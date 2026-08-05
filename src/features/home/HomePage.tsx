import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero container">
        <div className="hero-copy">
          <StatusBadge tone="success">Fundação do MVP · Gestão 2026/2027</StatusBadge>
          <h1>Uma votação mais simples, segura e transparente.</h1>
          <p className="hero-lead">
            O CIPA Digital apoia o processo eleitoral da CIPA com controle de presença, voto
            anônimo, apuração segura e evidências documentais.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/votar/arati-2026-2027">
              Acessar votação <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-secondary" to="/admin">
              Área administrativa
            </Link>
          </div>
          <p className="helper-text">
            A votação estará disponível somente durante o período definido pela comissão eleitoral.
          </p>
        </div>
        <div className="hero-visual" aria-label="Resumo das garantias do CIPA Digital">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-card">
            <span className="visual-icon" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>Processo protegido</strong>
              <span>Presença identificada</span>
              <span>Voto anônimo</span>
            </div>
          </div>
          <div className="visual-caption">
            <span className="status-dot status-dot-solid" aria-hidden="true" />
            Preparado para a sua eleição
          </div>
        </div>
      </section>

      <section className="principles-section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">O essencial, bem feito</span>
            <h2>Clareza em cada etapa do processo.</h2>
          </div>
          <div className="principles-grid">
            <article className="principle-card">
              <span className="principle-number">01</span>
              <h3>Presença controlada</h3>
              <p>
                O eleitor é validado por CPF, sem abrir mão de uma experiência rápida e objetiva.
              </p>
            </article>
            <article className="principle-card">
              <span className="principle-number">02</span>
              <h3>Voto protegido</h3>
              <p>
                O registro do voto é separado do controle de presença para preservar o sigilo
                eleitoral.
              </p>
            </article>
            <article className="principle-card">
              <span className="principle-number">03</span>
              <h3>Apuração segura</h3>
              <p>Os resultados só são liberados após o encerramento oficial da votação.</p>
            </article>
            <article className="principle-card">
              <span className="principle-number">04</span>
              <h3>Evidências documentais</h3>
              <p>Relatórios básicos apoiam a organização do dossiê eleitoral da empresa.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mvp-banner container">
        <div>
          <span className="eyebrow">Escopo atual</span>
          <h2>Uma base pronta para evoluir com responsabilidade.</h2>
        </div>
        <p>
          Este é o MVP do CIPA Digital. Os módulos de votação e administração estão em preparação.
        </p>
      </section>
    </div>
  )
}
