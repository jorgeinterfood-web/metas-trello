# Metas para Trello v36

## Atualizar a versão anterior

Copie o conteúdo desta pasta para a raiz do repositório, substituindo os arquivos de mesmo nome. Mantenha os demais arquivos da v35, inclusive fonts/. Não envie a pasta metas-trello-v36 como uma subpasta do site.

As três páginas passam a usar ?v=36 em todas as referências locais de CSS e JavaScript.

## O que mudou

- Textos auxiliares do resumo, em lista ou linha única, com 12 px, entrelinha de 16 px, peso regular e cor secundária.
- Informações extras removidas debaixo das barras de Objetivo do dia, Percentual atual e Etapas concluídas. As informações principais e os indicadores das barras permanecem.
- Espaço entre rótulos e campos aumentado de 4 para 8 px no formulário e no registro, incluindo Data.
- Hover dos botões neutros com contorno usa os fundos e bordas medidos nos prints: fundo #E2E4E6 e borda #C3C6C8 no claro; fundo #3C3D3F e borda #515254 no escuro. A cor do texto permanece secundária.
- Encerrar meta vira botão neutro com contorno e 36 px de altura, como Subtrair. A confirmação de encerramento permanece.
- A projeção financeira da equipe passa para a legenda abaixo do gráfico, ao lado da linha pontilhada de Projeção, com valor e percentual.
- Legendas dos gráficos do cartão e da equipe com mais 4 px de afastamento da base, além do intervalo já existente.

## Cores das tags

As cores das tags não foram alteradas nesta versão. A v35 usa tokens genéricos de sucesso, aviso e seleção, que podem produzir tons diferentes dos indicadores nativos do Trello. Para definir a correspondência desejada, use recortes das etiquetas nativas, com texto e fundo visíveis, nos temas claro e escuro.

## Validação

- Sintaxe de todos os arquivos JavaScript verificada com Node.
- Detalhe, painel e formulário montados com Trello simulado nos temas claro e escuro, sem erros JavaScript.
- Navegação entre painel e detalhe e troca do tipo da meta verificadas.
- Conferidos o botão Encerrar meta, sua confirmação e o cancelamento dessa confirmação.
- Conferida a ausência de textos extras no objetivo do dia, no percentual atual e em etapas concluídas.
- Conferida a projeção junto à legenda do gráfico da equipe.
- Tamanho, peso, cores e espaçamentos conferidos por cálculo de estilos. Hover simulado para conferir fundo e borda nos dois temas.
- Campos mantidos com 36 px, inclusive sob estilos simulados do hospedeiro.
- A comparação visual final e os estados interativos dentro do Trello continuam pendentes; o Chromium deste ambiente não permite as capturas necessárias.
- Nenhuma alteração remota foi realizada.

## Arquivos deste pacote

- css/metas.css
- js/detalhe.js
- js/painel.js
- index.html
- meta.html
- painel.html
- LEIA-ME.md
