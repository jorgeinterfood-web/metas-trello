# Power-Up Metas, versão 16

## Atualizar a versão 15

Substitua os arquivos correspondentes no GitHub, mantendo config.js, ícones e
arquivos não incluídos. Todos os arquivos estão completos. Não há nova-meta.html.
Após publicar, recarregue o Trello e reabra cartões e painel. As referências
passaram a ?v=16.

## Ajustes

- A largura comum das tags agora depende somente do maior texto presente na
  tela, com seu padding. Foi retirada toda a reserva para nomes ou percentuais
  hipotéticos. A largura pode diminuir quando os textos ficam menores e crescer
  se um valor real precisar de mais espaço. Todas as tags dessa tela continuam
  com a mesma largura. O fallback do CSS, caso a medição não esteja disponível,
  foi reduzido para 128px.
- Atingido foi substituído por Completo. Essa tag não apresenta porcentagem ou
  valor, no cartão aberto, no cartão fechado, nas etapas, nas taxas e no resumo
  financeiro. O filtro da equipe correspondente passou a Completos.
- O objetivo diário exatamente atingido também usa Completo sem número. Quando
  o objetivo diário é ultrapassado, a situação Superado continua própria e mantém
  sua porcentagem. O complemento "no dia" no selo fechado apenas identifica que
  se trata do objetivo diário.
- Cálculos, máscara por centavos e operações Somar/Subtrair foram preservados.

## Validação

Sintaxe dos JavaScripts; testes de cálculos, registros, validações, permissões,
conflitos, formulário, painel, histórico, largura das tags e novo texto de
conclusão. Testes específicos verificam que metas incompletas não recebem o texto
Completo por arredondamento. A aparência deve ser conferida no Trello.
Nenhuma alteração foi feita remotamente.
