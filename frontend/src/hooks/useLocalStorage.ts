import { useState, useEffect, useCallback, useRef } from 'react'

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
    } catch {
      return initialValue
    }
  })

  // Track the previous key to avoid writing stale values when key changes
  const prevKeyRef = useRef(key)

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Only write to localStorage if the key hasn't changed
    // When key changes, storedValue may still be stale from the previous key
    if (prevKeyRef.current === key) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch {
        // Silently ignore storage errors (e.g., quota exceeded)
      }
    }

    // Update the ref to track the current key
    prevKeyRef.current = key
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
    } catch {
      // Silently ignore storage errors
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
