import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export function Dropzone() {
  const { upload, setUploadFile, setUploadPreview, resetUpload } = useAppStore()
  const { file, previewUrl, isUploading } = upload

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0]
      if (!selectedFile) return

      setUploadFile(selectedFile)

      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile)
      setUploadPreview(objectUrl)
    },
    [setUploadFile, setUploadPreview]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      disabled: isUploading,
    })

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      resetUpload()
    },
    [previewUrl, resetUpload]
  )

  const errorMessage = fileRejections[0]?.errors[0]?.message

  if (file && previewUrl) {
    return (
      <div className="relative">
        <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border border-border">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center w-full max-w-md mx-auto aspect-square rounded-lg border-2 border-dashed transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          {isDragActive ? (
            <>
              <ImageIcon className="h-12 w-12 text-primary" />
              <p className="text-lg font-medium">Drop your photo here</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  Drag & drop your photo here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG or PNG, max 10MB
              </p>
            </>
          )}
        </div>
      </div>
      {errorMessage && (
        <p className="mt-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
