# Restauração completa da v22

Este pacote restaura a versão 22 do ZIP enviado. Não inclui a navegação pelo tempo.
Não é a v23 e não adiciona funcionalidades.

## Como aplicar

1. Envie TODOS os arquivos deste pacote ao repositório, substituindo os arquivos
   correspondentes. Preserve o seu js/config.js existente, que não foi incluído.
2. Espere a publicação terminar e recarregue o Trello com Ctrl + Shift + R.
3. Abra novamente o painel pelo botão Metas.

Não apague o repositório ou a pasta js antes de enviar. O pacote não inclui
chaves, tokens ou credenciais. O arquivo js/tempo.js da v23, caso tenha ficado
no repositório, não é carregado por esta restauração.

## Diagnóstico

Foi reproduzida em teste a mesma mensagem genérica do anexo quando painel.js
permanece na v23 e painel.html volta à v22: a página deixa de carregar tempo.js,
mas o painel da v23 tenta usar esse módulo.

Pacotes de atualização antigos podem conter somente parte dos arquivos. Por
isso, este pacote contém todos os arquivos da aplicação v22, exceto config.js,
para evitar sobras de arquivos de aplicação da v23. A aplicação hospedada não
foi inspecionada, então a causa exata da sua publicação ainda não foi confirmada.

A única mudança técnica sobre o código da v22 do anexo são as referências de
cache dos HTMLs, agora ?v=22-restauracao-1. Os JavaScripts e o CSS são os originais
da v22 enviada. Não há necessidade demonstrada de apagar ou migrar os dados das
metas: a v22 lê os campos adicionais da v23 sem usá-los.

## Validação

Sintaxe dos JavaScripts; reprodução da mistura de versões; carregamento do
painel v22 com histórico compacto e campos adicionais da v23; cálculos de
metas quantitativas, etapas e avaliações. Não foi realizada edição remota ou
exclusão de dados no Trello.
