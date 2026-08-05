# CIPA Digital - Fase 3: Banco, Supabase e Segurança do Voto

## Status

Base de dados modelada e versionada localmente. Nenhuma migration foi executada em banco Supabase remoto.

## Decisões de segurança

- `voters` é a fonte de presença identificada e contém `cpf_hash`, dados administrativos e `has_voted`.
- `votes` contém somente eleição, escolha, indicador de branco e timestamp. Não contém `voter_id`, CPF, nome, matrícula, setor, função, token, IP ou user agent.
- A unicidade de votação é protegida por `(election_id, cpf_hash)` e pela linha bloqueada durante `cast_vote`.
- A RPC `cast_vote` atualiza presença e insere voto na mesma transação do PostgreSQL.
- RLS está habilitado em todas as tabelas. Não há policy pública para listar eleitores ou votos.
- O acesso administrativo autenticado é inicialmente reconhecido por `admin_users.active`; permissões granulares ficam para a integração administrativa.
- Escritas diretas em `votes` são revogadas para `anon` e `authenticated`. A RPC é o caminho de escrita.

## Hash do CPF

O utilitário `src/lib/cpf/hashCpf.ts` normaliza e valida o CPF antes de aplicar SHA-256 sobre `salt:cpf`.

O salt local vem de `VITE_CPF_HASH_SALT`, para permitir execução da fundação sem backend. Como variáveis `VITE_*` são expostas ao bundle, este mecanismo não é considerado adequado para produção: a implementação de produção deve mover o hash para Edge Function ou RPC segura e retirar o salt do cliente.

## RPC `cast_vote`

A função está implementada em `supabase/migrations/0001_initial_schema.sql`. Ela verifica eleição, janela de votação, eleitor ativo, duplicidade e candidato, bloqueia a linha do eleitor, atualiza presença e insere o voto sem vínculo identificável.

O retorno é apenas `{ success, message }`, sem dados do eleitor ou da escolha. Erros usam códigos/mensagens operacionais genéricos para o cliente.

## Migração e seed

- Migration: `supabase/migrations/0001_initial_schema.sql`
- Seed opcional local/staging: `supabase/seed/arati_seed.sql`
- Seed não deve ser executado em produção sem revisão e aprovação.

## Configuração local

Copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_CPF_HASH_SALT=
```

O cliente fica `null` sem essas variáveis para que o PWA visual continue executável. `getSupabaseClient()` falha explicitamente quando a conexão é solicitada sem configuração.

## Limitações da Fase 3

- Não há aplicação automática de migrations remotas.
- Não há tela administrativa funcional ou autenticação real.
- Não há fluxo de votação conectado à RPC.
- Não há execução de integração contra um projeto Supabase remoto neste workspace.
- A política administrativa inicial não substitui uma matriz de permissões para produção.
