import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'
import { useEffect } from 'react'

export function useUser() {
  const { getToken, isSignedIn } = useAuth()
  const setUser = useAppStore((state) => state.setUser)

  const query = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return api.users.me(token)
    },
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Sync to global store
  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    } else if (!isSignedIn) {
      setUser(null)
    }
  }, [query.data, isSignedIn, setUser])

  return query
}
