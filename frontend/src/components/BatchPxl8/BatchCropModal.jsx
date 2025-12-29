import { useState, useEffect, useRef } from 'react'
import './BatchCropModal.css'

function BatchCropModal({ files, onApply, onCancel }) {
  // Image state
  const [images, setImages] = useState([])
  const [stackOrder, setStackOrder] = useState([])
  
  // Crop state
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // UI state
  const [currentAspectRatio, setCurrentAspectRatio] = useState(1) // Default 1:1
  const [gridType, setGridType] = useState('off') // '3x3' | '9x9' | 'off'
  const [cropColor, setCropColor] = useState('blue') // 'blue' | 'black' | 'white'
  
  // Reference dimensions (based on smallest image)
  const [referenceDimensions, setReferenceDimensions] = useState({ width: 0, height: 0 })
  const [imageRect, setImageRect] = useState({ width: 0, height: 0, left: 0, top: 0 })
  
  // Scaling info for median-based image sizing
  const [scalingInfo, setScalingInfo] = useState({
    medianArea: 0,
    smallestScaledDimensions: { width: 0, height: 0 },
    imageScaleFactors: {}, // Per-image scale factors to normalize to median
    smallestIndex: 0,
    baseDisplayScale: 1 // Scale factor to fit median-sized content in container
  })
  
  // Bounds rect for the smallest scaled image (crop constraint area)
  const [boundsRect, setBoundsRect] = useState({ width: 0, height: 0, left: 0, top: 0 })
  
  const containerRef = useRef(null)
  const stackRef = useRef(null)

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: '1:1', label: '1:1', ratio: 1 },
    { value: '3:2', label: '3:2', ratio: 3/2 },
    { value: '4:3', label: '4:3', ratio: 4/3 }
  ]

  // Color values
  const colors = {
    blue: '#4dd0e1',
    black: '#000000',
    white: '#ffffff'
  }

  // Initialize images from files
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = files.map((file, index) => {
        return new Promise((resolve) => {
          const url = URL.createObjectURL(file)
          const img = new Image()
          img.onload = () => {
            resolve({
              file,
              url,
              included: true,
              dimensions: { width: img.width, height: img.height },
              index
            })
          }
          img.onerror = () => {
            resolve({
              file,
              url,
              included: false,
              dimensions: { width: 0, height: 0 },
              index
            })
          }
          img.src = url
        })
      })

      const loadedImages = await Promise.all(imagePromises)
      setImages(loadedImages)
      
      // Calculate scaling info based on median area
      if (loadedImages.length > 0) {
        // Get all valid image areas
        const validImages = loadedImages.filter(img => img.dimensions.width > 0)
        const areas = validImages.map(img => img.dimensions.width * img.dimensions.height)
        
        // Find smallest and largest areas
        const smallestArea = Math.min(...areas)
        const largestArea = Math.max(...areas)
        const medianArea = (smallestArea + largestArea) / 2
        
        // Find smallest image index
        let smallestIndex = 0
        let smallestDimensions = loadedImages[0].dimensions
        
        loadedImages.forEach((img, index) => {
          const currentArea = img.dimensions.width * img.dimensions.height
          const smallestAreaCheck = smallestDimensions.width * smallestDimensions.height
          
          if (currentArea < smallestAreaCheck && currentArea > 0) {
            smallestIndex = index
            smallestDimensions = img.dimensions
          }
        })
        
        // Calculate per-image scale factors to normalize to median area
        // Scale factor: sqrt(medianArea / imageArea) - so larger images scale down, smaller scale up
        const imageScaleFactors = {}
        loadedImages.forEach((img, idx) => {
          const imgArea = img.dimensions.width * img.dimensions.height
          if (imgArea > 0) {
            imageScaleFactors[idx] = Math.sqrt(medianArea / imgArea)
          } else {
            imageScaleFactors[idx] = 1
          }
        })
        
        // Calculate smallest image's scaled dimensions (this defines crop bounds)
        const smallestScale = imageScaleFactors[smallestIndex]
        const smallestScaledDimensions = {
          width: smallestDimensions.width * smallestScale,
          height: smallestDimensions.height * smallestScale
        }
        
        setScalingInfo({
          medianArea,
          smallestScaledDimensions,
          imageScaleFactors,
          smallestIndex,
          baseDisplayScale: 1
        })
        
        // Create stack order with smallest image on top (index 0)
        const newStackOrder = [smallestIndex]
        for (let i = 0; i < loadedImages.length; i++) {
          if (i !== smallestIndex) {
            newStackOrder.push(i)
          }
        }
        
        setStackOrder(newStackOrder)
        
        // Reference dimensions are the smallest image's SCALED dimensions
        if (smallestScaledDimensions.width > 0) {
          setReferenceDimensions(smallestScaledDimensions)
        }
      }
    }

    if (files.length > 0) {
      loadImages()
    }

    // Cleanup URLs on unmount
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url))
    }
  }, [files])

  // Update bounds rect and base display scale when scaling info changes
  useEffect(() => {
    const updateBoundsRect = () => {
      if (containerRef.current && scalingInfo.smallestScaledDimensions.width > 0) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const { smallestScaledDimensions } = scalingInfo
        
        // Find the largest scaled image to determine how much space we need
        let maxScaledWidth = 0
        let maxScaledHeight = 0
        
        images.forEach((img, idx) => {
          if (img.dimensions.width > 0) {
            const scaleFactor = scalingInfo.imageScaleFactors[idx] || 1
            const scaledWidth = img.dimensions.width * scaleFactor
            const scaledHeight = img.dimensions.height * scaleFactor
            maxScaledWidth = Math.max(maxScaledWidth, scaledWidth)
            maxScaledHeight = Math.max(maxScaledHeight, scaledHeight)
          }
        })
        
        // Calculate base display scale to fit the largest scaled image in container
        const scaleX = containerRect.width / maxScaledWidth
        const scaleY = containerRect.height / maxScaledHeight
        const baseDisplayScale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond 1
        
        // Update scaling info with base display scale
        setScalingInfo(prev => ({ ...prev, baseDisplayScale }))
        
        // Calculate bounds rect (smallest scaled image display dimensions)
        const boundsWidth = smallestScaledDimensions.width * baseDisplayScale
        const boundsHeight = smallestScaledDimensions.height * baseDisplayScale
        const boundsLeft = (containerRect.width - boundsWidth) / 2
        const boundsTop = (containerRect.height - boundsHeight) / 2
        
        setBoundsRect({
          width: boundsWidth,
          height: boundsHeight,
          left: boundsLeft,
          top: boundsTop
        })
        
        // imageRect now represents the smallest scaled image bounds
        setImageRect({
          width: boundsWidth,
          height: boundsHeight,
          left: boundsLeft,
          top: boundsTop
        })
      }
    }

    updateBoundsRect()
    window.addEventListener('resize', updateBoundsRect)
    return () => window.removeEventListener('resize', updateBoundsRect)
  }, [scalingInfo.smallestScaledDimensions, scalingInfo.imageScaleFactors, images])

  // Initialize crop box after imageRect is set
  useEffect(() => {
    if (!referenceDimensions.width || !imageRect.width || cropSize.width > 0) return
    
    const targetRatio = currentAspectRatio
    const imageRatio = referenceDimensions.width / referenceDimensions.height
    
    // Calculate crop box size in image pixel coordinates (not display)
    // This ensures the crop respects the target aspect ratio relative to the actual image
    let cropWidth, cropHeight
    
    if (imageRatio > targetRatio) {
      // Image wider than target ratio - constrain by height
      cropHeight = referenceDimensions.height
      cropWidth = cropHeight * targetRatio
    } else {
      // Image taller than target ratio - constrain by width
      cropWidth = referenceDimensions.width
      cropHeight = cropWidth / targetRatio
    }
    
    // Ensure crop fits within image bounds
    const finalCropWidth = Math.min(cropWidth, referenceDimensions.width)
    const finalCropHeight = Math.min(cropHeight, referenceDimensions.height)
    
    // Center the crop
    const cropX = (referenceDimensions.width - finalCropWidth) / 2
    const cropY = (referenceDimensions.height - finalCropHeight) / 2
    
    setCropSize({ width: finalCropWidth, height: finalCropHeight })
    setCropPosition({ x: cropX, y: cropY })
  }, [referenceDimensions, imageRect, currentAspectRatio, cropSize.width])

  // Calculate opacity for onion skin effect
  const calculateOpacity = (stackIndex) => {
    if (stackIndex === 0) return 0.4  // Top image (smallest)
    return 0.3  // All other images
  }

  // Move top image to bottom of stack
  const moveTopToBottom = () => {
    setStackOrder(prevOrder => {
      const newOrder = [...prevOrder]
      const topImage = newOrder.shift()
      newOrder.push(topImage)
      return newOrder
    })
  }

  // Toggle image inclusion
  const toggleImageInclusion = (imageIndex) => {
    setImages(prevImages => {
      const newImages = [...prevImages]
      newImages[imageIndex].included = !newImages[imageIndex].included
      return newImages
    })
  }

  // Calculate scale factor for display (converts reference pixel coords to display coords)
  const getScale = () => {
    if (!referenceDimensions.width || boundsRect.width === 0) {
      return 1
    }
    return boundsRect.width / referenceDimensions.width
  }

  // Calculate per-image display size using median-relative scaling
  const getImageDisplaySize = (imageDimensions, imageIndex) => {
    if (!containerRef.current || !imageDimensions.width) {
      return { width: 0, height: 0 }
    }
    
    // Get the scale factor for this image (to normalize to median area)
    const medianScaleFactor = scalingInfo.imageScaleFactors[imageIndex] || 1
    const baseDisplayScale = scalingInfo.baseDisplayScale || 1
    
    // Apply both the median normalization and the display scale
    const displayWidth = imageDimensions.width * medianScaleFactor * baseDisplayScale
    const displayHeight = imageDimensions.height * medianScaleFactor * baseDisplayScale
    
    return {
      width: displayWidth,
      height: displayHeight
    }
  }

  // Calculate image position so its center is at container center
  const getImagePosition = (imageDimensions, imageIndex) => {
    if (!containerRef.current) {
      return { left: 0, top: 0 }
    }
    const containerRect = containerRef.current.getBoundingClientRect()
    const displaySize = getImageDisplaySize(imageDimensions, imageIndex)
    // Position image so its center is at container center
    return {
      left: (containerRect.width - displaySize.width) / 2,
      top: (containerRect.height - displaySize.height) / 2
    }
  }

  // Handle mouse down on crop box
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const scale = getScale()
    const rect = stackRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = (e.clientX - rect.left - boundsRect.left) / scale
      const mouseY = (e.clientY - rect.top - boundsRect.top) / scale
      
      setDragStart({ x: mouseX, y: mouseY })
      setDragOffset({
        x: mouseX - cropPosition.x,
        y: mouseY - cropPosition.y
      })
    }
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      if (!stackRef.current || !referenceDimensions.width) return

      e.stopPropagation()

      const rect = stackRef.current.getBoundingClientRect()
      const scale = getScale()
      
      const mouseX = (e.clientX - rect.left - boundsRect.left) / scale
      const mouseY = (e.clientY - rect.top - boundsRect.top) / scale
      
      const newX = mouseX - dragOffset.x
      const newY = mouseY - dragOffset.y

      // Constrain to bounds (smallest scaled image dimensions)
      const constrainedX = Math.max(0, Math.min(newX, referenceDimensions.width - cropSize.width))
      const constrainedY = Math.max(0, Math.min(newY, referenceDimensions.height - cropSize.height))

      setCropPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, referenceDimensions, cropSize, boundsRect])

  // Handle aspect ratio change
  const handleAspectRatioChange = (newRatioValue) => {
    const newRatio = aspectRatioOptions.find(opt => opt.value === newRatioValue).ratio
    setCurrentAspectRatio(newRatio)
    
    // Recalculate crop size
    const currentArea = cropSize.width * cropSize.height
    let newWidth = Math.sqrt(currentArea * newRatio)
    let newHeight = newWidth / newRatio
    
    // Constrain to image bounds
    const maxWidthByImage = referenceDimensions.width
    const maxHeightByImage = referenceDimensions.height
    const maxWidthByRatio = maxHeightByImage * newRatio
    const maxHeightByRatio = maxWidthByImage / newRatio
    
    const absoluteMaxWidth = Math.min(maxWidthByImage, maxWidthByRatio)
    const absoluteMaxHeight = Math.min(maxHeightByImage, maxHeightByRatio)
    
    if (newWidth > absoluteMaxWidth) newWidth = absoluteMaxWidth
    if (newHeight > absoluteMaxHeight) newHeight = absoluteMaxHeight
    newWidth = Math.min(newWidth, newHeight * newRatio)
    newHeight = newWidth / newRatio
    
    // Maintain position if possible
    let newX = cropPosition.x
    let newY = cropPosition.y
    
    if (newX + newWidth > referenceDimensions.width) {
      newX = Math.max(0, (referenceDimensions.width - newWidth) / 2)
    }
    if (newY + newHeight > referenceDimensions.height) {
      newY = Math.max(0, (referenceDimensions.height - newHeight) / 2)
    }
    
    setCropSize({ width: newWidth, height: newHeight })
    setCropPosition({ x: newX, y: newY })
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleApplyCrop()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleScale('up')
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        handleScale('down')
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        handleArrowMove(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cropPosition, cropSize, referenceDimensions, currentAspectRatio])

  // Handle scaling with keyboard
  const handleScale = (direction) => {
    if (!currentAspectRatio || !referenceDimensions.width) return
    
    const scaleFactor = direction === 'up' ? 1.05 : 0.95
    let newWidth = cropSize.width * scaleFactor
    let newHeight = newWidth / currentAspectRatio
    
    // Minimum size
    if (newWidth < 20) newWidth = 20
    if (newHeight < 20) newHeight = 20
    newWidth = Math.max(20, newHeight * currentAspectRatio)
    newHeight = newWidth / currentAspectRatio
    
    // Maximum size
    const maxWidthByImage = referenceDimensions.width
    const maxHeightByImage = referenceDimensions.height
    const maxWidthByRatio = maxHeightByImage * currentAspectRatio
    const maxHeightByRatio = maxWidthByImage / currentAspectRatio
    
    const absoluteMaxWidth = Math.min(maxWidthByImage, maxWidthByRatio)
    const absoluteMaxHeight = Math.min(maxHeightByImage, maxHeightByRatio)
    
    if (newWidth > absoluteMaxWidth) newWidth = absoluteMaxWidth
    if (newHeight > absoluteMaxHeight) newHeight = absoluteMaxHeight
    newWidth = Math.min(newWidth, newHeight * currentAspectRatio)
    newHeight = newWidth / currentAspectRatio
    
    // Adjust position if needed
    let newX = cropPosition.x
    let newY = cropPosition.y
    
    if (newX + newWidth > referenceDimensions.width) {
      newX = referenceDimensions.width - newWidth
    }
    if (newY + newHeight > referenceDimensions.height) {
      newY = referenceDimensions.height - newHeight
    }
    
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)
    
    setCropSize({ width: newWidth, height: newHeight })
    setCropPosition({ x: newX, y: newY })
  }

  // Handle arrow key movement
  const handleArrowMove = (key) => {
    const moveDistance = 10
    let newX = cropPosition.x
    let newY = cropPosition.y
    
    switch(key) {
      case 'ArrowUp':
        newY = Math.max(0, cropPosition.y - moveDistance)
        break
      case 'ArrowDown':
        newY = Math.min(referenceDimensions.height - cropSize.height, cropPosition.y + moveDistance)
        break
      case 'ArrowLeft':
        newX = Math.max(0, cropPosition.x - moveDistance)
        break
      case 'ArrowRight':
        newX = Math.min(referenceDimensions.width - cropSize.width, cropPosition.x + moveDistance)
        break
    }
    
    setCropPosition({ x: newX, y: newY })
  }

  // Render grid lines
  const renderGridLines = () => {
    if (gridType === 'off') return null

    const gridDivisions = gridType === '3x3' ? 3 : 9
    const lines = []

    // Vertical lines
    for (let i = 1; i < gridDivisions; i++) {
      const xPercent = (i / gridDivisions) * 100
      const isMainLine = gridType === '9x9' && i % 3 === 0
      lines.push(
        <div
          key={`v-${i}`}
          className={`crop-grid-line crop-grid-line-vertical ${isMainLine ? 'crop-grid-line-main' : ''}`}
          style={{
            left: `${xPercent}%`,
            backgroundColor: colors[cropColor],
          }}
        />
      )
    }

    // Horizontal lines
    for (let i = 1; i < gridDivisions; i++) {
      const yPercent = (i / gridDivisions) * 100
      const isMainLine = gridType === '9x9' && i % 3 === 0
      lines.push(
        <div
          key={`h-${i}`}
          className={`crop-grid-line crop-grid-line-horizontal ${isMainLine ? 'crop-grid-line-main' : ''}`}
          style={{
            top: `${yPercent}%`,
            backgroundColor: colors[cropColor],
          }}
        />
      )
    }

    return <>{lines}</>
  }

  // Apply crop to all included images
  const handleApplyCrop = () => {
    if (!onApply) return
    
    // Pass crop coordinates relative to smallest scaled image
    // Also pass the scaling info so the crop can be applied correctly to each image
    const cropData = {
      x: cropPosition.x,
      y: cropPosition.y,
      width: cropSize.width,
      height: cropSize.height,
      referenceDimensions, // Smallest scaled image dimensions (crop bounds)
      scalingInfo, // Contains per-image scale factors
      includedImages: images.filter(img => img.included).map(img => img.index)
    }
    
    onApply(cropData)
  }

  // Get included image count
  const includedCount = images.filter(img => img.included).length

  const scale = getScale()
  const displayX = cropPosition.x * scale
  const displayY = cropPosition.y * scale
  const displayWidth = cropSize.width * scale
  const displayHeight = cropSize.height * scale

  return (
    <div className="batch-crop-modal-overlay">
      <div className="batch-crop-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="batch-crop-close"
          onClick={onCancel}
          title="Close (ESC)"
        >
          ×
        </button>

        <h2 className="batch-crop-title">Batch Crop</h2>

        {/* Controls Bar */}
        <div className="batch-crop-controls-bar">
          <div className="batch-crop-control-group">
            <button
              className="batch-crop-move-button"
              onClick={moveTopToBottom}
              title="Move top image to bottom"
            >
              ↻ Move Top to Bottom
            </button>
          </div>
          
          <div className="batch-crop-control-group">
            <span className="batch-crop-control-label">Ratio:</span>
            {aspectRatioOptions.map(option => (
              <button
                key={option.value}
                className={`batch-crop-control-button ${currentAspectRatio === option.ratio ? 'active' : ''}`}
                onClick={() => handleAspectRatioChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="batch-crop-control-group">
            <span className="batch-crop-control-label">Grid:</span>
            <button
              className={`batch-crop-control-button ${gridType === '3x3' ? 'active' : ''}`}
              onClick={() => setGridType('3x3')}
            >
              3×3
            </button>
            <button
              className={`batch-crop-control-button ${gridType === '9x9' ? 'active' : ''}`}
              onClick={() => setGridType('9x9')}
            >
              9×9
            </button>
            <button
              className={`batch-crop-control-button ${gridType === 'off' ? 'active' : ''}`}
              onClick={() => setGridType('off')}
            >
              Off
            </button>
          </div>
          
          <div className="batch-crop-control-group">
            <span className="batch-crop-control-label">Color:</span>
            <button
              className={`batch-crop-control-button batch-crop-color-button ${cropColor === 'blue' ? 'active' : ''}`}
              onClick={() => setCropColor('blue')}
              style={{ backgroundColor: cropColor === 'blue' ? colors.blue : 'transparent' }}
            >
              Blue
            </button>
            <button
              className={`batch-crop-control-button batch-crop-color-button ${cropColor === 'black' ? 'active' : ''}`}
              onClick={() => setCropColor('black')}
              style={{ backgroundColor: cropColor === 'black' ? colors.black : 'transparent' }}
            >
              Black
            </button>
            <button
              className={`batch-crop-control-button batch-crop-color-button ${cropColor === 'white' ? 'active' : ''}`}
              onClick={() => setCropColor('white')}
              style={{ 
                backgroundColor: cropColor === 'white' ? colors.white : 'transparent',
                color: cropColor === 'white' ? '#000' : '#00838f'
              }}
            >
              White
            </button>
          </div>
        </div>

        {/* Onion Skin Container */}
        <div className="batch-crop-preview-container" ref={containerRef}>
          <div className="batch-crop-stack-wrapper" ref={stackRef}>
            {/* Render images in stack order with onion skin effect */}
            {stackOrder.map((imageIndex, stackIndex) => {
              const image = images[imageIndex]
              if (!image || !image.included) return null
              
              const opacity = calculateOpacity(stackIndex)
              const displaySize = getImageDisplaySize(image.dimensions, imageIndex)
              const imagePosition = getImagePosition(image.dimensions, imageIndex)
              
              return (
                <div
                  key={`stack-${imageIndex}`}
                  className="batch-crop-stack-layer"
                  style={{
                    opacity,
                    zIndex: stackOrder.length - stackIndex
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.file.name}
                    className="batch-crop-stack-image"
                    style={{
                      width: displaySize.width > 0 ? `${displaySize.width}px` : 'auto',
                      height: displaySize.height > 0 ? `${displaySize.height}px` : 'auto',
                      left: `${imagePosition.left}px`,
                      top: `${imagePosition.top}px`,
                    }}
                  />
                </div>
              )
            })}
            
            {/* Grey Crop Bounds Box - shows smallest scaled image limits */}
            {boundsRect.width > 0 && (
              <div 
                className="batch-crop-bounds-box"
                style={{
                  width: `${boundsRect.width}px`,
                  height: `${boundsRect.height}px`,
                  left: `${boundsRect.left}px`,
                  top: `${boundsRect.top}px`,
                }}
              />
            )}

            {/* Crop Overlay - constrained within bounds box */}
            {boundsRect.width > 0 && (
              <div 
                className="batch-crop-mask"
                style={{
                  width: `${boundsRect.width}px`,
                  height: `${boundsRect.height}px`,
                  left: `${boundsRect.left}px`,
                  top: `${boundsRect.top}px`,
                }}
              >
                <div
                  className="batch-crop-overlay"
                  style={{
                    left: `${displayX}px`,
                    top: `${displayY}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    borderColor: colors[cropColor],
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {renderGridLines()}
                  <div className="batch-crop-handle" style={{ backgroundColor: colors[cropColor] }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image List */}
        <div className="batch-crop-image-list">
          <div className="batch-crop-image-list-title">
            Images in Stack ({includedCount} selected):
          </div>
          <div className="batch-crop-image-list-items">
            {stackOrder.map((imageIndex, stackIndex) => {
              const image = images[imageIndex]
              if (!image) return null
              
              return (
                <label key={`checkbox-${imageIndex}`} className="batch-crop-image-item">
                  <input
                    type="checkbox"
                    checked={image.included}
                    onChange={() => toggleImageInclusion(imageIndex)}
                  />
                  <span className="batch-crop-image-name">
                    {image.file.name} {stackIndex === 0 ? '(top)' : ''}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="batch-crop-instructions">
          Drag to move • Arrow keys to nudge • +/- to resize
        </div>

        {/* Actions */}
        <div className="batch-crop-actions">
          <button className="batch-crop-cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="batch-crop-apply-button" 
            onClick={handleApplyCrop}
            disabled={includedCount === 0}
          >
            Apply Crop to {includedCount} image{includedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchCropModal

