# Power-Up Metas, versão 15

## Atualizar a versão 14

Substitua os arquivos correspondentes no GitHub. Todos os arquivos do ZIP estão
completos. Preserve config.js, ícones e os arquivos que não estão no pacote.
Não há nova-meta.html. Após a publicação, recarregue o Trello e reabra os cartões
e o painel. As referências usam ?v=15.

## Ajustes solicitados

- Período: e as datas usam exatamente o mesmo tamanho de 16px, peso 600 e
  entrelinha de 24px.
- Progresso da meta foi renomeado para Progresso geral.
- Variações negativas do histórico aparecem em vermelho, inclusive em metas
  de redução. Essa cor indica o sinal da operação; não altera a avaliação de
  sucesso da meta. Variações positivas continuam verdes.
- Tags mais compactas, mantendo largura comum. A medição considera apenas os
  nomes que podem acompanhar percentuais, com uma casa decimal como na interface,
  e o maior texto efetivamente exibido. Mensagens como Etapas indisponíveis não
  recebem mais uma reserva fictícia de percentual. A reserva do CSS é 164px;
  números maiores continuam ampliando a largura comum se necessário.
- Separação entre Evolução e Histórico: vertical quando estão lado a lado e
  horizontal quando o espaço disponível faz os blocos ficarem empilhados.

Somar/Subtrair, máscara por centavos, filtros e cálculos foram preservados.

## Validação

Sintaxe dos JavaScripts e testes com Trello simulado: unidades, cálculos,
validações, permissões, conflitos, formulário, painel, registro e subtração,
histórico, nomes dos títulos e redução da largura uniforme das tags.
A aparência deve ser conferida no Trello. Não houve alteração remota.
