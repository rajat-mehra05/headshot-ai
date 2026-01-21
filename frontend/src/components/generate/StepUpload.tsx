import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dropzone } from '@/components/upload/Dropzone'
import { QuickTips } from '@/components/upload/QuickTips'
import type { ValidatedImage } from '@/utils/constants'

interface StepUploadProps {
  images: ValidatedImage[]
  onFilesSelected: (files: File[]) => void
  onRemoveImage: (image: ValidatedImage) => void
  onNext: () => void
  canProceed: boolean
  isUploading: boolean
}

export function StepUpload({
  images,
  onFilesSelected,
  onRemoveImage,
  onNext,
  canProceed,
  isUploading,
}: StepUploadProps) {
  return (
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
              images={images}
              onFilesSelected={onFilesSelected}
              onRemoveImage={onRemoveImage}
              disabled={isUploading}
            />

            <Button
              onClick={onNext}
              disabled={!canProceed}
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
  )
}
