# Power-Up Metas

Metas por pessoa no Trello, quantitativas (R$, número ou percentual), por etapas ou por avaliação.

## Arquivos
- `index.html`: conector que o Trello carrega
- `painel.html`: painel em tela cheia (Minhas metas e Equipe)
- `meta.html`: seção Meta no verso do cartão
- `nova-meta.html`: criar, transformar cartão em meta e editar
- `js/config.js`: chave da API, nomes das listas, feriados locais
- `css/metas.css`: cores claro e escuro no padrão do Trello

## Capacidades a ativar no admin de Power-Ups
Board buttons, Card badges, Card back section, Card buttons.

## Onde os dados ficam
Nos dados do Power-Up de cada cartão (limite do Trello: cerca de 4 mil caracteres por cartão). O histórico mais antigo é descartado se chegar perto do limite.

## Regras
- Só admins do quadro criam, editam, avaliam e encerram metas.
- Cartões de meta não devem ser arquivados: cartão arquivado some do painel.
- Feriados nacionais já são considerados nos dias úteis. Feriados locais vão em `feriadosExtras`, no config.js.
