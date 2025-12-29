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

/**
 * Apply the same crop to multiple images
 * Crop coordinates are based on a reference image and scaled proportionally to each image
 * @param {Array<File>} files - Array of image files to crop
 * @param {Object} cropData - Crop data from BatchCropModal
 * @param {number} cropData.x - X position in pixels (based on reference image)
 * @param {number} cropData.y - Y position in pixels (based on reference image)
 * @param {number} cropData.width - Crop width in pixels (based on reference image)
 * @param {number} cropData.height - Crop height in pixels (based on reference image)
 * @param {Object} cropData.referenceDimensions - Dimensions of reference image
 * @param {Array<number>} cropData.includedImages - Indices of images to crop
 * @returns {Promise<Array<File>>} - Array of cropped image files
 */
export async function batchCropImages(files, cropData) {
  const { x, y, width, height, referenceDimensions, scalingInfo, includedImages } = cropData
  
  // Crop coordinates are in reference image pixel space
  // referenceDimensions = original dimensions of the smallest width image
  // All images are scaled so their HEIGHT matches the reference height
  // The crop box is constrained within the reference image bounds
  
  // Output dimensions are always the same (from the crop box)
  const outputWidth = Math.round(width)
  const outputHeight = Math.round(height)
  
  const croppedFiles = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Skip if not included in crop
    if (!includedImages.includes(i)) {
      croppedFiles.push(file)
      continue
    }
    
    try {
      // Load image to get dimensions
      const img = await loadImageFromFile(file)
      
      // Calculate scale factor for this image (scaled so height matches reference height)
      const heightScale = img.height / referenceDimensions.height
      
      // Convert crop coordinates from reference space to this image's native pixels
      // Since all images are height-matched and left-aligned, we scale by height ratio
      const nativeCropX = Math.round(x * heightScale)
      const nativeCropY = Math.round(y * heightScale)
      const nativeCropWidth = Math.round(width * heightScale)
      const nativeCropHeight = Math.round(height * heightScale)
      
      // Ensure crop stays within bounds
      const finalX = Math.max(0, Math.min(nativeCropX, img.width - nativeCropWidth))
      const finalY = Math.max(0, Math.min(nativeCropY, img.height - nativeCropHeight))
      
      // Crop and resize to uniform output dimensions
      const croppedFile = await cropAndResizeImage(
        file, finalX, finalY, nativeCropWidth, nativeCropHeight, outputWidth, outputHeight
      )
      
      croppedFiles.push(croppedFile)
    } catch (error) {
      console.error(`Failed to crop image ${file.name}:`, error)
      // Keep original file if crop fails
      croppedFiles.push(file)
    }
  }
  
  return croppedFiles
}

/**
 * Helper to load image from file
 * @param {File} file - Image file to load
 * @returns {Promise<HTMLImageElement>} - Loaded image element
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Crop image using exact pixel coordinates
 * @param {File} file - Image file to crop
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @param {number} width - Crop width in pixels
 * @param {number} height - Crop height in pixels
 * @returns {Promise<File>} - Cropped image as File
 */
function cropImageWithCoordinates(file, x, y, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        // Create canvas for cropping
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        // Draw cropped portion
        ctx.drawImage(
          img,
          x, y, width, height,  // Source crop
          0, 0, width, height   // Destination
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
 * Crop image and resize to uniform output dimensions
 * @param {File} file - Image file to crop
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @param {number} cropWidth - Crop width in pixels (source region)
 * @param {number} cropHeight - Crop height in pixels (source region)
 * @param {number} outputWidth - Output width in pixels
 * @param {number} outputHeight - Output height in pixels
 * @returns {Promise<File>} - Cropped and resized image as File
 */
function cropAndResizeImage(file, x, y, cropWidth, cropHeight, outputWidth, outputHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        // Create canvas at output dimensions
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = outputHeight
        const ctx = canvas.getContext('2d')
        
        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw cropped portion scaled to output size
        ctx.drawImage(
          img,
          x, y, cropWidth, cropHeight,    // Source crop region
          0, 0, outputWidth, outputHeight  // Destination (scaled to output)
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
