import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../app/providers/AuthProvider'

export function AdminLoginPage() {
  const { configured, user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin'

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true })
  }, [loading, navigate, redirectTo, user])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(
        configured
          ? 'Não foi possível entrar. Confira e-mail e senha.'
          : 'Configure o Supabase para ativar o login.',
      )
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-intro">
        <span className="eyebrow">Acesso restrito</span>
        <h1>Conduza sua eleição com clareza.</h1>
        <p>
          Entre no painel do CIPA Digital para preparar candidatos, eleitores e o calendário da
          votação.
        </p>
      </div>
      <Card className="admin-login-card">
        <div className="login-card-heading">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            <span className="eyebrow">Área administrativa</span>
            <h2>Entrar no painel</h2>
          </div>
        </div>
        {!configured && (
          <Alert tone="warning" title="Ambiente não configurado">
            O login ficará disponível quando as variáveis do Supabase forem preenchidas.
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={submitting || !configured}>
            {submitting ? 'Entrando...' : 'Entrar no painel'}
          </Button>
        </form>
        <Link className="back-link" to="/">
          ← Voltar para o início
        </Link>
      </Card>
    </div>
  )
}
