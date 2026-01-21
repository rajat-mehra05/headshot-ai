import { useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { api, type ValidationResult } from '@/lib/api'
import {
  validateImageClient,
  generateImageId,
  createPreviewUrl,
  revokePreviewUrl,
  generateQuickHash,
} from '@/utils/imageValidation'
import type { ValidatedImage, ValidationStatus } from '@/utils/constants'
import { MAX_IMAGES } from '@/utils/constants'

type UpdateImageFn = (id: string, updates: Partial<ValidatedImage>) => void
type AddImagesFn = (images: ValidatedImage[]) => void

interface UseImageValidationOptions {
  onUpdateImage: UpdateImageFn
  onAddImages: AddImagesFn
  currentImageCount: number
  existingImages: ValidatedImage[]
}

interface UseImageValidationReturn {
  processFiles: (files: File[]) => Promise<void>
  validateOnServer: (image: ValidatedImage) => Promise<ValidationResult | null>
  removeImage: (image: ValidatedImage, images: ValidatedImage[], setImages: (imgs: ValidatedImage[]) => void) => void
  cleanupAllPreviews: (images: ValidatedImage[]) => void
}

/**
 * Hook for handling hybrid (client + server) image validation
 * Manages the validation flow for uploaded images
 */
export function useImageValidation({
  onUpdateImage,
  onAddImages,
  currentImageCount,
  existingImages,
}: UseImageValidationOptions): UseImageValidationReturn {
  const { getToken } = useAuth()
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Process multiple files - client validation first with duplicate detection
  const processFiles = useCallback(
    async (files: File[]) => {
      const availableSlots = MAX_IMAGES - currentImageCount
      if (availableSlots <= 0) {
        toast.warning('Maximum images reached', {
          description: `You can only upload up to ${MAX_IMAGES} images.`,
        })
        return
      }

      // Create hashes for existing images for duplicate detection
      const existingHashes = new Set(
        existingImages.map((img) => generateQuickHash(img.file))
      )

      // Filter out duplicates and track them
      const uniqueFiles: File[] = []
      const duplicateFiles: File[] = []

      for (const file of files) {
        const hash = generateQuickHash(file)
        if (existingHashes.has(hash)) {
          duplicateFiles.push(file)
        } else {
          existingHashes.add(hash) // Add to set to catch duplicates within the same upload batch
          uniqueFiles.push(file)
        }
      }

      // Show toast for duplicates
      if (duplicateFiles.length > 0) {
        const duplicateNames = duplicateFiles.map((f) => f.name).join(', ')

        toast.info(
          duplicateFiles.length === 1
            ? 'Duplicate image removed'
            : `${duplicateFiles.length} duplicate images removed`,
          {
            description:
              duplicateFiles.length === 1
                ? `"${duplicateFiles[0].name}" was already uploaded.`
                : `The following images were already uploaded: ${duplicateNames}`,
          }
        )
      }

      // If no unique files remain, exit early
      if (uniqueFiles.length === 0) {
        return
      }

      // Limit to available slots
      const filesToProcess = uniqueFiles.slice(0, availableSlots)

      // Notify if some files were skipped due to slot limit
      if (uniqueFiles.length > availableSlots) {
        const skipped = uniqueFiles.length - availableSlots
        toast.warning(`${skipped} image${skipped > 1 ? 's' : ''} skipped`, {
          description: `Only ${availableSlots} slot${availableSlots > 1 ? 's' : ''} available. Maximum is ${MAX_IMAGES} images.`,
        })
      }

      // Create initial image entries with pending status
      const newImages: ValidatedImage[] = filesToProcess.map((file) => ({
        id: generateImageId(),
        file,
        previewUrl: createPreviewUrl(file),
        validationStatus: 'pending' as ValidationStatus,
      }))

      // Add all images to state immediately
      onAddImages(newImages)

      // Run client validation for each image (async-parallel pattern)
      const validationPromises = newImages.map(async (image) => {
        onUpdateImage(image.id, { validationStatus: 'validating' })

        const result = await validateImageClient(image.file)

        if (!result.isValid) {
          onUpdateImage(image.id, {
            validationStatus: 'invalid',
            validationError: result.error,
          })
          return
        }

        // Client validation passed - mark as valid for now
        // Server validation will happen after upload in the generate flow
        onUpdateImage(image.id, { validationStatus: 'valid' })
      })

      await Promise.all(validationPromises)
    },
    [currentImageCount, existingImages, onUpdateImage, onAddImages]
  )

  // Server-side validation for a single image
  const validateOnServer = useCallback(
    async (image: ValidatedImage): Promise<ValidationResult | null> => {
      if (!image.uploadedPath) {
        return null
      }

      const token = await getToken()
      if (!token) {
        return null
      }

      // Create abort controller for this validation
      const abortController = new AbortController()
      abortControllersRef.current.set(image.id, abortController)

      try {
        onUpdateImage(image.id, { validationStatus: 'validating' })

        const result = await api.validate.image(token, image.uploadedPath, {
          signal: abortController.signal,
        })

        onUpdateImage(image.id, {
          validationStatus: result.passed ? 'valid' : 'invalid',
          validationError: result.passed ? undefined : result.errors[0],
        })

        return result
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return null
        }

        onUpdateImage(image.id, {
          validationStatus: 'invalid',
          validationError: 'Server validation failed. Please try again.',
        })
        return null
      } finally {
        abortControllersRef.current.delete(image.id)
      }
    },
    [getToken, onUpdateImage]
  )

  // Remove a single image
  const removeImage = useCallback(
    (
      image: ValidatedImage,
      images: ValidatedImage[],
      setImages: (imgs: ValidatedImage[]) => void
    ) => {
      // Cancel any pending validation
      const controller = abortControllersRef.current.get(image.id)
      if (controller) {
        controller.abort()
        abortControllersRef.current.delete(image.id)
      }

      // Revoke preview URL
      revokePreviewUrl(image.previewUrl)

      // Remove from state
      const filtered = images.filter((img) => img.id !== image.id)
      setImages(filtered)
    },
    []
  )

  // Cleanup all preview URLs (on unmount or reset)
  const cleanupAllPreviews = useCallback((images: ValidatedImage[]) => {
    // Cancel all pending validations
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()

    // Revoke all preview URLs
    images.forEach((image) => revokePreviewUrl(image.previewUrl))
  }, [])

  return {
    processFiles,
    validateOnServer,
    removeImage,
    cleanupAllPreviews,
  }
}
