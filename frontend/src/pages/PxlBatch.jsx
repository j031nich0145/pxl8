import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BatchThumbnailsGrid from '../components/BatchPxl8/BatchThumbnailsGrid'
import BatchInfoBox from '../components/BatchPxl8/BatchInfoBox'
import BatchPreviewInfoCard from '../components/BatchPxl8/BatchPreviewInfoCard'
import BatchImagePreviewModal from '../components/BatchPxl8/BatchImagePreviewModal'
import { getSettings } from '../utils/settings-manager'
import { loadPixelatedImage, getPixelatedImageUrl, getPixelatedImageInfo, savePixelatedImage, saveMainImage, saveBatchImages, loadBatchImages, getMainImageUrl } from '../utils/image-state-manager'
import { pixelateImage } from '../utils/pixelation-client'
import { normalizeTo72dpi } from '../utils/image-manipulation'
import JSZip from 'jszip'
import './PxlBatch.css'

function PxlBatch() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [pixelatedImageUrl, setPixelatedImageUrl] = useState(null)
  const [pixelatedImageInfo, setPixelatedImageInfo] = useState(null)
  const [settings, setSettings] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [processedImageUrls, setProcessedImageUrls] = useState({})
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageUrl: null,
    imageName: null,
    imageDimensions: null,
    originalImageUrl: null,
    originalImageDimensions: null,
    isTargetImage: false,
    currentIndex: 0
  })
  const [originalTargetImageUrl, setOriginalTargetImageUrl] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pxl8_dark_mode')
    return saved === 'true'
  })
  const fileInputRef = useRef(null)

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
      
      // Load original target image URL for hover functionality
      const originalUrl = getMainImageUrl()
      if (originalUrl) {
        setOriginalTargetImageUrl(originalUrl)
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
    const newProcessedUrls = { ...processedImageUrls }
    const newResults = results.filter((_, i) => i !== index)
    
    // Remove the processed URL for this index and reindex remaining ones
    delete newProcessedUrls[index]
    const reindexedUrls = {}
    Object.keys(newProcessedUrls).forEach(key => {
      const keyNum = parseInt(key)
      if (keyNum > index) {
        reindexedUrls[keyNum - 1] = newProcessedUrls[key]
      } else {
        reindexedUrls[key] = newProcessedUrls[key]
      }
    })
    
    setFiles(newFiles)
    setProcessedImageUrls(reindexedUrls)
    setResults(newResults)
    
    // Save updated batch images to localStorage
    saveBatchImages(newFiles).catch(err => {
      console.error('Failed to save batch images:', err)
    })
  }

  // Handle target image change (X button click) - navigate to single page
  const handleTargetImageChange = () => {
    navigate('/')
  }

  // Preview all images (process and replace thumbnails in-place)
  const handlePreviewAll = async () => {
    if (files.length === 0 || !settings || !pixelatedImageInfo) return
    
    setProcessing(true)
    setResults([])
    
    const crunchCount = pixelatedImageInfo.crunchCount || 0
    console.log('Processing batch with crunchCount:', crunchCount) // Debug log
    
    // Initialize results array
    const initialResults = files.map(file => ({
      file,
      progress: 0,
      status: 'processing',
      processedBlob: null,
      error: null,
      originalDimensions: null,
      pixelatedDimensions: null
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
              // Store original dimensions immediately
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  originalDimensions: { width: img.width, height: img.height }
                }
                return updated
              })
              
              // Apply crunch operations if needed
              let processedFile = file
              let finalWidth = img.width
              let finalHeight = img.height
              
              if (crunchCount > 0) {
                console.log(`Applying ${crunchCount}x crunch to image ${i + 1}`) // Debug log
                // Apply crunch operations sequentially
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
                    console.log(`After crunch: ${finalWidth}x${finalHeight}`) // Debug log
                    URL.revokeObjectURL(crunchedImgUrl)
                    resolveCrunched()
                  }
                  crunchedImg.onerror = () => {
                    console.error('Failed to load crunched image') // Debug log
                    URL.revokeObjectURL(crunchedImgUrl)
                    resolveCrunched()
                  }
                  crunchedImg.src = crunchedImgUrl
                })
              }
              
              const pixelSize = calculatePixelSize(settings.pixelationLevel)
              const targetWidth = Math.max(1, Math.floor(finalWidth / pixelSize))
              const targetHeight = Math.max(1, Math.floor(finalHeight / pixelSize))
              
              // Always use multiplier of 1.0 to maintain original image dimensions
              const multiplier = 1.0
              
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
              ).then(async blob => {
                const blobUrl = URL.createObjectURL(blob)
                
                // Detect pixelated image dimensions
                const pixelatedImg = new Image()
                await new Promise((resolvePixelated) => {
                  pixelatedImg.onload = () => {
                    const pixelatedDimensions = {
                      width: pixelatedImg.width,
                      height: pixelatedImg.height
                    }
                    
                    setResults(prev => {
                      const updated = [...prev]
                      updated[i] = {
                        ...updated[i],
                        processedBlob: blob,
                        status: 'completed',
                        progress: 100,
                        pixelatedDimensions
                      }
                      return updated
                    })
                    
                    resolvePixelated()
                  }
                  pixelatedImg.onerror = () => {
                    console.error('Failed to load pixelated image for dimension detection')
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
                    resolvePixelated()
                  }
                  pixelatedImg.src = blobUrl
                })
                
                // Store processed image URL for in-place replacement
                setProcessedImageUrls(prev => ({
                  ...prev,
                  [i]: blobUrl
                }))
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
    
    console.log('handleDownloadZip called, completedResults:', completedResults.length) // Debug log
    
    if (completedResults.length === 0) {
      console.warn('No completed results to download')
      alert('No processed images available to download. Please process images first.')
      return
    }
    
    try {
      const zip = new JSZip()
      
      // Add each processed image to zip
      completedResults.forEach((result) => {
        zip.file(`pixelated_${result.file.name}`, result.processedBlob)
      })
      
      console.log(`Creating zip with ${completedResults.length} images`) // Debug log
      
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
      
      console.log('Zip file downloaded successfully') // Debug log
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
    // Revoke processed image URLs and clear them
    Object.values(processedImageUrls).forEach(url => {
      URL.revokeObjectURL(url)
    })
    setProcessedImageUrls({})
    // Only clear results, keep batch images loaded
  }

  // Placeholder for batch crop functionality
  const handleBatchCrop = () => {
    // TODO: Implement batch crop functionality
    console.log('Batch Crop functionality coming soon')
  }

  // Handle thumbnail click to open preview modal
  const handleThumbnailClick = (imageUrl, imageName, imageDimensions, imageIndex) => {
    const isTargetImage = imageName === 'Target Image'
    
    // For batch images, get dimensions from results
    let originalUrl = null
    let originalDims = null
    let pixelatedDims = imageDimensions  // passed from thumbnail
    
    if (isTargetImage) {
      originalUrl = originalTargetImageUrl
      originalDims = pixelatedImageInfo?.originalDimensions || null
      pixelatedDims = pixelatedImageInfo?.pixelatedDimensions || null
    } else if (imageIndex !== undefined) {
      // Calculate batch file index
      const fileIndex = pixelatedImageUrl ? imageIndex - 1 : imageIndex
      if (fileIndex >= 0 && fileIndex < files.length) {
        const result = results[fileIndex]
        originalUrl = URL.createObjectURL(files[fileIndex])
        originalDims = result?.originalDimensions || null
        pixelatedDims = result?.pixelatedDimensions || null
      }
    }
    
    setPreviewModal({
      isOpen: true,
      imageUrl,
      imageName,
      imageDimensions: pixelatedDims,
      originalImageUrl: originalUrl,
      originalImageDimensions: originalDims,
      isTargetImage,
      currentIndex: imageIndex !== undefined ? imageIndex : 0
    })
  }

  // Handle preview navigation
  const handlePreviewNavigate = (direction) => {
    // Build list of all images (target + batch files)
    const allImages = []
    
    // Add target image if it exists
    if (pixelatedImageUrl) {
      allImages.push({
        url: pixelatedImageUrl,
        name: 'Target Image',
        dimensions: pixelatedImageInfo?.pixelatedDimensions || null,
        originalUrl: originalTargetImageUrl,
        originalDimensions: pixelatedImageInfo?.originalDimensions || null,
        isTarget: true
      })
    }
    
    // Add batch files
    files.forEach((file, index) => {
      const result = results[index]
      const processedUrl = processedImageUrls[index]
      
      allImages.push({
        url: processedUrl || URL.createObjectURL(file),
        name: file.name,
        dimensions: result?.pixelatedDimensions || null,
        originalUrl: URL.createObjectURL(file),
        originalDimensions: result?.originalDimensions || null,
        isTarget: false
      })
    })
    
    const currentIndex = previewModal.currentIndex
    let newIndex = currentIndex
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'next' && currentIndex < allImages.length - 1) {
      newIndex = currentIndex + 1
    }
    
    if (newIndex !== currentIndex) {
      const newImage = allImages[newIndex]
      setPreviewModal({
        isOpen: true,
        imageUrl: newImage.url,
        imageName: newImage.name,
        imageDimensions: newImage.dimensions,
        originalImageUrl: newImage.originalUrl,
        originalImageDimensions: newImage.originalDimensions,
        isTargetImage: newImage.isTarget,
        currentIndex: newIndex
      })
    }
  }

  // Handle closing preview modal
  const handleCloseModal = () => {
    setPreviewModal({
      isOpen: false,
      imageUrl: null,
      imageName: null,
      imageDimensions: null,
      originalImageUrl: null,
      originalImageDimensions: null,
      isTargetImage: false,
      currentIndex: 0
    })
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
        
        {/* Batch Thumbnails Grid (includes target image as first item) */}
        <BatchThumbnailsGrid 
          targetImageUrl={pixelatedImageUrl}
          originalTargetImageUrl={originalTargetImageUrl}
          files={files} 
          onRemove={handleRemoveFile}
          onUploadClick={handleUploadClick}
          onTargetImageChange={handleTargetImageChange}
          disabled={processing}
          results={results}
          processedImageUrls={processedImageUrls}
          onThumbnailClick={handleThumbnailClick}
          previewInfoCard={
            results.length > 0 && !processing && completedResults.length > 0 ? (
              <BatchPreviewInfoCard
                results={results}
                pixelatedImageInfo={pixelatedImageInfo}
                onClear={handleClearResults}
                onDownloadZip={handleDownloadZip}
              />
            ) : null
          }
        />

        {/* Image Preview Modal */}
        <BatchImagePreviewModal
          imageUrl={previewModal.imageUrl}
          imageName={previewModal.imageName}
          imageDimensions={previewModal.imageDimensions}
          originalImageUrl={previewModal.originalImageUrl}
          originalImageDimensions={previewModal.originalImageDimensions}
          isTargetImage={previewModal.isTargetImage}
          isOpen={previewModal.isOpen}
          onClose={handleCloseModal}
          currentIndex={previewModal.currentIndex}
          totalImages={(pixelatedImageUrl ? 1 : 0) + files.length}
          onNavigate={handlePreviewNavigate}
        />

        {/* Blue Info Box */}
        <BatchInfoBox
          mainImage={pixelatedImageUrl ? true : false}
          mainImageDimensions={pixelatedImageInfo?.originalDimensions || { width: 0, height: 0 }}
          targetDimensions={pixelatedImageInfo?.targetDimensions || { width: 0, height: 0 }}
          pixelSize={pixelatedImageInfo?.pixelSize || 0}
          batchCount={files.length}
          onUpload={handleUploadClick}
          onDownload={handleDownloadZip}
          onProcessAll={handlePreviewAll}
          onBatchCrop={handleBatchCrop}
          onClear={handleClear}
          showProcessButtons={files.length > 0 && !processing}
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
