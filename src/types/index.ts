export type EventDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  eventDate: string;
  location: string;
  driveFolderId: string;
  thumbnailFileId: string;
  photoCount: number;
  featured: boolean;
  sortOrder: number;
  status: "draft" | "published";
  lastSyncedAt: string | null;
  syncStatus: "idle" | "syncing" | "error";
  syncProcessed: number;
  syncError: string;
};

export type PhotoDTO = {
  id: string;
  eventId: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  position: number;
};
