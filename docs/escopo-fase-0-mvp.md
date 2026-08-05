# CIPA DIGITAL

## Fase 0 - Escopo Fechado do MVP

### Sistema PWA de Votacao Eletronica da CIPA

**Status:** Aguardando validacao final
**Primeiro caso de uso:** Eleicao da CIPA da ARATI - Gestao 2026/2027

## 1. Objetivo do produto

O **CIPA Digital** sera um sistema web responsivo, no formato **PWA - Progressive Web App**, desenvolvido para gerenciar de forma simples, segura e documentada o processo de votacao eletronica da **Comissao Interna de Prevencao de Acidentes e de Assedio - CIPA**.

O objetivo principal do MVP e permitir que uma empresa realize a votacao da CIPA com controle de eleitores, registro de presenca, voto anonimo, apuracao automatica e emissao de relatorios basicos para composicao do dossie eleitoral.

O sistema sera especifico para o processo de votacao. Nao contemplara, nesta primeira versao, modulos de gestao completa da CIPA, plano de trabalho, reunioes, inspecoes ou treinamentos.

## 2. Nome oficial do produto

- **Nome:** CIPA Digital
- **Subtitulo:** Sistema de Votacao Eletronica da CIPA
- **Formato:** PWA responsivo
- **Uso principal:** votacao eletronica interna da CIPA
- **Primeiro caso de uso:** Eleicao da CIPA da ARATI - Gestao 2026/2027

## 3. Escopo central do MVP

O MVP devera permitir:

1. Cadastrar uma eleicao da CIPA.
2. Cadastrar candidatos com nome, funcao, frase e foto.
3. Cadastrar eleitores manualmente.
4. Importar eleitores por planilha simples.
5. Liberar votacao por CPF.
6. Validar se o eleitor esta apto.
7. Impedir voto duplicado.
8. Exibir candidatos e opcao de voto em branco.
9. Registrar presenca do eleitor.
10. Registrar o voto de forma anonima.
11. Ocultar resultado parcial durante a votacao.
12. Encerrar a votacao.
13. Apurar o resultado automaticamente.
14. Gerar lista de presenca.
15. Gerar relatorio de apuracao.
16. Gerar resultado final.
17. Gerar ata basica de eleicao e apuracao.
18. Manter logs administrativos essenciais.

## 4. Usuarios do sistema

### 4.1 Administrador Geral

Usuario com acesso completo ao sistema, autenticado por login e senha.

**Permissoes:**

- criar eleicao;
- editar dados da eleicao antes da abertura;
- cadastrar candidatos;
- cadastrar eleitores;
- importar eleitores;
- abrir e encerrar votacao;
- apurar resultado;
- emitir relatorios;
- visualizar logs;
- corrigir cadastros antes da abertura.

### 4.2 Comissao Eleitoral

Usuario responsavel pela conducao pratica do processo eleitoral.

**Permissoes:**

- consultar dados da eleicao;
- cadastrar e conferir candidatos;
- cadastrar e conferir eleitores;
- acompanhar a quantidade de votantes;
- abrir e encerrar a votacao;
- gerar relatorios finais;
- visualizar a apuracao somente apos o encerramento.

### 4.3 Mesario ou Apoio

Usuario auxiliar durante a votacao.

**Permissoes:**

- consultar se o eleitor esta cadastrado;
- verificar se o eleitor ja votou;
- acompanhar lista de presenca;
- auxiliar empregados com dificuldade de acesso.

**Restricoes:**

- nao pode visualizar votos por candidato;
- nao pode alterar candidatos;
- nao pode alterar resultado;
- nao pode apurar eleicao.

### 4.4 Eleitor

Empregado apto a votar.

**Permissoes:**

- acessar a votacao por CPF;
- confirmar seus dados;
- visualizar os candidatos;
- escolher um candidato ou voto em branco;
- confirmar o voto uma unica vez.

## 5. Jornada do administrador

