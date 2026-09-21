import { google, drive_v3 } from "googleapis";
import { getServerEnv } from "@/lib/env";

let cachedDrive: drive_v3.Drive | null = null;
let cachedAuth: any = null;

function getDriveAuth() {
  if (cachedAuth) return cachedAuth;
  const env = getServerEnv();
  cachedAuth = new google.auth.GoogleAuth({
    credentials: {
      project_id: env.GOOGLE_PROJECT_ID,
      client_email: env.GOOGLE_CLIENT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return cachedAuth;
}

export function getDriveClient() {
  if (cachedDrive) return cachedDrive;
  cachedDrive = google.drive({ version: "v3", auth: getDriveAuth() });
  return cachedDrive;
}

export function parseDriveFolderId(input: string) {
  const value = input.trim();
  if (!value) return "";
  const folderMatch = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];
  const idParam = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam?.[1]) return idParam[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) return value;
  return "";
}

export async function validateDriveFolder(folderId: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.get({
    fileId: folderId,
    fields: "id,name,mimeType,trashed",
    supportsAllDrives: true,
  });
  if (data.trashed || data.mimeType !== "application/vnd.google-apps.folder") {
    throw new Error("Google Drive ID không phải folder hợp lệ hoặc folder đã bị xoá.");
  }
  return { id: data.id!, name: data.name || "Google Drive folder" };
}

export type DrivePhoto = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdTime: Date | null;
  modifiedTime: Date | null;
};

export async function listDriveImageBatch(folderId: string, pageToken?: string | null) {
  const drive = getDriveClient();
  const { data } = await drive.files.list({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
    spaces: "drive",
    pageSize: 500,
    pageToken: pageToken || undefined,
    orderBy: "name_natural",
    fields: "nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,imageMediaMetadata(width,height))",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files: DrivePhoto[] = (data.files || [])
    .filter((file) => file.id && file.mimeType?.startsWith("image/"))
    .map((file) => ({
      id: file.id!,
      name: file.name || file.id!,
      mimeType: file.mimeType || "application/octet-stream",
      size: Number(file.size || 0),
      width: Number(file.imageMediaMetadata?.width || 0),
      height: Number(file.imageMediaMetadata?.height || 0),
      createdTime: file.createdTime ? new Date(file.createdTime) : null,
      modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
    }));

  return { files, nextPageToken: data.nextPageToken || null };
}

export async function getDriveFileStream(fileId: string) {
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: "id,mimeType,size,name",
    supportsAllDrives: true,
  });
  const media = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
  );
  return {
    stream: media.data,
    mimeType: meta.data.mimeType || "application/octet-stream",
    size: Number(meta.data.size || 0),
    name: meta.data.name || fileId,
  };
}

export async function getDriveThumbnailResponse(fileId: string) {
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: "thumbnailLink,mimeType,name",
    supportsAllDrives: true,
  });
  if (!meta.data.thumbnailLink) return null;

  const token = await getDriveAuth().getAccessToken();
  const response = await fetch(meta.data.thumbnailLink, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!response.ok || !response.body) return null;
  return {
    body: response.body,
    mimeType: response.headers.get("content-type") || meta.data.mimeType || "image/jpeg",
    name: meta.data.name || fileId,
  };
}
