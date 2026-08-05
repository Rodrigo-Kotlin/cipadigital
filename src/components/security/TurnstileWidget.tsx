import { useEffect, useRef } from 'react'

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEHBY97o929Vt55x'

function logTurnstile(event: string, fields: Record<string, unknown> = {}) {
  console.info(`[turnstile] ${event}`, fields)
}

type TurnstileWidgetProps = {
  action: string
  onToken: (token: string) => void
  resetKey?: number
}

export function TurnstileWidget({ action, onToken, resetKey = 0 }: TurnstileWidgetProps) {
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
        callback: (token) => {
          logTurnstile('turnstile_success', { action, token_present: token.length > 0 })
          tokenHandlerRef.current(token)
        },
        'expired-callback': () => {
          logTurnstile('turnstile_expired', { action })
          tokenHandlerRef.current('')
        },
        'error-callback': () => {
          logTurnstile('turnstile_error', { action })
          tokenHandlerRef.current('')
        },
        'timeout-callback': () => {
          logTurnstile('turnstile_timeout', { action })
          tokenHandlerRef.current('')
        },
      })
      logTurnstile('turnstile_rendered', { action })
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
  }, [action, resetKey])

  return (
    <div ref={containerRef} className="turnstile-widget" aria-label="Verificação de segurança" />
  )
}
