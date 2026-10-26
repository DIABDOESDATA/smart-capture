/** Decode and re-encode uploads before any DOM preview. SVG/HTML and active metadata never become preview URLs. */
export async function prepareReferenceRaster(file: Blob): Promise<Blob> {
  if (file.size > 25000000) throw new Error('Choose a reference below 25 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v),
    jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    [82, 73, 70, 70].every((v, i) => bytes[i] === v) &&
    [87, 69, 66, 80].every((v, i) => bytes[i + 8] === v);
  if (!png && !jpeg && !webp)
    throw new Error(
      'Upload a real PNG, JPEG or WebP raster image. SVG and HTML are not supported.'
    );
  if (typeof createImageBitmap !== 'function')
    throw new Error(
      'This browser cannot prepare reference uploads. Use a current browser for reference administration.'
    );
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (bitmap.width * bitmap.height > 24000000)
      throw new Error('Choose a reference below 24 megapixels.');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Reference preview canvas unavailable.');
    ctx.drawImage(bitmap, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Reference could not be encoded.'))),
        'image/png'
      )
    );
  } finally {
    bitmap.close();
  }
}
