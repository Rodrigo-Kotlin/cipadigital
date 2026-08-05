# CIPA Digital

Sistema de Votação Eletrônica da CIPA, desenvolvido como um PWA responsivo, mobile-first e preparado para evoluir por fases.

## Status

**Fase 9 - Deploy MVP** publicado no Cloudflare Pages.

O projeto Supabase `cipadigital` foi promovido a produção por decisão formal, e o MVP está publicado em `https://cipadigital.pages.dev`. O smoke test público passou em 15 cenários e a validação funcional pública foi concluída com limpeza dos dados fictícios. A Fase 8.1 moveu o hash de CPF para Edge Function, corrigiu exportação de relatórios, validou impressão no Chrome, removeu os dados fictícios e atualizou os ativos PWA.

A auditoria completa está documentada em `docs/auditoria-completa-frontend-backend-ui-ux.md`. As correções incluem controle explícito da janela/status da votação, proteção da rota administrativa, escape das exportações HTML, a migration `0004_harden_admin_mutations.sql` aplicada e o gateway Turnstile da migration `0005_turnstile_gateway.sql`.

O acesso público e o envio do voto usam Cloudflare Turnstile. O widget `0x4AAAAAAEHBY97o929Vt55x` protege as ações `voter_access` e `cast_vote`; a validação `siteverify`, o hash do CPF e as chamadas RPC ocorrem na Edge Function `voter-gateway`. A secret `TURNSTILE_SECRET_KEY` está somente nos secrets do Supabase.

O cadastro de candidatos também permite upload de fotos no Storage `candidate-photos`, com formatos JPG/JPEG/PNG/WebP e limite de 2 MB. O upload é restrito a administradores autenticados e as fotos aparecem no cadastro e na cédula.

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
  auditoria-completa-frontend-backend-ui-ux.md
supabase/
  migrations/0001_initial_schema.sql
  migrations/0005_turnstile_gateway.sql
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

1. Configurar o `VITE_TURNSTILE_SITE_KEY` no ambiente de build do Cloudflare Pages, se o fallback público for removido.
2. Validar uma consulta e um voto com token Turnstile real em homologação.
3. Executar revisão documental e de privacidade antes do uso real.
4. Avaliar assinatura digital e integrações futuras.

## Limitações conhecidas

- O modo offline exibe um aviso e impede a expectativa de votação sem conexão; não há persistência offline de votos.
- Os ícones PWA são temporários e deverão ser substituídos pelos ativos finais.
- Os indicadores administrativos exigem dados reais e as operações administrativas exigem Auth/RLS configurados.
- Nenhum `.env` real deve ser versionado; use `.env.example` como referência.
- Migrations e seed não são aplicados automaticamente a um Supabase remoto.
- O painel exige usuários existentes no Supabase Auth e registros correspondentes em `admin_users` para operar com RLS.
- A rota pública funcional é `/votar/:electionSlug`; `/votar` encaminha para a eleição de homologação configurada.
- A apuração e os relatórios exigem eleição encerrada e autenticação administrativa.
