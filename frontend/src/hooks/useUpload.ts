import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'

export function useUpload() {
  const { getToken } = useAuth()
  const {
    upload,
    setIsUploading,
    setUploadProgress,
    setUploadedPath,
  } = useAppStore()

  return useMutation({
    mutationFn: async () => {
      const { file } = upload
      if (!file) throw new Error('No file selected')

      const token = await getToken()
      if (!token) throw new Error('No auth token')

      setIsUploading(true)
      setUploadProgress(0)

      // Get presigned URL
      const { upload_url, file_path } = await api.upload.getPresignedUrl(
        token,
        file.name,
        file.type
      )

      setUploadProgress(20)

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

      setUploadProgress(100)
      setUploadedPath(file_path)

      return file_path
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })
}

export function useValidation() {
  const { getToken } = useAuth()
  const { setValidationResult } = useAppStore()

  return useMutation({
    mutationFn: async (imagePath: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')

      const result = await api.validate.image(token, imagePath)
      setValidationResult(result)
      return result
    },
  })
}
