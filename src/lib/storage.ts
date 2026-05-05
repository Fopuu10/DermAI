import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const ALLOWED_MIME = ["image/jpeg", "image/png"];
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type SaveResult = {
  url: string; // public URL like /uploads/<userId>/<id>.jpg
  bytes: number;
};

export function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  return { mime, buf };
}

export async function saveUserImage(userId: string, dataUrl: string): Promise<SaveResult> {
  const { mime, buf } = parseDataUrl(dataUrl);
  if (!ALLOWED_MIME.includes(mime)) throw new Error("Unsupported format");
  if (buf.byteLength > MAX_BYTES) throw new Error("File too large");
  if (buf.byteLength < 1024) throw new Error("File too small / corrupted");

  const ext = mime === "image/png" ? "png" : "jpg";
  const id = crypto.randomBytes(12).toString("hex");
  const dir = path.join(UPLOAD_DIR, userId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${id}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);

  // Public URL served by Next.js from /public
  return { url: `/uploads/${userId}/${filename}`, bytes: buf.byteLength };
}

export async function deleteUserImage(userId: string, url: string) {
  if (!url.startsWith(`/uploads/${userId}/`)) return;
  const filename = url.split("/").pop()!;
  const filePath = path.join(UPLOAD_DIR, userId, filename);
  await fs.rm(filePath, { force: true });
}
