# CIPA Digital - Fase 8.1: Correcoes Pre-Producao

## Status

**Status: correcoes implementadas e homologacao de backend atualizada. Deploy de producao nao executado.**

Ambiente utilizado: projeto Supabase de homologacao `cipadigital` (`kdjxexoexwznkwccvrqi`).

## React Router

O projeto foi fixado em `react-router-dom` `6.30.4`, com `react-router` e `@remix-run/router` correspondentes. Essa versao remove as vulnerabilidades altas reportadas no lockfile anterior sem usar `npm audit fix --force`.

O `npm audit` ainda reporta dois avisos moderados relacionados a redirecionamentos/SSR. O CIPA Digital usa apenas roteamento SPA no cliente, sem SSR, actions ou recursos RSC. A atualizacao para a linha 7.18.x reintroduz vulnerabilidades altas no advisory atual; por isso a linha 6.30.4 foi mantida como a alternativa de menor risco disponivel e deve ser reavaliada quando houver release corrigida.

## Hash de CPF

O cliente nao calcula mais hash nem utiliza `VITE_CPF_HASH_SALT`.

- A Edge Function `supabase/functions/hash-cpf/index.ts` normaliza e valida o CPF.
- O salt fica somente no secret `CPF_HASH_SALT` do Supabase.
- A funcao retorna apenas o hash SHA-256 hexadecimal.
- A funcao foi publicada sem exigir JWT porque e chamada pelo fluxo publico de votacao; ela nao le nem grava dados.
- Cadastro manual, importacao CSV e acesso do eleitor usam a mesma funcao server-side.
- O salt antigo foi removido do `.env` local e do `.env.example`.

Validacao remota:

- CPF valido: HTTP 200, hash com 64 caracteres.
- CPF invalido: HTTP 400.

## Dados de homologacao

Foram removidos do projeto remoto:

- votos de teste;
- eleitores ficticios;
- presencas derivadas dos testes.

A eleicao ARATI e os candidatos foram preservados para configuracao posterior e retornados para `draft`. Nao existem eleitores ou votos ficticios ativos no momento.

## Relatorios e impressao

Os exportadores continuam protegendo o CPF com mascara e mantendo presenca separada de voto. A janela de impressao recebeu margem `@page`, cabecalho CIPA Digital, rodape, quebra segura de linhas e estilos para impressao.

Validacoes automatizadas confirmam que:

- o relatorio de presenca usa `cpf_masked`;
- o relatorio de apuracao nao recebe eleitor ou CPF;
- a ata usa somente totais e resultados agregados;
- HTML de relatorio escapa dados dinamicos.

A conferencia final de impressao fisica deve ser feita no navegador antes da producao.

### Validacao visual manual

- Navegador validado: Google Chrome.
- Lista de presenca: PDF gerado e aberto corretamente; CPF mascarado e sem escolha de voto.
- Relatorio de participacao: PDF gerado e aberto corretamente; totais legiveis.
- Relatorio de apuracao: PDF gerado e aberto corretamente; somente candidatos, votos e classificacao.
- Resultado final: PDF gerado e aberto corretamente; sem eleitor ou CPF.
- Ata de eleicao e apuracao: PDF gerado e aberto corretamente; texto agregado e sem vinculo eleitor-voto.
- Cabecalho, rodape, margens, tabelas e salvamento pelo dialogo de impressao foram confirmados no Chrome.
- Microsoft Edge: nao validado nesta rodada.
- Ajuste realizado: atraso de renderizacao antes de `print()` e revogacao adiada do Blob CSV.

## PWA

Foram adicionados os ativos finais de marca:

- `public/icons/icon-192.svg`;
- `public/icons/icon-512.svg`.

O manifest agora declara os dois tamanhos com `purpose: any maskable`. O SVG original permanece como compatibilidade de asset.

## Limpeza pos-validacao

Os dados temporarios foram removidos novamente apos a validacao visual:

- 0 eleitores ficticios;
- 0 votos de teste;
- eleicao ARATI retornada para `draft`.

## Pendencias antes da producao

- Fazer conferencia visual final de todos os relatorios e impressao.
- Cadastrar eleitores reais somente no ambiente de producao aprovado.
- Configurar o secret `CPF_HASH_SALT` independente no projeto de producao.
- Publicar a mesma Edge Function no projeto de producao.
- Reavaliar os dois avisos moderados do React Router quando houver release corrigida.
- Executar deploy somente apos aprovacao formal.
