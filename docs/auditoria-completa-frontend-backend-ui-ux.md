# Auditoria Completa: Front-end, Backend e UI/UX

Data: 2026-08-05

## Escopo

- Fluxo público de consulta, autenticação do eleitor e votação.
- Área administrativa, controle de presença, candidatos, apuração e relatórios.
- Supabase, RLS, RPCs, Storage, Edge Function e separação entre presença e voto.
- Responsividade, acessibilidade, mensagens de estado, PWA e qualidade de código.

## Conclusões

- O front-end mantém o princípio de presença identificada e voto anônimo.
- A tabela `votes` não armazena `voter_id`, CPF, nome, matrícula, setor, cargo, token ou IP.
- O CPF é validado no cliente e transformado em hash por Edge Function; o salt não é enviado ao bundle.
- Consulta e voto passam por Turnstile com ações distintas (`voter_access` e `cast_vote`), hostname esperado e validação server-side.
- A Edge Function `voter-gateway` calcula o hash e chama os RPCs com service role; o cliente não recebe o hash e não envia token Turnstile para `votes`.
- O bucket de fotos é público apenas para leitura; gravação e remoção exigem admin ativo.
- Estados eleitorais e janela de votação agora possuem mensagens explícitas em português e fuso `America/Sao_Paulo`.
- A rota administrativa valida sessão Auth e registro ativo em `admin_users`.
- Exportações de relatório escapam conteúdo HTML e não expõem dados pessoais do eleitor.

## Achados Corrigidos Localmente

- Tratamento de erro em operações assíncronas administrativas e no envio de voto.
- Bloqueio visual da votação fora da janela ou em status não votável.
- Alerta administrativo para eleição vencida ainda marcada como aberta/agendada.
- Proteção da rota `/admin` contra usuário autenticado sem registro administrativo ativo.
- Escape de conteúdo dinâmico nas páginas de impressão de participação e resultado.
- Migration `0004_harden_admin_mutations.sql` criada para proteger alterações diretas de status e presença.
- Migration `0005_turnstile_gateway.sql` aplicada para revogar execução pública direta dos RPCs de presença e voto.
- `voter-gateway` e `hash-cpf` publicados no Supabase; `TURNSTILE_SECRET_KEY` configurada como secret server-side.

## Riscos Pendentes

### Resolvido: oracle de hash público no fluxo de votação

O fluxo público não chama mais `hash-cpf` nem recebe hash. O gateway exige Turnstile, calcula o hash no servidor e os RPCs de presença/voto não aceitam mais `anon` ou `authenticated`. `hash-cpf` ficou restrita a admins autenticados para cadastro administrativo.

### Resolvido: enumeração por RPC pública

`verify_voter_access` e `cast_vote` só são executáveis pelo `service_role`, usado internamente pelo gateway após o `siteverify`. O gateway exige ação Turnstile correspondente e hostname autorizado.

### Médio: mutações administrativas

As policies administrativas existentes são amplas. A migration `0004` restringe candidatos e eleitores a eleições em preparação e impede alterações diretas de status/presença por trigger; sua aplicação remota foi confirmada junto com a `0005`.

## Verificações Locais

- `npm test -- --run`: 31 testes aprovados.
- `npm run build`: aprovado; permanece apenas o aviso de chunk JavaScript acima de 500 kB.
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado.
- Gateway sem token: rejeitado com HTTP 403.
- Playwright: última execução registrada com 15 testes aprovados; executar novamente após o próximo deploy.
- `npm audit --audit-level=high`: sem vulnerabilidades altas na última auditoria registrada.

## Próximas Ações Obrigatórias

1. Publicar o front-end integrado ao Turnstile no Cloudflare Pages.
2. Executar Playwright contra produção após o deploy.
3. Revalidar `voters = 0`, `votes = 0` e a janela/status da eleição antes de qualquer abertura oficial.
