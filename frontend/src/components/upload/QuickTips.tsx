import { cn } from '@/lib/utils'

interface QuickTipsProps {
  className?: string
}

// Hoisted constant (rendering-hoist-jsx pattern)
const TIPS = [
  {
    icon: '💡',
    title: 'Well-lit & Clear',
    description: 'Use good lighting, avoid shadows on face',
  },
  {
    icon: '👤',
    title: 'Face Visible',
    description: 'No sunglasses, hats, or face coverings',
  },
  {
    icon: '📐',
    title: 'Straight Angle',
    description: 'Face the camera directly, eyes visible',
  },
  {
    icon: '📷',
    title: 'Multiple Photos',
    description: 'Upload 3-5 different poses for variety',
  },
  {
    icon: '🖼️',
    title: 'High Resolution',
    description: 'Use photos at least 512x512 pixels',
  },
] as const

export function QuickTips({ className }: QuickTipsProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 sm:p-6 lg:p-8 bg-blue-50 border border-blue-200',
        className
      )}
    >
      <div className="flex items-center mb-5 lg:mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-blue-100">
          <span className="text-xl">✨</span>
        </div>
        <h3 className="text-lg lg:text-xl font-bold text-gray-900">
          Quick Tips for Best Results
        </h3>
      </div>

      <div className="space-y-4 lg:space-y-5">
        {TIPS.map((tip) => (
          <div key={tip.title} className="flex items-start space-x-3">
            <span className="mt-0.5 text-xl text-blue-600">{tip.icon}</span>
            <div>
              <span className="font-semibold text-gray-900">{tip.title}</span>
              <p className="text-sm text-gray-600 mt-0.5">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
