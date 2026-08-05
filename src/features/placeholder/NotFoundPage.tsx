import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="placeholder-page container">
      <div className="placeholder-content">
        <span className="not-found-code">404</span>
        <span className="eyebrow">Página não encontrada</span>
        <h1>Este endereço não existe.</h1>
        <p>Confira o link ou volte para a página inicial do CIPA Digital.</p>
        <Link className="button button-primary" to="/">
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}
