import { useState, useEffect, useCallback } from 'react'

/**
 * Sync state with localStorage
 * Provides type-safe persistence with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Lazy initialization (rerender-lazy-state-init pattern)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`[useLocalStorage] Error setting key "${key}":`, error)
    }
  }, [key, storedValue])

  // Setter function supporting both value and function updates
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        return nextValue
      })
    },
    []
  )

  // Remove from storage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
