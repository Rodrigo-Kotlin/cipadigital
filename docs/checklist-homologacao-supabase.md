# Checklist de Homologação Supabase

## Preparação

- [ ] Criar projeto Supabase exclusivo para homologação.
- [ ] Configurar `VITE_SUPABASE_URL`.
- [ ] Configurar `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Configurar `VITE_CPF_HASH_SALT` somente para o ambiente controlado.
- [ ] Confirmar que nenhum `.env` real será versionado.

## Banco e segurança

- [ ] Revisar `supabase/migrations/0001_initial_schema.sql`.
- [ ] Aplicar a migration manualmente no projeto de homologação.
- [ ] Conferir RLS em todas as tabelas.
- [ ] Conferir ausência de policies públicas em `voters` e `votes`.
- [ ] Conferir revogação de escrita direta em `votes`.
- [ ] Conferir as RPCs `cast_vote`, `verify_voter_access`, `get_active_candidates`, `get_public_election`, `get_election_tally` e `transition_election_status`.
- [ ] Executar `supabase/seed/arati_seed.sql` somente se o seed for necessário.

## Usuários e dados de teste

- [ ] Criar usuário administrativo no Supabase Auth.
- [ ] Inserir o mesmo UUID em `admin_users` com role apropriada.
- [ ] Criar eleição de teste em `draft`.
- [ ] Criar candidatos de teste.
- [ ] Criar eleitores fictícios com CPFs de teste.
- [ ] Confirmar que `cpf_hash` é o único valor persistido, além da máscara e últimos dígitos.

## Fluxo administrativo

- [ ] Fazer login administrativo.
- [ ] Criar/editar eleição em `draft`.
- [ ] Agendar eleição.
- [ ] Abrir votação somente com candidato e eleitor ativos.
- [ ] Confirmar bloqueio de edição em `open`.
- [ ] Pausar e retomar votação.
- [ ] Encerrar votação.
- [ ] Confirmar logs de abertura, pausa e encerramento.

## Fluxo do eleitor

- [ ] Acessar `/votar/:electionSlug`.
- [ ] Testar CPF inválido.
- [ ] Testar CPF inexistente.
- [ ] Testar eleitor inativo/bloqueado.
- [ ] Testar eleitor apto.
- [ ] Confirmar dados mascarados.
- [ ] Votar em candidato fictício.
- [ ] Votar em branco.
- [ ] Tentar votar novamente com o mesmo CPF.
- [ ] Confirmar que `votes` não contém vínculo com `voters`.

## Apuração e relatórios

- [ ] Confirmar que apuração está bloqueada em `open` e `paused`.
- [ ] Confirmar apuração após `closed`.
- [ ] Conferir votos nominais e brancos.
- [ ] Conferir participação.
- [ ] Conferir divergência presença x votos.
- [ ] Gerar presença em CSV/PDF.
- [ ] Gerar apuração em CSV/PDF.
- [ ] Gerar participação, resultado e ata.
- [ ] Conferir que nenhum relatório contém CPF completo ou escolha de eleitor.
- [ ] Confirmar logs de exportação.
- [ ] Opcionalmente confirmar `closed` para `tallied`.

## Encerramento

- [ ] Registrar evidências e screenshots do ambiente de homologação.
- [ ] Registrar versão da migration aplicada.
- [ ] Registrar pendências encontradas.
- [ ] Não promover para produção sem aprovação formal.
