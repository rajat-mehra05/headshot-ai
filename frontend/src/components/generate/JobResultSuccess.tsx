import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface JobResultSuccessProps {
  outputImagePath: string | null
  processingTimeMs: number | null
  onStartOver: () => void
}

export function JobResultSuccess({
  outputImagePath,
  processingTimeMs,
  onStartOver,
}: JobResultSuccessProps) {
  const handleDownload = async () => {
    if (!outputImagePath) return

    try {
      const response = await fetch(outputImagePath)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `headshot-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(outputImagePath, '_blank')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Headshot is Ready!</CardTitle>
          <CardDescription>
            Generated in{' '}
            {processingTimeMs
              ? `${(processingTimeMs / 1000).toFixed(1)}s`
              : 'a few seconds'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {outputImagePath && (
            <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg border">
              <img
                src={outputImagePath}
                alt="Generated headshot"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-4">
            <Button variant="outline" onClick={onStartOver}>
              Create Another
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!outputImagePath}
              aria-label="Download headshot"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
