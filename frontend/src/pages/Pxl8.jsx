import React, { useState, useEffect, useRef, useCallback } from 'react'
import ImageUpload from '../components/ImageUpload'
import PixelationControls from '../components/PixelationControls'
import ImagePreview from '../components/ImagePreview'
import { pixelateImage } from '../utils/pixelation-client'
import { cropImage, normalizeTo72dpi } from '../utils/image-manipulation'
import { saveSettings } from '../utils/settings-manager'
import { saveMainImage, loadMainImage, savePixelatedImage } from '../utils/image-state-manager'
import '../App.css'

function Pxl8() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [processedImageUrl, setProcessedImageUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  
  // Undo history - stores up to 3 previous image states
  const [undoHistory, setUndoHistory] = useState([])
  
  // Dark mode - initialized from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pxl8_dark_mode')
    return saved === 'true' ? true : false
  })

  // Download counter - initialized from localStorage
  const [downloadCount, setDownloadCount] = useState(() => {
    const saved = localStorage.getItem('pxl8_download_count')
    return saved ? parseInt(saved, 10) : 1
  })

  // Pixelation settings - pixelation level from 1 (max pixelation) to 10 (minimal pixelation)
  const [liveUpdate, setLiveUpdate] = useState(true)
  const [pixelationLevel, setPixelationLevel] = useState(5.5) // Default center (5.5% = middle of 1-10%)
  const [pixelationMethod, setPixelationMethod] = useState('average')

  const handleLiveUpdateChange = (value) => {
    setLiveUpdate(value)
  }

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettings({
      pixelationLevel,
      pixelationMethod,
      liveUpdate
    })
  }, [pixelationLevel, pixelationMethod, liveUpdate])

  // Restore main image state on mount (if coming from Batch page)
  useEffect(() => {
    const restoreImageState = async () => {
      const savedImage = await loadMainImage()
      if (savedImage) {
        setUploadedFile(savedImage.file)
        setImageDimensions(savedImage.dimensions)
        
        // Get image URL for display
        const img = new Image()
        img.onload = () => {
          // Image already loaded, dimensions set
        }
        img.src = URL.createObjectURL(savedImage.file)
      }
    }
    restoreImageState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Undo history management functions
  const addToHistory = useCallback((file) => {
    if (!file) return
    
    setUndoHistory(prev => {
      const newHistory = [...prev, file]
      // Keep only last 3 items
      return newHistory.slice(-3)
    })
  }, [])

  const canUndo = useCallback(() => {
    return undoHistory.length > 0
  }, [undoHistory])

  const handleUndo = useCallback(() => {
    if (undoHistory.length === 0) return

    setUndoHistory(prev => {
      const newHistory = [...prev]
      const previousFile = newHistory.pop()
      
      if (previousFile) {
        setUploadedFile(previousFile)
        setProcessedImage(null)
        setProcessedImageUrl(null)
        
        // Get new image dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height })
        }
        img.src = URL.createObjectURL(previousFile)
      }
      
      return newHistory
    })
  }, [undoHistory.length])

  const clearHistory = useCallback(() => {
    setUndoHistory([])
  }, [])

  const handleFileUpload = async (file) => {
    setUploadedFile(file)
    setProcessedImage(null)
    setProcessedImageUrl(null)
    setError(null)
    clearHistory() // Clear history when new file is uploaded
    
    // Get image dimensions for pixelation calculation
    const img = new Image()
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height }
      setImageDimensions(dimensions)
      // Save main image state for Batch page
      saveMainImage(file, dimensions)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleImageChange = () => {
    // Clean up object URLs
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl)
    }
    setUploadedFile(null)
    setProcessedImage(null)
    setProcessedImageUrl(null)
    setImageDimensions({ width: 0, height: 0 })
    setError(null)
    clearHistory() // Clear history when user picks new image
  }

  const handleCrop = async (aspectRatio, cropX, cropY, cropWidth, cropHeight) => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    try {
      setError(null)
      // Save current file to history before applying crop
      addToHistory(uploadedFile)
      
      const croppedFile = await cropImage(uploadedFile, aspectRatio, cropX, cropY, cropWidth, cropHeight)
      
      // Update uploaded file and reset processed image
      setUploadedFile(croppedFile)
      setProcessedImage(null)
      setProcessedImageUrl(null)
      
      // Get new image dimensions
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(croppedFile)
    } catch (err) {
      setError(err.message || 'Crop failed')
    }
  }

  const handleCrunch = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    // Enable Live Update if it's off
    if (!liveUpdate) {
      setLiveUpdate(true)
    }

    try {
      setError(null)
      // Save current file to history before applying crunch
      addToHistory(uploadedFile)
      
      const normalizedFile = await normalizeTo72dpi(uploadedFile)
      
      // Update uploaded file and reset processed image
      setUploadedFile(normalizedFile)
      setProcessedImage(null)
      setProcessedImageUrl(null)
      
      // Get new image dimensions
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(normalizedFile)
    } catch (err) {
      setError(err.message || 'Crunch failed')
    }
  }

  const handle2xCrunch = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    // Enable Live Update if it's off
    if (!liveUpdate) {
      setLiveUpdate(true)
    }

    try {
      setError(null)
      // Save current file to history before applying 2x crunch
      addToHistory(uploadedFile)
      
      // Apply crunch twice
      const firstCrunch = await normalizeTo72dpi(uploadedFile)
      const secondCrunch = await normalizeTo72dpi(firstCrunch)
      
      // Update uploaded file and reset processed image
      setUploadedFile(secondCrunch)
      setProcessedImage(null)
      setProcessedImageUrl(null)
      
      // Get new image dimensions
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(secondCrunch)
    } catch (err) {
      setError(err.message || '2x Crunch failed')
    }
  }

  // Calculate pixel size from pixelation level
  // Maps to pixel block size (1x1 to 100x100) using exponential function
  // Note: level can be slightly above 10 to support direct pixel size inputs above ~50
  const calculatePixelSize = (level) => {
    // Use exponential mapping: pixelSize = 1 + ((level - 1) / 9)^2 * 99
    // This gives better granularity at lower levels
    // Clamp level to reasonable range (allow slightly above 10 for precision)
    const clampedLevel = Math.max(1.0, Math.min(10.1, level))
    const normalizedLevel = (clampedLevel - 1) / 9
    const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
    return Math.max(1, Math.min(100, pixelSize)) // Clamp between 1 and 100
  }

  // Calculate target dimensions from pixel size
  const calculateTargetDimensions = (overrideLevel = null) => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100, pixelSize: 1, multiplier: 1.0 }
    }
    
    const levelToUse = overrideLevel !== null ? overrideLevel : pixelationLevel
    const pixelSize = calculatePixelSize(levelToUse)
    const targetWidth = Math.max(1, Math.floor(imageDimensions.width / pixelSize))
    const targetHeight = Math.max(1, Math.floor(imageDimensions.height / pixelSize))
    
    // Calculate multiplier to make pixelation more visible/sensitive
    // Multiplier increases with pixelation level to make effect more visible
    // For now, use a constant multiplier that makes pixelation more visible
    // This can be adjusted based on user feedback
    const multiplier = 1.0 + (pixelSize / 100) * 2.0 // Multiplier from 1.0 to 3.0 based on pixel size
    
    return { width: targetWidth, height: targetHeight, pixelSize, multiplier }
  }

  const handleProcess = useCallback(async (overridePixelationLevel = null) => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    setProcessing(true)
    setProcessingProgress(0)
    setError(null)

    try {
      // Calculate target dimensions and multiplier (with optional override level)
      const { width: targetWidth, height: targetHeight, multiplier } = 
        calculateTargetDimensions(overridePixelationLevel)

      // Process image client-side using Canvas API
      const blob = await pixelateImage(
        uploadedFile,
        targetWidth,
        targetHeight,
        pixelationMethod,
        multiplier,
        (progress) => {
          setProcessingProgress(progress)
        }
      )

      // Create object URL from blob
      const url = URL.createObjectURL(blob)
      
      // Clean up previous URL if exists
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl)
      }
      
      setProcessedImageUrl(url)
      setProcessedImage('processed') // Just a flag, we use the URL
      
      // Save pixelated image and info for batch page
      const { pixelSize } = calculateTargetDimensions(overridePixelationLevel)
      const imageInfo = {
        originalDimensions: imageDimensions,
        pixelSize: pixelSize,
        targetDimensions: { width: targetWidth, height: targetHeight },
        pixelationMethod: pixelationMethod
      }
      await savePixelatedImage(url, imageInfo)
    } catch (err) {
      setError(err.message || 'Processing failed')
    } finally {
      setProcessing(false)
      setProcessingProgress(0)
    }
  }, [uploadedFile, pixelationLevel, pixelationMethod, imageDimensions, processedImageUrl])

  // Debounced auto-process for live update
  const debounceTimerRef = useRef(null)
  
  useEffect(() => {
    if (liveUpdate && uploadedFile && !processing) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        handleProcess()
      }, 300) // 300ms debounce
      
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }
  }, [liveUpdate, pixelationLevel, pixelationMethod, uploadedFile, handleProcess, processing])

  // Save pixelated image when processedImageUrl changes (for batch page)
  useEffect(() => {
    if (processedImageUrl && imageDimensions.width > 0) {
      const { pixelSize, width: targetWidth, height: targetHeight } = calculateTargetDimensions()
      const imageInfo = {
        originalDimensions: imageDimensions,
        pixelSize: pixelSize,
        targetDimensions: { width: targetWidth, height: targetHeight },
        pixelationMethod: pixelationMethod
      }
      savePixelatedImage(processedImageUrl, imageInfo).catch(err => {
        console.error('Failed to save pixelated image:', err)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedImageUrl, imageDimensions, pixelationMethod, pixelationLevel])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl)
      }
    }
  }, [processedImageUrl])

  // Sanitize filename - remove invalid characters
  const sanitizeFilename = (filename) => {
    // Remove invalid characters: / \ : * ? " < > |
    return filename.replace(/[\/\\:*?"<>|]/g, '').trim()
  }

  const handleDownload = async () => {
    if (!processedImageUrl) return

    // Generate default filename
    const defaultFilename = `pxl8_${downloadCount}.png`
    
    // Show prompt dialog
    const userInput = prompt('Enter filename (without extension):', `pxl8_${downloadCount}`)
    
    // If Cancel pressed (null), exit early without downloading
    if (userInput === null) {
      return // Don't download, don't increment counter
    }
    
    // Determine final filename
    let finalFilename = defaultFilename
    if (userInput.trim() !== '') {
      // User provided custom filename
      const sanitized = sanitizeFilename(userInput.trim())
      if (sanitized) {
        // Add .png extension if not present
        finalFilename = sanitized.endsWith('.png') ? sanitized : `${sanitized}.png`
      }
    }
    
    // Create download link
    const link = document.createElement('a')
    link.href = processedImageUrl
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Increment download count and save to localStorage
    const newCount = downloadCount + 1
    setDownloadCount(newCount)
    localStorage.setItem('pxl8_download_count', newCount.toString())
  }


  // Save dark mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pxl8_dark_mode', darkMode.toString())
  }, [darkMode])

  // Apply dark mode to body for global styles
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  // Keyboard shortcut for undo (Ctrl+Z or Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if crop modal is open (prevent undo during crop)
      const cropModal = document.querySelector('.crop-modal-overlay')
      if (cropModal && cropModal.style.display !== 'none') {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (undoHistory.length > 0) {
          handleUndo()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoHistory.length, handleUndo])

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="app-content">
        {!uploadedFile ? (
          <div className="upload-section">
            <ImageUpload onFileUpload={handleFileUpload} />
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <>
            <div className="image-display-section">
              <ImagePreview
                originalFile={uploadedFile}
                processedImageUrl={processedImageUrl}
                onImageChange={handleImageChange}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="controls-section">
              <PixelationControls
                liveUpdate={liveUpdate}
                onLiveUpdateChange={handleLiveUpdateChange}
                pixelationLevel={pixelationLevel}
                onPixelationLevelChange={setPixelationLevel}
                method={pixelationMethod}
                onMethodChange={setPixelationMethod}
                imageDimensions={imageDimensions}
                onDownload={handleDownload}
                onProcess={handleProcess}
                processedImageUrl={processedImageUrl}
                onCrop={handleCrop}
                onCrunch={handleCrunch}
                on2xCrunch={handle2xCrunch}
                onUndo={handleUndo}
                canUndo={canUndo()}
                hasUploadedFile={!!uploadedFile}
                originalFile={uploadedFile}
                darkMode={darkMode}
                onDarkModeChange={setDarkMode}
              />
            </div>
          </>
        )}
      </div>

      <footer className="app-footer">
        <a href="#" className="footer-link">Background Removal Tool</a>
        <span className="footer-separator">•</span>
        <a href="https://github.com/j031nich0145/j031nich0145/blob/main/LICENSING.md" 
           target="_blank" 
           rel="noopener noreferrer" 
           className="footer-link">
          Commercial Use License
        </a>
        <span className="footer-separator">•</span>
        <a href="https://github.com/j031nich0145/j031nich0145/" 
           target="_blank" 
           rel="noopener noreferrer" 
           className="footer-link">
          Buy Us Coffee
        </a>
      </footer>
    </div>
  )
}

export default Pxl8

