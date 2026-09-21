import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import Photo from "@/models/Photo";
import Event from "@/models/Event";
import { photoToDTO } from "@/lib/dto";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 40)));

  await connectMongo();
  const event = await Event.findById(id).lean();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const [photos, total] = await Promise.all([
    Photo.find({ eventId: id }).sort({ position: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Photo.countDocuments({ eventId: id }),
  ]);

  return NextResponse.json({
    photos: photos.map(photoToDTO),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
