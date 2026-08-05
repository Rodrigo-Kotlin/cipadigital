# Melhoria Tipográfica: Sora

Data: 2026-08-05

## Objetivo

Aplicar a fonte Sora ao PWA CIPA Digital para reforçar a identidade tecnológica, melhorar a hierarquia visual e manter leitura confortável no fluxo público e no painel administrativo.

## Estratégia

- Fonte empacotada localmente com `@fontsource/sora`.
- Pesos carregados: `400`, `500`, `600`, `700` e `800`.
- Fallback: `Sora`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- Nenhuma chamada de fonte externa ou CDN foi adicionada.
- O service worker e o manifest PWA continuam gerenciados pelo Vite PWA.

## Arquivos Alterados

- `src/main.tsx`: imports locais dos cinco pesos.
- `src/styles/index.css`: tokens de família, pesos, line-height e aplicação global em controles, títulos e tabelas.
- `package.json` e `package-lock.json`: dependência `@fontsource/sora`.
- `README.md`: registro da estratégia tipográfica.

## Ajustes Visuais

- Títulos usam pesos 700/800 e tracking negativo moderado.
- Botões usam peso 600 e inputs peso 500.
- Corpo usa line-height 1.5; textos continuam com os espaçamentos específicos existentes.
- Tabelas usam 14 px, cabeçalhos 700 e células 400.
- Impressão usa Sora com fallback Arial e reduz títulos para peso 600.

## Validação

Foram revisados os breakpoints existentes de 360 px, 480 px, 768 px, 1024 px e 1280 px. A alteração não introduz largura fixa, mudança de grid ou lógica de negócio.

Comandos finais:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`
- `npm audit --audit-level=high`

## Escopo Preservado

Não foram alterados votação, Turnstile, Supabase, Edge Functions, RPCs, RLS, autenticação, apuração, relatórios, anonimato do voto ou banco de dados.
