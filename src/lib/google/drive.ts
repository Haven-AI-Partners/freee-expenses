import { DriveFile } from "@/types";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

export async function searchFolder(
  accessToken: string,
  folderName: string
): Promise<string | null> {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google Drive folder search failed: ${error}`);
  }

  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function listImagesInFolder(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType)",
    pageSize: "100",
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google Drive list files failed: ${error}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function downloadFile(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google Drive file download failed: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
