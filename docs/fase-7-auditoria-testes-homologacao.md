# CIPA Digital - Fase 7: Auditoria, Testes e Homologação

## Escopo auditado

Foram revisados o schema SQL, RLS, RPCs, serviços de CPF, fluxo do eleitor, painel administrativo, apuração, exportadores, logs, PWA, rotas e testes.

## Resultado executivo

Não foram identificadas falhas críticas de sigilo no código local auditado.

- `votes` não possui `voter_id`, CPF, nome, matrícula, setor, função, token ou IP.
- `cast_vote` é o caminho de escrita para votos e executa a operação de forma transacional.
- `verify_voter_access` retorna somente dados mínimos e nunca retorna hash, ID ou token do eleitor.
- `get_election_tally` retorna somente agregados e exige administrador autenticado.
- A presença é consultada separadamente da apuração.
- Relatórios de presença não contêm escolha; relatórios de apuração não contêm eleitor.
- Não há uso de `localStorage` ou `sessionStorage` para CPF ou voto.

## Achados por severidade

| Severidade | Achado                                                             | Situação                                                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Crítica    | Associação eleitor-voto em tabela, RPC, log ou relatório           | Não encontrado                                                                        |
| Crítica    | CPF completo em `votes` ou exportações                             | Não encontrado                                                                        |
| Alta       | Salt de hash exposto por `VITE_CPF_HASH_SALT`                      | Limitação conhecida; migrar para server-side antes da produção                        |
| Alta       | Vulnerabilidade reportada em `react-router`/`react-router-dom`     | Afeta faixa RSC; o projeto usa somente client-side routing. Revisar antes da produção |
| Média      | Migrations/RPCs ainda não aplicadas e validadas em Supabase remoto | Pendente de homologação                                                               |
| Média      | E2E real com Auth/RPC depende de ambiente Supabase configurado     | Cobertura local usa mocks/ambiente sem credenciais                                    |
| Média      | PDF depende da impressão do navegador                              | Aceito para MVP; validar em homologação                                               |
| Baixa      | Ícones PWA são temporários                                         | Não bloqueia homologação                                                              |

## Auditoria de sigilo

| Verificação                                  | Resultado |
| -------------------------------------------- | --------- |
| `votes` sem `voter_id`                       | Aprovado  |
| `votes` sem CPF                              | Aprovado  |
| `votes` sem nome, matrícula, setor ou função | Aprovado  |
| `votes` sem token de presença ou IP          | Aprovado  |
| `cast_vote` sem retorno de escolha vinculada | Aprovado  |
| Logs sem escolha individual                  | Aprovado  |
| Presença sem candidato escolhido             | Aprovado  |
| Apuração somente agregada                    | Aprovado  |

## Auditoria de CPF e LGPD

| Verificação                                  | Resultado                                     |
| -------------------------------------------- | --------------------------------------------- |
| CPF não salvo em texto aberto                | Aprovado no modelo e nos fluxos implementados |
| CPF exibido mascarado                        | Aprovado                                      |
| CSV/PDF sem CPF completo                     | Aprovado por contrato dos exportadores        |
| Logs sem CPF completo                        | Aprovado no código de auditoria               |
| CPF/voto sem armazenamento local persistente | Aprovado                                      |

A versão MVP ainda utiliza hash client-side com `VITE_CPF_HASH_SALT`. Essa abordagem é provisória para ambiente controlado. Antes de produção, recomenda-se migrar a geração/validação do hash para Edge Function, RPC segura ou backend server-side.

## Auditoria de RLS e RPCs

- RLS está habilitado nas tabelas principais.
- Não existem policies públicas para ler `voters` ou `votes`.
- Insert/update/delete direto em `votes` é revogado para `anon` e `authenticated`.
- `cast_vote` é concedida apenas para `anon`/`authenticated` como RPC controlada.
- RPCs públicas retornam somente eleição, candidatos ativos e dados mínimos de acesso.
- `get_election_tally` exige conta administrativa ativa.
- `transition_election_status` valida transições permitidas, incluindo `closed` para `tallied`.
- Policies administrativas exigem autenticação e registro ativo em `admin_users`.

## Cobertura validada

- CPF: normalização, validação, máscara e hash.
- Status: somente `open` permite voto.
- Voto: nominal, branco, anonimato e limpeza do estado após sucesso.
- Apuração: ranking, titular, suplente, empate e divergência.
- Relatórios: presença sem voto, apuração sem eleitor, CPF mascarado e CSV com `;`.
- Rotas: admin sem sessão redireciona para login; votação pública sem configuração falha de forma controlada.
- PWA: identidade do manifest, service worker e responsividade básica.

## Limitações para homologação

- Não executar migrations, seed ou alterações no banco remoto sem confirmação.
- Criar ambiente Supabase separado para homologação.
- Validar SQL e policies no projeto remoto antes de qualquer piloto.
- Usar CPFs fictícios no ambiente de teste.
