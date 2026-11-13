# Metas para Trello v35

## Atualizar a versão anterior

Copie o conteúdo desta pasta para a raiz do repositório, substituindo os arquivos de mesmo nome. Mantenha os demais arquivos da v34, inclusive a pasta `fonts`.

O pacote contém somente os arquivos alterados, as três páginas HTML e este LEIA-ME. Todas as referências locais de CSS e JavaScript nas três páginas usam `?v=35`.

## O que mudou

- Títulos de seção seguem o mesmo padrão no cartão e no painel: 14 px, entrelinha de 20 px e peso 600. Títulos de página têm papel próprio, de 20 px, entrelinha de 24 px e peso 600.
- Rótulos de campo, incluindo Valor do registro e Data, usam 12 px, entrelinha de 16 px, peso 600 e cor secundária.
- Valores, períodos e títulos das metas na lista usam 14 px e peso regular. Os valores junto aos títulos deixam de receber negrito por herança.
- Botões e seletores de opções usam 14 px e peso 500. A seleção usa as mesmas cores nos dois temas.
- Datas e autores do histórico, legendas e textos do gráfico usam o papel auxiliar, de 12 px e peso regular. A margem do gráfico considera a largura dos rótulos.
- A Atlassian Sans é carregada pelo servidor oficial da Atlassian. A Inter local continua como reserva se a fonte oficial não carregar.
- As cores usam primeiro os tokens nativos disponibilizados pelo Trello. Os valores da v34 continuam como reserva.
- Os campos e menus mantêm 36 px de altura. O botão de ação destrutiva tem fundo próprio e o foco de teclado fica visível.

## Validação

- Sintaxe de todos os arquivos JavaScript verificada com Node.
- Detalhe, painel e formulário montados com dados de teste e Trello simulado, nos temas claro e escuro, sem erros JavaScript.
- Navegação entre painel e detalhe e troca do tipo de meta verificadas.
- Tamanho, peso e família por função conferidos por cálculo de estilos nas seis combinações de tela e tema.
- Prioridade dos tokens de cor recebidos do Trello verificada.
- As regras de altura, tamanho e cor dos campos foram conferidas por cálculo de estilos, incluindo uma folha que altera os padrões de select e label.
- O Chromium local foi bloqueado pelo ambiente. Não foi possível concluir capturas e testes de disposição em navegador. A comparação visual final, incluindo carregamento da fonte e estados interativos, precisa ser feita dentro do Trello.
- Nenhuma alteração remota foi realizada.

## Arquivos deste pacote

- `css/metas.css`
- `js/detalhe.js`
- `index.html`
- `meta.html`
- `painel.html`
- `LEIA-ME.md`

As alterações são de apresentação. As regras de cálculo, armazenamento e permissões permanecem na implementação anterior.
