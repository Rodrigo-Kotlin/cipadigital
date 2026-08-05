# CIPA Digital

Sistema de Votação Eletrônica da CIPA, desenvolvido como um PWA responsivo, mobile-first e preparado para evoluir por fases.

## Status

**Fase 9 - Deploy MVP** publicado no Cloudflare Pages.

O projeto Supabase `cipadigital` foi promovido a produção por decisão formal, e o MVP está publicado em `https://cipadigital.pages.dev`. O smoke test público passou em 15 cenários. A Fase 8.1 moveu o hash de CPF para Edge Function, corrigiu exportação de relatórios, validou impressão no Chrome, removeu os dados fictícios e atualizou os ativos PWA. Login administrativo no domínio público e teste controlado de votação permanecem pendentes.

## Stack

- React + Vite + TypeScript
- React Router
- `@supabase/supabase-js`
- `vite-plugin-pwa`
- CSS responsivo mobile-first
- Vitest + Testing Library
- Playwright configurado para testes E2E
- ESLint + Prettier

## Execução local

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no navegador. Para testar o build de produção:

```bash
npm run build
npm run preview
```

## Testes e qualidade

```bash
npm test
npm run lint
npm run format:check
npx playwright test
npm audit
```

O Playwright está configurado com um smoke test da tela inicial. A instalação dos navegadores pode ser feita com `npx playwright install` quando os testes E2E forem executados localmente.

## Estrutura inicial

```text
docs/
  escopo-fase-0-mvp.md
  fase-3-banco-supabase-seguranca.md
  fase-4-painel-administrativo.md
  fase-5-fluxo-votacao-eleitor.md
  fase-6-apuracao-relatorios.md
  fase-7-auditoria-testes-homologacao.md
  checklist-homologacao-supabase.md
  fase-8-homologacao-supabase-arati.md
  fase-8.1-correcoes-pre-producao.md
  fase-9-deploy-mvp-producao.md
supabase/
  migrations/0001_initial_schema.sql
  seed/arati_seed.sql
public/
  icons/icon.svg
src/
  app/
    routes.tsx
  components/
    feedback/
    layout/
    ui/
  features/
    admin/
    home/
    placeholder/
    voting/
  lib/
    cpf/
    security/
    supabase/
  styles/
  tests/
    e2e/
index.html
vite.config.ts
vitest.config.ts
```

Os componentes em `components/ui`, `components/feedback` e `components/layout` formam a base visual reutilizável. A camada `lib` contém a integração preparada com Supabase e regras de segurança sem conexão obrigatória em desenvolvimento.

## Próximos passos

1. Validar a migration, RPCs e policies em um projeto Supabase de homologação.
2. Mover o hash de CPF para uma função server-side antes da produção.
3. Executar revisão documental e de privacidade antes do uso real.
4. Avaliar assinatura digital e integrações futuras.

## Limitações conhecidas

- O modo offline exibe um aviso e impede a expectativa de votação sem conexão; não há persistência offline de votos.
- Os ícones PWA são temporários e deverão ser substituídos pelos ativos finais.
- As rotas `/votar` e `/admin` são placeholders.
- Os indicadores administrativos, tabela e CPF exibidos são dados visuais demonstrativos.
- Nenhum `.env` real deve ser versionado; use `.env.example` como referência.
- A migration e o seed não são aplicados automaticamente a um Supabase remoto.
- O painel exige usuários existentes no Supabase Auth e registros correspondentes em `admin_users` para operar com RLS.
- A rota pública funcional é `/votar/:electionSlug`; `/votar` continua sendo uma entrada visual genérica.
- A apuração e os relatórios exigem eleição encerrada e autenticação administrativa.
