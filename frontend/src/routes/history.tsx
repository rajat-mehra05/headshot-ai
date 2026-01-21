import { Navigate } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { JobCard } from '@/components/history/JobCard'
import { useJobs } from '@/hooks/useJobs'

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useClerkUser()
  const { data: jobs, isLoading } = useJobs()

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">View all your generated headshots</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No headshots generated yet.</p>
            <a href="/generate">
              <Button>Create Your First Headshot</Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
