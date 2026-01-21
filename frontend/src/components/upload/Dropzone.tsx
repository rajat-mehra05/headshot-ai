import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { ImagePreviewGrid } from '@/components/upload/ImagePreviewGrid'
import { EmptyStateDropzone } from '@/components/upload/EmptyStateDropzone'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES,
  MIN_IMAGES,
  type ValidatedImage,
} from '@/utils/constants'

interface DropzoneProps {
  images: ValidatedImage[]
  onFilesSelected: (files: File[]) => void
  onRemoveImage: (image: ValidatedImage) => void
  disabled?: boolean
  className?: string
}

export function Dropzone({
  images,
  onFilesSelected,
  onRemoveImage,
  disabled = false,
  className,
}: DropzoneProps) {
  const canAddMore = images.length < MAX_IMAGES

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      onFilesSelected(acceptedFiles)
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_IMAGES - images.length,
    disabled: disabled || !canAddMore,
  })

  const errorMessage = fileRejections[0]?.errors[0]?.message
  const hasImages = images.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Image preview grid */}
      {hasImages && (
        <ImagePreviewGrid
          images={images}
          onRemoveImage={onRemoveImage}
          disabled={disabled}
          canAddMore={canAddMore}
          isDragActive={isDragActive}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />
      )}

      {/* Empty state dropzone */}
      {!hasImages && (
        <EmptyStateDropzone
          isDragActive={isDragActive}
          disabled={disabled}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />
      )}

      {/* Requirements text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          Upload <strong>{MIN_IMAGES}-{MAX_IMAGES} photos</strong> (minimum {MIN_IMAGES} required)
        </p>
        <p>JPG, PNG, or WebP - Max 10MB each</p>
      </div>

      {/* Image count indicator */}
      {hasImages && (
        <div
          className={cn(
            'text-center text-sm font-medium',
            images.length >= MIN_IMAGES ? 'text-green-600' : 'text-amber-600'
          )}
        >
          {images.length >= MIN_IMAGES
            ? `${images.length} photo${images.length !== 1 ? 's' : ''} ready`
            : `${images.length}/${MIN_IMAGES} photos (need ${MIN_IMAGES - images.length} more)`}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}
