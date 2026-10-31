'use client'

import { useCallback, useSyncExternalStore } from 'react'

const EVENT = 'pusaka:local-storage'

function read(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

/**
 * A string preference persisted in localStorage. The server snapshot is the
 * fallback, so the first client render matches the server and the saved
 * value applies right after hydration — no mismatch, no effect-driven state.
 */
export function useLocalPreference<T extends string>(
  key: string,
  fallback: T,
  isValid: (v: string) => v is T,
  /** Client-side default when nothing is saved yet (e.g. from the browser language). */
  detect?: () => T | null,
): [T, (value: T) => void] {
  const getSnapshot = useCallback(() => {
    const v = read(key)
    if (v !== null && isValid(v)) return v
    return detect?.() ?? fallback
  }, [key, fallback, isValid, detect])

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback)

  const set = useCallback((next: T) => {
    try { localStorage.setItem(key, next) } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(EVENT))
  }, [key])

  return [value, set]
}
