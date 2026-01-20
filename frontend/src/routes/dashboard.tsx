import { Link, Navigate } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { Plus, History, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BalanceDisplay } from '@/components/credits/BalanceDisplay'
import { useJobs } from '@/hooks/useJobs'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useClerkUser()
  const { data: jobs, isLoading: jobsLoading } = useJobs()

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

  const recentJobs = jobs?.slice(0, 3) ?? []
  const completedCount = jobs?.filter((j) => j.status === 'completed').length ?? 0
  const pendingCount = jobs?.filter((j) => j.status === 'pending' || j.status === 'processing').length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <BalanceDisplay className="text-2xl" showLabel={false} />
            <p className="text-xs text-muted-foreground mt-1">
              <Link to="/pricing" className="text-primary hover:underline">
                Buy more credits
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">headshots generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Spinner size="sm" className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">jobs processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start creating or view your history</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link to="/generate">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Headshot
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              View History
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest headshot generations</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No headshots generated yet.</p>
              <Link to="/generate" className="text-primary hover:underline">
                Create your first headshot
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {job.thumbnail_path ? (
                      <img
                        src={job.thumbnail_path}
                        alt="Thumbnail"
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium capitalize">{job.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {job.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  )}
                </div>
              ))}
              {jobs && jobs.length > 3 && (
                <Link
                  to="/history"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  View all {jobs.length} jobs
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
