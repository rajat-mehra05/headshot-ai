// Configuration constants for the generate page
// Following Vercel best practices: hoisted constants to avoid recreation

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MIN_IMAGE_DIMENSION = 512
export const MAX_IMAGES = 5
export const MIN_IMAGES = 3

export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
} as const

export const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

// Free users have 10 or fewer credits
export const FREE_USER_CREDIT_THRESHOLD = 10

// Generation quantity options for paid users
export const QUANTITY_OPTIONS = [1, 3, 5, 8, 10] as const

// Background options (6 total)
export const BACKGROUNDS = [
  { id: 'professional-office', name: 'Professional Office', emoji: '🏢', description: 'Modern office setting' },
  { id: 'clean-white', name: 'Clean White', emoji: '⚪', description: 'Minimalist backdrop' },
  { id: 'modern-gray', name: 'Modern Gray', emoji: '🔳', description: 'Contemporary neutral' },
  { id: 'outdoor-blur', name: 'Outdoor Blur', emoji: '🌿', description: 'Natural blurred background' },
  { id: 'library', name: 'Library', emoji: '📚', description: 'Academic atmosphere' },
  { id: 'studio', name: 'Studio', emoji: '🎬', description: 'Professional photo studio' },
] as const

// Style options (6 total)
export const STYLES = [
  { id: 'business-casual', name: 'Business Casual', emoji: '👔', description: 'Smart casual professional' },
  { id: 'formal-suit', name: 'Formal Suit', emoji: '🤵', description: 'Classic formal attire' },
  { id: 'creative-professional', name: 'Creative Professional', emoji: '🎨', description: 'Artistic yet professional' },
  { id: 'medical-professional', name: 'Medical Professional', emoji: '🩺', description: 'Healthcare appropriate' },
  { id: 'academic', name: 'Academic', emoji: '🎓', description: 'Scholarly and distinguished' },
  { id: 'tech-casual', name: 'Tech Casual', emoji: '💻', description: 'Modern tech industry' },
] as const

// Clothing color options (10 total)
export const CLOTHING_COLORS = [
  { id: 'random', name: 'Random', emoji: '🎲', description: 'AI will choose' },
  { id: 'navy-blue', name: 'Navy Blue', emoji: '🔵', description: 'Classic professional' },
  { id: 'charcoal-gray', name: 'Charcoal Gray', emoji: '⚫', description: 'Sophisticated neutral' },
  { id: 'black', name: 'Black', emoji: '⬛', description: 'Timeless elegance' },
  { id: 'white', name: 'White', emoji: '⚪', description: 'Clean & crisp' },
  { id: 'light-blue', name: 'Light Blue', emoji: '🔷', description: 'Approachable tone' },
  { id: 'burgundy', name: 'Burgundy', emoji: '🟤', description: 'Rich & confident' },
  { id: 'forest-green', name: 'Forest Green', emoji: '🟢', description: 'Natural & calming' },
  { id: 'cream', name: 'Cream', emoji: '🟡', description: 'Warm & friendly' },
  { id: 'purple', name: 'Purple', emoji: '🟣', description: 'Creative & bold' },
] as const

// Type exports for type safety
export type BackgroundId = (typeof BACKGROUNDS)[number]['id']
export type StyleId = (typeof STYLES)[number]['id']
export type ClothingColorId = (typeof CLOTHING_COLORS)[number]['id']
export type ValidationStatus = 'pending' | 'validating' | 'valid' | 'invalid'

// Validated image interface used throughout the app
export interface ValidatedImage {
  id: string
  file: File
  previewUrl: string
  validationStatus: ValidationStatus
  validationError?: string
  uploadedPath?: string
}

// Default preferences for localStorage persistence
export const DEFAULT_PREFERENCES = {
  background: 'professional-office' as BackgroundId,
  style: 'business-casual' as StyleId,
  clothingColor: 'random' as ClothingColorId,
} as const
