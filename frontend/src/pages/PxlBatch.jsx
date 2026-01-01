import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BatchThumbnailsGrid from '../components/BatchPxl8/BatchThumbnailsGrid'
import BatchInfoBox from '../components/BatchPxl8/BatchInfoBox'
import BatchPreviewInfoCard from '../components/BatchPxl8/BatchPreviewInfoCard'
import BatchImagePreviewModal from '../components/BatchPxl8/BatchImagePreviewModal'
import BatchCropModal from '../components/BatchPxl8/BatchCropModal'
import BatchCrunchModal from '../components/BatchPxl8/BatchCrunchModal'
import InfoModal from '../components/InfoModal'
import { getSettings } from '../utils/settings-manager'
import { loadPixelatedImage, getPixelatedImageUrl, getPixelatedImageInfo, savePixelatedImage, saveMainImage, saveBatchImages, loadBatchImages, getMainImageUrl, loadMainImage } from '../utils/image-state-manager'
import { pixelateImage } from '../utils/pixelation-client'
import { normalizeTo72dpi, batchCropImages } from '../utils/image-manipulation'
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
    targetDimensions: null,
    originalImageUrl: null,
    originalImageDimensions: null,
    isTargetImage: false,
    hasPixelated: false,
    currentIndex: 0
  })
  const [originalTargetImageUrl, setOriginalTargetImageUrl] = useState(null)
  const [originalTargetFilename, setOriginalTargetFilename] = useState(null)
  const [targetImageFile, setTargetImageFile] = useState(null) // Target image as File for batch operations
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pxl8_dark_mode')
    return saved === 'true'
  })
  const [showBatchCropModal, setShowBatchCropModal] = useState(false)
  const [showBatchCrunchModal, setShowBatchCrunchModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
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
        
        // Detect actual pixelated dimensions if not already stored
        let imageInfo = pixelatedData.imageInfo
        if (!imageInfo.pixelatedDimensions && pixelatedData.imageUrl) {
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = () => {
              imageInfo = {
                ...imageInfo,
                pixelatedDimensions: { width: img.width, height: img.height }
              }
              resolve()
            }
            img.onerror = () => resolve()
            img.src = pixelatedData.imageUrl
          })
        }
        
        setPixelatedImageInfo(imageInfo)
      } else {
        // Try synchronous fallback
        const url = getPixelatedImageUrl()
        const info = getPixelatedImageInfo()
        if (url && info) {
          setPixelatedImageUrl(url)
          setPixelatedImageInfo(info)
        }
      }
      
      // Load main image (original) with filename and file object
      const mainImageData = await loadMainImage()
      if (mainImageData) {
        setOriginalTargetImageUrl(mainImageData.blob 
          ? URL.createObjectURL(mainImageData.blob) 
          : null)
        // Store filename for use in modal
        setOriginalTargetFilename(mainImageData.filename || 'image.png')
        // Store file object for batch operations
        if (mainImageData.file) {
          setTargetImageFile(mainImageData.file)
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

  // Get all batch images including target as first item
  const getAllBatchImages = () => {
    const allImages = []
    if (targetImageFile) {
      allImages.push(targetImageFile)
    }
    return [...allImages, ...files]
  }

  // Check if target image exists (for conditional logic)
  const hasTargetImage = () => {
    return targetImageFile !== null
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

  // Remove file from batch (index is the files array index, not result index)
  const handleRemoveFile = (index) => {
    const hasTarget = hasTargetImage()
    const newFiles = files.filter((_, i) => i !== index)
    const newProcessedUrls = { ...processedImageUrls }
    
    // Calculate the result index for this file (offset by 1 if target exists)
    const resultIndex = hasTarget ? index + 1 : index
    
    // Remove result at the correct index, keeping target at index 0 if it exists
    const newResults = results.filter((_, i) => i !== resultIndex)
    
    // Remove the processed URL for this result index and reindex remaining ones
    delete newProcessedUrls[resultIndex]
    const reindexedUrls = {}
    Object.keys(newProcessedUrls).forEach(key => {
      const keyNum = parseInt(key)
      if (keyNum > resultIndex) {
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
    const allImages = getAllBatchImages()
    if (allImages.length === 0 || !settings || !pixelatedImageInfo) return
    
    setProcessing(true)
    setResults([])
    setProcessedImageUrls({}) // Clear previous processed URLs
    
    const crunchCount = pixelatedImageInfo.crunchCount || 0
    console.log('Processing batch with crunchCount:', crunchCount) // Debug log
    console.log('Processing', allImages.length, 'images (including target)') // Debug log
    
    // Initialize results array for all images (target + batch)
    const initialResults = allImages.map((file, idx) => ({
      file,
      progress: 0,
      status: 'processing',
      processedBlob: null,
      error: null,
      originalDimensions: null,
      pixelatedDimensions: null,
      targetDimensions: null,
      isTargetImage: hasTargetImage() && idx === 0
    }))
    setResults(initialResults)
    
    // Process sequentially
    for (let i = 0; i < allImages.length; i++) {
      const file = allImages[i]
      const isTarget = hasTargetImage() && i === 0
      
      try {
        // Calculate target dimensions
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        
        await new Promise((resolve) => {
          img.onload = async () => {
            try {
              // Store original dimensions immediately
              const originalDims = { width: img.width, height: img.height }
              console.log(`Stored original dimensions for image ${i}${isTarget ? ' (target)' : ''}:`, originalDims)
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  originalDimensions: originalDims
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
              
              // Store target dimensions
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  targetDimensions: { width: targetWidth, height: targetHeight }
                }
                return updated
              })
              
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
                    console.log(`Stored pixelated dimensions for image ${i}:`, pixelatedDimensions)
                    
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
                
                // If this is the target image, also update the pixelated image URL and save to storage
                if (isTarget) {
                  setPixelatedImageUrl(blobUrl)
                  // Save updated pixelated image to storage
                  savePixelatedImage(blob, {
                    ...pixelatedImageInfo,
                    pixelatedDimensions: { width: pixelatedImg.width, height: pixelatedImg.height }
                  }).catch(err => console.error('Failed to save updated target image:', err))
                }
                
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
      
      // Add each processed image to zip (target image at index 0 if present)
      completedResults.forEach((result, index) => {
        // Use original target filename for target image, otherwise use file name
        const isTarget = result.isTargetImage
        const filename = isTarget && originalTargetFilename 
          ? `pixelated_${originalTargetFilename}`
          : `pixelated_${result.file.name}`
        zip.file(filename, result.processedBlob)
      })
      
      console.log(`Creating zip with ${completedResults.length} images (including target)`) // Debug log
      
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
    // Only clear batch files, keep target image intact
    setFiles([])
    setResults([])
    setProcessedImageUrls({})
    // Clear batch images from localStorage (target image remains in main image storage)
    saveBatchImages([]).catch(err => {
      console.error('Failed to clear batch images:', err)
    })
    // Note: Target image (targetImageFile, pixelatedImageUrl, etc.) is NOT cleared
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

  // Handle batch crop
  const handleBatchCrop = () => {
    const allImages = getAllBatchImages()
    if (allImages.length === 0) {
      alert('Please upload images first')
      return
    }
    
    setShowBatchCropModal(true)
  }

  // Handle batch crop apply
  const handleBatchCropApply = async (cropData) => {
    try {
      setProcessing(true)
      setShowBatchCropModal(false)
      
      const allImages = getAllBatchImages()
      const hasTarget = hasTargetImage()
      
      // Apply crop to all included images (including target)
      const croppedFiles = await batchCropImages(allImages, cropData)
      
      // Split results: first item is target (if exists), rest are batch files
      if (hasTarget && croppedFiles.length > 0) {
        const croppedTarget = croppedFiles[0]
        const croppedBatch = croppedFiles.slice(1)
        
        // Update target image file
        setTargetImageFile(croppedTarget)
        
        // Get cropped target dimensions for saving
        const targetDims = await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.onerror = () => resolve(pixelatedImageInfo?.originalDimensions || { width: 800, height: 600 })
          img.src = URL.createObjectURL(croppedTarget)
        })
        
        // Save cropped target to main image storage
        await saveMainImage(croppedTarget, targetDims, originalTargetFilename)
        
        // Update original target image URL for display
        setOriginalTargetImageUrl(URL.createObjectURL(croppedTarget))
        
        // Update pixelatedImageInfo with new dimensions
        const updatedInfo = {
          ...pixelatedImageInfo,
          originalDimensions: targetDims
        }
        setPixelatedImageInfo(updatedInfo)
        
        // Update batch files
        setFiles(croppedBatch)
        await saveBatchImages(croppedBatch)
      } else {
        // No target, just update batch files
        setFiles(croppedFiles)
        await saveBatchImages(croppedFiles)
      }
      
      // Clear processed results since images changed
      setResults([])
      setProcessedImageUrls({})
      
      alert(`Successfully cropped ${cropData.includedImages.length} image${cropData.includedImages.length !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Batch crop failed:', error)
      alert('Failed to crop images. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Handle batch crop cancel
  const handleBatchCropCancel = () => {
    setShowBatchCropModal(false)
  }

  // Handle batch crunch click
  const handleBatchCrunchClick = () => {
    const allImages = getAllBatchImages()
    if (allImages.length === 0) {
      alert('Please upload images first')
      return
    }
    
    setShowBatchCrunchModal(true)
  }

  // Handle batch crunch operation
  const handleBatchCrunch = async (crunchCount = 1) => {
    const allImages = getAllBatchImages()
    if (allImages.length === 0) return
    
    setProcessing(true)
    setShowBatchCrunchModal(false)
    
    const hasTarget = hasTargetImage()
    
    try {
      const crunchedFiles = []
      
      for (let i = 0; i < allImages.length; i++) {
        let processedFile = allImages[i]
        
        // Apply crunch operation(s)
        for (let j = 0; j < crunchCount; j++) {
          processedFile = await normalizeTo72dpi(processedFile)
        }
        
        crunchedFiles.push(processedFile)
      }
      
      // Split results: first item is target (if exists), rest are batch files
      if (hasTarget && crunchedFiles.length > 0) {
        const crunchedTarget = crunchedFiles[0]
        const crunchedBatch = crunchedFiles.slice(1)
        
        // Update target image file
        setTargetImageFile(crunchedTarget)
        
        // Get crunched target dimensions for saving
        const targetDims = await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.onerror = () => resolve(pixelatedImageInfo?.originalDimensions || { width: 800, height: 600 })
          img.src = URL.createObjectURL(crunchedTarget)
        })
        
        // Save crunched target to main image storage
        await saveMainImage(crunchedTarget, targetDims, originalTargetFilename)
        
        // Update original target image URL for display
        setOriginalTargetImageUrl(URL.createObjectURL(crunchedTarget))
        
        // Update pixelatedImageInfo with new dimensions
        const updatedInfo = {
          ...pixelatedImageInfo,
          originalDimensions: targetDims
        }
        setPixelatedImageInfo(updatedInfo)
        
        // Update batch files
        setFiles(crunchedBatch)
        await saveBatchImages(crunchedBatch)
      } else {
        // No target, just update batch files
        setFiles(crunchedFiles)
        await saveBatchImages(crunchedFiles)
      }
      
      // Clear processed results since images changed
      setResults([])
      setProcessedImageUrls({})
      
      alert(`Successfully crunched ${crunchedFiles.length} image${crunchedFiles.length !== 1 ? 's' : ''} ${crunchCount}×`)
    } catch (error) {
      console.error('Batch crunch failed:', error)
      alert('Failed to crunch images. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Handle crunch "Crop First" workflow
  const handleCrunchCropFirst = () => {
    setShowBatchCrunchModal(false)
    setShowBatchCropModal(true)
  }

  // Handle batch crunch cancel
  const handleBatchCrunchCancel = () => {
    setShowBatchCrunchModal(false)
  }

  // Handle thumbnail click to open preview modal
  const handleThumbnailClick = (imageUrl, imageName, imageDimensions, imageIndex) => {
    const isTargetImage = imageName === 'Target Image'
    const hasTarget = hasTargetImage()
    
    // For batch images, get dimensions from results
    let originalUrl = null
    let originalDims = null
    let pixelatedDims = null  // Will be set from results/pixelatedImageInfo
    let targetDims = null
    let displayName = imageName
    let hasPixelatedVersion = false
    
    if (isTargetImage) {
      console.log('Target image click - pixelatedImageInfo:', pixelatedImageInfo)
      originalUrl = originalTargetImageUrl
      originalDims = pixelatedImageInfo?.originalDimensions || null
      // Check if target has been processed in batch (results[0])
      const targetResult = results[0]
      pixelatedDims = targetResult?.pixelatedDimensions || pixelatedImageInfo?.pixelatedDimensions || null
      targetDims = targetResult?.targetDimensions || pixelatedImageInfo?.targetDimensions || null
      displayName = originalTargetFilename || 'image.png'
      hasPixelatedVersion = processedImageUrls[0] !== undefined || pixelatedImageUrl !== null
    } else if (imageIndex !== undefined) {
      // imageIndex is now the result index (target at 0, batch at 1+)
      // Calculate the files array index
      const fileIndex = hasTarget ? imageIndex - 1 : imageIndex
      if (fileIndex >= 0 && fileIndex < files.length) {
        const result = results[imageIndex] // Use imageIndex directly for results
        console.log(`Batch image ${fileIndex} (result index ${imageIndex}) click - result:`, result)
        originalUrl = URL.createObjectURL(files[fileIndex])
        originalDims = result?.originalDimensions || null
        pixelatedDims = result?.pixelatedDimensions || null
        targetDims = result?.targetDimensions || null
        // Check if this batch image has been processed
        hasPixelatedVersion = processedImageUrls[imageIndex] !== undefined
      }
    }
    
    console.log('Setting modal with dimensions:', {
      imageName: displayName,
      pixelatedDims,
      targetDims,
      originalDims,
      hasPixelatedVersion,
      resultObject: results[imageIndex]
    })
    
    setPreviewModal({
      isOpen: true,
      imageUrl,
      imageName: displayName,
      imageDimensions: pixelatedDims,
      targetDimensions: targetDims,
      originalImageUrl: originalUrl,
      originalImageDimensions: originalDims,
      isTargetImage,
      hasPixelated: hasPixelatedVersion,
      currentIndex: imageIndex !== undefined ? imageIndex : 0
    })
  }

  // Handle preview navigation
  const handlePreviewNavigate = (direction) => {
    // Build list of all images (target + batch files)
    const allImages = []
    const hasTarget = hasTargetImage()
    
    // Add target image if it exists (index 0)
    if (hasTarget) {
      const targetResult = results[0]
      allImages.push({
        url: processedImageUrls[0] || pixelatedImageUrl,
        name: originalTargetFilename || 'image.png',
        dimensions: targetResult?.pixelatedDimensions || pixelatedImageInfo?.pixelatedDimensions || null,
        targetDimensions: targetResult?.targetDimensions || pixelatedImageInfo?.targetDimensions || null,
        originalUrl: originalTargetImageUrl,
        originalDimensions: pixelatedImageInfo?.originalDimensions || null,
        isTarget: true,
        hasPixelated: processedImageUrls[0] !== undefined || pixelatedImageUrl !== null
      })
    }
    
    // Add batch files (indices 1+ in results if target exists)
    files.forEach((file, index) => {
      const resultIndex = hasTarget ? index + 1 : index
      const result = results[resultIndex]
      const processedUrl = processedImageUrls[resultIndex]
      
      allImages.push({
        url: processedUrl || URL.createObjectURL(file),
        name: file.name,
        dimensions: result?.pixelatedDimensions || null,
        targetDimensions: result?.targetDimensions || null,
        originalUrl: URL.createObjectURL(file),
        originalDimensions: result?.originalDimensions || null,
        isTarget: false,
        hasPixelated: processedUrl !== undefined
      })
    })
    
    console.log('allImages array:', allImages)
    
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
        targetDimensions: newImage.targetDimensions,
        originalImageUrl: newImage.originalUrl,
        originalImageDimensions: newImage.originalDimensions,
        isTargetImage: newImage.isTarget,
        hasPixelated: newImage.hasPixelated,
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
      targetDimensions: null,
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
          hasTargetImage={hasTargetImage()}
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
          targetDimensions={previewModal.targetDimensions}
          originalImageUrl={previewModal.originalImageUrl}
          originalImageDimensions={previewModal.originalImageDimensions}
          isTargetImage={previewModal.isTargetImage}
          hasPixelated={previewModal.hasPixelated}
          isOpen={previewModal.isOpen}
          onClose={handleCloseModal}
          currentIndex={previewModal.currentIndex}
          totalImages={(hasTargetImage() ? 1 : 0) + files.length}
          onNavigate={handlePreviewNavigate}
        />

        {/* Batch Crop Modal */}
        {showBatchCropModal && (
          <BatchCropModal
            files={getAllBatchImages()}
            targetImageFile={targetImageFile}
            onApply={handleBatchCropApply}
            onCancel={handleBatchCropCancel}
          />
        )}

        {/* Batch Crunch Modal */}
        {showBatchCrunchModal && (
          <BatchCrunchModal
            files={getAllBatchImages()}
            targetImageFile={targetImageFile}
            onCrunch={handleBatchCrunch}
            onCropFirst={handleCrunchCropFirst}
            onCancel={handleBatchCrunchCancel}
          />
        )}

        {/* Blue Info Box */}
        <BatchInfoBox
          mainImage={pixelatedImageUrl ? true : false}
          mainImageDimensions={pixelatedImageInfo?.originalDimensions || { width: 0, height: 0 }}
          targetDimensions={pixelatedImageInfo?.targetDimensions || { width: 0, height: 0 }}
          pixelSize={pixelatedImageInfo?.pixelSize || 0}
          batchCount={getAllBatchImages().length}
          onUpload={handleUploadClick}
          onDownload={handleDownloadZip}
          onProcessAll={handlePreviewAll}
          onBatchCrop={handleBatchCrop}
          onBatchCrunch={handleBatchCrunchClick}
          onClear={handleClear}
          showProcessButtons={getAllBatchImages().length > 0 && !processing}
          canDownload={completedResults.length > 0}
          darkMode={darkMode}
          onDarkModeChange={setDarkMode}
        />
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <button 
          className="footer-info-button" 
          onClick={() => setShowInfoModal(true)}
          title="App Usage Guide"
        >
          ⓘ
        </button>
        <span className="footer-separator">•</span>
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

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  )
}

export default PxlBatch
