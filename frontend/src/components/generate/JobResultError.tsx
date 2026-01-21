import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface JobResultErrorProps {
  errorMessage: string | null
  onStartOver: () => void
}

export function JobResultError({ errorMessage, onStartOver }: JobResultErrorProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Generation Failed</CardTitle>
          <CardDescription>
            {errorMessage || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your credit has been refunded. Please try again.
          </p>
          <Button onClick={onStartOver}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  )
}
