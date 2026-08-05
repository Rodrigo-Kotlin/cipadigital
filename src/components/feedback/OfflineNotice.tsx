import { useEffect, useState } from 'react'

export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="offline-notice" role="status">
      <span className="status-dot" aria-hidden="true" />
      Você está offline. A votação não está disponível sem conexão.
    </div>
  )
}
