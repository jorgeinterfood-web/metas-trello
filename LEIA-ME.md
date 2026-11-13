# Power-Up Metas, restauração da versão 22

Este pacote volta o Power-Up para a versão 22, antes dos clientes (versões 24
e 25). Traz todos os arquivos da aplicação, menos o config.js, que continua o
mesmo.

## Como publicar

1. Substitua no GitHub todos os arquivos deste pacote, de uma vez.
2. Mantenha o js/config.js.
3. Pode apagar o js/tempo.js, se ainda estiver no repositório.
4. Peça para quem estiver com o Trello aberto recarregar a página.

As referências usam ?v=22-restauracao-2, diferente de todas as versões
anteriores, para o navegador não reaproveitar arquivos guardados da 24 ou da 25.

## Se a versão 24 ou 25 chegou a ser usada

- Registros feitos com cliente continuam gravados. A versão 22 mostra um número
  depois do nome de quem registrou no histórico e preserva o cliente ao gravar.
- Metas criadas com o tipo Clientes passam a aparecer como metas de quantidade
  comuns, com registro manual, e deixam de ser contadas sozinhas.

## Validação

O código é idêntico, arquivo por arquivo, ao da versão 22. Só mudaram as
referências de cache das três páginas e este arquivo.
