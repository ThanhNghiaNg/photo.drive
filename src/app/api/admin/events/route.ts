import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import { eventToDTO } from "@/lib/dto";
import { parseDriveFolderId, validateDriveFolder } from "@/lib/google-drive";
import { slugify } from "@/lib/slug";

const eventSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().max(120).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  eventDate: z.string().min(1),
  location: z.string().max(300).optional().default(""),
  driveFolder: z.string().min(1),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(-999999).max(999999).optional().default(0),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export async function GET() {
  await connectMongo();
  const events = await Event.find().sort({ eventDate: -1, createdAt: -1 }).lean();
  return NextResponse.json({ events: events.map(eventToDTO) });
}

export async function POST(request: Request) {
  try {
    const parsed = eventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu event không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });

    const driveFolderId = parseDriveFolderId(parsed.data.driveFolder);
    if (!driveFolderId) return NextResponse.json({ error: "Google Drive folder URL/ID không hợp lệ." }, { status: 400 });
    await validateDriveFolder(driveFolderId);

    await connectMongo();
    const baseSlug = slugify(parsed.data.slug || parsed.data.name);
    if (!baseSlug) return NextResponse.json({ error: "Không tạo được slug hợp lệ." }, { status: 400 });

    let slug = baseSlug;
    let suffix = 2;
    while (await Event.exists({ slug })) slug = `${baseSlug}-${suffix++}`;

    const event = await Event.create({
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      eventDate: new Date(parsed.data.eventDate),
      location: parsed.data.location,
      driveFolderId,
      featured: parsed.data.featured,
      sortOrder: parsed.data.sortOrder,
      status: parsed.data.status,
    });

    return NextResponse.json({ event: eventToDTO(event) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Không thể tạo event." }, { status: 500 });
  }
}
