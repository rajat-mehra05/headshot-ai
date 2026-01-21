// Client-side image validation utilities
// Provides instant feedback before server-side validation

import {
  MAX_FILE_SIZE,
  MIN_IMAGE_DIMENSION,
  VALID_MIME_TYPES,
} from './constants'

export interface ClientValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

// Pure function: validates file size
const validateFileSize = (file: File): ClientValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return {
      isValid: false,
      error: `File too large. Maximum ${maxMB}MB allowed.`,
    }
  }
  return { isValid: true }
}

// Pure function: validates file type
const validateFileType = (file: File): ClientValidationResult => {
  if (!VALID_MIME_TYPES.includes(file.type as typeof VALID_MIME_TYPES[number])) {
    return {
      isValid: false,
      error: 'Invalid format. Use JPG, PNG, or WebP.',
    }
  }
  return { isValid: true }
}

// Validates image dimensions and loadability (async)
const validateImageDimensions = (file: File): Promise<ClientValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      if (img.width < MIN_IMAGE_DIMENSION || img.height < MIN_IMAGE_DIMENSION) {
        resolve({
          isValid: false,
          error: `Resolution too low. Minimum ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} required.`,
        })
        return
      }

      // Check for square-ish aspect ratio (optional warning)
      const aspectRatio = img.width / img.height
      const warnings: string[] = []

      if (aspectRatio < 0.5 || aspectRatio > 2) {
        warnings.push('Image aspect ratio is unusual. Best results with photos closer to square.')
      }

      resolve({ isValid: true, warnings: warnings.length > 0 ? warnings : undefined })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        isValid: false,
        error: 'Could not load image. File may be corrupted.',
      })
    }

    img.src = objectUrl
  })
}

// Main validation function - composes all validations
export const validateImageClient = async (file: File): Promise<ClientValidationResult> => {
  // Run synchronous validations first (js-early-exit pattern)
  const sizeResult = validateFileSize(file)
  if (!sizeResult.isValid) {
    return sizeResult
  }

  const typeResult = validateFileType(file)
  if (!typeResult.isValid) {
    return typeResult
  }

  // Run async dimension validation
  const dimensionResult = await validateImageDimensions(file)
  return dimensionResult
}

// Generate unique ID for images (using crypto for uniqueness)
export const generateImageId = (): string => {
  return crypto.randomUUID()
}

// Create preview URL for a file (caller is responsible for cleanup)
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file)
}

// Cleanup preview URL
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url)
}

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Generate a hash for file content to detect duplicates
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Quick hash using file metadata (faster but less accurate)
// Use for initial quick check, then verify with full hash if needed
export const generateQuickHash = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}`
}
