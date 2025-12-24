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
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // Calculate aspect ratio value
  const getAspectRatio = () => {
    if (aspectRatio === '1:1') return 1
    if (aspectRatio === '3:2') return 3 / 2
    if (aspectRatio === '4:3') return 4 / 3
    return 1
  }

  // Load image and calculate initial crop
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)

      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height
        setImageDimensions({ width, height })

        // Calculate initial crop size (80% of image, maintaining aspect ratio)
        const targetRatio = getAspectRatio()
        const imageRatio = width / height

        let overlayWidth, overlayHeight
        if (imageRatio > targetRatio) {
          // Image wider - constrain by height
          overlayHeight = height * 0.8
          overlayWidth = overlayHeight * targetRatio
        } else {
          // Image taller - constrain by width
          overlayWidth = width * 0.8
          overlayHeight = overlayWidth / targetRatio
        }

        // Center the crop
        const cropX = (width - overlayWidth) / 2
        const cropY = (height - overlayHeight) / 2

        setCropSize({ width: overlayWidth, height: overlayHeight })
        setCropPosition({ x: cropX, y: cropY })
        setCurrentAspectRatio(targetRatio)
      }
      img.src = url

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [originalFile, aspectRatio])

  // Apply crop function
  const handleApplyCrop = () => {
    if (onCrop && originalFile) {
      // cropPosition and cropSize are already in image pixel coordinates
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
      // Calculate mouse position relative to image
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
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
      const displayWidth = imageRef.current.offsetWidth
      const scale = displayWidth / imageDimensions.width
      
      // Calculate mouse position in image coordinates
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
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
    if (!imageRef.current || !imageDimensions.width) return 1
    const displayWidth = imageRef.current.offsetWidth
    return displayWidth / imageDimensions.width
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
        <div className="crop-preview-container" ref={containerRef}>
          <img
            ref={imageRef}
            src={originalUrl}
            alt="Crop preview"
            className="crop-preview-image"
          />
          <div className="crop-mask">
            <div
              className="crop-overlay"
              style={{
                left: `${displayX}px`,
                top: `${displayY}px`,
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="crop-handle crop-handle-center" />
            </div>
          </div>
        </div>
        <div className="crop-instructions">
          Drag and resize with +/-
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

