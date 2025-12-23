/**
 * Client-side pixelation using Canvas API
 * Works entirely in the browser - no server needed
 */

/**
 * Pixelate an image using Canvas API
 * @param {File|string} imageSource - Image file or data URL
 * @param {number} targetWidth - Target width in pixels for downscaled image
 * @param {number} targetHeight - Target height in pixels for downscaled image
 * @param {string} method - 'nearest' or 'average'
 * @param {number} multiplier - Multiplier for output size (default: 1.0)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Processed image as blob
 */
export async function pixelateImage(imageSource, targetWidth, targetHeight, method = 'average', multiplier = 1.0, onProgress) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Ensure minimum dimensions
        const finalWidth = Math.max(1, targetWidth)
        const finalHeight = Math.max(1, targetHeight)
        
        // Get original dimensions
        const origWidth = img.width
        const origHeight = img.height
        
        if (onProgress) onProgress(20)
        
        // Create canvas for pixelation
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (method === 'nearest') {
          // Nearest neighbor: simple resize
          canvas.width = finalWidth
          canvas.height = finalHeight
          
          // Use imageSmoothingEnabled = false for nearest neighbor
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight)
          
          if (onProgress) onProgress(60)
          
          // Scale back up to original size with multiplier
          const outputCanvas = document.createElement('canvas')
          outputCanvas.width = origWidth * multiplier
          outputCanvas.height = origHeight * multiplier
          const outputCtx = outputCanvas.getContext('2d')
          outputCtx.imageSmoothingEnabled = false
          outputCtx.drawImage(canvas, 0, 0, origWidth * multiplier, origHeight * multiplier)
          
          if (onProgress) onProgress(90)
          
          // Convert to blob
          outputCanvas.toBlob((blob) => {
            if (onProgress) onProgress(100)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create image blob'))
            }
          }, 'image/png')
        } else {
          // Pixel averaging method
          canvas.width = finalWidth
          canvas.height = finalHeight
          
          // Calculate block sizes (original approach)
          const blockWidth = origWidth / finalWidth
          const blockHeight = origHeight / finalHeight
          
          // Create temporary canvas for original image
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = origWidth
          tempCanvas.height = origHeight
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.drawImage(img, 0, 0)
          
          const imageData = tempCtx.getImageData(0, 0, origWidth, origHeight)
          const data = imageData.data
          
          if (onProgress) onProgress(40)
          
          // Create output image data
          const outputData = ctx.createImageData(finalWidth, finalHeight)
          const output = outputData.data
          
          // Process each target pixel
          for (let y = 0; y < finalHeight; y++) {
            for (let x = 0; x < finalWidth; x++) {
              // Calculate block boundaries (original approach)
              const xStart = Math.floor(x * blockWidth)
              const xEnd = Math.min(Math.floor((x + 1) * blockWidth), origWidth)
              const yStart = Math.floor(y * blockHeight)
              const yEnd = Math.min(Math.floor((y + 1) * blockHeight), origHeight)
              
              // Calculate average color for this block
              let r = 0, g = 0, b = 0, a = 0
              let pixelCount = 0
              
              for (let py = yStart; py < yEnd; py++) {
                for (let px = xStart; px < xEnd; px++) {
                  const idx = (py * origWidth + px) * 4
                  r += data[idx]
                  g += data[idx + 1]
                  b += data[idx + 2]
                  a += data[idx + 3]
                  pixelCount++
                }
              }
              
              // Set average color
              const outIdx = (y * finalWidth + x) * 4
              output[outIdx] = Math.round(r / pixelCount)
              output[outIdx + 1] = Math.round(g / pixelCount)
              output[outIdx + 2] = Math.round(b / pixelCount)
              output[outIdx + 3] = Math.round(a / pixelCount)
            }
            
            // Update progress
            if (onProgress && y % Math.max(1, Math.floor(finalHeight / 10)) === 0) {
              onProgress(40 + Math.floor((y / finalHeight) * 30))
            }
          }
          
          // Put averaged data onto canvas
          ctx.putImageData(outputData, 0, 0)
          
          if (onProgress) onProgress(80)
          
          // Scale back up to original size with multiplier
          const outputCanvas = document.createElement('canvas')
          outputCanvas.width = origWidth * multiplier
          outputCanvas.height = origHeight * multiplier
          const outputCtx = outputCanvas.getContext('2d')
          outputCtx.imageSmoothingEnabled = false
          outputCtx.drawImage(canvas, 0, 0, origWidth * multiplier, origHeight * multiplier)
          
          if (onProgress) onProgress(95)
          
          // Convert to blob
          outputCanvas.toBlob((blob) => {
            if (onProgress) onProgress(100)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create image blob'))
            }
          }, 'image/png')
        }
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    // Set image source
    if (imageSource instanceof File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(imageSource)
    } else {
      img.src = imageSource
    }
  })
}

