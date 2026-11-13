# Power-Up Metas, versão 28

## Atualizar a versão 27

Substitua no GitHub os arquivos deste pacote: metas.css, form.js, index.html,
meta.html e painel.html. Os demais ficam como na versão 27. As referências
passaram a ?v=28.

## Ajustes

- Os exemplos dentro dos campos voltaram: Título (Ex.: Faturamento do mês) e
  Unidade (Ex.: clientes).
- Importância, campos e menus têm sempre 36 px de altura. A regra agora fixa
  também o box-sizing e as alturas mínima e máxima, que o estilo do Trello pode
  alterar em select e input e que deixavam os menus mais altos que o bloco de
  Importância.

## Validação

Medição em navegador com um estilo que imita o do Trello alterando box-sizing,
altura mínima e espaçamento de select e input: todos os campos, menus e blocos
de opções do formulário ficaram com 36 px. A conferência visual no Trello
continua pendente. Nenhuma alteração remota foi realizada.
