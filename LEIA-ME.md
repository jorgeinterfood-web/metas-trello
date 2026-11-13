# Metas para Trello v37

## Atualizar a versão anterior

Copie o conteúdo desta pasta para a raiz do repositório, substituindo os arquivos de mesmo nome. Mantenha os demais arquivos da v36. Esta é uma atualização da v36, não um pacote completo.

As três páginas passam a usar ?v=37 nas referências locais de CSS e JavaScript.

## O que mudou

- No histórico, o valor acumulado e a variação, como “6 clientes −1 cliente”, passam a usar 12 px, entrelinha de 16 px e peso regular, como as datas e os autores.
- Tags dentro do cartão e do painel usam cores próprias, medidas nas referências enviadas, em vez dos tons genéricos de avisos e seleção.
- A paleta das tags fica separada da paleta de mensagens, gráficos e valores do histórico.

## Referências das tags

Azul, amarelo, vermelho e verde medidos nos ZIPs claros e escuros. Cinza baseado nos recortes nativos de Etapa: Criação enviados anteriormente.

| Cor | Claro: fundo / texto | Escuro: fundo / texto |
|---|---|---|
| Azul | #CFE1FD / #123263 | #123263 / #CFE1FD |
| Amarelo | #F5E989 / #533F04 | #533F04 / #F5E989 |
| Vermelho | #FFD5D2 / #5D1F1A | #5D1F1A / #FFD5D2 |
| Verde | #D3F1A7 / #37471F | #37471F / #D3F1A7 |
| Cinza | #DDDEE1 / #505258 | #4B4D51 / #A9ABAF |

A cor de cada situação segue o mapeamento existente: azul para andamento/no objetivo, amarelo para atraso/atenção, vermelho para não atingido, verde para completo/superado e cinza para sem avaliação. Os selos da frente do cartão continuam sendo desenhados pelo próprio Trello.

## Validação

- Detalhe, painel e formulário montados em simulação, nos temas claro e escuro, sem erros JavaScript.
- Tamanho, peso e família conferidos por cálculo de estilos nas seis combinações de tela e tema.
- Todos os textos do histórico conferidos em 12 px e peso regular nos dois temas.
- Fundo e texto das cinco cores de tags conferidos nos dois temas.
- Conferido que tokens genéricos de avisos não substituem as cores das tags e continuam funcionando nas mensagens.
- Pacote e referências ?v=37 conferidos.
- A comparação visual final dentro do Trello continua pendente, pois o navegador de capturas está bloqueado neste ambiente.
- Nenhuma alteração remota foi realizada.

## Arquivos deste pacote

- css/metas.css
- index.html
- meta.html
- painel.html
- LEIA-ME.md
