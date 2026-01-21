import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MAX_IMAGES, type ValidatedImage } from '@/utils/constants'
import { formatFileSize } from '@/utils/imageValidation'

interface ImagePreviewGridProps {
  images: ValidatedImage[]
  onRemoveImage: (image: ValidatedImage) => void
  disabled?: boolean
  canAddMore: boolean
  isDragActive: boolean
  getRootProps: () => Record<string, unknown>
  getInputProps: () => Record<string, unknown>
}

function StatusIndicator({ status }: { status: ValidatedImage['validationStatus'] }) {
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

export function ImagePreviewGrid({
  images,
  onRemoveImage,
  disabled = false,
  canAddMore,
  isDragActive,
  getRootProps,
  getInputProps,
}: ImagePreviewGridProps) {
  return (
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
  )
}
