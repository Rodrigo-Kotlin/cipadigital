# CIPA Digital - Fase 9: Deploy MVP

## Status

**Status: MVP publicado; smoke test publico aprovado; fluxo autenticado pendente.**

Por decisao formal, o projeto `cipadigital`, referencia `kdjxexoexwznkwccvrqi`, foi promovido para producao. Os dados ficticios foram removidos antes da publicacao: `voters = 0` e `votes = 0`.

O deploy foi realizado no Cloudflare Pages, projeto `cipadigital`, conectado ao GitHub. O commit de validacao atual e `5215a64`.

URL publica principal: `https://cipadigital.pages.dev`

O projeto Pages esta conectado ao repositorio GitHub `Rodrigo-Kotlin/cipadigital`, branch `main`.

## Preparado

- Build de producao validado na Fase 8.1.
- Edge Function `hash-cpf` publicada no Supabase promovido a producao.
- Migration `0001_initial_schema.sql` ja aplicada no projeto promovido.
- Variaveis publicas esperadas: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `VITE_CPF_HASH_SALT` nao deve ser configurado.
- PWA, relatorios, anonimato e limpeza de dados ficticios validados em homologacao.
- Edge Function `hash-cpf` publicada e respondendo HTTP 200 para CPF valido.
- Secret `CPF_HASH_SALT` configurado somente no Supabase.
- Manifest, rota publica e rota administrativa respondendo HTTP 200.

## Validacao pos-deploy

- [x] Pagina inicial publica.
- [x] Manifest PWA.
- [x] Rota publica `/votar/arati-2026-2027`.
- [x] Rota `/admin` entregue pelo Pages.
- [x] Edge Function `hash-cpf`.
- [x] Supabase sem eleitores/votos ficticios.
- [x] Smoke tests Playwright diretamente em `https://cipadigital.pages.dev` (15 aprovados).
- [ ] Login administrativo real na URL publica.
- [ ] Votacao controlada com eleitores ficticios no dominio publico.
- [ ] Validacao visual final no dominio publico.

## Comandos finais

- `npm run build`: aprovado; warning de bundle acima de 500 kB.
- `npm test -- --run`: 28 testes aprovados.
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado.
- `npx playwright test --workers=1`: 15 testes aprovados.
- `npm audit --audit-level=high`: aprovado sem vulnerabilidades altas; 2 moderadas do React Router permanecem documentadas.

Nenhum eleitor real foi cadastrado. A migration ja existente e o administrador Auth foram mantidos no projeto promovido.

## Checklist restante

- [ ] Fazer login administrativo na URL publica.
- [ ] Executar votacao controlada, apuracao e relatorios.
- [ ] Remover novamente dados de teste.
- [ ] Registrar anonimato e logs do teste publico.

## Restricao

A Fase 9 nao adicionou funcionalidades fora do MVP. O deploy foi executado somente apos confirmacao expressa da promocao do projeto atual.
