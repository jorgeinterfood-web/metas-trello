# Power-Up Metas, versão 27

## Atualizar a versão 26

Substitua no GitHub os arquivos deste pacote: metas.css, core.js, detalhe.js,
form.js, meta.js, painel.js, index.html, meta.html e painel.html. O config.js,
o connector.js e os ícones ficam como estão. As referências passaram a ?v=27.

## Unidade

- O formulário tem um campo só, Unidade. A pessoa digita no singular ou no
  plural, e o Power-Up acerta os dois pelas regras do português: devolução e
  devoluções, colaborador e colaboradores, item e itens, papel e papéis, nível e
  níveis, mês e meses, pedido de compra e pedidos de compra. Siglas ganham s
  (SKU, SKUs) e palavras invariáveis ficam como estão (lápis, bônus).

## Avisos

Todos os avisos usam o mesmo componente e aparecem no topo do conteúdo a que se
referem, na mesma coluna:
- Sucesso, em verde, some sozinho em 5 segundos: Meta salva, Meta criada,
  Avaliação registrada, Meta encerrada e cartão movido, Cartão atualizado.
- Aviso, em amarelo, sempre com o botão que resolve: cartão não atualizado
  depois de salvar (Atualizar cartão), responsável fora do cartão (Adicionar ao
  cartão, para admins), meta encerrada ou reaberta sem o cartão ter sido movido
  (Mover cartão), conclusão do cartão não atualizada (Atualizar cartão), etapas
  sem autorização (Autorizar e atualizar).
- Erro, em vermelho, com o botão que permite tentar de novo: falha ao gravar
  (Atualizar dados), falha ao carregar ou atualizar o painel e o verso do
  cartão (Tentar de novo).
Saiu a faixa de aviso solta abaixo do topo do painel. Avisos com a mesma causa
não se repetem: a pendência de atualizar o cartão já inclui o responsável.

## Ajustes

- Linha de Importância: os campos deixaram de herdar a margem que o estilo do
  Trello aplica aos rótulos, o que desalinhava Importância dos dois campos ao
  lado.
- Excedente do dia em metas financeiras mostra R$, como as outras linhas.

## Validação

Sintaxe dos JavaScripts, testes com Trello simulado e capturas de tela no tema
claro e escuro: singular e plural de 56 unidades, formulário com campo único,
avisos depois de salvar com e sem autorização, testes anteriores de alterações,
formulário, painel, compactação, migração, Etapas e projeção. O estilo do
Trello não pôde ser carregado no teste; a conferência visual no Trello continua
pendente. Nenhuma alteração remota foi realizada.
