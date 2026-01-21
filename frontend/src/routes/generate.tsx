import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { Spinner } from '@/components/ui/spinner'
import { StepUpload } from '@/components/generate/StepUpload'
import { StepBackground } from '@/components/generate/StepBackground'
import { StepStyleColor } from '@/components/generate/StepStyleColor'
import { StepConfirm } from '@/components/generate/StepConfirm'
import { JobResultSuccess } from '@/components/generate/JobResultSuccess'
import { JobResultError } from '@/components/generate/JobResultError'
import { JobGenerating } from '@/components/generate/JobGenerating'
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

  // Ref to track latest uploadedImages for cleanup on unmount
  const uploadedImagesRef = useRef<ValidatedImage[]>(uploadedImages)

  // Keep ref in sync with state
  useEffect(() => {
    uploadedImagesRef.current = uploadedImages
  }, [uploadedImages])
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
    setCurrentStep(newStep)
  }

  const handlePrevStep = () => {
    const newStep = Math.max(currentStep - 1, 1) as Step
    setCurrentStep(newStep)
  }

  // Handle generation
  const handleGenerate = async () => {
    if (!hasEnoughCredits || validImages.length < MIN_IMAGES) {
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      // Upload all valid images first (if not already uploaded)
      const imagesToUpload = validImages
        .filter((img) => !img.uploadedPath)
        .map((img) => ({ file: img.file, imageId: img.id }))

      let primaryUploadedPath: string | undefined

      if (imagesToUpload.length > 0) {
        // Capture the mutation result directly to avoid stale state
        const batchResult = await multiUpload.mutateAsync(imagesToUpload)
        // Find the uploaded path from the first successful upload
        const firstSuccessful = batchResult.successful[0]
        if (firstSuccessful) {
          primaryUploadedPath = firstSuccessful.filePath
        }
      }

      // If no uploads were performed, fall back to already-uploaded images
      if (!primaryUploadedPath) {
        const alreadyUploaded = validImages.find((img) => img.uploadedPath)
        primaryUploadedPath = alreadyUploaded?.uploadedPath
      }

      if (!primaryUploadedPath) {
        throw new Error('No valid uploaded image found')
      }

      // Create the job
      const job = await createJobMutation.mutateAsync({
        input_image_path: primaryUploadedPath,
        style_preset: selectedStyle,
        background_option: selectedBackground,
      })

      setCurrentJobId(job.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setIsGenerating(false)
    }
  }

  // Handle start over
  const handleStartOver = () => {
    cleanupAllPreviews(uploadedImagesRef.current)
    setUploadedImages([])
    uploadedImagesRef.current = []
    setCurrentStep(1)
    setIsGenerating(false)
    setError('')
    setCurrentJobId(null)
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
      cleanupAllPreviews(uploadedImagesRef.current)
    }
  }, [cleanupAllPreviews])

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
      <JobResultSuccess
        outputImagePath={currentJob.output_image_path}
        processingTimeMs={currentJob.processing_time_ms}
        onStartOver={handleStartOver}
      />
    )
  }

  // Render job error
  if (currentJob?.status === 'failed') {
    return (
      <JobResultError
        errorMessage={currentJob.error_message}
        onStartOver={handleStartOver}
      />
    )
  }

  // Render generating state
  if (isGenerating && currentJobId) {
    return <JobGenerating status={currentJob?.status} />
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
        <StepUpload
          images={uploadedImages}
          onFilesSelected={handleFilesSelected}
          onRemoveImage={handleRemoveImage}
          onNext={handleNextStep}
          canProceed={canProceedFromUpload}
          isUploading={multiUpload.isPending}
        />
      )}

      {/* Step 2: Background */}
      {currentStep === 2 && (
        <StepBackground
          selectedBackground={selectedBackground}
          onSelectBackground={setSelectedBackground}
          onNext={handleNextStep}
          onBack={handlePrevStep}
        />
      )}

      {/* Step 3: Style & Color */}
      {currentStep === 3 && (
        <StepStyleColor
          selectedStyle={selectedStyle}
          selectedClothingColor={selectedClothingColor}
          onSelectStyle={setSelectedStyle}
          onSelectClothingColor={setSelectedClothingColor}
          onNext={handleNextStep}
          onBack={handlePrevStep}
        />
      )}

      {/* Step 4: Confirm & Generate */}
      {currentStep === 4 && (
        <StepConfirm
          validImageCount={validImages.length}
          selectedBackground={selectedBackground}
          selectedStyle={selectedStyle}
          selectedClothingColor={selectedClothingColor}
          numberOfResults={numberOfResults}
          onSetNumberOfResults={setNumberOfResults}
          userCredits={userCredits}
          isFreeUser={isFreeUser}
          hasEnoughCredits={hasEnoughCredits}
          isGenerating={isGenerating}
          isPreparing={createJobMutation.isPending || multiUpload.isPending}
          onGenerate={handleGenerate}
          onBack={handlePrevStep}
        />
      )}
    </div>
  )
}
