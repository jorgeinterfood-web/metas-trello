# Power-Up Metas, versão 10

## Atualizar

Este pacote contém os arquivos alterados por inteiro. Substitua os arquivos de
mesmo nome no GitHub, mantendo js/config.js e os ícones já existentes. Os HTMLs
usam ?v=10. Após a publicação do GitHub Pages, recarregue o Trello e reabra o
painel. nova-meta.html agora é um encaminhamento para o painel atual.

Antes da atualização, guarde uma cópia do código atual. Não é necessário apagar
ou recriar cartões. Os dados existentes continuam sendo lidos.

## Textos e unidades

- Unidades comuns em minúsculas; siglas são preservadas.
- Campo Unidade no plural e campo Unidade no singular, com sugestão editável.
- Metas antigas usam a normalização de exibição. Confira unidades personalizadas
  ao editar; não há algoritmo capaz de inferir todos os plurais com segurança.
- Situações totais: No ritmo, Adiantada, Abaixo do ritmo, Atingida, Prazo
  encerrado, Encerrada sem atingir. Taxas: No objetivo / Fora do objetivo.
- Situação diária: Em andamento, Atingido ou Superado, na seção Objetivo de hoje.
- Filtros por situação, sem depender da cor.
- Ajuda de cálculo recolhida por padrão; sucessos rotineiros curtos.
- Mensagens técnicas são traduzidas para instruções em português.

## Cálculos e períodos

- O progresso mede o avanço entre o valor inicial e o objetivo.
- O consolidado financeiro usa a mesma base, somando os avanços e os objetivos
  líquidos das metas de crescimento em dinheiro. Não inclui reduções.
- O consolidado inclui apenas metas com as mesmas datas do período selecionado.
  As demais continuam listadas por pessoa, sem serem somadas como se fossem mensais.
- Ritmo: comparação com os dias encerrados, até ontem. Evita atraso artificial
  na manhã do primeiro dia. Depois do prazo, considera o período completo.
- Objetivo diário: saldo no início de hoje dividido pelos dias restantes,
  arredondado para cima na precisão da meta; permanece fixo durante o dia.
- Quantidades podem ter casas decimais se os valores iniciais/objetivos forem
  configurados com elas. Entradas incompatíveis são rejeitadas, não convertidas
  silenciosamente para outro número.
- Taxas: valores entre 0 e 100. Dinheiro/quantidade: não negativos e até 1 trilhão.
- Não se aceitam períodos sem dias úteis quando a contagem é em dias úteis.
- Novos registros são permitidos apenas dentro das datas da meta e enquanto ela
  estiver aberta. Para corrigir um período passado, um administrador deve editar
  explicitamente suas datas e reabrir a meta. Não há lançamento retroativo.
- O dia do negócio é America/Sao_Paulo e o vencimento do cartão é 23:59:59, -03:00.
  Configurações opcionais fusoHorario/deslocamentoUTC podem alterar esses padrões;
  devem ser compatíveis entre si. Não é necessário adicionar nada ao config atual.

## Etapas e autorização

A meta usa sua checklist vinculada, não todas as listas do cartão. Metas novas
salvam checklistId. Nas antigas, usa a única checklist chamada Etapas, ou a única
checklist existente. Havendo ambiguidade, mantenha uma única checklist chamada
Etapas. O progresso só é mostrado após obter os itens corretos pela API.

É necessário autorizar o acesso ao Trello para carregar etapas e sincronizar os
campos nativos. Sem autorização, a interface informa o que não foi carregado ou
sincronizado, sem inventar progresso. A autorização continua read,write / 30 dias.

## Gravações e recuperação

- Permissão efetiva de escrita e papel do usuário são reavaliados ao salvar.
- Revisão por meta detecta cópias antigas e conflitos visíveis. Web Locks serializa
  abas da mesma origem no mesmo navegador, quando disponível.
- LIMITAÇÃO: t.set não fornece transação ou compare-and-swap. Revisão, checagem após
  gravação e locks locais reduzem o risco, mas não garantem exclusão mútua entre
  computadores. Autorização inviolável por responsável e gravações atômicas exigem
  um serviço de dados com autenticação; o GitHub Pages sozinho não o oferece.
- Não mantenha versões antigas do Power-Up abertas ao atualizar.
- Falhas preservam valor e observação; há Atualizar dados para resolver conflitos.
- Criações parciais retomam o mesmo cartão na mesma sessão. Marcadores na descrição
  ajudam a reencontrar operações com resposta perdida. Se fechar a tela durante
  uma criação incompleta, confira o cartão criado antes de iniciar outra.
- Repetição usa marcador de origem e período para reencontrar cartões já gerados
  pela v10 e completar checklists. Cartões repetidos por versões anteriores não
  têm esse marcador: confira o período antes de repetir.
- Alterações de tipo, formato, unidade, precisão ou valor inicial são bloqueadas
  quando há registros. Crie outra meta para mudar o significado dos valores.
- Responsável e datas são sincronizados sem remover outros membros do cartão;
  falhas de sincronização aparecem como sucesso parcial.
- Conclusão nativa do cartão é sincronizada após salvar quando houver autorização.
  Reabrir também tenta mover o cartão de volta à lista Metas.

## Histórico

Não há mais exclusão automática para liberar espaço. Ao atingir a margem de
3.800 caracteres, o registro é recusado e permanece preenchido na tela.

Exportar histórico baixa JSON com os dados da meta. Ver histórico completo mostra
os registros ainda disponíveis no cartão. Exportar e resumir histórico, exclusivo
de administradores, primeiro inicia o download e depois pede confirmação explícita.
Confira o arquivo salvo antes de confirmar. O resumo mantém o último registro e
sua base anterior; o gráfico indica somente os pontos disponíveis, sem recriar
registros removidos. Arquivos exportados podem conter nomes e observações da equipe.

Registros que versões antigas já excluíram não podem ser recuperados pelo código.

## Atualização e interface

O painel recarrega dados a cada 30 segundos e quando o Trello sinaliza mudanças,
sem substituir formulários ou rascunhos de registros/avaliações. Há atualização
manual no painel. A leitura de dados falha explicitamente, em vez de esconder metas.
Valores continuam visíveis em telas estreitas. Títulos têm acesso ao texto completo.

## Validação

Sintaxe de todos os JavaScripts, testes de cálculos, unidades, precisão, validação,
permissões, conflitos, limite do histórico, geração do detalhe, registro diário,
consolidado, avaliações na atenção e retomada de criação após erro, com Trello
simulado. Não houve alteração no GitHub ou no Trello. A inspeção visual e a
integração autenticada precisam ser verificadas no Trello após publicar.
