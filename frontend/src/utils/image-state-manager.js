/**
 * Image State Manager - Sync main image between Single and Batch modes
 */

const MAIN_IMAGE_KEY = 'pxl8_main_image'
const MAIN_IMAGE_DIMENSIONS_KEY = 'pxl8_main_image_dimensions'
const PIXELATED_IMAGE_KEY = 'pxl8_pixelated_image'
const PIXELATED_IMAGE_INFO_KEY = 'pxl8_pixelated_image_info'
const BATCH_IMAGES_KEY = 'pxl8_batch_images'

/**
 * Save main image to localStorage
 * @param {File} file - Image file
 * @param {Object} dimensions - { width, height }
 */
export function saveMainImage(file, dimensions) {
  try {
    // Convert File to base64 for storage
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const base64 = reader.result
        localStorage.setItem(MAIN_IMAGE_KEY, base64)
        localStorage.setItem(MAIN_IMAGE_DIMENSIONS_KEY, JSON.stringify(dimensions))
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded for main image, clearing old data')
          // Clear pixelated image to make space for main image (main image is more important)
          localStorage.removeItem(PIXELATED_IMAGE_KEY)
          localStorage.removeItem(PIXELATED_IMAGE_INFO_KEY)
          try {
            // Try again
            localStorage.setItem(MAIN_IMAGE_KEY, base64)
            localStorage.setItem(MAIN_IMAGE_DIMENSIONS_KEY, JSON.stringify(dimensions))
          } catch (retryError) {
            console.error('Still cannot save main image after clearing space:', retryError)
          }
        } else {
          console.error('Failed to save main image to localStorage:', error)
        }
      }
    }
    reader.onerror = () => {
      console.error('Failed to save main image')
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Failed to save main image:', error)
  }
}

/**
 * Load main image from localStorage
 * @returns {Promise<Object|null>} - { file: File, dimensions: { width, height } } or null
 */
export async function loadMainImage() {
  try {
    const base64 = localStorage.getItem(MAIN_IMAGE_KEY)
    const dimensionsStr = localStorage.getItem(MAIN_IMAGE_DIMENSIONS_KEY)
    
    if (!base64 || !dimensionsStr) {
      return null
    }
    
    // Convert base64 back to File
    const dimensions = JSON.parse(dimensionsStr)
    
    // Convert base64 to blob then to File
    const response = await fetch(base64)
    const blob = await response.blob()
    const file = new File([blob], 'main-image.png', { type: blob.type })
    
    return { file, dimensions }
  } catch (error) {
    console.error('Failed to load main image:', error)
    return null
  }
}

/**
 * Check if main image exists in localStorage
 * @returns {boolean}
 */
export function hasMainImage() {
  return !!localStorage.getItem(MAIN_IMAGE_KEY)
}

/**
 * Clear main image from localStorage
 */
export function clearMainImage() {
  try {
    localStorage.removeItem(MAIN_IMAGE_KEY)
    localStorage.removeItem(MAIN_IMAGE_DIMENSIONS_KEY)
  } catch (error) {
    console.error('Failed to clear main image:', error)
  }
}

/**
 * Get main image URL for display (synchronous)
 * @returns {string|null} - Data URL or null
 */
export function getMainImageUrl() {
  try {
    return localStorage.getItem(MAIN_IMAGE_KEY)
  } catch (error) {
    console.error('Failed to get main image URL:', error)
    return null
  }
}

/**
 * Save pixelated image to localStorage
 * @param {Blob} blob - Blob object of pixelated image
 * @param {Object} imageInfo - { originalDimensions, pixelSize, targetDimensions, pixelationMethod, pixelationLevel, liveUpdate, cropState?, crunchApplied? }
 */
