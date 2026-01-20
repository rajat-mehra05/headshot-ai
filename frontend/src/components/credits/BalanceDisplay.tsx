import { Coins } from 'lucide-react'
import { useCreditsBalance } from '@/stores/appStore'
import { cn } from '@/lib/utils'

type BalanceDisplayProps = {
  className?: string
  showLabel?: boolean
}

export function BalanceDisplay({ className, showLabel = true }: BalanceDisplayProps) {
  const balance = useCreditsBalance()

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
