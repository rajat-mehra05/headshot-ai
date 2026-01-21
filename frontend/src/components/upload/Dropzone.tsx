import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES,
  MIN_IMAGES,
  type ValidatedImage,
} from '@/utils/constants'
import { formatFileSize } from '@/utils/imageValidation'

interface DropzoneProps {
  images: ValidatedImage[]
  onFilesSelected: (files: File[]) => void
  onRemoveImage: (image: ValidatedImage) => void
  disabled?: boolean
  className?: string
}

// Status indicator component (hoisted to avoid recreation)
const StatusIndicator = ({ status }: { status: ValidatedImage['validationStatus'] }) => {
  switch (status) {
    case 'validating':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    case 'valid':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'invalid':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    default:
      return null
  }
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
      console.log('[Dropzone] Files dropped:', {
        count: acceptedFiles.length,
        files: acceptedFiles.map((f) => ({ name: f.name, size: f.size })),
      })
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

  // Show image grid if we have images
  const hasImages = images.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Image preview grid */}
      {hasImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                'relative aspect-square rounded-lg border-2 overflow-hidden group',
                image.validationStatus === 'valid' && 'border-green-400',
                image.validationStatus === 'invalid' && 'border-red-400',
                image.validationStatus === 'validating' && 'border-blue-400',
                image.validationStatus === 'pending' && 'border-gray-300'
              )}
            >
              <img
                src={image.previewUrl}
                alt={`Preview ${image.file.name}`}
                className="h-full w-full object-cover"
              />

              {/* Status overlay */}
              <div className="absolute top-2 left-2">
                <StatusIndicator status={image.validationStatus} />
              </div>

              {/* Remove button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveImage(image)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Error message */}
              {image.validationError && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-2 line-clamp-2">
                  {image.validationError}
                </div>
              )}

              {/* File info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {image.file.name} ({formatFileSize(image.file.size)})
              </div>
            </div>
          ))}

          {/* Add more button (only if under max) */}
          {canAddMore && (
            <div
              {...getRootProps()}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary/50 hover:bg-muted/50',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add more</span>
              <span className="text-xs text-muted-foreground mt-1">
                {images.length}/{MAX_IMAGES}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty state dropzone */}
      {!hasImages && (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {isDragActive ? (
              <>
                <ImageIcon className="h-12 w-12 text-primary" />
                <p className="text-lg font-medium">Drop your photos here</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drag & drop your photos here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Requirements text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          📸 Upload <strong>{MIN_IMAGES}-{MAX_IMAGES} photos</strong> (minimum {MIN_IMAGES} required)
        </p>
        <p>📁 JPG, PNG, or WebP • Max 10MB each</p>
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
            ? `✓ ${images.length} photo${images.length !== 1 ? 's' : ''} ready`
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
