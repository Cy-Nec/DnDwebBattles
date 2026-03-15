import { useEffect, useState } from 'react'

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false)
  const [wakeLock, setWakeLock] = useState(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API не поддерживается')
      return
    }

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        setWakeLock(lock)
        setIsLocked(true)

        lock.addEventListener('release', () => {
          setIsLocked(false)
        })
      } catch (err) {
        console.error('Ошибка при запросе Wake Lock:', err)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLock === null) {
        await requestWakeLock()
      }
    }

    requestWakeLock()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      wakeLock?.release()
    }
  }, [])

  return { isLocked }
}
