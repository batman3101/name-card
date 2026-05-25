export async function preprocessImage(file: File, rotation = 0): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const turnsSideways = normalizedRotation === 90 || normalizedRotation === 270;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    return file;
  }

  canvas.width = turnsSideways ? height : width;
  canvas.height = turnsSideways ? width : height;
  context.save();
  if (normalizedRotation === 90) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  } else if (normalizedRotation === 180) {
    context.translate(canvas.width, canvas.height);
    context.rotate(Math.PI);
  } else if (normalizedRotation === 270) {
    context.translate(0, canvas.height);
    context.rotate((Math.PI * 3) / 2);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  context.restore();
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (luminance - 128) * 1.35 + 128));
    const value = contrasted > 185 ? 255 : contrasted < 90 ? 0 : contrasted;

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(image, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.92);
  });
}
