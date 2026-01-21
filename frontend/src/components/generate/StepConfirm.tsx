import { Link } from 'react-router-dom'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { CreditsDisplay } from '@/components/credits/BalanceDisplay'
import {
  BACKGROUNDS,
  STYLES,
  CLOTHING_COLORS,
  QUANTITY_OPTIONS,
  type BackgroundId,
  type StyleId,
  type ClothingColorId,
} from '@/utils/constants'

interface StepConfirmProps {
  validImageCount: number
  selectedBackground: BackgroundId
  selectedStyle: StyleId
  selectedClothingColor: ClothingColorId
  numberOfResults: number
  onSetNumberOfResults: (num: number) => void
  userCredits: number
  isFreeUser: boolean
  hasEnoughCredits: boolean
  isGenerating: boolean
  isPreparing: boolean
  onGenerate: () => void
  onBack: () => void
}

export function StepConfirm({
  validImageCount,
  selectedBackground,
  selectedStyle,
  selectedClothingColor,
  numberOfResults,
  onSetNumberOfResults,
  userCredits,
  isFreeUser,
  hasEnoughCredits,
  isGenerating,
  isPreparing,
  onGenerate,
  onBack,
}: StepConfirmProps) {
  return (
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
            <p className="font-medium">{validImageCount} photos ready</p>
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
                  onClick={() => onSetNumberOfResults(num)}
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
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!hasEnoughCredits || isGenerating || isPreparing}
            className="flex-1 gap-2"
          >
            {isPreparing ? (
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
  )
}
