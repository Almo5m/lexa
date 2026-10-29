/**
 * Shrinks a picture in the browser before it is uploaded: at most `maxWidth` wide, saved as JPEG.
 * Phone photos of a page are several megabytes, and a serverless upload has a size limit; this keeps the text readable
 * and the file well under a megabyte. Returns null if the browser cannot read the file as an image.
 */
export async function shrinkImage(file: File, maxWidth = 1800, quality = 0.88): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    // A transparent picture would turn black as a JPEG, so it is painted on white first.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  } catch {
    return null;
  }
}
