import React, { useState, useEffect, useRef } from 'react'
import './CropPreviewModal.css'

function CropPreviewModal({ originalFile, aspectRatio, onCrop, onCancel }) {
  const [originalUrl, setOriginalUrl] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentAspectRatio, setCurrentAspectRatio] = useState(null)
  const [gridType, setGridType] = useState('off') // '3x3' | '9x9' | 'off'
  const [cropColor, setCropColor] = useState('blue') // 'blue' | 'black' | 'white'
  const [imageRect, setImageRect] = useState({ width: 0, height: 0, left: 0, top: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // Calculate aspect ratio value
  const getAspectRatio = () => {
    if (aspectRatio === '1:1') return 1
    if (aspectRatio === '3:2') return 3 / 2
    if (aspectRatio === '4:3') return 4 / 3
    return 1
  }

  // Update image rect when image loads or resizes
  useEffect(() => {
    const updateImageRect = () => {
      if (imageRef.current && containerRef.current && imageDimensions.width) {
        const containerRect = containerRef.current.getBoundingClientRect()
        
        // Calculate actual rendered image dimensions with object-fit: contain
        const imageAspectRatio = imageDimensions.width / imageDimensions.height
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

    if (originalUrl && imageRef.current && imageDimensions.width) {
      const img = imageRef.current
      if (img.complete) {
        updateImageRect()
      } else {
        img.onload = updateImageRect
      }
      
      window.addEventListener('resize', updateImageRect)
      return () => window.removeEventListener('resize', updateImageRect)
    }
  }, [originalUrl, imageDimensions.width, imageDimensions.height])

  // Load image and set dimensions (crop calculation happens after imageRect is set)
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)

      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
        // Don't calculate crop here - wait for imageRect to be set
        // Crop calculation will happen in the imageRect-based useEffect
      }
      img.src = url

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [originalFile, aspectRatio])

  // Calculate optimal crop size after image is displayed and imageRect is known
  useEffect(() => {
    if (!imageDimensions.width || !imageRect.width || cropSize.width > 0) return
    
    const targetRatio = getAspectRatio()
    const displayedImageRatio = imageRect.width / imageRect.height
    
    console.log('CropPreviewModal: Calculating optimal crop size', {
      imageDimensions,
      imageRect,
      targetRatio,
      displayedImageRatio
    })
    
    // Calculate crop box size in display coordinates to maximize width
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
    const scale = imageRect.width / imageDimensions.width
    const cropWidth = cropBoxDisplayWidth / scale
    const cropHeight = cropBoxDisplayHeight / scale
    
    // Ensure crop fits within image bounds (in case of rounding errors)
    const finalCropWidth = Math.min(cropWidth, imageDimensions.width)
    const finalCropHeight = Math.min(cropHeight, imageDimensions.height)
    
    // Center the crop
    const cropX = (imageDimensions.width - finalCropWidth) / 2
    const cropY = (imageDimensions.height - finalCropHeight) / 2
    
    console.log('CropPreviewModal: Setting crop', {
      finalCropWidth,
      finalCropHeight,
      cropX,
      cropY,
      scale
    })
    
    setCropSize({ width: finalCropWidth, height: finalCropHeight })
    setCropPosition({ x: cropX, y: cropY })
    setCurrentAspectRatio(targetRatio)
  }, [imageDimensions, imageRect, aspectRatio, cropSize.width])

  // Apply crop function
  const handleApplyCrop = () => {
    if (onCrop && originalFile) {
      // cropPosition and cropSize are already in image pixel coordinates
      console.log('CropPreviewModal: handleApplyCrop() called', {
        cropPosition,
        cropSize,
        imageDimensions,
        scale: getScale()
      })
      onCrop(
        cropPosition.x,
        cropPosition.y,
        cropSize.width,
        cropSize.height
      )
    }
  }

  // Handle 90-degree rotation
  const handleRotate = () => {
    if (!currentAspectRatio || currentAspectRatio === 1) {
      // 1:1 stays the same
      return
    }
    
    // Calculate new aspect ratio (inverse)
    const newAspectRatio = 1 / currentAspectRatio
    setCurrentAspectRatio(newAspectRatio)
    
    // Recalculate crop size maintaining area or fitting to image
    const currentArea = cropSize.width * cropSize.height
    const imageRatio = imageDimensions.width / imageDimensions.height
    
    let newWidth, newHeight
    
    if (imageRatio > newAspectRatio) {
      // Image wider - constrain by height
      newHeight = Math.min(imageDimensions.height * 0.8, Math.sqrt(currentArea / newAspectRatio))
      newWidth = newHeight * newAspectRatio
    } else {
      // Image taller - constrain by width
      newWidth = Math.min(imageDimensions.width * 0.8, Math.sqrt(currentArea * newAspectRatio))
      newHeight = newWidth / newAspectRatio
    }
    
    // Ensure minimum size
    if (newWidth < 50) {
      newWidth = 50
      newHeight = newWidth / newAspectRatio
    }
    if (newHeight < 50) {
      newHeight = 50
      newWidth = newHeight * newAspectRatio
    }
    
    // Constrain to image bounds
    newWidth = Math.min(newWidth, imageDimensions.width)
    newHeight = Math.min(newHeight, imageDimensions.height)
    
    // Center the crop
    const newX = Math.max(0, (imageDimensions.width - newWidth) / 2)
    const newY = Math.max(0, (imageDimensions.height - newHeight) / 2)
    
    setCropSize({ width: newWidth, height: newHeight })
    setCropPosition({ x: newX, y: newY })
  }

  // Handle scaling with keyboard
  const handleScale = (direction) => {
    if (!currentAspectRatio || !imageDimensions.width) return
    
    const scaleFactor = direction === 'up' ? 1.05 : 0.95 // Smaller increments for smoother scaling
    const newWidth = cropSize.width * scaleFactor
    const newHeight = newWidth / currentAspectRatio
    
    // Check bounds
    let finalWidth = newWidth
    let finalHeight = newHeight
    
    // Ensure minimum size
    if (finalWidth < 50) {
      finalWidth = 50
      finalHeight = finalWidth / currentAspectRatio
    }
    if (finalHeight < 50) {
      finalHeight = 50
      finalWidth = finalHeight * currentAspectRatio
    }
    
    // Calculate maximum size that fits in image bounds
    const maxWidthFromX = imageDimensions.width - cropPosition.x
    const maxHeightFromY = imageDimensions.height - cropPosition.y
    const maxWidthFromRatio = maxHeightFromY * currentAspectRatio
    const maxHeightFromRatio = maxWidthFromX / currentAspectRatio
    
    const maxWidth = Math.min(maxWidthFromX, maxWidthFromRatio)
    const maxHeight = Math.min(maxHeightFromY, maxHeightFromRatio)
    
    // Constrain to image bounds
    if (finalWidth > maxWidth) {
      finalWidth = maxWidth
      finalHeight = finalWidth / currentAspectRatio
    }
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight
      finalWidth = finalHeight * currentAspectRatio
    }
    
    // Adjust position if needed to keep crop within bounds (center the crop)
    let newX = cropPosition.x
    let newY = cropPosition.y
    
    // If scaling would go out of bounds, adjust position to keep it centered
    if (cropPosition.x + finalWidth > imageDimensions.width) {
      newX = imageDimensions.width - finalWidth
    }
    if (cropPosition.y + finalHeight > imageDimensions.height) {
      newY = imageDimensions.height - finalHeight
    }
    
    // Ensure position is valid
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)
    
    setCropSize({ width: finalWidth, height: finalHeight })
    setCropPosition({ x: newX, y: newY })
  }

  // Handle arrow key movement
  const handleArrowMove = (key) => {
    const moveDistance = 10 // pixels to move per keypress
    let newX = cropPosition.x
    let newY = cropPosition.y
    
    switch(key) {
      case 'ArrowUp':
        newY = Math.max(0, cropPosition.y - moveDistance)
        break
      case 'ArrowDown':
        newY = Math.min(imageDimensions.height - cropSize.height, cropPosition.y + moveDistance)
        break
      case 'ArrowLeft':
        newX = Math.max(0, cropPosition.x - moveDistance)
        break
      case 'ArrowRight':
        newX = Math.min(imageDimensions.width - cropSize.width, cropPosition.x + moveDistance)
        break
    }
    
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
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleArrowMove(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cropPosition, cropSize, originalFile, onCrop, onCancel, currentAspectRatio, imageDimensions])

  // Handle drag start
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const imgRect = imageRef.current?.getBoundingClientRect()
    if (imgRect) {
      const scale = getScale()
      // Calculate mouse position relative to image (accounting for letterbox offsets)
      const mouseX = (e.clientX - imgRect.left - imageRect.left) / scale
      const mouseY = (e.clientY - imgRect.top - imageRect.top) / scale
      
      setDragStart({
        x: mouseX,
        y: mouseY
      })
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
      if (!imageRef.current || !imageDimensions.width) return

      // Prevent event from bubbling to overlay
      e.stopPropagation()

      const imgRect = imageRef.current.getBoundingClientRect()
      const scale = getScale()
      
      // Calculate mouse position in image coordinates (accounting for letterbox offsets)
      const mouseX = (e.clientX - imgRect.left - imageRect.left) / scale
      const mouseY = (e.clientY - imgRect.top - imageRect.top) / scale
      
      // Calculate new crop position
      const newX = mouseX - dragOffset.x
      const newY = mouseY - dragOffset.y

      // Constrain to image bounds
      const constrainedX = Math.max(0, Math.min(newX, imageDimensions.width - cropSize.width))
      const constrainedY = Math.max(0, Math.min(newY, imageDimensions.height - cropSize.height))

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
  }, [isDragging, dragOffset, imageDimensions, cropSize])

  // Calculate scale factor for display
  const getScale = () => {
    if (!imageDimensions.width || imageRect.width === 0) {
      return 1
    }
    return imageRect.width / imageDimensions.width
  }

  // Color values
  const colors = {
    blue: '#4dd0e1',
    black: '#000000',
    white: '#ffffff'
  }

  // Render grid lines
  const renderGridLines = () => {
    if (gridType === 'off') return null

    const gridDivisions = gridType === '3x3' ? 3 : 9
    const lines = []

    // Vertical lines
    for (let i = 1; i < gridDivisions; i++) {
      const xPercent = (i / gridDivisions) * 100
      lines.push(
        <div
          key={`v-${i}`}
          className="crop-grid-line crop-grid-line-vertical"
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
      lines.push(
        <div
          key={`h-${i}`}
          className="crop-grid-line crop-grid-line-horizontal"
          style={{
            top: `${yPercent}%`,
            backgroundColor: colors[cropColor],
          }}
        />
      )
    }

    return <>{lines}</>
  }

  if (!originalUrl) return null

  const scale = getScale()
  const displayX = cropPosition.x * scale
  const displayY = cropPosition.y * scale
  const displayWidth = cropSize.width * scale
  const displayHeight = cropSize.height * scale

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        {/* Controls Bar */}
        <div className="crop-controls-bar">
          <div className="crop-control-group">
            <span className="crop-control-label">Grid:</span>
            <button
              className={`crop-control-button ${gridType === '3x3' ? 'active' : ''}`}
              onClick={() => setGridType('3x3')}
            >
              3×3
            </button>
            <button
              className={`crop-control-button ${gridType === '9x9' ? 'active' : ''}`}
              onClick={() => setGridType('9x9')}
            >
              9×9
            </button>
            <button
              className={`crop-control-button ${gridType === 'off' ? 'active' : ''}`}
              onClick={() => setGridType('off')}
            >
              Off
            </button>
          </div>
          <div className="crop-control-group">
            <span className="crop-control-label">Color:</span>
            <button
              className={`crop-control-button crop-color-button ${cropColor === 'blue' ? 'active' : ''}`}
              onClick={() => setCropColor('blue')}
              style={{ backgroundColor: cropColor === 'blue' ? colors.blue : 'transparent' }}
            >
              Blue
            </button>
            <button
              className={`crop-control-button crop-color-button ${cropColor === 'black' ? 'active' : ''}`}
              onClick={() => setCropColor('black')}
              style={{ backgroundColor: cropColor === 'black' ? colors.black : 'transparent' }}
            >
              Black
            </button>
            <button
              className={`crop-control-button crop-color-button ${cropColor === 'white' ? 'active' : ''}`}
              onClick={() => setCropColor('white')}
              style={{ backgroundColor: cropColor === 'white' ? colors.white : 'transparent', color: cropColor === 'white' ? '#000' : 'inherit' }}
            >
              White
            </button>
          </div>
        </div>

        <div className="crop-preview-container" ref={containerRef}>
          <div className="crop-image-wrapper">
            <img
              ref={imageRef}
              src={originalUrl}
              alt="Crop preview"
              className="crop-preview-image"
            />
            <div 
              className="crop-mask"
              style={{
                width: imageRect.width > 0 ? `${imageRect.width}px` : '0px',
                height: imageRect.height > 0 ? `${imageRect.height}px` : '0px',
                left: imageRect.width > 0 ? `${imageRect.left}px` : '0px',
                top: imageRect.height > 0 ? `${imageRect.top}px` : '0px',
              }}
            >
              <div
                className="crop-overlay"
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
                <div className="crop-handle crop-handle-center" style={{ backgroundColor: colors[cropColor] }} />
              </div>
            </div>
          </div>
        </div>
        <div className="crop-instructions">
          Drag to move • Arrow keys to nudge • +/- to resize
        </div>
        <div className="crop-actions">
          <button className="crop-rotate-button" onClick={handleRotate} title="Rotate 90 degrees">
            ↻ Rotate 90°
          </button>
          <button className="crop-cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-apply-button" onClick={handleApplyCrop}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}

export default CropPreviewModal

