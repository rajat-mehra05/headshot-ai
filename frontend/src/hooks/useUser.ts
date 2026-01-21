import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api, type User } from '@/lib/api'

/**
 * Hook for fetching the current user
 * Removed Zustand dependency - returns query result directly
 */
export function useUser() {
  const { getToken, isSignedIn } = useAuth()

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async (): Promise<User> => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')

      const user = await api.users.me(token)
      console.log('[useUser] User fetched:', {
        id: user.id,
        email: user.email,
        credits: user.credits_balance,
      })

      return user
    },
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Helper hook to get just the credits balance
 * Useful when you only need credits info
 */
export function useCredits() {
  const { data: user, isLoading, error } = useUser()

  return {
    credits: user?.credits_balance ?? 0,
    isLoading,
    error,
    hasCredits: (user?.credits_balance ?? 0) > 0,
  }
}
