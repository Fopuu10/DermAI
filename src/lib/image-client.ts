// Client-side helpers — runs in the browser.

export const MAX_DIM = 1024;
export const JPEG_QUALITY = 0.82;

export type ResizedImage = {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
};

export async function resizeFromImageElement(img: HTMLImageElement): Promise<ResizedImage> {
  const { naturalWidth: w, naturalHeight: h } = img;
  const ratio = Math.min(1, MAX_DIM / Math.max(w, h));
  const targetW = Math.round(w * ratio);
  const targetH = Math.round(h * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const bytes = Math.ceil((dataUrl.length * 3) / 4);
  return { dataUrl, width: targetW, height: targetH, bytes };
}

export async function resizeFromVideo(video: HTMLVideoElement): Promise<ResizedImage> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const ratio = Math.min(1, MAX_DIM / Math.max(w, h));
  const targetW = Math.round(w * ratio);
  const targetH = Math.round(h * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, targetW, targetH);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const bytes = Math.ceil((dataUrl.length * 3) / 4);
  return { dataUrl, width: targetW, height: targetH, bytes };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}
