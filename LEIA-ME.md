# Power-Up Metas, versão 23

## Instalação sobre a versão 22

Esta atualização usa exclusivamente a v22 do ZIP enviado como base.
Substitua no GitHub os arquivos deste pacote, mantendo config.js, os ícones e
os demais arquivos. Os arquivos incluídos estão completos. Não há nova-meta.html.
Publique todos os arquivos juntos e recarregue o Trello nas telas abertas.
As referências passaram a ?v=23. Nenhuma alteração remota foi feita nesta entrega.

## Navegar no tempo

No painel da equipe, clique em Explorar período, no bloco Navegar no tempo.

- Arraste o controle de tempo ou escolha uma data no calendário.
- As setas percorrem um dia por vez. Os limites são o início do período e o
  último dia já ocorrido. Não há resultados futuros simulados.
- Reproduzir percorre os dias nas velocidades 1×, 2× e 4×. Ao chegar ao fim,
  a reprodução para; um novo clique reinicia no começo.
- As barras verticais pequenas indicam quantas metas da equipe têm registros
  disponíveis em cada dia. O controle abaixo seleciona a data.
- O progresso financeiro, a atenção, as situações e as metas por pessoa usam
  a data consultada. Os filtros de pessoa e situação continuam funcionando.
- Registros de cada dia aparecem abaixo das metas. Clique em um registro ou
  em uma meta para consultar o resumo e os registros daquela data.
- A consulta histórica é somente de leitura. Editar, registrar, repetir e criar
  metas continuam disponíveis na visão atual. Abrir cartão atual abre o cartão
  real do Trello, e não uma cópia antiga.
- Filtrar, trocar a data ou abrir uma meta pausa a reprodução. Ocultar a página
  também pausa. Há suporte ao teclado no controle de tempo e ao movimento reduzido.
- Visão atual sai da consulta e busca os dados mais recentes do Trello. Trocar
  mês ou trimestre também encerra a consulta histórica.

## O que pode ser reconstruído

Os valores quantitativos usam os registros existentes até a data escolhida,
com o último total daquele dia. Os registros antigos não têm horário: o passado
é exibido por dia completo; hoje é identificado como Até agora. O objetivo do
dia é recalculado com o saldo e os dias restantes daquela data, usando os mesmos
critérios da v22. O ritmo esperado mantém a referência até o dia anterior.

A partir desta versão, alterações de objetivo, período, responsável, avaliação
e encerramento guardam diferenças da configuração anterior no próprio cartão.
Mudanças no mesmo dia mantêm o estado final do dia. Versões anteriores à captura
não podem ser recuperadas: nesses casos, a tela informa que usa a configuração
mais antiga disponível. Títulos dos cartões continuam usando o título atual.

A v22 não guardava histórico de etapas. A v23 passa a guardar observações das
contagens ao carregar o painel na visão atual ou abrir a meta, quando houver
permissão de escrita. Não há servidor capturando alterações com o Power-Up
fechado. Entre observações, é mostrada a última contagem conhecida com sua data.
Antes da primeira observação, a situação é Sem histórico; a checklist atual
nunca é aplicada a uma data antiga sem observação.

A consulta não grava dados nem observa etapas. Reproduzir o período não faz
chamadas ao Trello a cada passo. Na visão atual, observações iguais no mesmo dia
não geram outra gravação. Atualizações de valores e configurações mantêm as
permissões e a verificação de conflitos existentes.

## Histórico incompleto e armazenamento

A v22 pode ter agrupado registros de um mesmo dia ou removido os mais antigos
para caber no cartão. A consulta não recupera dados removidos. Lacunas aparecem
como Sem histórico, e o financeiro não mostra uma porcentagem se houver valores
necessários ausentes. Quando há saldo preservado, ele é identificado e não vira
um lançamento inventado.

O histórico continua compacto e dentro do limite usado pela v22. Se necessário,
as observações e versões mais antigas são reduzidas primeiro, com indicação da
cobertura disponível. Novos cortes de valores guardam a data do saldo preservado.
O saldo atual e a lógica de compactação da v22 continuam preservados.

O painel continua usando as metas dos cartões abertos disponíveis no quadro,
em qualquer lista, como na v22. Cartões excluídos ou arquivados não são incluídos.
A navegação não cria, move ou reorganiza listas. A futura organização em listas
por colaboradora não foi implementada nesta atualização.

## Validação

Sintaxe de todos os JavaScripts e testes automatizados de reconstrução diária,
subtrações, percentuais mínimos e máximos, redução, versões de configuração,
reabertura, avaliações, etapas, lacunas, compactação, permissões, conflitos,
carregamento sem escrita, controles, filtros, reprodução, calendário, ano
bissexto, detalhe somente de leitura e retorno à visão atual.

Também foram verificadas as operações existentes de criação e retomada sem
cartão duplicado, registro, objetivo diário e rótulo Completo sem números.
A conferência visual no Trello permanece pendente: o ambiente de teste bloqueou
a abertura da prévia local no navegador.