1. Acessar o painel administrativo.
2. Fazer login.
3. Criar ou acessar a eleicao.
4. Cadastrar dados da empresa e da gestao.
5. Cadastrar candidatos.
6. Inserir fotos dos candidatos.
7. Cadastrar ou importar eleitores.
8. Conferir eleitores aptos.
9. Gerar link ou QR Code de votacao.
10. Abrir a votacao no dia e horario definidos.
11. Acompanhar apenas o numero de votantes.
12. Encerrar a votacao.
13. Liberar a apuracao.
14. Gerar relatorios.
15. Arquivar documentos no dossie da CIPA.

## 6. Jornada do eleitor

1. Acessar o link ou QR Code da votacao.
2. Visualizar a identificacao da eleicao.
3. Digitar o CPF.
4. O sistema valida o CPF.
5. Confirmar nome, CPF mascarado, funcao e setor.
6. Visualizar candidatos e voto em branco.
7. Selecionar uma opcao.
8. Visualizar a tela de confirmacao.
9. Confirmar o voto.
10. O sistema registra a presenca.
11. O sistema registra o voto anonimo.
12. Visualizar mensagem de sucesso.

## 7. Presenca identificada e voto anonimo

O sistema devera separar completamente o controle de presenca do registro do voto.

### 7.1 Registro de presenca

A presenca podera conter:

- nome do eleitor;
- CPF protegido ou mascarado;
- setor;
- funcao;
- status do eleitor;
- data e hora da votacao;
- indicacao de que votou.

O CPF sera usado exclusivamente para validar a elegibilidade, identificar a presenca operacional e impedir duplicidade. Ele nunca sera gravado no registro do voto.

### 7.2 Registro do voto

O voto devera conter apenas:

- identificacao da eleicao;
- candidato escolhido ou voto em branco;
- data e hora do registro.

### 7.3 Proibicao tecnica

A tabela ou estrutura de votos nao podera conter:

- CPF;
- nome do eleitor;
- matricula;
- setor;
- funcao;
- ID do eleitor;
- token que permita rastrear o eleitor;
- qualquer dado que possibilite associar pessoa e voto.

Tambem nao podera haver vinculo recuperavel entre presenca e voto por logs, URLs, chaves de armazenamento, mensagens de erro ou relatorios.

## 8. Requisitos funcionais do MVP

### 8.1 Eleicao

O sistema devera permitir o cadastro de:

- nome da empresa;
- CNPJ;
- unidade;
- gestao;
- data da eleicao;
- horario de inicio;
- horario de encerramento;
- quantidade de empregados aptos;
- quantidade de titulares;
- quantidade de suplentes;
- status da eleicao.

**Status previstos:**

| Status     | Finalidade                                |
| ---------- | ----------------------------------------- |
| Preparacao | Eleicao ainda editavel                    |
| Agendada   | Eleicao configurada e aguardando abertura |
| Aberta     | Votacao disponivel aos eleitores          |
| Pausada    | Votacao temporariamente bloqueada         |
| Encerrada  | Votacao finalizada                        |
| Apurada    | Resultado gerado                          |
| Arquivada  | Processo finalizado e documentado         |

### 8.2 Candidatos

O sistema devera permitir cadastro manual de:

- nome completo;
- funcao;
- frase de campanha;
- foto;
- ordem de exibicao;
- situacao ativa ou inativa.

### 8.3 Eleitores

O sistema devera permitir:

- cadastro manual;
- importacao por planilha simples;
- edicao antes da abertura;
- bloqueio ou inativacao;
- pesquisa por nome ou CPF mascarado;
- exportacao da lista de eleitores.

**Campos minimos:**

- nome;
- CPF;
- setor;
- funcao;
- matricula, se houver;
- situacao.

O CPF devera ser normalizado, validado e protegido tecnicamente.

### 8.4 Votacao

O sistema devera permitir que o eleitor:

- acesse por CPF;
- confirme seus dados;
- visualize candidatos;
- vote em um candidato;
- vote em branco;
- confirme antes de finalizar;
- receba mensagem de voto registrado.

