import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import Photo from "@/models/Photo";
import { eventToDTO } from "@/lib/dto";
import { parseDriveFolderId, validateDriveFolder } from "@/lib/google-drive";
import { slugify } from "@/lib/slug";

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  eventDate: z.string().min(1).optional(),
  location: z.string().max(300).optional(),
  driveFolder: z.string().optional(),
  thumbnailFileId: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(-999999).max(999999).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  await connectMongo();
  const event = await Event.findById(id).lean();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event: eventToDTO(event) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

    await connectMongo();
    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (parsed.data.name !== undefined) event.name = parsed.data.name;
    if (parsed.data.description !== undefined) event.description = parsed.data.description;
    if (parsed.data.location !== undefined) event.location = parsed.data.location;
    if (parsed.data.eventDate !== undefined) event.eventDate = new Date(parsed.data.eventDate);
    if (parsed.data.featured !== undefined) event.featured = parsed.data.featured;
    if (parsed.data.sortOrder !== undefined) event.sortOrder = parsed.data.sortOrder;
    if (parsed.data.status !== undefined) event.status = parsed.data.status;

    if (parsed.data.slug !== undefined) {
      const nextSlug = slugify(parsed.data.slug || event.name);
      if (!nextSlug) return NextResponse.json({ error: "Slug không hợp lệ." }, { status: 400 });
      const duplicate = await Event.exists({ slug: nextSlug, _id: { $ne: event._id } });
      if (duplicate) return NextResponse.json({ error: "Slug đã tồn tại." }, { status: 409 });
      event.slug = nextSlug;
    }

    if (parsed.data.driveFolder !== undefined) {
      const folderId = parseDriveFolderId(parsed.data.driveFolder);
      if (!folderId) return NextResponse.json({ error: "Google Drive folder URL/ID không hợp lệ." }, { status: 400 });
      if (folderId !== event.driveFolderId) {
        await validateDriveFolder(folderId);
        event.driveFolderId = folderId;
        event.syncStatus = "idle";
        event.syncRunId = "";
        event.syncProcessed = 0;
      }
    }

    if (parsed.data.thumbnailFileId !== undefined) {
      if (parsed.data.thumbnailFileId) {
        const exists = await Photo.exists({ eventId: event._id, driveFileId: parsed.data.thumbnailFileId });
        if (!exists) return NextResponse.json({ error: "Thumbnail không thuộc event này." }, { status: 400 });
      }
      event.thumbnailFileId = parsed.data.thumbnailFileId;
    }

    await event.save();
    return NextResponse.json({ event: eventToDTO(event) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Không thể cập nhật event." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  await connectMongo();
  const event = await Event.findById(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  await Promise.all([Photo.deleteMany({ eventId: event._id }), event.deleteOne()]);
  return NextResponse.json({ ok: true });
}
