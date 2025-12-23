// Normalize image to 72 DPI equivalent
// Since browsers don't support DPI metadata directly, we normalize pixel dimensions
// Standard: 72 DPI means 72 pixels per inch
// We'll resize images to a standard width (e.g., 1000px) maintaining aspect ratio
// This ensures consistent pixelation effects across different source images
export function normalizeImageTo72DPI(image, targetWidth = 1000) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = image.height / image.width
    const newWidth = targetWidth
    const newHeight = Math.round(targetWidth * aspectRatio)
    
    // Set canvas dimensions
    canvas.width = newWidth
    canvas.height = newHeight
    
    // Draw and resize image
    ctx.drawImage(image, 0, 0, newWidth, newHeight)
    
    // Create new image from canvas
    const normalizedImage = new Image()
    normalizedImage.onload = () => resolve(normalizedImage)
    normalizedImage.src = canvas.toDataURL('image/png')
  })
}