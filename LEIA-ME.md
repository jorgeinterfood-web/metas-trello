# Power-Up Metas, versão 25

## Atualizar a versão 24

Substitua no GitHub os arquivos deste pacote: core.js, detalhe.js, form.js,
meta.js, painel.js, index.html, meta.html e painel.html. O metas.css e os demais
ficam como na versão 24. As referências passaram a ?v=25.

## Concentração

- Em metas de dinheiro e quantidade com clientes informados, o resumo mostra os
  3 maiores clientes e quanto eles representam do realizado:
  Maiores clientes: Carrefour, Mambo e Pão de Açúcar (62% do realizado)
  Com um cliente só, aparece Maior cliente.

## Meta de clientes atendidos

- Novo tipo Clientes no formulário, entre Quantidade e Percentual. Pede só o
  responsável, o período, o objetivo (número inteiro) e a contagem de dias.
- A meta conta sozinha os clientes distintos com valor positivo no período, nas
  metas de dinheiro e quantidade do mesmo responsável. Grafias equivalentes
  contam uma vez; um cliente cuja soma volta a zero por devolução sai da contagem.
- Não tem registro manual. No verso do cartão, no lugar do registro, aparece a
  lista dos clientes contados.
- A contagem é gravada: depois de cada registro nas metas do responsável; ao
  abrir o cartão da meta; ao abrir ou atualizar o painel. Grava quem é o
  responsável ou admin. O selo na frente do cartão mostra o último valor gravado.
- Metas de clientes atendidos não entram na aba Clientes, para não contar o
  mesmo cliente duas vezes.

## Ajuste

- Em metas de quantidade, a unidade aparece só no objetivo: "4 de 10 clientes",
  em vez de "4 clientes de 10 clientes". O mesmo vale para o objetivo do dia.

## Validação

Sintaxe dos JavaScripts e testes com Trello simulado: contagem de clientes
distintos entre metas de dinheiro e quantidade do responsável, grafias
equivalentes, saída de cliente zerado por devolução, gravação depois de
registro, ao abrir o cartão e ao carregar o painel, exclusão da aba Clientes;
formulário do tipo Clientes com objetivo inteiro, sem valor inicial e com
atualização pelo responsável; concentração; testes anteriores de clientes,
compactação, migração, Etapas e projeção. A conferência visual no Trello
continua pendente. Nenhuma alteração remota foi realizada.
