const MAX_SIZE = 256;
const JPEG_QUALITY = 0.85;

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Resize and compress an image file into a JPEG data URL suitable for avatars.
 * @param file The image file selected by the user.
 * @returns A compressed `data:image/jpeg;base64,...` string.
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalid_image");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const { width, height } = fitWithin(image.width, image.height, MAX_SIZE);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas_unavailable");

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Crop a region from an image source and compress it into a JPEG data URL.
 * Preserves the crop aspect ratio while fitting within `maxSize`.
 * @param imageSrc Object URL or data URL of the source image.
 * @param pixelCrop Crop rectangle in image pixels (from react-easy-crop).
 * @param maxSize Maximum width or height of the output image.
 * @returns A compressed `data:image/jpeg;base64,...` string.
 */
export async function cropImageToDataUrl(
  imageSrc: string,
  pixelCrop: CropArea,
  maxSize = MAX_SIZE,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const { width, height } = fitWithin(
    pixelCrop.width,
    pixelCrop.height,
    maxSize,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("invalid_image"));
    image.src = src;
  });
}

function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) {
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  }

  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
