"""
Background removal using edge detection and flood fill.
"""

from PIL import Image
import numpy as np
from typing import Tuple
import cv2


def remove_background(
    image: Image.Image,
    threshold: float = 50.0
) -> Image.Image:
    """
    Remove background from image using edge detection and flood fill.
    
    Args:
        image: PIL Image object (will be converted to RGB if needed)
        threshold: Sensitivity threshold (0-100), higher = more aggressive removal
    
    Returns:
        PIL Image with transparent background (RGBA mode)
    """
    # Convert PIL to numpy array
    if image.mode == 'RGBA':
        img_array = np.array(image)
        has_alpha = True
    else:
        img_array = np.array(image.convert('RGB'))
        has_alpha = False
    
    # Convert to OpenCV format (BGR)
    if len(img_array.shape) == 3:
        cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    else:
        cv_image = img_array
    
    # Create mask using edge detection and flood fill
    mask = _create_background_mask(cv_image, threshold)
    
    # Apply mask to create transparent background
    if has_alpha:
        result_array = img_array.copy()
        result_array[:, :, 3] = mask * 255  # Update alpha channel
    else:
        # Convert to RGBA
        result_array = np.zeros((img_array.shape[0], img_array.shape[1], 4), dtype=np.uint8)
        result_array[:, :, :3] = img_array
        result_array[:, :, 3] = mask * 255  # Set alpha channel
    
    # Convert back to PIL Image
    result = Image.fromarray(result_array, 'RGBA')
    
    return result


def _create_background_mask(
    cv_image: np.ndarray,
    threshold: float
) -> np.ndarray:
    """
    Create a mask identifying foreground (1) vs background (0).
    Uses edge detection and flood fill from image edges.
    """
    # Normalize threshold (0-100 -> 0-255)
    threshold_value = int((threshold / 100.0) * 255)
    
    # Convert to grayscale for processing
    if len(cv_image.shape) == 3:
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = cv_image
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Create mask with border padding for flood fill
    height, width = gray.shape
    mask = np.zeros((height + 2, width + 2), np.uint8)
    
    # Add border to image for flood fill
    bordered = cv2.copyMakeBorder(blurred, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    
    # Flood fill from all four corners to identify background
    # This assumes background touches the edges
    fill_flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
    lo_diff = threshold_value // 4
    up_diff = threshold_value // 4
    
    # Fill from corners
    cv2.floodFill(bordered, mask, (0, 0), 0, (lo_diff, lo_diff, lo_diff), (up_diff, up_diff, up_diff), fill_flags)
    cv2.floodFill(bordered, mask, (width, 0), 0, (lo_diff, lo_diff, lo_diff), (up_diff, up_diff, up_diff), fill_flags)
    cv2.floodFill(bordered, mask, (0, height), 0, (lo_diff, lo_diff, lo_diff), (up_diff, up_diff, up_diff), fill_flags)
    cv2.floodFill(bordered, mask, (width, height), 0, (lo_diff, lo_diff, lo_diff), (up_diff, up_diff, up_diff), fill_flags)
    
    # Remove border padding
    mask = mask[1:-1, 1:-1]
    
    # Invert mask (background=0, foreground=1)
    mask = 1 - (mask / 255.0)
    
    # Apply morphological operations to clean up mask
    kernel = np.ones((5, 5), np.uint8)
    mask_uint8 = (mask * 255).astype(np.uint8)
    mask_uint8 = cv2.morphologyEx(mask_uint8, cv2.MORPH_CLOSE, kernel)
    mask_uint8 = cv2.morphologyEx(mask_uint8, cv2.MORPH_OPEN, kernel)
    
    # Normalize back to 0-1
    mask = mask_uint8.astype(np.float32) / 255.0
    
    return mask

