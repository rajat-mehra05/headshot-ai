import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { BalanceDisplay } from '@/components/credits/BalanceDisplay'
import { useCredits } from '@/hooks/useUser'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { credits } = useCredits()

  const handlePricingClick = () => {
    if (location.pathname === '/') {
      // Already on home page, scroll to pricing section
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navigate to home page with hash
      navigate('/#pricing')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">Headshot AI</span>
        </Link>

        <nav className="flex items-center gap-4">
          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="ghost" size="sm">
                History
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost" size="sm">
                Buy Credits
              </Button>
            </Link>
            <BalanceDisplay balance={credits} />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Button variant="ghost" size="sm" onClick={handlePricingClick}>
              Pricing
            </Button>
            <Link to="/sign-in">
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  )
}
