# Power-Up Metas, versão 34

## Atualizar a versão 33

Substitua no GitHub os arquivos deste pacote: css/metas.css, js/core.js,
js/connector.js, index.html, meta.html e painel.html. Mantenha a pasta fonts
(se ela ainda não estiver no repositório, envie a deste pacote).

Apague do repositório os arquivos da versão 33 que saíram: css/metas-shadcn.css,
js/configuracoes.js e configuracoes.html. No portal de administração do
Power-Up, a capacidade show-settings pode ser desmarcada.

Os demais ficam como estão. As referências passaram a ?v=34.

## O que mudou

- Saem o visual shadcn e o seletor de visual da versão 33. O Metas volta a ter
  um visual só, o do Trello.
- Cores medidas no Trello atual, nos temas claro e escuro: textos, bordas,
  fundos, azul dos botões e da seleção, e os selos de situação nas mesmas cores
  das etiquetas e datas do Trello (amarelo de Etapa, vermelho de data vencida,
  verde de etiqueta e azul de seleção).
- Fonte Inter, base da fonte do Trello (Atlassian Sans), hospedada no próprio
  repositório.
- Botões neutros com contorno, como Add, Edit e Filter do Trello. Campos e
  botões com canto de 4 px.
- Selos com 24 px de altura e texto regular, como os do cartão.

## Validação

Sintaxe dos JavaScripts, testes com Trello simulado e capturas no tema claro e
escuro do painel, detalhe, formulário e verso do cartão. Campos e menus com
36 px, medidos com o estilo do Trello imitado por cima. O teste
teste-registro.js falha igual na versão 32, porque procura o campo de clientes
que foi retirado. A conferência visual no próprio Trello continua pendente.
Nenhuma alteração remota foi realizada.
