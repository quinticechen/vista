
// Helper function to check if an image URL is a HEIC format
export const isHeicImage = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.heic') || 
         urlLower.includes('/heic') || 
         urlLower.includes('heic.') ||
         urlLower.includes('image/heic');
};
