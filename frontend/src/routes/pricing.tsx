import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { Check, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

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

const faqItems = [
  {
    question: 'Do credits expire?',
    answer: 'No, your credits never expire. Use them whenever you need a new headshot.',
  },
  {
    question: "What if I'm not satisfied with the result?",
    answer: 'If generation fails due to a technical issue, your credit will be automatically refunded.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Unused credits can be refunded within 30 days of purchase. Contact support for assistance.',
  },
]

export default function PricingPage() {
  const { getToken, isSignedIn } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const token = await getToken()
      if (!token) throw new Error('Please sign in to purchase credits')
      return api.credits.checkout(token, packageId)
    },
    onSuccess: (data) => {
      window.location.href = data.checkout_url
    },
  })

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="space-y-12 py-8">
      {/* Free Credit Banner */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-800">
          <span>🎉</span>
          <span className="text-sm font-medium">Start with 1 FREE credit - No credit card required</span>
        </div>
      </div>

      {/* Pricing Cards */}
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
              {isSignedIn ? (
                <Button
                  className={cn(
                    'w-full',
                    plan.isPopular
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  )}
                  onClick={() => checkoutMutation.mutate(plan.id)}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    'Go to Dashboard'
                  )}
                </Button>
              ) : (
                <Link to="/sign-up" className="w-full">
                  <Button
                    className={cn(
                      'w-full',
                      plan.isPopular
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    )}
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section - Accordion */}
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {item.question}
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    openFaq === index && 'rotate-180'
                  )}
                />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
