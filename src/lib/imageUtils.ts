/**
 * Image processing utilities for Solitaire CHS Portal
 * Handles client-side compression, validation, and safe data URL generation
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Reduces 3MB-10MB mobile photos down to ~60KB-140KB high-definition web assets.
 * Prevents exceeding localStorage quota and ensures instant network syncing.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 1400,
    maxHeight = 1050,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // If it's an SVG, don't re-compress it via canvas; read as text/dataURL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image file for processing.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved bounding box
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas context unavailable
          resolve(event.target?.result as string);
          return;
        }

        // Fill with white background for JPEG compression to avoid black background on transparent PNGs
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Apply clean image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized data URL
        try {
          const targetMime = file.type === 'image/webp' ? 'image/webp' : mimeType;
          const compressedDataUrl = canvas.toDataURL(targetMime, quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a file is an accepted image format
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const acceptedExts = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'];

  if (!acceptedTypes.includes(file.type) && (!ext || !acceptedExts.includes(ext))) {
    return {
      valid: false,
      error: 'Please choose a valid image (.jpg, .jpeg, .png, .webp, or .svg).',
    };
  }

  // Soft limit before client compression
  if (file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image is too large (exceeds 25MB). Please choose a smaller photo.',
    };
  }

  return { valid: true };
}

/**
 * High-definition society preset imagery for quick assignment
 */
export const SOCIETY_PHOTO_PRESETS = [
  {
    title: 'Solitaire Towers & Front Gate',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    description: 'Front elevation view of Solitaire Towers with entrance security boom barrier.',
  },
  {
    title: 'Semi-Olympic Swimming Pool',
    category: 'Amenities',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
    description: 'Crystal-clear chlorinated pool with timber deck loungers and filtration unit.',
  },
  {
    title: 'High-Tech Gymnasium & Cardio',
    category: 'Fitness',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    description: 'Full conditioning gymnasium with treadmills, free weights, and rubber flooring.',
  },
  {
    title: 'Solitaire Grand Banquet Clubhouse',
    category: 'Amenities',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    description: 'Air-conditioned community hall and celebration lounge with mood lighting.',
  },
  {
    title: 'STP MBBR Water Treatment Plant',
    category: 'Utilities',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    description: 'Tertiary MBBR bio-reactor recycling 48,000 L/day for flushing and landscaping.',
  },
  {
    title: 'Central Landscaped Podium Lawn',
    category: 'Grounds',
    url: 'https://images.unsplash.com/photo-1588880331179-bc9b93a0cb5e?auto=format&fit=crop&w=1200&q=80',
    description: 'Lush green podium garden, jogging path, and child play park.',
  },
];
