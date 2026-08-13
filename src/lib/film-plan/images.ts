import type { VisualReference } from "./types";

const MAX_IMAGE_FILES_PER_UPLOAD = 6;
const MAX_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1100;
const IMAGE_QUALITY = 0.72;

export async function imageFilesToReferences(files: FileList | File[]) {
  const images: VisualReference[] = [];
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length > MAX_IMAGE_FILES_PER_UPLOAD) {
    throw new Error(`Envie no maximo ${MAX_IMAGE_FILES_PER_UPLOAD} imagens por vez.`);
  }
  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      throw new Error("Uma das imagens ultrapassa 8 MB.");
    }
    images.push({
      id: crypto.randomUUID(),
      name: file.name,
      dataUrl: await compressImage(file),
    });
  }
  return images;
}

async function compressImage(file: File) {
  const source = await readDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
