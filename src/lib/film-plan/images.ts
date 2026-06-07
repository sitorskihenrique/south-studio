import type { VisualReference } from "./types";

export async function imageFilesToReferences(files: FileList | File[]) {
  const images: VisualReference[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
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
  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
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

