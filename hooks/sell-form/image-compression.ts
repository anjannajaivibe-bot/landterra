export const MAX_IMAGE_UPLOAD_BYTES = 850 * 1024;
export const MAX_IMAGE_DIMENSION = 2048;
export const INITIAL_IMAGE_QUALITY = 0.82;
export const MIN_IMAGE_QUALITY = 0.45;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not a supported image.`);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new window.Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Unable to read image: ${file.name}`));
      image.src = objectUrl;
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (!width || !height) {
      throw new Error(`Invalid image dimensions: ${file.name}`);
    }

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const scale = Math.min(
        MAX_IMAGE_DIMENSION / width,
        MAX_IMAGE_DIMENSION / height
      );
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Browser image processing is unavailable.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    const outputMimeType = 'image/webp';

    const canvasToBlob = (quality: number): Promise<Blob> =>
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Unable to compress image.'));
              return;
            }
            resolve(blob);
          },
          outputMimeType,
          quality
        );
      });

    let quality = INITIAL_IMAGE_QUALITY;
    let blob = await canvasToBlob(quality);

    while (blob.size > MAX_IMAGE_UPLOAD_BYTES && quality > MIN_IMAGE_QUALITY) {
      quality = Math.max(MIN_IMAGE_QUALITY, quality - 0.07);
      blob = await canvasToBlob(quality);
    }

    let attempts = 0;
    while (blob.size > MAX_IMAGE_UPLOAD_BYTES && attempts < 5) {
      attempts += 1;
      width = Math.max(800, Math.round(width * 0.85));
      height = Math.max(600, Math.round(height * 0.85));

      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      blob = await canvasToBlob(MIN_IMAGE_QUALITY);
    }

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const finalFileName = `${fileNameWithoutExt}.webp`;

    return new File([blob], finalFileName, {
      type: outputMimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
