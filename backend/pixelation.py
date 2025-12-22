"""
Pixelation algorithms for image processing.
Supports nearest neighbor and pixel averaging methods.
"""

from PIL import Image
import numpy as np
from typing import Tuple, Literal


def pixelate_image(
    image: Image.Image,
    target_width: int,
    target_height: int,
    method: Literal['nearest', 'average'] = 'average'
) -> Image.Image:
    """
    Pixelate an image to target dimensions using specified method.
    
    Args:
        image: PIL Image object
        target_width: Target width in pixels (minimum 10)
        target_height: Target height in pixels (minimum 10)
        method: 'nearest' for nearest neighbor, 'average' for pixel averaging
    
    Returns:
        Pixelated PIL Image
    """
    # Ensure minimum dimensions (10x10 for maximum pixelation)
    target_width = max(10, target_width)
    target_height = max(10, target_height)
    
    # Get original dimensions
    orig_width, orig_height = image.size
    
    if method == 'nearest':
        # Nearest neighbor: simple resize (fast, blocky)
        pixelated = image.resize(
            (target_width, target_height),
            Image.Resampling.NEAREST
        )
        # Scale back up to original size for visible pixelation effect
        pixelated = pixelated.resize(
            (orig_width, orig_height),
            Image.Resampling.NEAREST
        )
    else:  # method == 'average'
        # Pixel averaging: average colors in each block
        pixelated = _pixelate_average(image, target_width, target_height)
    
    return pixelated


def _pixelate_average(
    image: Image.Image,
    target_width: int,
    target_height: int
) -> Image.Image:
    """
    Pixelate using pixel averaging method.
    Divides image into blocks and averages pixel values in each block.
    """
    # Convert to numpy array
    img_array = np.array(image)
    orig_height, orig_width = img_array.shape[:2]
    
    # Calculate block sizes
    block_width = orig_width / target_width
    block_height = orig_height / target_height
    
    # Create output array
    if len(img_array.shape) == 3:  # Color image (RGB/RGBA)
        output = np.zeros((target_height, target_width, img_array.shape[2]), dtype=img_array.dtype)
    else:  # Grayscale
        output = np.zeros((target_height, target_width), dtype=img_array.dtype)
    
    # Process each block
    for y in range(target_height):
        for x in range(target_width):
            # Calculate block boundaries
            x_start = int(x * block_width)
            x_end = int((x + 1) * block_width)
            y_start = int(y * block_height)
            y_end = int((y + 1) * block_height)
            
            # Ensure we don't go out of bounds
            x_end = min(x_end, orig_width)
            y_end = min(y_end, orig_height)
            
            # Extract block
            block = img_array[y_start:y_end, x_start:x_end]
            
            # Average the block
            if len(img_array.shape) == 3:
                avg_color = np.mean(block.reshape(-1, img_array.shape[2]), axis=0)
                output[y, x] = avg_color.astype(img_array.dtype)
            else:
                avg_color = np.mean(block)
                output[y, x] = avg_color.astype(img_array.dtype)
    
    # Convert back to PIL Image
    result = Image.fromarray(output)
    
    # Scale back up to original size for visible pixelation
    result = result.resize(
        (orig_width, orig_height),
        Image.Resampling.NEAREST
    )
    
    return result

