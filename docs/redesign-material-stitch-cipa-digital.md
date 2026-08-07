# Redesign Material Stitch do CIPA Digital

## Objetivo

Atualizar a camada visual do PWA para uma experiência institucional, clara e responsiva, usando a referência do Stitch e princípios do Material Design 3. A alteração é restrita ao front-end visual e às mensagens de privacidade da jornada pública.

## Referências Stitch

Foram analisados `DESIGN.md` e as telas `logo_cipa_digital`, `home_p_blica_cipa_digital`, `acesso_por_cpf_cipa_digital`, `confirma_o_do_eleitor_cipa_digital`, `c_dula_de_vota_o_cipa_digital`, `confirma_o_de_voto_cipa_digital`, `voto_confirmado_cipa_digital`, `dashboard_cipa_digital`, `candidatos_cipa_digital` e `eleitores_cipa_digital`.

O código externo do Stitch não foi copiado. Tailwind por CDN, Google Fonts, ícones externos, dados fictícios e scripts externos continuam fora do aplicativo.

## Decisões Material Design 3

- Superfície principal clara `#FAF8FF`, cartões brancos e camadas azuladas suaves.
- Verde institucional para ações primárias, seleção e estados de sucesso.
- Elevação discreta com três níveis de sombra.
- Raios de 8, 12, 16, 24 e 32 px para componentes e containers.
- Alvos de toque com no mínimo 48 px em botões e controles principais.
- Estados de hover, pressed, focus-visible, disabled, selected, loading, error, success e empty preservados ou reforçados.
- Redução de movimento respeitada com `prefers-reduced-motion`.

## Tokens

Os tokens estão no início da camada visual final de `src/styles/index.css`, incluindo cores de superfície, conteúdo, outline, estados semânticos, raios e sombras `--shadow-1` a `--shadow-3`. O fallback tipográfico permanece `"Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

## Componentes e telas

Componentes visuais existentes receberam a nova linguagem por tokens e estilos compartilhados: `Button`, `Card`, `Input`, `InputCPF`, `Alert`, `StatusBadge`, `ModalConfirm`, `DataTable`, `MetricCard`, estados de carregamento/vazio, shells público/admin/votação, filtros, tabelas e cartões de candidatos.

As telas pública, de acesso CPF, confirmação do eleitor, cédula, confirmação de voto, sucesso, dashboard, candidatos, eleitores, presença, apuração e configurações usam os mesmos tokens sem alteração de suas APIs de serviço.

## Acessibilidade e responsividade

- Sora local via `@fontsource/sora`; não há Google Fonts ou CDN.
- `focus-visible` continua explícito e os controles mantêm nomes acessíveis.
- Layout mobile-first para 360 px, com colunas progressivas em 768, 1024 e 1280 px.
- Tabelas continuam responsivas com rótulos por célula em telas estreitas.
- Contraste foi mantido em ações, texto, alertas e badges.

## Performance e PWA

Manifest, service worker, cache, roteamento, Supabase client e configuração de Pages não foram alterados. A mudança acrescenta apenas CSS e dois textos de privacidade, sem dependências ou scripts externos novos.

## Segurança preservada

Não foram alterados Supabase, RLS, RPCs, Edge Functions, gateway Turnstile, hash de CPF, regras de apuração ou relatórios. O botão de acesso continua desabilitado sem token Turnstile e o botão de confirmação continua exigindo token, escolha válida e conexão.

A mensagem pública obrigatória está presente: “Seu CPF será usado apenas para validar sua participação. O voto é secreto e registrado de forma anônima.” A presença continua identificada apenas no cadastro administrativo; a lista não relaciona eleitor a candidato ou voto.

## Estado da ARATI

Registro de preservação solicitado para `arati-2026-2027`:

| Campo                     | Estado registrado         |
| ------------------------- | ------------------------- |
| slug                      | `arati-2026-2027`         |
| status final              | `closed`                  |
| voters                    | `53`                      |
| votantes                  | `37`                      |
| active_candidates         | `4`                       |
| candidate_photos          | `4`                       |
| votes                     | `37`                      |
| blank_votes               | `0`                       |
| participation             | `69.81%`                  |
| relatórios coletados      | Sim, conforme solicitação |
| arquivos finais coletados | Sim, conforme solicitação |

Nenhum dado da ARATI foi limpo, reaberto, alterado ou reprocessado. A conferência administrativa confirmou `election_id = 0ad0100b-0bdf-4609-b1fe-50d32343ccd4`, status `closed`, presença de 37 votantes e apuração agregada de 37 votos.

A consulta anterior que indicou `votes = 0` foi feita pela leitura direta da tabela `votes` via PostgREST. Como não há policy de leitura para `votes`, essa consulta retornou zero linhas sob RLS. A RPC `get_election_tally`, que é a origem do painel e executa com `SECURITY DEFINER`, retornou corretamente `total_votes = 37`, `blank_votes = 0`, `total_attendance = 37` e `has_divergence = false`.

## Testes e pendências

Validações executadas na branch `feat/material-redesign-pwa`:

```text
npm run build
npm test -- --run
npm run lint
npm run format:check
npx playwright test
npm audit --audit-level=high
```

- `npm run build`: aprovado; Vite reporta chunk principal de 513 kB, pendente de code-splitting administrativo.
- `npm test -- --run`: aprovado, 31 testes em 10 arquivos.
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado.
- `npx playwright test`: aprovado, 15 testes em mobile 360/480, tablet 768, laptop 1024 e desktop 1280.
- `npm audit --audit-level=high`: não aprovado por duas vulnerabilidades moderadas transitivas em `react-router`; a correção automática exige upgrade major.

Também permanece necessária a validação de fluxo completo com a eleição fictícia `efetiva-teste-2026-2027`. A eleição real da ARATI não deve ser usada para testes de voto.