O sistema devera bloquear:

- CPF nao cadastrado;
- CPF inativo ou bloqueado;
- eleitor que ja votou;
- votacao fora do horario;
- votacao em eleicao encerrada;
- votacao em eleicao ainda nao aberta.

### 8.5 Apuracao

O sistema devera apurar:

- total de eleitores aptos;
- total de votantes;
- percentual de participacao;
- votos por candidato;
- votos em branco;
- total de votos;
- classificacao dos candidatos;
- situacao de titular, suplente ou candidato votado nao eleito.

O resultado por candidato devera ser exibido somente apos o encerramento da votacao.

### 8.6 Relatorios

| Relatorio                 | Conteudo                                               |
| ------------------------- | ------------------------------------------------------ |
| Lista de eleitores aptos  | Nome, CPF mascarado, setor, funcao e situacao          |
| Lista de presenca         | Nome, CPF mascarado, setor, funcao e data/hora do voto |
| Relatorio de participacao | Total de aptos, votantes e percentual                  |
| Relatorio de apuracao     | Votos por candidato, votos em branco e total geral     |
| Resultado final           | Classificacao, nome, funcao, votos e situacao          |
| Ata de eleicao e apuracao | Texto formal para assinatura                           |
| Log administrativo basico | Abertura, encerramento, apuracao e exportacoes         |

## 9. Requisitos nao funcionais

O sistema devera ser:

- responsivo e mobile-first;
- simples de usar;
- rapido em redes moveis comuns;
- acessivel, com foco visivel e contraste adequado;
- instalavel como PWA;
- compativel com celular, tablet e desktop;
- preparado para HTTPS;
- organizado em arquitetura limpa;
- dotado de mensagens claras de erro, sucesso, carregamento e bloqueio;
- com dados protegidos;
- com logs administrativos essenciais;
- sem dependencia de votacao offline no MVP.

## 10. Boas praticas de PWA e design responsivo

1. Iniciar o design pelo celular.
2. Usar layout fluido.
3. Adaptar cards e tabelas conforme o tamanho da tela.
4. Evitar tabelas complexas na tela do eleitor.
5. Usar botoes grandes e faceis de tocar.
6. Manter contraste adequado.
7. Garantir foco visivel em campos e botoes.
8. Apresentar mensagens claras.
9. Minimizar campos no fluxo do eleitor.
10. Reduzir o numero de cliques para votar.
11. Carregar rapidamente em redes moveis.
12. Permitir instalacao como aplicativo.
13. Exibir tela amigavel em caso de erro ou indisponibilidade.

**Breakpoints minimos recomendados:**

| Largura | Uso             |
| ------: | --------------- |
|   360px | Celular pequeno |
|   480px | Celular comum   |
|   768px | Tablet          |
|  1024px | Notebook        |
|  1280px | Desktop         |

## 11. Itens fora do escopo da primeira versao

- gestao completa da CIPA;
- calendario de reunioes;
- atas mensais da CIPA;
- plano de trabalho;
- inspecoes de seguranca;
- controle de treinamentos;
- assinatura digital;
- biometria;
- reconhecimento facial;
- integracao com folha de pagamento;
- envio automatico por WhatsApp;
- multiplas empresas com cobranca SaaS;
- portal completo do cliente;
- edicao de cartazes ou campanhas;
- chat interno;
- notificacoes push avancadas.

## 12. Decisoes tecnicas iniciais

| Item                        | Decisao                              |
| --------------------------- | ------------------------------------ |
| Nome oficial                | CIPA Digital                         |
| Tipo de aplicacao           | PWA responsivo                       |
| Front-end                   | React + Vite + TypeScript            |
| Banco                       | Supabase/PostgreSQL                  |
| Autenticacao administrativa | Supabase Auth                        |
| Acesso do eleitor           | CPF                                  |
| CPF                         | Hash e mascara                       |
| Voto                        | Anonimo, sem vinculo com eleitor     |
| Relatorios                  | PDF e Excel                          |
| Estilo visual               | Profissional, simples e mobile-first |
| Hospedagem                  | Cloudflare Pages ou Vercel           |
| Primeiro uso                | Eleicao da CIPA ARATI 2026/2027      |

