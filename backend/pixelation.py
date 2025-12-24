"""
Pixelation algorithms for image processing.
Supports nearest neighbor (majority color), spatial approximation, and pixel averaging methods.
"""

from PIL import Image
import numpy as np
from typing import Tuple, Literal
from collections import Counter


def pixelate_image(
    image: Image.Image,
    target_width: int,
    target_height: int,
    method: Literal['nearest', 'spatial', 'average'] = 'average'
) -> Image.Image:
    """
    Pixelate an image to target dimensions using specified method.
    
    Args:
        image: PIL Image object
        target_width: Target width in pixels (minimum 1)
        target_height: Target height in pixels (minimum 1)
        method: 'nearest' for majority color, 'spatial' for spatial approximation, 'average' for pixel averaging
    
    Returns:
        Pixelated PIL Image
    """
    # Ensure minimum dimensions (1x1 for maximum pixelation - largest possible pixels)
    target_width = max(1, target_width)
    target_height = max(1, target_height)
    
    # Get original dimensions
    orig_width, orig_height = image.size
    
    if method == 'spatial':
        # Spatial approximation: simple resize (fast, blocky)
        pixelated = image.resize(
            (target_width, target_height),
            Image.Resampling.NEAREST
        )
        # Scale back up to original size for visible pixelation effect
        pixelated = pixelated.resize(
            (orig_width, orig_height),
            Image.Resampling.NEAREST
        )
    elif method == 'nearest':
        # Nearest neighbor: majority color per block
        pixelated = _pixelate_majority(image, target_width, target_height)
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


def _pixelate_majority(
    image: Image.Image,
    target_width: int,
    target_height: int
) -> Image.Image:
    """
    Pixelate using majority color (mode) method.
    Divides image into blocks and uses the most frequent color in each block.
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
            
            # Find majority color (mode)
            if len(img_array.shape) == 3:
                # Reshape to list of pixels
                pixels = block.reshape(-1, img_array.shape[2])
                # Convert to tuples for counting
                pixel_tuples = [tuple(pixel) for pixel in pixels]
                # Count frequencies
                color_counts = Counter(pixel_tuples)
                # Get most common color
                majority_color = color_counts.most_common(1)[0][0]
                output[y, x] = np.array(majority_color, dtype=img_array.dtype)
            else:
                # Grayscale: flatten and find mode
                pixels = block.flatten()
                color_counts = Counter(pixels)
                majority_color = color_counts.most_common(1)[0][0]
                output[y, x] = majority_color
    
    # Convert back to PIL Image
    result = Image.fromarray(output)
    
    # Scale back up to original size for visible pixelation
    result = result.resize(
        (orig_width, orig_height),
        Image.Resampling.NEAREST
    )
    
    return result

