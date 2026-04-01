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
  const query = `'${folderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/pdf') and trashed=false`;
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

export interface DriveTreeNode {
  id: string;
  name: string;
  mimeType: string;
  children?: DriveTreeNode[];
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

export async function listAllInFolder(
  accessToken: string,
  folderId: string
): Promise<DriveTreeNode[]> {
  const query = `'${folderId}' in parents and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType)",
    pageSize: "1000",
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google Drive list files failed: ${error}`);
  }

  const data = await res.json();
  const items: DriveFile[] = data.files || [];

  const nodes: DriveTreeNode[] = [];
  for (const item of items) {
    if (item.mimeType === FOLDER_MIME) {
      const children = await listAllInFolder(accessToken, item.id);
      nodes.push({ ...item, children });
    } else {
      nodes.push(item);
    }
  }

  return nodes.sort((a, b) => {
    const aIsFolder = a.children ? 0 : 1;
    const bIsFolder = b.children ? 0 : 1;
    if (aIsFolder !== bIsFolder) return aIsFolder - bIsFolder;
    return a.name.localeCompare(b.name);
  });
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
