# CIPA Digital - Fase 5: Fluxo de Votação do Eleitor

## Objetivo

Implementar a jornada pública do eleitor com validação por CPF, confirmação de dados, cédula de candidatos, confirmação final e registro pela RPC `cast_vote`.

## Fluxo implementado

Na rota `/votar/:electionSlug`, o fluxo ocorre em etapas na mesma página:

1. Carrega apenas os dados públicos da eleição por `get_public_election`.
2. Valida o CPF no cliente e calcula o hash em memória.
3. Consulta elegibilidade por `verify_voter_access`.
4. Exibe somente nome, CPF mascarado, setor e função.
5. Busca candidatos ativos por `get_active_candidates`.
6. Permite candidato ou voto em branco.
7. Abre confirmação visual antes do envio.
8. Registra pela RPC `cast_vote`.
9. Mostra sucesso e limpa CPF, hash e escolha da memória.

## RPCs

- `get_public_election`: retorna somente metadados públicos da eleição.
- `verify_voter_access`: recebe hash de CPF e retorna somente aptidão e dados mínimos do eleitor.
- `get_active_candidates`: retorna candidatos ativos da eleição aberta.
- `cast_vote`: mantém a operação transacional de presença e voto anônimo.

Nenhuma tabela de eleitores ou votos é consultada diretamente pelo cliente público.

## Segurança e sigilo

- CPF completo não é persistido.
- Hash e escolha permanecem somente no estado em memória da página.
- Não há `localStorage`, `sessionStorage` ou logs de escolha.
- A tabela `votes` continua sem identificador de eleitor.
- O CPF mascarado é exibido somente na confirmação.
- O voto é enviado apenas pela RPC.
- Offline bloqueia acesso e envio.
- Resultado parcial não é consultado nem exibido.

## Hash de CPF

A validação atual utiliza SHA-256 client-side com `VITE_CPF_HASH_SALT`, por limitação do MVP. Como o salt em `VITE_*` fica exposto no front-end, a solução é provisória para ambiente controlado. Antes da produção, mover a geração do hash para Edge Function, RPC segura ou backend server-side.

## Estados e erros

O fluxo trata carregamento, CPF inválido, eleição inexistente/fechada/pausada, eleitor não encontrado, eleitor inativo, duplicidade, erro de RPC, sucesso, ausência de candidatos e offline.

## Limitações

- Não há apuração visual, ranking, relatórios, ata ou exportação.
- Não há votação offline.
- A migration/RPC deve ser aplicada em homologação antes do uso remoto.
- O hash client-side ainda deve ser substituído antes de produção.
