# Power-Up Metas, versão 33

## Atualizar a versão 32

Substitua no GitHub os arquivos deste pacote: css/metas.css, js/core.js,
js/connector.js, index.html, meta.html e painel.html. Adicione os arquivos
novos: css/metas-shadcn.css, js/configuracoes.js, configuracoes.html e a pasta
fonts (com os dois arquivos da fonte Inter e a licença). Os demais ficam como
na versão 32. As referências passaram a ?v=33.

## Seletor de visual

- Cada pessoa escolhe o visual do Metas em Configurações do Power-Up (menu de
  Power-Ups do quadro): Trello, o atual, ou shadcn.
- A escolha vale só para quem escolheu e em todos os quadros com o Metas.
  Todo mundo começa no visual Trello.
- As janelas do Metas que estiverem abertas mudam ao serem reabertas.
- O visual shadcn segue o preset b37aFvF5c: estilo Nova, cores Zinc, gráfico
  Indigo, fonte Inter e cantos de 7 px. Campos, botões e abas ficam com 32 px.
- Os selos da frente do cartão são desenhados pelo Trello e não mudam.

## Validação

Sintaxe dos JavaScripts, testes com Trello simulado e capturas no tema claro e
escuro nos dois visuais (painel, detalhe, formulário, verso do cartão e
configurações). O visual Trello ficou idêntico ao da versão 32 nas capturas. As
alturas dos campos foram medidas com o estilo do Trello imitado por cima: 36 px
no visual Trello e 32 px no shadcn. O teste teste-registro.js falha igual na
versão 32, porque procura o campo de clientes que foi retirado.

Ficou pendente a conferência no próprio Trello, principalmente se a opção
Configurações aparece para quem não é admin do quadro. Nenhuma alteração remota
foi realizada.
