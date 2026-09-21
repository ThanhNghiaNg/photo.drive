import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { listDriveImageBatch, validateDriveFolder } from "@/lib/google-drive";
import Event from "@/models/Event";
import Photo from "@/models/Photo";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json().catch(() => ({}));
    await connectMongo();
    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let runId = typeof body.runId === "string" ? body.runId : "";
    let pageToken = typeof body.pageToken === "string" && body.pageToken ? body.pageToken : null;
    let basePosition = Number(body.basePosition || 0);

    if (!runId) {
      await validateDriveFolder(event.driveFolderId);
      runId = randomUUID();
      pageToken = null;
      basePosition = 0;
      event.syncRunId = runId;
      event.syncProcessed = 0;
      event.syncStatus = "syncing";
      event.syncError = "";
      await event.save();
    } else if (event.syncRunId !== runId || event.syncStatus !== "syncing") {
      return NextResponse.json({ error: "Sync session không còn hợp lệ. Hãy bắt đầu sync lại." }, { status: 409 });
    }

    const batch = await listDriveImageBatch(event.driveFolderId, pageToken);
    const operations = batch.files.map((file, index) => ({
      updateOne: {
        filter: { eventId: event._id, driveFileId: file.id },
        update: {
          $set: {
            fileName: file.name,
            mimeType: file.mimeType,
            size: file.size,
            width: file.width,
            height: file.height,
            driveCreatedTime: file.createdTime,
            driveModifiedTime: file.modifiedTime,
            position: basePosition + index,
            syncRunId: runId,
          },
          $setOnInsert: { eventId: event._id, driveFileId: file.id },
        },
        upsert: true,
      },
    }));

    if (operations.length) await Photo.bulkWrite(operations, { ordered: false });

    const processed = basePosition + batch.files.length;
    event.syncProcessed = processed;
    await event.save();

    if (batch.nextPageToken) {
      return NextResponse.json({
        done: false,
        runId,
        nextPageToken: batch.nextPageToken,
        basePosition: processed,
        processed,
      });
    }

    const deleteResult = await Photo.deleteMany({ eventId: event._id, syncRunId: { $ne: runId } });
    const total = await Photo.countDocuments({ eventId: event._id });

    if (event.thumbnailFileId) {
      const thumbExists = await Photo.exists({ eventId: event._id, driveFileId: event.thumbnailFileId });
      if (!thumbExists) event.thumbnailFileId = "";
    }

    event.photoCount = total;
    event.lastSyncedAt = new Date();
    event.syncStatus = "idle";
    event.syncProcessed = total;
    event.syncError = "";
    await event.save();

    return NextResponse.json({
      done: true,
      runId,
      processed: total,
      total,
      removed: deleteResult.deletedCount || 0,
    });
  } catch (error: any) {
    try {
      await connectMongo();
      await Event.findByIdAndUpdate(id, {
        syncStatus: "error",
        syncError: error?.message || "Sync failed",
      });
    } catch {}
    return NextResponse.json({ error: error?.message || "Không thể sync Google Drive." }, { status: 500 });
  }
}
