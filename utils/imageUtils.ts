export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Set crossOrigin just in case, though usually not needed for blob URLs
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

/**
 * Crops an image based on pixel coordinates.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return base64 string
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Automatically crops an image to the nearest standard aspect ratio (3:4 or 4:3).
 * Centers the crop.
 */
export async function autoCropImage(imageSrc: string): Promise<string> {
  const image = await createImage(imageSrc);
  const { naturalWidth: w, naturalHeight: h } = image;
  
  // Determine orientation and target ratio
  const isLandscape = w > h;
  // Standard ratios: 3:4 (0.75) for portrait, 4:3 (1.33) for landscape
  const targetRatio = isLandscape ? 4/3 : 3/4;
  
  // Calculate standard crop dimensions
  let cropWidth, cropHeight, x, y;
  const currentRatio = w / h;
  
  if (currentRatio > targetRatio) {
    // Image is wider than target -> Crop width, keep height
    cropHeight = h;
    cropWidth = h * targetRatio;
    x = (w - cropWidth) / 2;
    y = 0;
  } else {
    // Image is taller than target -> Crop height, keep width
    cropWidth = w;
    cropHeight = w / targetRatio;
    x = 0;
    y = (h - cropHeight) / 2;
  }
  
  return getCroppedImg(imageSrc, { 
    x: Math.round(x), 
    y: Math.round(y), 
    width: Math.round(cropWidth), 
    height: Math.round(cropHeight) 
  });
}