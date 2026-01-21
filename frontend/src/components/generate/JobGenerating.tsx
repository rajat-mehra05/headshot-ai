import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'

type JobStatus = 'pending' | 'validating' | 'processing' | 'completed' | 'failed'

interface JobGeneratingProps {
  status: JobStatus | undefined
}

export function JobGenerating({ status }: JobGeneratingProps) {
  const getProgressValue = () => {
    if (!status) return 10
    switch (status) {
      case 'pending':
        return 20
      case 'validating':
        return 40
      case 'processing':
        return 70
      default:
        return 100
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generating Your Headshot</CardTitle>
          <CardDescription>This usually takes less than 30 seconds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner size="lg" />
            <p className="text-muted-foreground capitalize">
              Status: {status || 'starting'}
            </p>
            <Progress value={getProgressValue()} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
