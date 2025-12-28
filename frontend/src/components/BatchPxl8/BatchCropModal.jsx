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
  
  // Reference dimensions (based on top image)
  const [referenceDimensions, setReferenceDimensions] = useState({ width: 0, height: 0 })
  const [imageRect, setImageRect] = useState({ width: 0, height: 0, left: 0, top: 0 })
  
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
      
      // Find smallest image and its index
      if (loadedImages.length > 0) {
        let smallestIndex = 0
        let smallestDimensions = loadedImages[0].dimensions
        
        loadedImages.forEach((img, index) => {
          const smallestArea = smallestDimensions.width * smallestDimensions.height
          const currentArea = img.dimensions.width * img.dimensions.height
          
          if (currentArea < smallestArea) {
            smallestIndex = index
            smallestDimensions = img.dimensions
          }
        })
        
        // Create stack order with smallest image on top (index 0)
        const newStackOrder = [smallestIndex]
        for (let i = 0; i < loadedImages.length; i++) {
          if (i !== smallestIndex) {
            newStackOrder.push(i)
          }
        }
        
        setStackOrder(newStackOrder)
        
        if (smallestDimensions && smallestDimensions.width > 0) {
          setReferenceDimensions(smallestDimensions)
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

  // Update image rect when reference dimensions change
  useEffect(() => {
    const updateImageRect = () => {
      if (containerRef.current && referenceDimensions.width > 0) {
        const containerRect = containerRef.current.getBoundingClientRect()
        
        // Calculate actual rendered image dimensions with object-fit: contain
        const imageAspectRatio = referenceDimensions.width / referenceDimensions.height
        const containerAspectRatio = containerRect.width / containerRect.height
        
        let renderedWidth, renderedHeight, offsetX, offsetY
        
        if (imageAspectRatio > containerAspectRatio) {
          // Image wider - constrained by container width
          renderedWidth = containerRect.width
          renderedHeight = containerRect.width / imageAspectRatio
          offsetX = 0
          offsetY = (containerRect.height - renderedHeight) / 2
        } else {
          // Image taller - constrained by container height
          renderedHeight = containerRect.height
          renderedWidth = containerRect.height * imageAspectRatio
          offsetX = (containerRect.width - renderedWidth) / 2
          offsetY = 0
        }
        
        setImageRect({
          width: renderedWidth,
          height: renderedHeight,
          left: offsetX,
          top: offsetY
        })
      }
    }

    updateImageRect()
    window.addEventListener('resize', updateImageRect)
    return () => window.removeEventListener('resize', updateImageRect)
  }, [referenceDimensions])

  // Initialize crop box after imageRect is set
  useEffect(() => {
    if (!referenceDimensions.width || !imageRect.width || cropSize.width > 0) return
    
    const targetRatio = currentAspectRatio
    const displayedImageRatio = imageRect.width / imageRect.height
    
    // Calculate crop box size in display coordinates
    let cropBoxDisplayWidth, cropBoxDisplayHeight
    
    if (displayedImageRatio > targetRatio) {
      // Image wider than target - constrain by height
      cropBoxDisplayHeight = imageRect.height
      cropBoxDisplayWidth = cropBoxDisplayHeight * targetRatio
    } else {
      // Image taller than target - constrain by width
      cropBoxDisplayWidth = imageRect.width
      cropBoxDisplayHeight = cropBoxDisplayWidth / targetRatio
    }
    
    // Convert to image pixel coordinates
    const scale = imageRect.width / referenceDimensions.width
    const cropWidth = cropBoxDisplayWidth / scale
    const cropHeight = cropBoxDisplayHeight / scale
    
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

  // Calculate scale factor for display
  const getScale = () => {
    if (!referenceDimensions.width || imageRect.width === 0) {
      return 1
    }
    return imageRect.width / referenceDimensions.width
  }

  // Handle mouse down on crop box
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const scale = getScale()
    const rect = stackRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = (e.clientX - rect.left - imageRect.left) / scale
      const mouseY = (e.clientY - rect.top - imageRect.top) / scale
      
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
      
      const mouseX = (e.clientX - rect.left - imageRect.left) / scale
      const mouseY = (e.clientY - rect.top - imageRect.top) / scale
      
      const newX = mouseX - dragOffset.x
      const newY = mouseY - dragOffset.y

      // Constrain to image bounds
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
  }, [isDragging, dragOffset, referenceDimensions, cropSize, imageRect])

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
    
    // Pass crop coordinates as percentages
    const cropData = {
      x: cropPosition.x,
      y: cropPosition.y,
      width: cropSize.width,
      height: cropSize.height,
      referenceDimensions,
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
                      width: imageRect.width > 0 ? `${imageRect.width}px` : 'auto',
                      height: imageRect.height > 0 ? `${imageRect.height}px` : 'auto',
                    }}
                  />
                </div>
              )
            })}
            
            {/* Crop Overlay */}
            {imageRect.width > 0 && (
              <div 
                className="batch-crop-mask"
                style={{
                  width: `${imageRect.width}px`,
                  height: `${imageRect.height}px`,
                  left: `${imageRect.left}px`,
                  top: `${imageRect.top}px`,
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

