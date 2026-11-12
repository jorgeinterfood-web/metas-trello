# Power-Up Metas, versão 14

## Atualizar a versão 13

Substitua no GitHub os arquivos correspondentes aos deste ZIP, que estão completos.
Preserve config.js, ícones e arquivos não incluídos. Não há nova-meta.html neste
pacote. Recarregue o Trello após a publicação; as referências usam ?v=14.

## Tags das barras

Todas as tags de barras e as tags das linhas da equipe têm largura comum. A
reserva considera o maior nome de situação com 000,00%. A largura é medida usando
a fonte real. Se algum número efetivamente exibido precisar de mais espaço,
todas as tags dessa tela são ampliadas. A precisão dos percentuais não mudou.
O CSS mantém largura de reserva se a medição não estiver disponível.

## Cabeçalho

O nome do responsável não aparece mais no cabeçalho do detalhe. O período começa
com Período: e as datas usam fonte 16px com peso 600. Informações de importância e
encerramento foram preservadas. Avisos sobre associação ao cartão continuam
indicando o responsável quando isso for necessário para resolver o problema.

## Somar e subtrair

Nas metas de dinheiro/quantidade acumuladas, o campo Valor do registro tem os
botões Somar e Subtrair. Informe sempre o valor positivo da operação. A máscara
por centavos foi preservada. A prévia mostra o resultado de cada operação.
Subtrair não pode deixar o total negativo; somar não pode ultrapassar o limite
numérico já configurado. Ambos geram um registro de histórico e atualizam barras.

Enter usa Somar. Não há mensagem de sucesso após o registro, conforme solicitado.
Taxas percentuais e metas de redução continuam com registro do valor atual pelo
botão Registrar, pois não são o campo acumulativo Valor do registro.

## Equipe

O bloco financeiro ganhou o mesmo contorno/raio do componente tab usado nos
outros blocos, com padding interno. O título passou para 20px, rótulos dos valores
para 16px e números para 20px. A projeção permanece removida.

Os filtros usam plural quando aplicável: Adiantados, Atrasados, Atingidos,
Superados, Pendentes, Não atingidos e Parciais. No ritmo, Adiantados, Atrasados e
Atingidos ficam sempre visíveis, mesmo com contagem zero. As demais situações
aparecem quando há metas correspondentes. Também estão cobertos A iniciar,
A avaliar, Sem etapas, Indisponíveis e Sem dias úteis. Cada meta individual mantém
sua tag no singular; plural é utilizado nos filtros de grupos.

## Por que Em andamento aparece em algumas barras

O progresso total compara o realizado com o ritmo acumulado: No ritmo, Adiantado
ou Atrasado; ao alcançar o alvo, Atingido. Já a barra do objetivo do dia usa
Em andamento até cumprir o objetivo diário, passando a Atingido ou Superado.
Os dois estados não são equivalentes: uma meta pode estar atrasada no período e
já ter superado o objetivo do dia.

## Validação

Sintaxe de todos os JavaScripts e testes com Trello simulado para cálculos,
validações, permissões, conflitos, histórico, formulário, painel e detalhe.
Testes específicos verificam cabeçalho, soma e subtração com centavos, total
negativo rejeitado, cobertura de todas as situações nos filtros e cálculo de
largura com reserva e expansão para números maiores. A aparência e a integração
autenticada devem ser conferidas no Trello. Não houve alteração remota.
