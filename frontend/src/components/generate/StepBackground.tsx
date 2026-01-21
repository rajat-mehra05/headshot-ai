import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BACKGROUNDS, type BackgroundId } from '@/utils/constants'

interface StepBackgroundProps {
  selectedBackground: BackgroundId
  onSelectBackground: (id: BackgroundId) => void
  onNext: () => void
  onBack: () => void
}

export function StepBackground({
  selectedBackground,
  onSelectBackground,
  onNext,
  onBack,
}: StepBackgroundProps) {
  return (
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
              onClick={() => onSelectBackground(bg.id)}
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
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="flex-1 gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
