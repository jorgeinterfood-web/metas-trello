# Power-Up Metas, versão 26

## Atualizar a restauração da versão 22

Substitua no GitHub os arquivos deste pacote: metas.css, core.js, detalhe.js,
form.js, painel.js, index.html, meta.html e painel.html. O config.js, o
connector.js, o meta.js e os ícones ficam como estão. As referências passaram
a ?v=26.

## Alterações da meta

- O verso do cartão e o detalhe no painel ganharam a seção Alterações, abaixo
  do histórico. Ela registra quem mudou o quê e quando: tipo, objetivo, valor
  inicial, unidade, período, responsável, importância, permissão para editar,
  contagem de dias, encerramento e reabertura. Exemplo:
  13/11  Objetivo de R$ 300.000,00 para R$ 350.000,00  Jorge
- Ficam as 10 alterações mais recentes. Metas repetidas para o período seguinte
  começam sem alterações.

## Janela de metas

- O tipo Dinheiro passou a se chamar Financeiro.
- Responsável começa vazio em metas novas.
- Mais opções deixou de existir. Permissão para editar (antes Quem atualiza) e
  Contagem de dias ficam na mesma linha da Importância. As opções de contagem são
  Úteis e Corridos. Nos tipos em que um dos dois não se aplica, o espaço fica
  reservado para a linha não mudar de alinhamento.
- Saíram todos os textos explicativos e os exemplos dentro dos campos. Ao editar
  uma meta de Etapas, o bloco de etapas não aparece (elas são editadas na
  checklist do cartão).

## Painel

- Progresso financeiro da equipe segue o desenho dos outros blocos: título fora
  da caixa e a mesma tipografia, com "R$ 85.560,00 de R$ 300.000,00" acima da
  barra.
- Sem botão Atualizar. O painel continua se atualizando sozinho a cada
  30 segundos e quando o quadro muda.

## Validação

Sintaxe dos JavaScripts e testes com Trello simulado: formulário sem textos
explicativos, responsável vazio com erro ao salvar sem escolher, alinhamento da
linha de Importância por tipo, registro das alterações ao editar, encerrar e
reabrir, exibição no detalhe, painel sem Atualizar e bloco financeiro;
testes anteriores de compactação, migração, Etapas e projeção. A conferência
visual no Trello continua pendente. Nenhuma alteração remota foi realizada.
