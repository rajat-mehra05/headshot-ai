import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api, type ValidationResult } from '@/lib/api'

interface UploadProgress {
  imageId: string
  progress: number
}

interface UploadResult {
  imageId: string
  filePath: string
}

interface UseUploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (imageId: string, error: Error) => void
}

/**
 * Hook for uploading a single image file
 * Returns a mutation that can be called with file and imageId
 */
export function useUpload(options: UseUploadOptions = {}) {
  const { getToken } = useAuth()
  const { onProgress, onSuccess, onError } = options

  return useMutation({
    mutationFn: async ({ file, imageId }: { file: File; imageId: string }) => {
      console.log('[useUpload] Starting upload:', { fileName: file.name, imageId })

      const token = await getToken()
      if (!token) throw new Error('No auth token')

      onProgress?.({ imageId, progress: 0 })

      // Get presigned URL
      const { upload_url, file_path } = await api.upload.getPresignedUrl(
        token,
        file.name,
        file.type
      )

      onProgress?.({ imageId, progress: 20 })

      // Upload file directly to storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      onProgress?.({ imageId, progress: 100 })

      console.log('[useUpload] Upload complete:', { fileName: file.name, filePath: file_path })

      return { imageId, filePath: file_path }
    },
    onSuccess: (result) => {
      onSuccess?.(result)
    },
    onError: (error, variables) => {
      console.error('[useUpload] Upload failed:', { imageId: variables.imageId, error })
      onError?.(variables.imageId, error as Error)
    },
  })
}

/**
 * Hook for uploading multiple images in parallel
 * Uses Promise.all for concurrent uploads (async-parallel pattern)
 */
export function useMultiUpload(options: UseUploadOptions = {}) {
  const { getToken } = useAuth()
  const { onProgress, onSuccess, onError } = options

  return useMutation({
    mutationFn: async (files: Array<{ file: File; imageId: string }>) => {
      console.log('[useMultiUpload] Starting batch upload:', {
        count: files.length,
        files: files.map((f) => f.file.name),
      })

      const token = await getToken()
      if (!token) throw new Error('No auth token')

      // Upload all files in parallel (async-parallel pattern from Vercel best practices)
      const uploadPromises = files.map(async ({ file, imageId }) => {
        try {
          onProgress?.({ imageId, progress: 0 })

          const { upload_url, file_path } = await api.upload.getPresignedUrl(
            token,
            file.name,
            file.type
          )

          onProgress?.({ imageId, progress: 20 })

          const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file')
          }

          onProgress?.({ imageId, progress: 100 })
          onSuccess?.({ imageId, filePath: file_path })

          console.log('[useMultiUpload] Individual upload complete:', {
            fileName: file.name,
            filePath: file_path,
          })

          return { imageId, filePath: file_path, success: true as const }
        } catch (error) {
          console.error('[useMultiUpload] Individual upload failed:', {
            fileName: file.name,
            error,
          })
          onError?.(imageId, error as Error)
          return { imageId, error: error as Error, success: false as const }
        }
      })

      const results = await Promise.all(uploadPromises)
      const successful = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      console.log('[useMultiUpload] Batch complete:', {
        total: files.length,
        successful: successful.length,
        failed: failed.length,
      })

      return { results, successful, failed }
    },
  })
}

/**
 * Hook for server-side image validation
 * Removed Zustand dependency - returns result directly
 */
export function useValidation() {
  const { getToken } = useAuth()

  return useMutation({
    mutationFn: async (imagePath: string): Promise<ValidationResult> => {
      console.log('[useValidation] Validating image:', { imagePath })

      const token = await getToken()
      if (!token) throw new Error('No auth token')

      const result = await api.validate.image(token, imagePath)

      console.log('[useValidation] Validation result:', {
        imagePath,
        passed: result.passed,
        qualityScore: result.quality_score,
      })

      return result
    },
  })
}
