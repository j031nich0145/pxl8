/**
 * Image manipulation utilities for cropping and DPI normalization
 */

/**
 * Crop an image to a specific aspect ratio (centered crop) or with custom coordinates
 * @param {File} file - Image file to crop
 * @param {string} aspectRatio - Aspect ratio: '1:1', '3:2', or '4:3'
 * @param {number} [cropX] - Optional X coordinate for crop (in pixels, relative to original image)
 * @param {number} [cropY] - Optional Y coordinate for crop (in pixels, relative to original image)
 * @param {number} [cropWidth] - Optional width for crop (in pixels)
 * @param {number} [cropHeight] - Optional height for crop (in pixels)
 * @returns {Promise<File>} - Cropped image as File
 */
export async function cropImage(file, aspectRatio, cropX = null, cropY = null, cropWidth = null, cropHeight = null) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        const width = img.width
        const height = img.height
        
        let finalCropX, finalCropY, finalCropWidth, finalCropHeight
        
        // If custom coordinates provided, use them
        if (cropX !== null && cropY !== null && cropWidth !== null && cropHeight !== null) {
          finalCropX = cropX
          finalCropY = cropY
          finalCropWidth = cropWidth
          finalCropHeight = cropHeight
        } else {
          // Otherwise, calculate centered crop based on aspect ratio
          // Calculate target aspect ratio
          let targetRatio
          if (aspectRatio === '1:1') {
            targetRatio = 1
          } else if (aspectRatio === '3:2') {
            targetRatio = 3 / 2
          } else if (aspectRatio === '4:3') {
            targetRatio = 4 / 3
          } else {
            reject(new Error('Invalid aspect ratio'))
            return
          }
          
          // Calculate current aspect ratio
          const currentRatio = width / height
          
          // Calculate crop dimensions (centered)
          if (currentRatio > targetRatio) {
            // Image is wider than target - crop width (keep full height)
            finalCropHeight = height
            finalCropWidth = height * targetRatio
            finalCropX = (width - finalCropWidth) / 2
            finalCropY = 0
          } else {
            // Image is taller than target - crop height (keep full width)
            finalCropWidth = width
            finalCropHeight = width / targetRatio
            finalCropX = 0
            finalCropY = (height - finalCropHeight) / 2
          }
        }
        
        // Create canvas for cropping
        const canvas = document.createElement('canvas')
        canvas.width = finalCropWidth
        canvas.height = finalCropHeight
        const ctx = canvas.getContext('2d')
        
        // Draw cropped portion
        ctx.drawImage(
          img,
          finalCropX, finalCropY, finalCropWidth, finalCropHeight,  // Source crop
          0, 0, finalCropWidth, finalCropHeight           // Destination
        )
        
        // Convert to blob then to file
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create cropped image'))
            return
          }
          
          // Create new File from blob
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          URL.revokeObjectURL(url)
          resolve(croppedFile)
        }, file.type || 'image/png')
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Rotate an image 90 degrees clockwise
 * @param {File} file - Image file to rotate
 * @returns {Promise<File>} - Rotated image as File
 */
export async function rotateImage90CW(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        // Swap dimensions for 90° rotation
        canvas.width = img.height
        canvas.height = img.width
        const ctx = canvas.getContext('2d')
        
        // Rotate 90° clockwise
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(Math.PI / 2)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to rotate image'))
            return
          }
          
          const rotatedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          URL.revokeObjectURL(url)
          resolve(rotatedFile)
        }, file.type || 'image/png')
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Normalize image to 72dpi equivalent
 * Assumes source is 96dpi (common web default) and converts to 72dpi
 * @param {File} file - Image file to normalize
 * @returns {Promise<File>} - Normalized image as File
 */
export async function normalizeTo72dpi(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        const width = img.width
        const height = img.height
        
        // Assume source is 96dpi (common web default)
        // Convert to 72dpi: newSize = oldSize * (72/96) = oldSize * 0.75
        const targetWidth = Math.round(width * (72 / 96))
        const targetHeight = Math.round(height * (72 / 96))
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        
        // Use high-quality resizing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        
        // Convert to blob then to file
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create normalized image'))
            return
          }
          
          // Create new File from blob
          const normalizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          URL.revokeObjectURL(url)
          resolve(normalizedFile)
        }, file.type || 'image/png')
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

