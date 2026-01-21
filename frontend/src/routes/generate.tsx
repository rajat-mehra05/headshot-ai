import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { ArrowRight, ArrowLeft, Wand2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Dropzone } from '@/components/upload/Dropzone'
import { QuickTips } from '@/components/upload/QuickTips'
import { CreditsDisplay } from '@/components/credits/BalanceDisplay'
import { useUser } from '@/hooks/useUser'
import { useMultiUpload } from '@/hooks/useUpload'
import { useCreateJob, useJob } from '@/hooks/useJobs'
import { useImageValidation } from '@/hooks/useImageValidation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  type ValidatedImage,
  type BackgroundId,
  type StyleId,
  type ClothingColorId,
  BACKGROUNDS,
  STYLES,
  CLOTHING_COLORS,
  QUANTITY_OPTIONS,
  MIN_IMAGES,
  FREE_USER_CREDIT_THRESHOLD,
  DEFAULT_PREFERENCES,
} from '@/utils/constants'

type Step = 1 | 2 | 3 | 4

// Step labels for progress indicator
const STEP_LABELS = ['Upload', 'Background', 'Style', 'Generate'] as const

export default function GeneratePage() {
  const { isSignedIn, isLoaded } = useClerkUser()
  const { data: user } = useUser()

  // Local state (replacing Zustand)
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [uploadedImages, setUploadedImages] = useState<ValidatedImage[]>([])
  const [selectedBackground, setSelectedBackground] = useState<BackgroundId>('professional-office')
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('business-casual')
  const [selectedClothingColor, setSelectedClothingColor] = useState<ClothingColorId>('random')
  const [numberOfResults, setNumberOfResults] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Persist preferences in localStorage
  const [savedPreferences, setSavedPreferences] = useLocalStorage(
    'headshot-preferences',
    DEFAULT_PREFERENCES
  )

  // Load saved preferences on mount
  useEffect(() => {
    setSelectedBackground(savedPreferences.background)
    setSelectedStyle(savedPreferences.style)
    setSelectedClothingColor(savedPreferences.clothingColor)
    console.log('[GeneratePage] Loaded saved preferences:', savedPreferences)
  }, [])

  // Save preferences when they change
  useEffect(() => {
    setSavedPreferences({
      background: selectedBackground,
      style: selectedStyle,
      clothingColor: selectedClothingColor,
    })
  }, [selectedBackground, selectedStyle, selectedClothingColor, setSavedPreferences])

  // Derived state
  const userCredits = user?.credits_balance ?? 0
  const isFreeUser = userCredits <= FREE_USER_CREDIT_THRESHOLD
  const hasEnoughCredits = userCredits >= numberOfResults
  const validImages = uploadedImages.filter((img) => img.validationStatus === 'valid')
  const canProceedFromUpload = validImages.length >= MIN_IMAGES

  // Set default quantity based on user type
  useEffect(() => {
    if (user) {
      const defaultQty = isFreeUser ? 1 : 5
      setNumberOfResults(defaultQty)
      console.log('[GeneratePage] Credits loaded:', { userCredits, isFreeUser, defaultQty })
    }
  }, [user, isFreeUser, userCredits])

  // Image validation hook
  const { processFiles, removeImage, cleanupAllPreviews } = useImageValidation({
    onUpdateImage: useCallback((id: string, updates: Partial<ValidatedImage>) => {
      setUploadedImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
      )
    }, []),
    onAddImages: useCallback((images: ValidatedImage[]) => {
      setUploadedImages((prev) => [...prev, ...images])
    }, []),
    currentImageCount: uploadedImages.length,
    existingImages: uploadedImages,
  })

  // Multi-upload mutation
  const multiUpload = useMultiUpload({
    onProgress: ({ imageId, progress }) => {
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, uploadProgress: progress } : img
        )
      )
    },
    onSuccess: ({ imageId, filePath }) => {
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, uploadedPath: filePath } : img
        )
      )
    },
  })

  // Job creation and polling
  const createJobMutation = useCreateJob()
  const { data: currentJob } = useJob(currentJobId)

  // Handle file selection
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      console.log('[GeneratePage] Files selected:', {
        count: files.length,
        files: files.map((f) => ({ name: f.name, size: f.size })),
      })
      processFiles(files)
    },
    [processFiles]
  )

  // Handle image removal
  const handleRemoveImage = useCallback(
    (image: ValidatedImage) => {
      removeImage(image, uploadedImages, setUploadedImages)
    },
    [removeImage, uploadedImages]
  )

  // Handle step navigation
  const handleNextStep = () => {
    const newStep = Math.min(currentStep + 1, 4) as Step
    console.log('[GeneratePage] Step changed:', { from: currentStep, to: newStep })
    setCurrentStep(newStep)
  }

  const handlePrevStep = () => {
    const newStep = Math.max(currentStep - 1, 1) as Step
    console.log('[GeneratePage] Step changed:', { from: currentStep, to: newStep })
    setCurrentStep(newStep)
  }

  // Handle generation
  const handleGenerate = async () => {
    if (!hasEnoughCredits || validImages.length < MIN_IMAGES) {
      return
    }

    setIsGenerating(true)
    setError('')

    console.log('[GeneratePage] Generation started:', {
      imageCount: validImages.length,
      background: selectedBackground,
      style: selectedStyle,
      clothingColor: selectedClothingColor,
      quantity: numberOfResults,
      creditsAvailable: userCredits,
    })

    try {
      // Upload all valid images first (if not already uploaded)
      const imagesToUpload = validImages
        .filter((img) => !img.uploadedPath)
        .map((img) => ({ file: img.file, imageId: img.id }))

      if (imagesToUpload.length > 0) {
        console.log('[GeneratePage] Uploading images:', imagesToUpload.length)
        await multiUpload.mutateAsync(imagesToUpload)
      }

      // Get the first valid image's path for the job
      const primaryImage = uploadedImages.find(
        (img) => img.validationStatus === 'valid' && img.uploadedPath
      )

      if (!primaryImage?.uploadedPath) {
        throw new Error('No valid uploaded image found')
      }

      // Create the job
      const job = await createJobMutation.mutateAsync({
        input_image_path: primaryImage.uploadedPath,
        style_preset: selectedStyle,
        background_option: selectedBackground,
      })

      console.log('[GeneratePage] Generation API response:', {
        success: true,
        jobId: job.id,
      })

      setCurrentJobId(job.id)
    } catch (err) {
      console.error('[GeneratePage] Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Generation failed')
      setIsGenerating(false)
    }
  }

  // Handle start over
  const handleStartOver = () => {
    cleanupAllPreviews(uploadedImages)
    setUploadedImages([])
    setCurrentStep(1)
    setIsGenerating(false)
    setError('')
    setCurrentJobId(null)
    console.log('[GeneratePage] Reset to initial state')
  }

  // Auto-advance when job completes
  useEffect(() => {
    if (currentJob?.status === 'completed' || currentJob?.status === 'failed') {
      setIsGenerating(false)
    }
  }, [currentJob?.status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllPreviews(uploadedImages)
    }
  }, [])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Auth check
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // Render job result
  if (currentJob?.status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Headshot is Ready!</CardTitle>
            <CardDescription>
              Generated in{' '}
              {currentJob.processing_time_ms
                ? `${(currentJob.processing_time_ms / 1000).toFixed(1)}s`
                : 'a few seconds'}
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
      </div>
    )
  }

  // Render job error
  if (currentJob?.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
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
      </div>
    )
  }

  // Render generating state
  if (isGenerating && currentJobId) {
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
                Status: {currentJob?.status || 'starting'}
              </p>
              <Progress
                value={
                  !currentJob
                    ? 10
                    : currentJob.status === 'pending'
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
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Headshot</h1>
        <p className="text-muted-foreground">
          Upload photos and generate your professional headshot
        </p>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={i + 1 === currentStep ? 'text-primary font-medium' : ''}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
      )}

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Upload Your Photos</CardTitle>
                <CardDescription>
                  Choose 3-5 clear photos with good lighting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Dropzone
                  images={uploadedImages}
                  onFilesSelected={handleFilesSelected}
                  onRemoveImage={handleRemoveImage}
                  disabled={multiUpload.isPending}
                />

                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedFromUpload}
                  className="w-full gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <QuickTips className="h-full" />
          </div>
        </div>
      )}

      {/* Step 2: Background */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Background</CardTitle>
            <CardDescription>Select the background style for your headshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${
                    selectedBackground === bg.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  {selectedBackground === bg.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <span className="text-2xl block mb-2">{bg.emoji}</span>
                  <span className="font-medium block">{bg.name}</span>
                  <span className="text-xs text-muted-foreground">{bg.description}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handlePrevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNextStep} className="flex-1 gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Style & Color */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Style & Color</CardTitle>
            <CardDescription>Customize the style and clothing color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Styles */}
            <div>
              <h3 className="font-medium mb-3">Style</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${
                      selectedStyle === style.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {selectedStyle === style.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-xl block mb-1">{style.emoji}</span>
                    <span className="font-medium block text-sm">{style.name}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clothing Colors */}
            <div>
              <h3 className="font-medium mb-3">Clothing Color</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CLOTHING_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedClothingColor(color.id)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all hover:border-primary/50 ${
                      selectedClothingColor === color.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {selectedClothingColor === color.id && (
                      <div className="absolute top-1 right-1">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <span className="text-lg block">{color.emoji}</span>
                    <span className="text-xs font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handlePrevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNextStep} className="flex-1 gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm & Generate */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Generate</CardTitle>
            <CardDescription>Confirm your selections and generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Photos</span>
                <p className="font-medium">{validImages.length} photos ready</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Background</span>
                <p className="font-medium">
                  {BACKGROUNDS.find((b) => b.id === selectedBackground)?.name}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Style</span>
                <p className="font-medium">
                  {STYLES.find((s) => s.id === selectedStyle)?.name}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Clothing Color</span>
                <p className="font-medium">
                  {CLOTHING_COLORS.find((c) => c.id === selectedClothingColor)?.name}
                </p>
              </div>
            </div>

            {/* Quantity selector (paid users only) */}
            {!isFreeUser && (
              <div>
                <h3 className="font-medium mb-3">Number of Results</h3>
                <div className="grid grid-cols-5 gap-3">
                  {QUANTITY_OPTIONS.map((num) => (
                    <button
                      key={num}
                      onClick={() => setNumberOfResults(num)}
                      className={`p-3 rounded-xl border-2 font-medium transition-all ${
                        numberOfResults === num
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credits display */}
            <div className="flex justify-center">
              <CreditsDisplay credits={userCredits} needed={numberOfResults} />
            </div>

            {/* Insufficient credits warning */}
            {!hasEnoughCredits && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-amber-800 mb-2">You need more credits to generate.</p>
                <Link to="/pricing">
                  <Button variant="outline" size="sm">
                    Get More Credits
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={handlePrevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!hasEnoughCredits || isGenerating || createJobMutation.isPending}
                className="flex-1 gap-2"
              >
                {createJobMutation.isPending || multiUpload.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate ({numberOfResults} credit{numberOfResults !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
