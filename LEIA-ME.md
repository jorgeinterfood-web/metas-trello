# Power-Up Metas, versão 11

## Atualizar a versão 10

Substitua no GitHub os arquivos correspondentes aos deste ZIP. Cada arquivo está
completo. Preserve js/config.js, os ícones e os outros arquivos da versão 10.
Remova nova-meta.html do repositório, caso ainda exista: ele não é utilizado e
não faz parte deste pacote. Não apague cartões ou dados do Power-Up.

Depois da publicação, recarregue o Trello e reabra os cartões e o painel.
As referências dos arquivos foram atualizadas para ?v=11.

## Mudanças

- Adiantado e Atrasado são os rótulos curtos de ritmo. As situações do progresso
  usam o masculino de modo consistente: Atingido, Não atingido, Superado.
- Cartão aberto, cartão fechado e painel usam as mesmas situações. Os selos
  fechados acrescentam apenas o dado de progresso e o contexto Dia.
- Objetivo do dia substitui Objetivo de hoje.
- Progresso da meta e Objetivo do dia usam o mesmo tamanho e peso dos valores.
- Quando há mais de um feedback abaixo da barra, ele aparece em lista com bullets.
- Fragmentos relacionados usam o separador |, sem confundir pontos de milhar com
  finais de frases. Exemplo: Esperado até ontem: R$ 110.526,32 | R$ 25.526,32 atrás
  do esperado.
- O saldo final usa: Faltam R$ ... para o objetivo final.
- O excedente diário em dinheiro usa: Excedente do dia: 60.000,00.
- Removidos Como é calculado, Corrigir o total, Exportar histórico e Exportar e
  resumir histórico, incluindo seus manipuladores e a alternância para corrigir.
- A seção de histórico e a consulta de seus registros continuam disponíveis.
- O limite de armazenamento continua protegido: atingir o limite impede novos
  registros e orienta criar outra meta. Não há exclusão automática do histórico.

## Registro de valores

Metas acumuladas: campo Valor do registro e botão Registrar valor. O valor
informado é somado ao total. Uma prévia mostra:
Total atual: R$ 85.000,00 | Após o registro: R$ 85.500,00

Nesse campo, digitar 500 significa R$ 500,00. Use vírgula para centavos, por
exemplo 500,50. A moeda tem prefixo R$ e recebe duas casas ao sair do campo.
A inclusão de observação é opcional. Não há alternância para corrigir o total.

Taxas e metas de redução: campo Percentual atual ou Valor atual e botão Atualizar
valor. Nesses casos o número substitui o valor atual; não é somado.

O formulário de criação/edição mantém a entrada monetária da versão 10 e sua
orientação específica; a mudança de digitação acima é da área de registro.

## Mantido da versão 10

Validação de números, períodos, permissões, unidades, objetivo diário estável,
consolidado com a mesma base do detalhe, revisão por gravação, alertas e recuperação
de criações parciais. Não foi feita alteração no GitHub nem no Trello.

Gravações simultâneas entre computadores continuam limitadas pela API t.set,
que não oferece transação. As proteções existentes não são exclusão mútua global.
Registros antigos já removidos por versões anteriores não podem ser recuperados.

## Validação

Sintaxe de todos os JavaScripts e testes com Trello simulado: cálculos, validação,
permissões, conflito, limite de armazenamento, formulário, painel e detalhes.
Testes adicionais conferem os textos solicitados, os bullets, os separadores,
a ausência das ações removidas, a igualdade dos rótulos e o registro de 500 como
R$ 500,00. A aparência e a integração autenticada devem ser conferidas no Trello.