export async function savePixelatedImage(blob, imageInfo) {
  try {
    // Convert blob to base64 - no need to fetch since we have the blob directly
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const base64 = reader.result
          localStorage.setItem(PIXELATED_IMAGE_KEY, base64)
          localStorage.setItem(PIXELATED_IMAGE_INFO_KEY, JSON.stringify(imageInfo))
          resolve()
        } catch (error) {
          // Handle quota exceeded
          if (error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded for pixelated image, clearing old data')
            // Clear old pixelated image
            localStorage.removeItem(PIXELATED_IMAGE_KEY)
            // Try again with just the info (more important than the image itself)
            try {
              localStorage.setItem(PIXELATED_IMAGE_INFO_KEY, JSON.stringify(imageInfo))
              console.warn('Saved pixelated image info but not image data due to quota')
              resolve() // Resolve anyway - info is more important
            } catch (retryError) {
              console.error('Cannot save even pixelated image info:', retryError)
              reject(retryError)
            }
          } else {
            console.error('Failed to save pixelated image to localStorage:', error)
            reject(error)
          }
        }
      }
      reader.onerror = () => {
        console.error('Failed to read blob')
        reject(new Error('Failed to read blob'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to save pixelated image:', error)
  }
}

/**
 * Load pixelated image from localStorage
 * @returns {Promise<Object|null>} - { imageUrl: string, imageInfo: Object } or null
 */
export async function loadPixelatedImage() {
  try {
    const base64 = localStorage.getItem(PIXELATED_IMAGE_KEY)
    const infoStr = localStorage.getItem(PIXELATED_IMAGE_INFO_KEY)
    
    if (!base64 || !infoStr) {
      return null
    }
    
    const imageInfo = JSON.parse(infoStr)
    
    return {
      imageUrl: base64, // base64 data URL
      imageInfo
    }
  } catch (error) {
    console.error('Failed to load pixelated image:', error)
    return null
  }
}

/**
 * Get pixelated image info (synchronous)
 * @returns {Object|null} - Image info object or null
 */
export function getPixelatedImageInfo() {
  try {
    const infoStr = localStorage.getItem(PIXELATED_IMAGE_INFO_KEY)
    return infoStr ? JSON.parse(infoStr) : null
  } catch (error) {
    console.error('Failed to get pixelated image info:', error)
    return null
  }
}

/**
 * Get pixelated image URL (synchronous)
 * @returns {string|null} - Base64 data URL or null
 */
export function getPixelatedImageUrl() {
  try {
    return localStorage.getItem(PIXELATED_IMAGE_KEY)
  } catch (error) {
    console.error('Failed to get pixelated image URL:', error)
    return null
  }
}

/**
 * Clear pixelated image from localStorage
 */
export function clearPixelatedImage() {
  try {
    localStorage.removeItem(PIXELATED_IMAGE_KEY)
    localStorage.removeItem(PIXELATED_IMAGE_INFO_KEY)
  } catch (error) {
    console.error('Failed to clear pixelated image:', error)
  }
}

/**
 * Convert File to base64
 * @param {File} file - File object
 * @returns {Promise<string>} - Base64 data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert base64 to Blob
 * @param {string} base64 - Base64 data URL
 * @param {string} mimeType - MIME type
 * @returns {Blob} - Blob object
 */
function base64ToBlob(base64, mimeType) {
  const byteString = atob(base64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}

/**
 * Save batch images to localStorage
 * @param {File[]} files - Array of File objects
 */
export async function saveBatchImages(files) {
  try {
    if (!files || files.length === 0) {
      localStorage.removeItem(BATCH_IMAGES_KEY)
      return
    }

    const fileData = await Promise.all(files.map(async (file) => {
      const base64 = await fileToBase64(file)
      return {
        base64,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified
      }
    }))
    
    localStorage.setItem(BATCH_IMAGES_KEY, JSON.stringify(fileData))
  } catch (error) {
    console.error('Failed to save batch images:', error)
  }
}

/**
 * Load batch images from localStorage
 * @returns {Promise<File[]>} - Array of File objects
 */
export async function loadBatchImages() {
  try {
    const saved = localStorage.getItem(BATCH_IMAGES_KEY)
    if (!saved) {
      return []
    }
    
    const fileData = JSON.parse(saved)
    const files = fileData.map(data => {
      const blob = base64ToBlob(data.base64, data.type)
      return new File([blob], data.name, { 
        type: data.type, 
        lastModified: data.lastModified || Date.now()
      })
    })
    
    return files
  } catch (error) {
    console.error('Failed to load batch images:', error)
    return []
  }
}

/**
 * Clear batch images from localStorage
 */
export function clearBatchImages() {
  try {
    localStorage.removeItem(BATCH_IMAGES_KEY)
  } catch (error) {
    console.error('Failed to clear batch images:', error)
  }
}

