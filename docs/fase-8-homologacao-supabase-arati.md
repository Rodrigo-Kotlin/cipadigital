# CIPA Digital - Fase 8: Homologação Supabase e ARATI

## Status da execução

**Status: homologação funcional concluída em ambiente Supabase de homologação; pendências de produção registradas.**

O projeto Supabase `cipadigital` foi confirmado como homologação e vinculado à CLI. A CLI Supabase `2.109.1` está instalada e `supabase/config.toml` está configurado.

Foi tentado iniciar o Supabase local com:

```bash
supabase start --workdir .
```

O comando foi bloqueado porque o daemon do Docker Desktop não está disponível:

```text
Docker Desktop is a prerequisite for local development.
```

O `.env` local aponta para o projeto de homologação. A migration `0001_initial_schema.sql` foi aplicada remotamente e aparece como `0001` no histórico Supabase. O seed ARATI e três eleitores fictícios foram aplicados de forma idempotente. O usuário Auth de Josenilson Oliveira de Aguiar foi vinculado como `super_admin` ativo.

## Pacote preparado

- Migration: `supabase/migrations/0001_initial_schema.sql`.
- Seed opcional: `supabase/seed/arati_seed.sql`.
- Configuração local: `supabase/config.toml`.
- Variáveis de referência: `.env.example`.
- Checklist operacional: `docs/checklist-homologacao-supabase.md`.

Os testes estáticos confirmam a presença das tabelas, RPCs, RLS e dados da ARATI no pacote versionado.

## Validações possíveis sem ambiente

- Build e testes automatizados locais.
- Integridade textual da migration e do seed.
- Ausência de persistência local de CPF/voto.
- Ausência de identificadores na tabela `votes`.
- Regras de anonimato e relatórios.
- Configuração PWA e rotas protegidas.

## Validações pendentes

- Validação visual de impressão/PDF depende do navegador do responsável.
- Limpeza/arquivamento dos eleitores fictícios antes da eleição real.

## Resultado dos comandos automáticos

- `supabase migration list`: aprovado; migration `0001` aplicada remotamente.
- `get_public_election`: HTTP 200, retorno público mínimo confirmado.
- RPCs: seis funções presentes como `SECURITY DEFINER`.
- `get_public_election`: execução liberada para `anon` e `authenticated`.
- RLS: habilitado nas sete tabelas do schema.
- Seed ARATI: aplicado sem sobrescrever registros existentes.
- Eleitores de teste: 3 cadastrados, sendo 2 `active` e 1 `blocked`.
- Fluxo RPC de votação: 1 voto nominal, 1 voto em branco e segunda tentativa bloqueada por `VOTER_ALREADY_VOTED`.
- Presença: 2 eleitores ativos com `has_voted = true` e `voted_at` preenchido; bloqueado sem presença.
- Anonimato: `votes` contém somente `id`, `election_id`, `candidate_id`, `is_blank` e `created_at`; não possui identificador de eleitor.
- Encerramento: transição autenticada `open` para `closed`, com `actor_id` do administrador em `audit_logs`.
- Apuração: 2 votos totais, sendo 1 para Rosiane Farias e 1 em branco; demais candidatos com 0 votos.
- `npm run build`: aprovado, com warning de bundle acima de 500 kB.
- `npm test -- --run`: aprovado; 25 testes.
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado após excluir arquivos gerados de `supabase/.temp`.
- `npx playwright test`: 15 aprovados, incluindo a rota pública da eleição ARATI.
- `npm audit --omit=dev`: 2 vulnerabilidades altas em `react-router`/`react-router-dom`.

## Dados ARATI preparados

O seed contém a empresa ARATI, eleição `arati-2026-2027`, gestão 2026/2027, data de 06/08/2026, 53 empregados, 1 titular, 1 suplente e os quatro candidatos definidos na Fase 0.

O seed é opcional e deve ser executado somente em homologação após confirmação. Ele não deve ser executado em produção sem revisão.

## Segurança

Não houve acesso a credenciais, banco remoto ou dados reais de empregados. Nenhum CPF real foi utilizado. A validação real deve usar CPFs fictícios e uma janela de votação de teste.

## Ação necessária antes de produção

1. Validar visualmente os relatórios e impressão no navegador do responsável.
2. Limpar ou arquivar os dados fictícios antes de qualquer eleição real.
3. Corrigir as vulnerabilidades de `react-router` antes da produção.

Não realizar alterações destrutivas ou aplicar seed em produção sem confirmação formal.
