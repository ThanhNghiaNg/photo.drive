import type { EventDTO, PhotoDTO } from "@/types";

export function eventToDTO(doc: any): EventDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    eventDate: new Date(doc.eventDate).toISOString(),
    location: doc.location || "",
    driveFolderId: doc.driveFolderId,
    thumbnailFileId: doc.thumbnailFileId || "",
    photoCount: doc.photoCount || 0,
    featured: Boolean(doc.featured),
    sortOrder: doc.sortOrder || 0,
    status: doc.status,
    lastSyncedAt: doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toISOString() : null,
    syncStatus: doc.syncStatus || "idle",
    syncProcessed: doc.syncProcessed || 0,
    syncError: doc.syncError || "",
  };
}

export function photoToDTO(doc: any): PhotoDTO {
  return {
    id: String(doc._id),
    eventId: String(doc.eventId),
    driveFileId: doc.driveFileId,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    size: doc.size || 0,
    width: doc.width || 0,
    height: doc.height || 0,
    position: doc.position || 0,
  };
}
