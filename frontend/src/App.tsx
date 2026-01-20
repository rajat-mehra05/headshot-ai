import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useUser } from '@/hooks/useUser'

// Route components - direct imports (no barrel files per bundle-barrel-imports)
import HomePage from '@/routes/index'
import DashboardPage from '@/routes/dashboard'
import GeneratePage from '@/routes/generate'
import HistoryPage from '@/routes/history'
import PricingPage from '@/routes/pricing'

function App() {
  // Initialize user data
  useUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
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
      </main>
      <Footer />
    </div>
  )
}

export default App
