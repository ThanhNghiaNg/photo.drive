import { Readable } from "stream";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/mongodb";
import Photo from "@/models/Photo";
import Event from "@/models/Event";
import { getDriveFileStream, getDriveThumbnailResponse } from "@/lib/google-drive";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

export const runtime = "nodejs";

function nodeToWeb(stream: NodeJS.ReadableStream) {
  return Readable.toWeb(stream as Readable) as ReadableStream;
}

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const variant = new URL(request.url).searchParams.get("variant") === "full" ? "full" : "thumb";
  try {
    await connectMongo();
    const photo = await Photo.findOne({ driveFileId: fileId }).lean();
    if (!photo) return new NextResponse("Not found", { status: 404 });

    const event = await Event.findById(photo.eventId).select("status").lean();
    if (!event) return new NextResponse("Not found", { status: 404 });

    if (event.status !== "published") {
      const store = await cookies();
      const isAdmin = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
      if (!isAdmin) return new NextResponse("Not found", { status: 404 });
    }

    const cacheControl = event.status === "published"
      ? "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"
      : "private, no-store, max-age=0";

    if (variant === "thumb") {
      const thumb = await getDriveThumbnailResponse(fileId);
      if (thumb) {
        return new NextResponse(thumb.body, {
          status: 200,
          headers: {
            "Content-Type": thumb.mimeType,
            "Cache-Control": cacheControl,
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(thumb.name)}`,
          },
        });
      }
    }

    const file = await getDriveFileStream(fileId);
    return new NextResponse(nodeToWeb(file.stream as NodeJS.ReadableStream), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": cacheControl,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "Image unavailable", { status: 404 });
  }
}
