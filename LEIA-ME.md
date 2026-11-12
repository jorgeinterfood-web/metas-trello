# Power-Up Metas, versão 13

## Atualizar a versão 12

Substitua no GitHub os arquivos correspondentes aos deste ZIP. Cada arquivo está
completo. Preserve config.js, ícones e os demais arquivos da versão 12.
Não há nova-meta.html neste pacote. Recarregue o Trello após a publicação e
reabra o painel e os cartões. As referências agora usam ?v=13.

## Ajustes

- Registros de valor bem-sucedidos não exibem mensagem de confirmação. Os dados
  e as barras são atualizados e o campo é limpo. Falhas continuam sendo informadas,
  com preservação do valor digitado. A máscara por centavos foi mantida.
- Rótulos de entrada com o mesmo tamanho, peso e cor de Progresso da meta.
- Campo de entrada reduzido de 380 para 200px, com adaptação a telas estreitas.
- Removida a opção Incluir observação do registro. Observações que já existiam
  continuam preservadas e visíveis no histórico. O comentário de uma avaliação
  não foi alterado.
- Feedback principal: Abaixo do esperado: R$ ... ou Acima do esperado: R$ ...,
  seguido de Restante para o objetivo final: R$ ... . Sem repetir o valor esperado.
- Feedbacks múltiplos continuam em lista com marcadores visíveis.
- Removido o separador de bolinha grande. Os selos usam dois-pontos.
- A situação e a porcentagem aparecem juntas à direita de cada barra, com espaço
  reservado para o selo. Não existe mais um selo de situação separado acima.
- Cartão aberto, cartão fechado e linhas da equipe usam a mesma função para o
  selo total, por exemplo Atrasado: 21,4%. O selo diário usa a mesma situação e a
  mesma porcentagem; no cartão fechado acrescenta apenas "no dia" para indicar
  qual das duas barras está representada.
- Taxas que alcançam o objetivo usam Atingido. As que ainda não alcançaram usam
  Pendente. As situações são iguais em cartões, detalhes e filtros do painel.
- Removidos projeção financeira e aviso sobre quando a projeção apareceria.
- Resumo da equipe com título Progresso financeiro da equipe e valores nomeados
  Realizado e Objetivo. A barra usa o mesmo padrão de selo combinado das metas.
  Quando há valores iniciais não nulos, uma nota esclarece que os números medem
  o avanço a partir deles. A fórmula do consolidado foi preservada.

## Validação

Sintaxe de todos os JavaScripts e testes com o Trello simulado: cálculos,
validações, permissões, conflitos, histórico, retomada de criação, detalhes,
consolidado e avaliações. Testes específicos conferem textos, selo combinado,
padronização entre superfícies, máscara por centavos e ausência de confirmação,
projeção e opção de observação no registro.

A aparência e a integração autenticada ainda devem ser verificadas no Trello.
Nenhuma alteração foi feita no GitHub ou nos dados do Trello.
