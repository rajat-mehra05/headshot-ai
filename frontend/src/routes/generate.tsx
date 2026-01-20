import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { ArrowRight, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Dropzone } from '@/components/upload/Dropzone'
import { ValidationFeedback } from '@/components/upload/ValidationFeedback'
import { useAppStore, useHasCredits, useValidationPassed } from '@/stores/appStore'
import { useUpload, useValidation } from '@/hooks/useUpload'
import { useCreateJob, useJob } from '@/hooks/useJobs'

type Step = 'upload' | 'validate' | 'configure' | 'generate' | 'result'

export default function GeneratePage() {
  const { isSignedIn, isLoaded } = useClerkUser()
  const [step, setStep] = useState<Step>('upload')

  const { upload, validationResult, generation, resetAll } = useAppStore()
  const hasCredits = useHasCredits()
  const validationPassed = useValidationPassed()

  const uploadMutation = useUpload()
  const validationMutation = useValidation()
  const createJobMutation = useCreateJob()

  const { data: currentJob } = useJob(generation.currentJob?.id ?? null)

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  const handleUploadAndValidate = async () => {
    if (!upload.file) return

    try {
      const filePath = await uploadMutation.mutateAsync()
      setStep('validate')
      await validationMutation.mutateAsync(filePath)
    } catch (error) {
      console.error('Upload/validation failed:', error)
    }
  }

  const handleGenerate = async () => {
    if (!upload.uploadedPath || !validationPassed) return

    try {
      setStep('generate')
      const job = await createJobMutation.mutateAsync({
        input_image_path: upload.uploadedPath,
        style_preset: generation.selectedStyle ?? undefined,
        background_option: generation.selectedBackground ?? undefined,
      })
      useAppStore.getState().setCurrentJob(job)
    } catch (error) {
      console.error('Job creation failed:', error)
      setStep('configure')
    }
  }

  const handleStartOver = () => {
    resetAll()
    setStep('upload')
  }

  // Auto-advance to result when job completes
  if (currentJob?.status === 'completed' && step === 'generate') {
    setStep('result')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Headshot</h1>
        <p className="text-muted-foreground">
          Upload a photo and generate your professional headshot
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'validate', 'configure', 'generate', 'result'] as Step[]).map(
          (s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                i <= ['upload', 'validate', 'configure', 'generate', 'result'].indexOf(step)
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          )
        )}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Photo</CardTitle>
            <CardDescription>
              Choose a clear photo with good lighting. Face should be clearly visible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Dropzone />
            {upload.file && (
              <Button
                onClick={handleUploadAndValidate}
                disabled={uploadMutation.isPending}
                className="w-full gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Validate */}
      {step === 'validate' && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              We check your photo to ensure the best results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Spinner size="lg" />
                <p className="text-muted-foreground">Analyzing your photo...</p>
              </div>
            ) : validationResult ? (
              <>
                <ValidationFeedback result={validationResult} />
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleStartOver}>
                    Try Another Photo
                  </Button>
                  {validationPassed && (
                    <Button onClick={() => setStep('configure')} className="gap-2">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Step: Configure */}
      {step === 'configure' && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Options</CardTitle>
            <CardDescription>
              Choose your style and background preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Style presets - simplified for MVP */}
            <div>
              <h3 className="font-medium mb-3">Style</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Professional', 'Corporate', 'Creative', 'Casual'].map((style) => (
                  <Button
                    key={style}
                    variant={generation.selectedStyle === style.toLowerCase() ? 'default' : 'outline'}
                    onClick={() =>
                      useAppStore.getState().setSelectedStyle(style.toLowerCase())
                    }
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            {/* Background options */}
            <div>
              <h3 className="font-medium mb-3">Background</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'white', label: 'White', color: '#ffffff' },
                  { id: 'gray', label: 'Gray', color: '#6b7280' },
                  { id: 'blue', label: 'Blue', color: '#3b82f6' },
                ].map((bg) => (
                  <Button
                    key={bg.id}
                    variant={generation.selectedBackground === bg.id ? 'default' : 'outline'}
                    onClick={() => useAppStore.getState().setSelectedBackground(bg.id)}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: bg.color }}
                    />
                    {bg.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Credits warning */}
            {!hasCredits && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                You need credits to generate a headshot.{' '}
                <a href="/pricing" className="underline">
                  Buy credits
                </a>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('validate')}>
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!hasCredits || createJobMutation.isPending}
                className="flex-1 gap-2"
              >
                {createJobMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate (1 credit)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Generate */}
      {step === 'generate' && currentJob && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Your Headshot</CardTitle>
            <CardDescription>
              This usually takes less than 30 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner size="lg" />
              <p className="text-muted-foreground capitalize">
                Status: {currentJob.status}
              </p>
              <Progress
                value={
                  currentJob.status === 'pending'
                    ? 20
                    : currentJob.status === 'validating'
                    ? 40
                    : currentJob.status === 'processing'
                    ? 70
                    : 100
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Result */}
      {step === 'result' && currentJob?.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Headshot is Ready!</CardTitle>
            <CardDescription>
              Generated in {currentJob.processing_time_ms ? `${(currentJob.processing_time_ms / 1000).toFixed(1)}s` : 'a few seconds'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentJob.output_image_path && (
              <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg border">
                <img
                  src={currentJob.output_image_path}
                  alt="Generated headshot"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleStartOver}>
                Create Another
              </Button>
              <Button className="flex-1">Download</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {currentJob?.status === 'failed' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Generation Failed</CardTitle>
            <CardDescription>
              {currentJob.error_message || 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your credit has been refunded. Please try again.
            </p>
            <Button onClick={handleStartOver}>Try Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
