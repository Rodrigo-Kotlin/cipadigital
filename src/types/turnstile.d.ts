interface TurnstileRenderOptions {
  sitekey: string
  action: string
  callback: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  'timeout-callback'?: () => void
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

interface Window {
  turnstile?: TurnstileApi
}
