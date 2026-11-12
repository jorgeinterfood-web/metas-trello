# Power-Up Metas, versão 22

## Atualizar a versão 21

Substitua no GitHub os arquivos deste pacote: metas.css, detalhe.js, index.html,
meta.html e painel.html. Os demais ficam como na versão 21. As referências
passaram a ?v=22.

## Ajuste

- Os blocos de resumo passaram a ter rótulo e valor na mesma linha, no formato
  da linha do período:
  Progresso geral: R$ 85.560,00 de R$ 300.000,00
  Percentual atual: 85%
  Etapas concluídas: 1 de 4
  Objetivo do dia: R$ 3.200,00 de R$ 15.909,09
  Metas de redução: Progresso geral: 65 devoluções (objetivo: 20 devoluções)
- O complemento (de R$ …, objetivo) fica sem negrito. Evolução e Histórico
  continuam como títulos.

---

# Versão 21

## Atualizar a versão 20

Substitua no GitHub os arquivos deste pacote: metas.css, core.js, detalhe.js,
index.html, meta.html e painel.html. Os demais ficam como na versão 20. As
referências passaram a ?v=21.

## Ajuste

- A importância Alta ou Muito alta saiu do lado das datas e virou uma tag à
  direita da linha do período, com a mesma largura e alinhamento da tag de
  situação. Fundo cinza neutro, seta laranja (Alta) ou vermelha (Muito alta).
  Metas de importância normal continuam sem tag.

---

# Versão 20

## Atualizar a versão 19

Substitua no GitHub os arquivos deste pacote: metas.css, index.html, meta.html e
painel.html. Os demais ficam como na versão 19. As referências passaram a ?v=20.
Se a versão 19 ainda não foi publicada, publique primeiro os arquivos dela e
depois estes.

## Ajuste

- A linha do período passou a ter o mesmo tamanho e peso dos títulos das seções,
  como Etapas concluídas e Progresso geral: 14 px, seminegrito.

---

# Versão 19

## Atualizar a versão 17 ou 18

Este pacote reúne as mudanças das versões 18 e 19. Se a 18 não chegou a ser
publicada, publique direto esta.

Substitua no GitHub os arquivos deste pacote, mantendo config.js e os ícones.
Cada arquivo incluído está completo. As referências passaram a ?v=19.
Publique todos de uma vez e peça para quem estiver com o Trello aberto recarregar
a página: uma aba ainda na versão 17 lê o histórico novo como vazio.

## Ajustes

- Histórico compacto. Cada registro ocupava cerca de 64 caracteres e cabiam uns
  50 por meta. Agora a data é guardada como dias desde o início e a pessoa como
  índice: cabem perto de 200. Perto do limite, os registros de um mesmo dia
  anterior a hoje são juntados no total do fim do dia; só em último caso os dias
  mais antigos saem do histórico, sem mudar o valor atual nem o objetivo do dia.
  As metas existentes são convertidas sozinhas no próximo registro.
- Etapas sem autorização. Quem não autorizou passa a ver a contagem nativa do
  cartão, em vez de "Etapas indisponíveis". Essa contagem soma todas as
  checklists do cartão; nos cartões criados pelo Power-Up só existe a Etapas.
- Descrição dos cartões. O marcador usado para evitar cartão duplicado
  ("metas-criar:…" ou "metas-repetir:…") sai da descrição assim que a meta é
  gravada. Os cartões antigos são limpos quando um admin autorizado abre o painel.
  Criar e repetir metas passaram a ler só a lista Metas, não o quadro inteiro.
  Metas repetidas guardam o cartão de origem, e é isso que impede duplicação.
- Projeção. Em metas de dinheiro e quantidade, a partir de um terço do período,
  o resumo mostra quanto a meta fecha no ritmo atual e quanto isso representa do
  objetivo. O gráfico prolonga a linha pontilhada de hoje até o fim do período.
- Autorização sem vencimento. A autorização do Trello deixou de vencer a cada
  30 dias. Quem autorizou na versão 17 autoriza mais uma vez quando o token
  antigo vencer, e a partir daí não precisa mais.

## Ajustes da versão 19

- Linhas que terminam com valor (dinheiro, quantidade, percentual, data ou
  contagem) ficaram sem ponto final.
- A projeção passou para depois de "Restante para o objetivo final" e o
  percentual foi para parênteses: Projeção no ritmo atual: R$ 360.000,00 (90% do
  objetivo).

## Atenção sobre a autorização

O token fica guardado no navegador de cada pessoa e dá leitura e escrita no
Trello dela enquanto não for revogado. Em computador compartilhado, a pessoa
deve revogar o acesso do Power-Up Metas na página de aplicativos da conta do
Trello quando deixar de usar a máquina.

## Validação

Sintaxe dos JavaScripts e testes com Trello simulado: compactação com 163
registros (3.018 caracteres), caso extremo com corte, leitura de metas antigas,
migração no registro, convivência com aba na versão 17, objetivo do dia
inalterado após compactar, Etapas com e sem autorização, projeção em metas de
aumento e de redução, ausência de projeção em percentual. A conferência visual
no Trello continua pendente. Nenhuma alteração remota foi realizada.
