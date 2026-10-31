'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

type GreetingKey = 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening'

const noopSubscribe = () => () => {}

/** Time-of-day greeting key; null during SSR so the server never guesses the user's clock. */
export function useGreeting(): GreetingKey | null {
  return useSyncExternalStore<GreetingKey | null>(
    noopSubscribe,
    () => {
      const h = new Date().getHours()
      return h < 11 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : 'greetingEvening'
    },
    () => null,
  )
}
