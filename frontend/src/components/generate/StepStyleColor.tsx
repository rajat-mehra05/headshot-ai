import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { STYLES, CLOTHING_COLORS, type StyleId, type ClothingColorId } from '@/utils/constants'

interface StepStyleColorProps {
  selectedStyle: StyleId
  selectedClothingColor: ClothingColorId
  onSelectStyle: (id: StyleId) => void
  onSelectClothingColor: (id: ClothingColorId) => void
  onNext: () => void
  onBack: () => void
}

export function StepStyleColor({
  selectedStyle,
  selectedClothingColor,
  onSelectStyle,
  onSelectClothingColor,
  onNext,
  onBack,
}: StepStyleColorProps) {
  return (
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
                onClick={() => onSelectStyle(style.id)}
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
                onClick={() => onSelectClothingColor(color.id)}
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
