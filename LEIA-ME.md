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
- Os arquivos carregam com `?v=8` nos endereços. Ao publicar uma nova versão, troque o número nos HTMLs para o Trello não usar a cópia antiga.
