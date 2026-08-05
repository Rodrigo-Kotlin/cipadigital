# CIPA Digital - Fase 9: Deploy MVP

## Status

**Status: MVP publicado; validacao final controlada concluida.**

Por decisao formal, o projeto `cipadigital`, referencia `kdjxexoexwznkwccvrqi`, foi promovido para producao. Os dados ficticios foram removidos antes da publicacao: `voters = 0` e `votes = 0`.

O deploy foi realizado no Cloudflare Pages, projeto `cipa-digital`, conta `f7c78675b59e662f0c5adda33cc14e19`.

URL publica: `https://a0a8b2a3.cipa-digital.pages.dev`

Deployment ID: `a0a8b2a3-d04e-4527-b594-c2361540c521`

## Preparado

- Build de producao validado na Fase 8.1.
- Edge Function `hash-cpf` publicada somente em homologacao.
- Migration `0001_initial_schema.sql` pronta para aplicacao controlada.
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
- [ ] Login administrativo real na URL publica.
- [ ] Votacao real com eleitores reais.
- [ ] Validacao visual final no dominio definitivo.

## Comandos finais

- `npm run build`: aprovado; warning de bundle acima de 500 kB.
- `npm test -- --run`: 28 testes aprovados.
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado.
- `npx playwright test --workers=1`: 15 testes aprovados.
- `npm audit --audit-level=high`: aprovado sem vulnerabilidades altas; 2 moderadas do React Router permanecem documentadas.

Nenhum eleitor real foi cadastrado. A migration ja existente e o administrador Auth foram mantidos no projeto promovido.

## Checklist apos desbloqueio

- [ ] Confirmar project ref de producao diferente de `kdjxexoexwznkwccvrqi`.
- [ ] Aplicar migration com controle e verificar RLS/RPCs.
- [ ] Configurar `CPF_HASH_SALT` somente como secret server-side.
- [ ] Publicar `hash-cpf` em producao.
- [ ] Criar e vincular administrador Auth.
- [ ] Configurar variaveis do front-end no provedor.
- [ ] Publicar build e validar URL publica.
- [ ] Testar PWA, login, votacao controlada, apuracao e relatorios.
- [ ] Remover dados de teste.
- [ ] Registrar anonimato e logs.

## Restricao

A Fase 9 nao adicionou funcionalidades fora do MVP. O deploy foi executado somente apos confirmacao expressa da promocao do projeto atual.
