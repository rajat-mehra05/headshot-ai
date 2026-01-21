import { useState, useCallback } from 'react'

/**
 * Simple toggle hook for boolean state
 * Useful for modals, expanded sections, etc.
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)

  // Memoized toggle function (rerender-functional-setstate pattern)
  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  // Direct setter for when explicit value is needed
  const setExplicit = useCallback((newValue: boolean) => {
    setValue(newValue)
  }, [])

  return [value, toggle, setExplicit]
}
