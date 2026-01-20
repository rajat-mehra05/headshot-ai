import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { ArrowRight, CheckCircle, Zap, Shield, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Generate professional headshots using state-of-the-art AI models',
  },
  {
    icon: Clock,
    title: 'Fast Results',
    description: 'Get your headshot in under 30 seconds',
  },
  {
    icon: Shield,
    title: 'Quality Assured',
    description: 'Validation ensures your photo meets professional standards',
  },
  {
    icon: CheckCircle,
    title: 'Platform Ready',
    description: 'Perfect for LinkedIn, company profiles, and hiring platforms',
  },
]

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 4,
    discount: '50% OFF Limited Time',
    features: [
      '20 HD headshots',
      '3 professional backgrounds',
      '30-second generation',
      '14-day money back guarantee',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    discount: '50% OFF Today Only!',
    isPopular: true,
    features: [
      '60 HD headshots',
      '6 professional backgrounds',
      'Multiple outfit styles',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 20,
    discount: 'Best Value',
    features: [
      '140 4K headshots',
      'All backgrounds & styles',
      '10 bonus generation credits',
      'VIP support',
    ],
  },
]

export default function HomePage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#pricing') {
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location.hash])

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Professional AI Headshots
          <br />
          <span className="text-muted-foreground">in Seconds</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your photos into polished, professional headshots perfect for
          LinkedIn, company profiles, and hiring platforms.
        </p>
        <div className="flex gap-4 justify-center">
          <SignedIn>
            <Link to="/generate">
              <Button size="lg" className="gap-2">
                Create Headshot
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link to="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">Why Choose Us</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold">Upload Your Photo</h3>
            <p className="text-sm text-muted-foreground">
              Upload a clear photo of yourself. Our AI validates it meets quality standards.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold">Choose Your Style</h3>
            <p className="text-sm text-muted-foreground">
              Select from professional style presets and background options.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold">Download & Use</h3>
            <p className="text-sm text-muted-foreground">
              Get your professional headshot in seconds, ready to use anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="space-y-12 scroll-mt-20">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-800">
            <span>🎉</span>
            <span className="text-sm font-medium">Start with 1 FREE credit - No credit card required</span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-start">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.isPopular
                  ? 'bg-slate-800 text-white border-slate-700 shadow-xl md:-mt-4 md:mb-4'
                  : 'bg-white'
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className={cn(
                  'text-xl font-bold',
                  plan.isPopular ? 'text-white' : 'text-slate-900'
                )}>
                  {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={cn(
                      'text-4xl font-bold',
                      plan.isPopular ? 'text-white' : 'text-slate-900'
                    )}>
                      ${plan.price}
                    </span>
                    <span className={cn(
                      'text-sm',
                      plan.isPopular ? 'text-slate-300' : 'text-slate-500'
                    )}>
                      /package
                    </span>
                  </div>
                  <p className={cn(
                    'text-sm font-medium mt-1',
                    plan.isPopular ? 'text-blue-400' : 'text-blue-600'
                  )}>
                    {plan.discount}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={cn(
                        'h-5 w-5 flex-shrink-0 mt-0.5',
                        plan.isPopular ? 'text-green-400' : 'text-green-500'
                      )} />
                      <span className={cn(
                        'text-sm',
                        plan.isPopular ? 'text-slate-200' : 'text-slate-600'
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Link to="/sign-up" className="w-full">
                  <Button
                    className={cn(
                      'w-full',
                      plan.isPopular
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    )}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
