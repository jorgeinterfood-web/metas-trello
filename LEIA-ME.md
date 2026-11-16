# Metas para Trello v40

## Atualizar a versão anterior

Copie os arquivos deste pacote para a raiz do repositório, substituindo css/metas.css, index.html, meta.html, painel.html e LEIA-ME.md. Mantenha os demais arquivos da v39. As três páginas passam a usar ?v=40 nas referências locais de CSS e JavaScript.

## O que mudou

- No tema escuro, os campos de data que tinham borda #3C3D40 passam a usar #7E8188, como os demais campos de entrada.
- Dropdowns e campos de data ativos mostram o cursor de mão. O cursor também foi aplicado ao texto da data e ao ícone do calendário no Chromium. Controles desabilitados usam o cursor de indisponível.
- A tag de prioridade no tema escuro recebe fundo #303134, mais escuro que o anterior #4B4D51. Texto, ícone e demais tags mantêm suas cores.

## Validação

- Montadas as telas de detalhe, painel e formulário com os scripts reais em uma simulação local do Trello, nos dois temas, sem erros JavaScript. Conferidas navegação e troca de tipo de meta.
- Conferidos os estilos calculados de campos em estado normal e hover: borda das datas, fundos, tipografia, recuos e alturas de 36 px. Os hovers editável e dropdown continuam distintos.
- Conferidos os cursores dos seletores ativos e desabilitados por estilos calculados no DOM.
- Conferidos os fundos da prioridade e da tag neutra comum nos dois temas: apenas a prioridade escura foi escurecida.
- Conferidas as referências ?v=40 nas três páginas e a integridade do ZIP.
- A conferência visual final e a interação com o calendário dentro do Trello continuam pendentes. Os testes locais não substituem essa conferência.
- Nenhuma alteração remota foi realizada.

## Arquivos deste pacote

- css/metas.css
- index.html
- meta.html
- painel.html
- LEIA-ME.md
