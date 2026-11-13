# Power-Up Metas, versão 29

## Atualizar a versão 28

Substitua no GitHub os arquivos deste pacote: core.js, detalhe.js, painel.js,
index.html, meta.html e painel.html. Os demais ficam como na versão 28. As
referências passaram a ?v=29.

## Situações e cores

Cada cor tem um sentido só, como no Trello:
- Azul, em andamento bem: No ritmo, Adiantado, No objetivo e o Em andamento do
  objetivo do dia.
- Amarelo, atenção: Atrasado e Abaixo do objetivo.
- Vermelho: Não atingido.
- Verde, concluído: Completo, inclusive no objetivo do dia.
- Cinza, sem avaliação: A iniciar, Sem etapas, Sem dias úteis e Etapas
  indisponíveis.

Mudanças de rótulo:
- Metas de Percentual que alcançam o objetivo durante o período mostram No
  objetivo, porque ainda podem cair. Completo fica para o fim do período, e só
  então o cartão é marcado como concluído.
- Pendente passou a se chamar Abaixo do objetivo.
- Os filtros do painel ganharam No objetivo e Abaixo do objetivo. A avaliar,
  Parciais e Superados só aparecem se ainda existir alguma meta antiga do tipo
  Avaliação no quadro.

## Validação

Sintaxe dos JavaScripts, testes com Trello simulado e captura do painel. A
conferência visual no Trello continua pendente. Nenhuma alteração remota foi
realizada.
