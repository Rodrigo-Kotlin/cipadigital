import { useEffect, useRef } from 'react'

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEHBY97o929Vt55x'

type TurnstileWidgetProps = {
  action: string
  onToken: (token: string) => void
}

export function TurnstileWidget({ action, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)
  const tokenHandlerRef = useRef(onToken)
  tokenHandlerRef.current = onToken

  useEffect(() => {
    let cancelled = false
    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        callback: (token) => tokenHandlerRef.current(token),
        'expired-callback': () => tokenHandlerRef.current(''),
        'error-callback': () => tokenHandlerRef.current(''),
      })
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID)
    if (window.turnstile) renderWidget()
    else if (existingScript) existingScript.addEventListener('load', renderWidget, { once: true })
    else {
      const script = document.createElement('script')
      script.id = TURNSTILE_SCRIPT_ID
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.addEventListener('load', renderWidget, { once: true })
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = undefined
      }
    }
  }, [action])

  return (
    <div ref={containerRef} className="turnstile-widget" aria-label="Verificação de segurança" />
  )
}
