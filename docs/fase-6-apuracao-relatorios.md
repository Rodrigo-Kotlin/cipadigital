# CIPA Digital - Fase 6: Apuração e Relatórios

## Objetivo

Disponibilizar a apuração agregada depois do encerramento oficial, com conferência de participação, ranking, classificação, empate, divergência e documentos básicos do dossiê.

## Acesso e consulta

A rota `/admin/eleicoes/:id/apuracao` permanece protegida pelo `AdminRoute`. A RPC `get_election_tally` exige administrador ativo e aceita apenas eleições `closed`, `tallied` ou `archived`.

Ela retorna um objeto agregado com candidatos e métricas. Não retorna CPF, `voter_id`, nome de eleitor, matrícula, setor, função ou token. A tela nunca consulta `votes` diretamente.

## Regras de apuração

- candidatos são ordenados por votos e ordem de exibição como critério visual secundário;
- titulares e suplentes seguem `titulares_count` e `suplentes_count`;
- votos em branco são contados separadamente;
- empate no topo gera alerta e não é resolvido automaticamente por regra de negócio;
- divergência compara presenças (`voters.has_voted`) com registros em `votes`;
- a transição `closed` para `tallied` é opcional e auditada.

## Relatórios

Implementados na tela de apuração:

- presença em PDF imprimível e CSV;
- apuração em PDF imprimível e CSV;
- participação em PDF imprimível;
- resultado final em PDF imprimível;
- ata básica em PDF imprimível.

O PDF usa uma janela HTML de impressão, sem dependência adicional de biblioteca. Os CSVs usam UTF-8 com BOM, separador `;` e CPF mascarado.

## Auditoria

Geração de cada documento registra ação em `audit_logs`. Nenhum log contém vínculo entre eleitor e voto.

## Limitações

- PDF depende da caixa de diálogo de impressão do navegador.
- Nenhum relatório é enviado ou publicado automaticamente.
- A migration e as RPCs ainda precisam ser aplicadas e validadas em Supabase de homologação.
- Não há assinatura digital, deploy ou exportação automática para terceiros.
