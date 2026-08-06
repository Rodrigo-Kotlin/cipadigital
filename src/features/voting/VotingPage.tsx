import { Link } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { InputCPF } from '../../components/ui/InputCPF'
import { PageHeader } from '../../components/ui/PageHeader'

export function VotingPage() {
  return (
    <div className="voting-page container">
      <div className="voting-progress" aria-label="Etapa 1 de 3">
        <span className="progress-step active">
          <b>01</b> Identificação
        </span>
        <span className="progress-line" />
        <span className="progress-step">
          <b>02</b> Candidatos
        </span>
        <span className="progress-line" />
        <span className="progress-step">
          <b>03</b> Confirmação
        </span>
      </div>
      <div className="voting-grid">
        <div>
          <PageHeader
            eyebrow="Eleição da CIPA · Gestão 2026/2027"
            title="Identifique-se para começar."
            description="Informe seu CPF para consultar sua elegibilidade e acessar a cédula desta eleição."
          />
          <Card className="voting-access-card">
            <form onSubmit={(event) => event.preventDefault()}>
              <InputCPF />
              <Button type="submit" className="full-width">
                Acessar votação <span aria-hidden="true">→</span>
              </Button>
            </form>
            <p className="form-disclaimer">
              Seu CPF será usado apenas para validar sua participação. O voto é secreto e registrado
              de forma anônima.
            </p>
          </Card>
          <Link className="back-link" to="/">
            ← Voltar para o início
          </Link>
        </div>
        <aside className="voting-aside">
          <Alert tone="info" title="Módulo em preparação">
            Esta é uma prévia visual do futuro fluxo de votação. Nenhum CPF é validado nesta fase.
          </Alert>
          <Card className="privacy-card">
            <span className="privacy-icon" aria-hidden="true">
              ⌁
            </span>
            <h2>Seu voto é anônimo</h2>
            <p>
              O CPF será usado apenas para validar o eleitor e impedir duplicidade. O voto não terá
              vínculo com seus dados.
            </p>
            <div className="privacy-rule">
              <span aria-hidden="true">✓</span> Presença identificada
            </div>
            <div className="privacy-rule">
              <span aria-hidden="true">✓</span> Voto separado e protegido
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
