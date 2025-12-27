import { useState, useEffect, useRef } from 'react'
import BatchThumbnailsGrid from '../components/BatchPxl8/BatchThumbnailsGrid'
import BatchInfoBox from '../components/BatchPxl8/BatchInfoBox'
import BatchProgress from '../components/BatchPxl8/BatchProgress'
import BatchResults from '../components/BatchPxl8/BatchResults'
import { getSettings } from '../utils/settings-manager'
import { loadPixelatedImage, getPixelatedImageUrl, getPixelatedImageInfo, savePixelatedImage, saveMainImage, saveBatchImages, loadBatchImages } from '../utils/image-state-manager'
import { pixelateImage } from '../utils/pixelation-client'
import { normalizeTo72dpi } from '../utils/image-manipulation'
import JSZip from 'jszip'
import './PxlBatch.css'

function PxlBatch() {
  const [files, setFiles] = useState([])
  const [pixelatedImageUrl, setPixelatedImageUrl] = useState(null)
  const [pixelatedImageInfo, setPixelatedImageInfo] = useState(null)
  const [settings, setSettings] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pxl8_dark_mode')
    return saved === 'true'
  })
  const fileInputRef = useRef(null)
  const targetImageInputRef = useRef(null)

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = getSettings()
    setSettings(loadedSettings)
  }, [])

  // Load pixelated image and batch images on mount
  useEffect(() => {
    const loadData = async () => {
      // Load pixelated image
      const pixelatedData = await loadPixelatedImage()
      if (pixelatedData) {
        setPixelatedImageUrl(pixelatedData.imageUrl)
        setPixelatedImageInfo(pixelatedData.imageInfo)
      } else {
        // Try synchronous fallback
        const url = getPixelatedImageUrl()
        const info = getPixelatedImageInfo()
        if (url && info) {
          setPixelatedImageUrl(url)
          setPixelatedImageInfo(info)
        }
      }
      
      // Load batch images
      const savedFiles = await loadBatchImages()
      if (savedFiles && savedFiles.length > 0) {
        setFiles(savedFiles)
      }
    }
    
    loadData()
  }, [])

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  // Save dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('pxl8_dark_mode', darkMode.toString())
  }, [darkMode])

  // Calculate pixel size from pixelation level (same as Pxl8.jsx)
  const calculatePixelSize = (level) => {
    const clampedLevel = Math.max(1.0, Math.min(10.1, level))
    const normalizedLevel = (clampedLevel - 1) / 9
    const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
    return Math.max(1, Math.min(100, pixelSize))
  }

  // Handle upload button click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files)
      const validFiles = []
      const errors = []

      fileArray.forEach(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (validTypes.includes(file.type)) {
          if (files.length + validFiles.length < 48) {
            validFiles.push(file)
          } else {
            errors.push(`${file.name}: Maximum 48 files allowed`)
          }
        } else {
          errors.push(`${file.name}: Only JPG and PNG files are allowed`)
        }
      })

      if (errors.length > 0) {
        alert(`Some files were rejected:\n${errors.join('\n')}`)
      }

      if (validFiles.length > 0) {
        const newFiles = [...files, ...validFiles]
        setFiles(newFiles)
        // Save batch images to localStorage
        saveBatchImages(newFiles).catch(err => {
          console.error('Failed to save batch images:', err)
        })
      }
    }
  }

  // Remove file from batch
  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    // Save updated batch images to localStorage
    saveBatchImages(newFiles).catch(err => {
      console.error('Failed to save batch images:', err)
    })
  }

  // Handle target image change (X button click)
  const handleTargetImageChange = () => {
    if (targetImageInputRef.current) {
      targetImageInputRef.current.click()
    }
  }

  // Handle target image file selection
  const handleTargetImageFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      
      if (!validTypes.includes(file.type)) {
        alert('Please select a JPG or PNG image file')
        e.target.value = ''
        return
      }

      if (!settings) {
        alert('Settings not loaded yet. Please wait.')
        e.target.value = ''
        return
      }

      try {
        // Get image dimensions
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        
        await new Promise((resolve, reject) => {
          img.onload = async () => {
            const dimensions = { width: img.width, height: img.height }
            
            // Save original file for single page
            saveMainImage(file, dimensions)
            
            // Calculate pixelation settings
            const pixelSize = calculatePixelSize(settings.pixelationLevel)
            const targetWidth = Math.max(1, Math.floor(img.width / pixelSize))
            const targetHeight = Math.max(1, Math.floor(img.height / pixelSize))
            const multiplier = 1.0 + (pixelSize / 100) * 2.0
            
            // Process image to create pixelated version
            try {
              const blob = await pixelateImage(
                file,
                targetWidth,
                targetHeight,
                settings.pixelationMethod,
                multiplier,
                () => {} // No progress callback needed
              )
              
              const blobUrl = URL.createObjectURL(blob)
              
              // Save pixelated image and info
              const imageInfo = {
                originalDimensions: dimensions,
                pixelSize: pixelSize,
                targetDimensions: { width: targetWidth, height: targetHeight },
                pixelationMethod: settings.pixelationMethod
              }
              
              await savePixelatedImage(blobUrl, imageInfo)
              
              // Update display
              setPixelatedImageUrl(blobUrl)
              setPixelatedImageInfo(imageInfo)
              
              URL.revokeObjectURL(imgUrl)
              resolve()
            } catch (error) {
              URL.revokeObjectURL(imgUrl)
              reject(error)
            }
          }
          img.onerror = () => {
            URL.revokeObjectURL(imgUrl)
            reject(new Error('Failed to load image'))
          }
          img.src = imgUrl
        })
      } catch (error) {
        console.error('Failed to set target image:', error)
        alert('Failed to process target image. Please try again.')
      }
      
      // Reset input
      e.target.value = ''
    }
  }

  // Set thumbnail as target image
  const handleSetAsTarget = async (file, index) => {
    if (!settings) return

    try {
      // Get image dimensions
      const img = new Image()
      const imgUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        img.onload = async () => {
          const dimensions = { width: img.width, height: img.height }
          
          // Save original file for single page
          saveMainImage(file, dimensions)
          
          // Calculate pixelation settings
          const pixelSize = calculatePixelSize(settings.pixelationLevel)
          const targetWidth = Math.max(1, Math.floor(img.width / pixelSize))
          const targetHeight = Math.max(1, Math.floor(img.height / pixelSize))
          const multiplier = 1.0 + (pixelSize / 100) * 2.0
          
          // Process image to create pixelated version
          try {
            const blob = await pixelateImage(
              file,
              targetWidth,
              targetHeight,
              settings.pixelationMethod,
              multiplier,
              () => {} // No progress callback needed
            )
            
            const blobUrl = URL.createObjectURL(blob)
            
            // Save pixelated image and info
            const imageInfo = {
              originalDimensions: dimensions,
              pixelSize: pixelSize,
              targetDimensions: { width: targetWidth, height: targetHeight },
              pixelationMethod: settings.pixelationMethod
            }
            
            await savePixelatedImage(blobUrl, imageInfo)
            
            // Update display
            setPixelatedImageUrl(blobUrl)
            setPixelatedImageInfo(imageInfo)
            
            URL.revokeObjectURL(imgUrl)
            resolve()
          } catch (error) {
            URL.revokeObjectURL(imgUrl)
            reject(error)
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(imgUrl)
          reject(new Error('Failed to load image'))
        }
        img.src = imgUrl
      })
    } catch (error) {
      console.error('Failed to set target image:', error)
    }
  }

  // Process all images
  const handleProcessAll = async () => {
    if (files.length === 0 || !settings || !pixelatedImageInfo) return
    
    setProcessing(true)
    setResults([])
    
    const crunchCount = pixelatedImageInfo.crunchCount || 0
    
    // Initialize results array
    const initialResults = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      processedBlob: null,
      error: null
    }))
    setResults(initialResults)
    
    // Process sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Calculate target dimensions
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        
        await new Promise((resolve) => {
          img.onload = async () => {
            try {
              // Apply crunch operations if needed
              let processedFile = file
              let finalWidth = img.width
              let finalHeight = img.height
              
              if (crunchCount > 0) {
                processedFile = file
                for (let j = 0; j < crunchCount; j++) {
                  processedFile = await normalizeTo72dpi(processedFile)
                }
                // Recalculate image dimensions after crunch
                const crunchedImg = new Image()
                const crunchedImgUrl = URL.createObjectURL(processedFile)
                await new Promise((resolveCrunched) => {
                  crunchedImg.onload = () => {
                    finalWidth = crunchedImg.width
                    finalHeight = crunchedImg.height
                    URL.revokeObjectURL(crunchedImgUrl)
                    resolveCrunched()
                  }
                  crunchedImg.onerror = () => {
                    URL.revokeObjectURL(crunchedImgUrl)
                    resolveCrunched()
                  }
                  crunchedImg.src = crunchedImgUrl
                })
              }
              
              const pixelSize = calculatePixelSize(settings.pixelationLevel)
              const targetWidth = Math.max(1, Math.floor(finalWidth / pixelSize))
              const targetHeight = Math.max(1, Math.floor(finalHeight / pixelSize))
              
              // Calculate multiplier (same as Pxl8.jsx)
              const multiplier = 1.0 + (pixelSize / 100) * 2.0
              
              // Process image
              pixelateImage(
                processedFile,
                targetWidth,
                targetHeight,
                settings.pixelationMethod,
                multiplier,
                (progress) => {
                  setResults(prev => {
                    const updated = [...prev]
                    updated[i] = { ...updated[i], progress }
                    return updated
                  })
                }
              ).then(blob => {
                setResults(prev => {
                  const updated = [...prev]
                  updated[i] = {
                    ...updated[i],
                    processedBlob: blob,
                    status: 'completed',
                    progress: 100
                  }
                  return updated
                })
                URL.revokeObjectURL(imgUrl)
                resolve()
              }).catch(error => {
                setResults(prev => {
                  const updated = [...prev]
                  updated[i] = {
                    ...updated[i],
                    status: 'error',
                    error: error.message || 'Processing failed',
                    progress: 0
                  }
                  return updated
                })
                URL.revokeObjectURL(imgUrl)
                resolve()
              })
            } catch (error) {
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  status: 'error',
                  error: error.message || 'Processing failed',
                  progress: 0
                }
                return updated
              })
              URL.revokeObjectURL(imgUrl)
              resolve()
            }
          }
          img.onerror = () => {
            setResults(prev => {
              const updated = [...prev]
              updated[i] = {
                ...updated[i],
                status: 'error',
                error: 'Failed to load image',
                progress: 0
              }
              return updated
            })
            URL.revokeObjectURL(imgUrl)
            resolve()
          }
          img.src = imgUrl
        })
      } catch (error) {
        setResults(prev => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: error.message || 'Processing failed',
            progress: 0
          }
          return updated
        })
      }
    }
    
    setProcessing(false)
  }

  // Download batch as zip file
  const handleDownloadZip = async () => {
    const completedResults = results.filter(r => r.status === 'completed' && r.processedBlob)
    
    if (completedResults.length === 0) return
    
    try {
      const zip = new JSZip()
      
      // Add each processed image to zip
      completedResults.forEach((result) => {
        zip.file(`pixelated_${result.file.name}`, result.processedBlob)
      })
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download zip file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixelated_images_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create zip file:', error)
      alert('Failed to create zip file. Please try again.')
    }
  }

  // Download batch (individual files - kept for backward compatibility)
  const handleDownloadBatch = async () => {
    const completedResults = results.filter(r => r.status === 'completed' && r.processedBlob)
    
    if (completedResults.length === 0) return
    
    // Download with small delay between each to avoid browser blocking
    for (let i = 0; i < completedResults.length; i++) {
      const result = completedResults[i]
      const url = URL.createObjectURL(result.processedBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixelated_${result.file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (i < completedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  const handleClear = () => {
    setFiles([])
    setResults([])
    // Clear batch images from localStorage
    saveBatchImages([]).catch(err => {
      console.error('Failed to clear batch images:', err)
    })
  }

  const handleClearResults = () => {
    setResults([])
    // Only clear results, keep batch images loaded
  }

  const completedResults = results.filter(r => r.status === 'completed')

  return (
    <div className={`pxl-batch ${darkMode ? 'dark-mode' : ''}`}>
      <div className="batch-content">
        {/* Hidden file input for batch upload */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* Hidden file input for target image */}
        <input
          type="file"
          ref={targetImageInputRef}
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleTargetImageFileChange}
          style={{ display: 'none' }}
        />

        {/* Batch Thumbnails Grid (includes target image as first item) */}
        <BatchThumbnailsGrid 
          targetImageUrl={pixelatedImageUrl}
          files={files} 
          onRemove={handleRemoveFile}
          onSetAsTarget={handleSetAsTarget}
          onUploadClick={handleUploadClick}
          onTargetImageChange={handleTargetImageChange}
          disabled={processing}
        />

        {/* Progress */}
        {processing && (
          <BatchProgress results={results} />
        )}

        {/* Results */}
        {results.length > 0 && !processing && (
          <BatchResults 
            results={results} 
            pixelatedImageInfo={pixelatedImageInfo}
            onClear={handleClearResults}
            onDownloadZip={handleDownloadZip}
          />
        )}

        {/* Blue Info Box */}
        <BatchInfoBox
          mainImage={pixelatedImageUrl ? true : false}
          mainImageDimensions={pixelatedImageInfo?.originalDimensions || { width: 0, height: 0 }}
          batchCount={files.length}
          onUpload={handleUploadClick}
          onDownload={handleDownloadBatch}
          onProcessAll={handleProcessAll}
          onClear={handleClear}
          showProcessButtons={files.length > 0 && !processing && results.length === 0}
          canDownload={completedResults.length > 0}
          darkMode={darkMode}
          onDarkModeChange={setDarkMode}
        />
      </div>

      {/* Footer */}
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

export default PxlBatch
