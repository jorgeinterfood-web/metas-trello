# Power-Up Metas

Metas por pessoa no Trello: de valor (R$, número ou percentual), por etapas ou por avaliação.

## Arquivos
- `index.html`: conector que o Trello carrega
- `painel.html`: painel em tela cheia, com a equipe, o detalhe de cada meta e o formulário de criar e editar
- `meta.html`: seção Meta no verso do cartão
- `js/detalhe.js`: detalhe da meta (progresso, meta do dia, atualização, gráfico, histórico), usado no painel e no cartão
- `js/form.js`: formulário de criar, transformar cartão em meta e editar
- `js/config.js`: chave da API, nomes das listas, feriados locais
- `css/metas.css`: cores claro e escuro no padrão do Trello

## Capacidades a ativar no admin de Power-Ups
Board buttons, Card badges, Card back section, Card buttons.

## Onde os dados ficam
Nos dados do Power-Up de cada cartão (limite do Trello: cerca de 4 mil caracteres por cartão). O histórico mais antigo é descartado se chegar perto do limite.

## Regras
- Só admins do quadro criam, editam, avaliam e encerram metas.
- Todas as metas ficam visíveis para todos no painel. Quem tem meta atualiza o próprio valor pelo cartão ou pelo painel.
- Cartões de meta não devem ser arquivados: cartão arquivado some do painel.
- Feriados nacionais já são considerados nos dias úteis. Feriados locais vão em `feriadosExtras`, no config.js.
- Os arquivos carregam com `?v=9` nos endereços. Ao publicar uma nova versão, troque o número nos HTMLs para o Trello não usar a cópia antiga.


## Atualização v9: barras e situações

Este ZIP é um pacote de atualização: inclui apenas arquivos alterados, completos.
Extraia e substitua os arquivos de mesmo nome no repositório. Preserve o config.js,
os ícones e os demais arquivos que já estão publicados. Depois da publicação,
feche e abra o painel e o cartão. As referências dos arquivos agora usam ?v=9.
O arquivo antigo nova-meta.html não participa do fluxo atual e pode ser removido.

### Barras
- No painel da equipe, cada meta continua com uma barra total.
- No detalhe do cartão e do painel, dinheiro e quantidade de crescimento ganham
  duas barras: Progresso da meta e Objetivo de hoje.
- O objetivo de hoje é o saldo no início do dia dividido pelos dias restantes,
  arredondado para cima na precisão da meta. Ele fica fixo durante o dia.
- O realizado de hoje é a variação líquida do total desde o início do dia.
  Correções do total também alteram esse realizado; não há data retroativa.
- O primeiro registro do dia guarda a referência diária nos dados da meta.
  Para metas existentes, ela é reconstruída a partir do histórico disponível.
- No dia seguinte, o objetivo diário é recalculado a partir do saldo restante.
- Em dias não úteis, metas que contam dias úteis não exibem barra diária.
  Registros nesses dias continuam contando para o total.
- Percentuais, redução e etapas mantêm uma barra adequada ao seu tipo.
- O traço de ritmo esperado saiu das barras totais. Em percentuais, o traço
  permanece porque indica o valor-alvo da taxa.

### Situações
- No ritmo esperado: o realizado corresponde ao esperado até hoje.
- À frente do ritmo: o realizado está à frente do esperado até hoje.
- Abaixo do ritmo: o realizado está atrás do esperado até hoje.
- O ritmo compara o realizado com a expectativa acumulada até o fim de hoje,
  considerando dias úteis ou corridos. A antiga tolerância de 5 pontos foi removida.
- Meta atingida: o valor real alcançou o objetivo, sem arredondamento antecipado.
- Prazo encerrado: o período acabou sem alcançar o objetivo.
- Encerrada sem atingir: um admin encerrou a meta sem alcançar o objetivo.
- Objetivo alcançado / Objetivo pendente: usados em taxas percentuais, inclusive
  quando o objetivo é reduzir uma taxa. Diferenças são pontos percentuais.
- A barra diária tem situações próprias: objetivo de hoje pendente, atingido ou
  superado. A pendência durante o dia não é marcada como atraso.
- O percentual exibido tem até uma casa decimal e não chega a 100% por
  arredondamento quando o objetivo real ainda não foi alcançado.

### Validação
Sintaxe dos JavaScripts, 17 cenários de cálculo e testes de geração do HTML e de
registro com o cliente do Trello simulado. A aparência e a integração real ainda
precisam ser verificadas dentro do Trello.
