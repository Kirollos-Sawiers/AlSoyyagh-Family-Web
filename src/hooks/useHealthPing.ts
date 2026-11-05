import { useEffect } from 'react'
import { checkHealth } from '../services/api'

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000

export function useHealthPing(intervalMs: number = DEFAULT_INTERVAL_MS) {
  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      if (cancelled) return
      try {
        await checkHealth()
      } catch {
        // Health checks are best-effort; ignore failures.
      }
    }

    ping()
    const timer = window.setInterval(ping, intervalMs)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [intervalMs])
}
