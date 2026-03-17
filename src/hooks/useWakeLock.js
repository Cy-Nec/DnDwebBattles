import { useEffect, useState } from 'react'

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false)
  const [wakeLock, setWakeLock] = useState(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API не поддерживается')
      return
    }

    let isMounted = true

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (isMounted) {
          setWakeLock(lock)
          setIsLocked(true)
        }

        lock.addEventListener('release', () => {
          if (isMounted) {
            setIsLocked(false)
            setWakeLock(null)
          }
        })
        console.log('Wake Lock успешно получен')
      } catch (err) {
        console.error('Ошибка при запросе Wake Lock:', err.name, err.message)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Вкладка стала видимой, запрашиваем Wake Lock')
        await requestWakeLock()
      } else {
        console.log('Вкладка скрыта')
      }
    }

    // Запрашиваем при первом клике/тапе (требуется жест пользователя)
    const handleUserInteraction = async () => {
      console.log('Пользователь взаимодействует со страницей')
      if (!wakeLock) {
        await requestWakeLock()
      }
      // Удаляем обработчики после первого взаимодействия
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    // Также пробуем запросить сразу (может сработать на localhost)
    requestWakeLock()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      wakeLock?.release()
    }
  }, [])

  return { isLocked }
}
