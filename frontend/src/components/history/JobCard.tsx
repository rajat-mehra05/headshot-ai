import { Download, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { Job, JobStatus } from '@/lib/api'

const statusConfig: Record<JobStatus, { icon: typeof CheckCircle; className: string; label: string }> = {
  pending: { icon: Clock, className: 'text-yellow-500', label: 'Pending' },
  validating: { icon: Loader2, className: 'text-blue-500 animate-spin', label: 'Validating' },
  processing: { icon: Loader2, className: 'text-blue-500 animate-spin', label: 'Processing' },
  completed: { icon: CheckCircle, className: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, className: 'text-destructive', label: 'Failed' },
}

interface JobCardProps {
  job: Job
  onDownload?: (jobId: string) => void
  onDelete?: (jobId: string) => void
}

export function JobCard({ job, onDownload, onDelete }: JobCardProps) {
  const status = statusConfig[job.status]
  const StatusIcon = status.icon

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted relative">
        {job.thumbnail_path || job.output_image_path ? (
          <img
            src={job.thumbnail_path || job.output_image_path || ''}
            alt="Generated headshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {job.status === 'processing' || job.status === 'validating' ? (
              <Spinner size="lg" />
            ) : (
              <span className="text-muted-foreground">No preview</span>
            )}
          </div>
        )}
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-background/80 backdrop-blur',
            status.className
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {job.style_preset
            ? `${job.style_preset.charAt(0).toUpperCase()}${job.style_preset.slice(1)} Style`
            : 'Headshot'}
        </CardTitle>
        <CardDescription className="text-xs">
          {new Date(job.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          {job.status === 'completed' && (
            <Button
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onDownload?.(job.id)}
              aria-label="Download headshot"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onDelete?.(job.id)}
            aria-label="Delete job"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {job.processing_time_ms && (
          <p className="text-xs text-muted-foreground mt-2">
            Generated in {(job.processing_time_ms / 1000).toFixed(1)}s
          </p>
        )}
        {job.error_message && (
          <p className="text-xs text-destructive mt-2">{job.error_message}</p>
        )}
      </CardContent>
    </Card>
  )
}
