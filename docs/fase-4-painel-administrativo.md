# CIPA Digital - Fase 4: Painel Administrativo Básico

## Objetivo

Entregar o painel operacional para preparar uma eleição, administrar candidatos e eleitores, importar CSV, consultar presença e controlar o status da eleição.

## Telas implementadas

- `/admin/login`: login com Supabase Auth.
- `/admin`: dashboard com eleição principal e indicadores.
- `/admin/eleicoes`: lista de eleições.
- `/admin/eleicoes/:id`: dashboard da eleição e ações de status.
- `/admin/eleicoes/:id/configuracoes`: edição dos parâmetros permitidos.
- `/admin/eleicoes/:id/candidatos`: cadastro, edição, ordenação visual e ativação/inativação.
- `/admin/eleicoes/:id/eleitores`: cadastro manual e importação CSV.
- `/admin/eleicoes/:id/presenca`: consulta de presença e participação.

## Acesso e status

Rotas administrativas, exceto `/admin/login`, exigem uma sessão Supabase Auth. Sem configuração local, o painel exibe aviso amigável e redireciona usuários não autenticados para o login.

As transições são executadas pela RPC `transition_election_status`, com as regras:

- `draft` para `scheduled`;
- `scheduled` para `open`;
- `open` para `paused` ou `closed`;
- `paused` para `open` ou `closed`.

Para abrir, a RPC exige ao menos um candidato ativo, um eleitor ativo e período válido. Estados `open`, `closed`, `tallied` e `archived` bloqueiam edições estruturais.

## Candidatos

O MVP da fase usa `photo_url` como estratégia de foto. O formulário registra uma URL e o `CandidatePreviewCard` exibe uma prévia textual. Upload para Supabase Storage fica para uma etapa posterior.

## Eleitores e CSV

O cadastro manual e a importação aceitam nome, CPF, setor, função e matrícula. O CSV esperado é:

```csv
nome,cpf,setor,funcao,matricula
```

Cada CPF é normalizado, validado, mascarado e convertido em hash antes de ser enviado. O CPF completo nunca é enviado para a tabela `voters`.

## Presença e sigilo

A tela de presença exibe somente dados administrativos e `has_voted`/`voted_at`. Não consulta a tabela `votes`, não mostra candidato escolhido e não cria associação entre presença e voto.

## Auditoria

As operações de criação/edição de candidatos, cadastro/importação de eleitores, alterações de situação e edição da eleição registram `audit_logs`. A RPC de status registra abertura, pausa, retomada e encerramento. Os detalhes não incluem CPF completo nem conteúdo de voto.

## Limitações

- O login depende de um projeto Supabase configurado e de usuários criados no Auth.
- O usuário autenticado ainda não possui matriz granular de permissões.
- A criação visual de eleições usa `company_id` opcional; o vínculo de empresa poderá ser refinado com um seletor na próxima etapa.
- Não há upload real de fotos, votação, apuração, relatórios, exportações ou deploy.
- O hash local com `VITE_CPF_HASH_SALT` continua provisório e deve migrar para server-side antes da produção.
