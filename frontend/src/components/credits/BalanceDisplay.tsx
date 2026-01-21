import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BalanceDisplayProps {
  balance: number
  className?: string
  showLabel?: boolean
}

export function BalanceDisplay({
  balance,
  className,
  showLabel = true,
}: BalanceDisplayProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="font-medium">{balance}</span>
      {showLabel && (
        <span className="text-muted-foreground text-sm">
          credit{balance !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// Credits display with cost indicator for generation page
interface CreditsDisplayProps {
  credits: number
  needed: number
  className?: string
}

export function CreditsDisplay({ credits, needed, className }: CreditsDisplayProps) {
  const hasEnough = credits >= needed

  return (
    <div
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium',
        hasEnough ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
        className
      )}
    >
      <span className="text-lg mr-2">{hasEnough ? '⭐' : '⚠️'}</span>
      <span>
        {needed} credit{needed !== 1 ? 's' : ''} needed • You have {credits}
        {!hasEnough && (
          <span className="font-bold ml-2">({needed - credits} more needed)</span>
        )}
      </span>
    </div>
  )
}
