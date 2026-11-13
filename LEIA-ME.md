# Power-Up Metas, versão 30

## Atualizar a versão 29

Substitua no GitHub os arquivos deste pacote: metas.css, core.js, detalhe.js,
index.html, meta.html e painel.html. Os demais ficam como na versão 29. As
referências passaram a ?v=30.

## Registro com data anterior

- Para admins, o registro de valores ganhou o campo Data, ao lado do valor, já
  preenchido com hoje. Aceita qualquer dia do período da meta até hoje.
  Responsáveis que não são admins continuam registrando só com a data de hoje.
- O registro entra na posição da data. Em metas que acumulam (Somar e
  Subtrair), o valor é somado ao total daquele dia e os totais dos dias
  seguintes mudam junto; uma subtração que deixaria algum dia negativo é
  recusada. Em percentuais e metas de redução, o valor é gravado naquele dia e
  o valor atual só muda se não houver registro mais recente; a prévia avisa.
- No histórico, o registro aparece na data escolhida, com "lançado em" e a data
  real do lançamento ao lado de quem registrou.
- Com data anterior, o objetivo do dia é recalculado, porque o total até ontem
  mudou.

## Validação

Sintaxe dos JavaScripts, testes com Trello simulado e captura do detalhe:
registros fora de ordem, soma e subtração com dias seguintes recalculados,
recusa de total negativo em data passada e de data fora do período, taxa com
registro anterior a outro mais recente, campo visível só para admins,
histórico com "lançado em", gráfico com a curva, objetivo do dia recalculado;
testes anteriores de compactação, migração, Etapas e projeção. A conferência
visual no Trello continua pendente. Nenhuma alteração remota foi realizada.
