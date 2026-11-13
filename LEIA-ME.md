# Metas para Trello v39

## Atualizar a versão anterior

Copie os arquivos deste pacote para a raiz do repositório, substituindo os de mesmo nome: css/metas.css, js/detalhe.js, index.html, meta.html, painel.html e LEIA-ME.md. Mantenha os demais arquivos da v38. As três páginas passam a usar ?v=39 nas referências locais de CSS e JavaScript.

## O que mudou

- Campos editáveis e dropdowns passam a ter hovers separados, medidos nos prints nativos: os campos recebem um fundo mais suave que os dropdowns.
- Os campos mantêm o fundo correto no tema escuro, mesmo quando o SDK fornece uma cor diferente para a superfície da página.
- Campos editáveis usam recuo interno de 12 px. Dropdowns usam texto secundário de 14 px, peso regular e seta em formato de chevron nos dois temas.
- Seletores de data usam texto de 14 px com peso médio, borda discreta e hover de seletor, como o controle Dates. O calendário continua sendo o do navegador.
- Valores acumulados e variações do histórico ficam em colunas próprias. Os sinais positivos e negativos começam na mesma posição, independentemente da largura do valor acumulado. No celular, o autor fica na linha de baixo.
- Foram preservadas as alturas de 36 px, os textos de 12 px do histórico, as cores das barras e tags e as regras de cálculo e registro.

## Validação

- Conferidos os fundos normal e hover de campos editáveis, campos com prefixo, dropdowns e seletores de data nos dois temas, incluindo uma superfície de SDK diferente da nativa.
- Conferidos os tamanhos, pesos, cores de texto, recuos e alturas dos controles. Campos desabilitados não recebem o novo hover.
- Montadas as telas de detalhe, painel e formulário com os scripts reais e uma simulação local do Trello: seis cenários sem erros JavaScript. Navegação e troca de tipo de meta conferidas.
- Conferido o histórico com valores positivos e negativos em metas financeiras, numéricas e percentuais: data, valor, variação e autor são células separadas da mesma grade de colunas.
- Conferidas as referências ?v=39 nas três páginas e a integridade do ZIP.
- A conferência visual final dos hovers e do alinhamento dentro do Trello continua pendente, pois o navegador de capturas está bloqueado neste ambiente. As cores e propriedades foram verificadas no código e por estilos calculados; isso não substitui a renderização no Trello.
- Nenhuma alteração remota foi realizada.

## Arquivos deste pacote

- css/metas.css
- js/detalhe.js
- index.html
- meta.html
- painel.html
- LEIA-ME.md
