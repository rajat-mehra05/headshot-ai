import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateDropzoneProps {
  isDragActive: boolean
  disabled?: boolean
  getRootProps: () => Record<string, unknown>
  getInputProps: () => Record<string, unknown>
}

export function EmptyStateDropzone({
  isDragActive,
  disabled = false,
  getRootProps,
  getInputProps,
}: EmptyStateDropzoneProps) {
  return (
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
  )
}
