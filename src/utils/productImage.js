/**
 * Normalize product photo payloads from the API for use in <img src> or lightbox.
 * Backend may return raw base64 without a data: prefix.
 */
export function toProductImgSrc(imageData, contentType) {
  if (!imageData) return null;
  if (typeof imageData !== 'string') return null;
  if (imageData.startsWith('data:') || imageData.startsWith('http')) return imageData;
  return `data:${contentType || 'image/jpeg'};base64,${imageData}`;
}
