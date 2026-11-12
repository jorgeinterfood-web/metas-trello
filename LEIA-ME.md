# Power-Up Metas, versão 12

## Atualizar a versão 11

Substitua no GitHub os arquivos correspondentes aos deste ZIP. Cada arquivo está
completo. Preserve js/config.js, os ícones e os demais arquivos já existentes.
Não há nova-meta.html neste pacote; remova a página antiga se ainda existir.
Após a publicação, recarregue o Trello e reabra o painel e os cartões.
As referências agora usam ?v=12.

## Ajustes solicitados

- Restaurada a máscara monetária por centavos na área de registro: 500 vira 5,00;
  50029 vira 500,29. Não há mais a formatação introduzida na versão 11 que tratava
  500 digitado diretamente como 500 reais.
- Listas de feedback com marcadores disc explícitos e estilos com prioridade
  sobre o CSS do Trello, incluindo o marcador visível.
- Separador entre trechos relacionados alterado de | para ● em mensagens,
  prévias e selos do cartão. A barra vertical usada internamente nas datas do
  formulário não foi alterada, pois não é texto apresentado ao usuário.
- Valores e o trecho "de R$ ..." separados por um espaço tipográfico normal,
  sem o gap adicional de 8px entre os dois trechos.
- Rótulos da área de registro seguem o padrão dos demais rótulos de campo:
  12px, peso 600 e cor secundária.
- Botão com o texto Registrar, alinhado ao centro vertical da entrada de valor.
  O rótulo ocupa uma linha própria acima do campo; não participa desse alinhamento.
- Preservados os ajustes de situações, feedbacks e histórico da versão 11.

## Validação

Sintaxe dos JavaScripts; testes de valores, máscara por centavos, registro,
permissões, conflitos, histórico, formulário, consolidado, alertas e geração dos
componentes com Trello simulado. Os testes verificam também as classes de rótulo,
o espaço normal antes de "de", os separadores e as ações removidas.
A renderização real e a integração autenticada devem ser conferidas no Trello.
Nenhum dado foi alterado no GitHub ou no Trello.
