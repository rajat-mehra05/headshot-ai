import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { Toaster } from 'sonner'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useUser } from '@/hooks/useUser'
import { Spinner } from '@/components/ui/spinner'

// Route components - lazy loaded for code splitting
const HomePage = lazy(() => import('@/routes/index'))
const DashboardPage = lazy(() => import('@/routes/dashboard'))
const GeneratePage = lazy(() => import('@/routes/generate'))
const HistoryPage = lazy(() => import('@/routes/history'))
const PricingPage = lazy(() => import('@/routes/pricing'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

function App() {
  // Initialize user data
  useUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" richColors />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route
              path="/sign-in/*"
              element={
                <div className="flex justify-center py-12">
                  <SignIn routing="path" path="/sign-in" />
                </div>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="flex justify-center py-12">
                  <SignUp routing="path" path="/sign-up" />
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App
