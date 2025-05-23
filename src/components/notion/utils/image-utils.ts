
/**
 * Helper function to check if an image URL is a HEIC format
 * @param url The image URL to check
 * @returns boolean indicating if the URL points to a HEIC image
 */
export const isHeicImage = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  
  // Check common patterns that might indicate a HEIC image
  return urlLower.endsWith('.heic') || 
         urlLower.includes('/heic') || 
         urlLower.includes('heic.') || 
         urlLower.includes('image/heic');
};

/**
 * Detect image orientation based on width and height
 * @param width The image width
 * @param height The image height
 * @returns string indicating the orientation: 'portrait', 'landscape', or 'square'
 */
export const detectImageOrientation = (width?: number, height?: number): 'portrait' | 'landscape' | 'square' => {
  if (!width || !height) return 'landscape'; // Default to landscape if dimensions unknown
  
  if (width > height) {
    return 'landscape';
  } else if (height > width) {
    return 'portrait';
  } else {
    return 'square';
  }
};
