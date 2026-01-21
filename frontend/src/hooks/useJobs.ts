import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api, type CreateJobRequest, type Job } from '@/lib/api'

export function useJobs() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return api.jobs.list(token)
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useJob(jobId: string | null) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      const token = await getToken()
      if (!token || !jobId) throw new Error('No auth token or job ID')
      return api.jobs.get(token, jobId)
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll while job is in progress
      const data = query.state.data as Job | undefined
      if (data?.status === 'pending' || data?.status === 'processing' || data?.status === 'validating') {
        return 2000 // Poll every 2 seconds
      }
      return false
    },
  })
}

export function useCreateJob() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return api.jobs.create(token, data)
    },
    onSuccess: () => {
      // Invalidate jobs list and user (credits may have changed)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useCancelJob() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return api.jobs.cancel(token, jobId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useDownloadImage() {
  const { getToken } = useAuth()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      const { url } = await api.images.getDownloadUrl(token, jobId)

      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `headshot-${jobId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    },
  })
}

export function useDeleteJob() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return api.images.delete(token, jobId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