Estas decisoes orientam a Fase 1 e deverao ser confirmadas antes da implementacao. A escolha final de hospedagem, configuracao de seguranca e modelo de dados dependera da validacao tecnica da Fase 1.

## 13. Riscos tecnicos e mitigacao

| Risco                              | Impacto                        | Mitigacao                                                                       |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Relacionar eleitor ao voto         | Quebra do sigilo               | Separar presenca e voto em tabelas, servicos, permissoes e relatorios distintos |
| Voto duplicado                     | Fraude ou inconsistencia       | Transacao atomica, idempotencia e bloqueio por CPF                              |
| CPF exposto                        | Risco LGPD                     | Hash para validacao, mascara na interface e ausencia de CPF em URLs e logs      |
| Parcial de votos durante a votacao | Influencia no processo         | Bloqueio de apuracao ate o encerramento                                         |
| Erro de conexao no voto            | Perda ou incerteza de registro | Operacao transacional e mensagem clara sem confirmacao falsa                    |
| Uso dificil no celular             | Baixa adesao                   | Design mobile-first e fluxo curto                                               |
| Importacao incorreta de eleitores  | Bloqueios indevidos            | Pre-visualizacao, validacao e relatorio de erros                                |
| Empate na apuracao                 | Incerteza no resultado         | Emitir alerta para decisao pela Comissao Eleitoral                              |
| Divergencia entre presenca e votos | Questionamento documental      | Conferencia automatica e alerta sem revelar vinculos individuais                |
| Alteracao indevida apos abertura   | Inseguranca documental         | Bloqueio de edicao apos status Aberta                                           |

## 14. Criterios de aceite da Fase 0

A Fase 0 sera considerada aprovada quando:

- o escopo do MVP estiver definido;
- o objetivo do sistema estiver claro;
- os usuarios estiverem definidos;
- as jornadas principais estiverem descritas;
- os requisitos funcionais estiverem listados;
- os requisitos nao funcionais estiverem definidos;
- o principio de sigilo do voto estiver validado;
- os itens fora do escopo estiverem aceitos;
- as decisoes tecnicas iniciais estiverem aprovadas;
- os riscos principais estiverem identificados.

## 15. Checklist para liberacao da Fase 1

| Item                                         | Status                     |
| -------------------------------------------- | -------------------------- |
| Nome CIPA Digital aprovado                   | Aprovado                   |
| Escopo restrito a votacao aprovado           | Aprovado                   |
| PWA responsivo aprovado                      | Aprovado                   |
| Acesso por CPF aprovado                      | Aprovado                   |
| Login administrativo aprovado                | Aprovado                   |
| Candidatos com foto aprovado                 | Aprovado                   |
| Cadastro/importacao de eleitores aprovado    | Aprovado                   |
| Voto em branco aprovado                      | Aprovado                   |
| Presenca identificada aprovada               | Aprovado                   |
| Voto anonimo aprovado                        | Aprovado                   |
| Resultado somente apos encerramento aprovado | Aprovado                   |
| Relatorios basicos aprovados                 | Aprovado                   |
| Itens fora do MVP aceitos                    | Aguardando validacao final |

## 16. Conclusao da Fase 0

A Fase 0 estabelece o escopo fechado do **CIPA Digital** como um MVP funcional, profissional e especifico para votacao eletronica da CIPA. A aplicacao devera priorizar simplicidade operacional, experiencia mobile-first, sigilo do voto, controle de presenca, apuracao segura e geracao de relatorios documentais.

Com a aprovacao deste escopo, o projeto estara pronto para avancar para a **Fase 1 - Fundacao do Projeto PWA**.

Nenhuma tela, integracao ou codigo funcional sera implementado antes da aprovacao formal deste documento.
