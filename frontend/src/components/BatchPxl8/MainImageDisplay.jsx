import { useEffect, useState } from 'react'
import './MainImageDisplay.css'

function MainImageDisplay({ imageUrl }) {
  const [displayUrl, setDisplayUrl] = useState(imageUrl)

  useEffect(() => {
    setDisplayUrl(imageUrl)
  }, [imageUrl])

  if (!imageUrl) {
    return null
  }

  return (
    <div className="target-image-display">
      <div className="target-image-container" title="Target Image">
        {displayUrl && (
          <img 
            src={displayUrl} 
            alt="Target image"
            className="target-image"
          />
        )}
      </div>
    </div>
  )
}

export default MainImageDisplay
