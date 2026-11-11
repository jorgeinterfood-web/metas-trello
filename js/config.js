// Configuração do Power-Up Metas.
// A chave da API (appKey) identifica o Power-Up perante o Trello e não é secreta:
// ela fica visível no navegador de qualquer pessoa que use o Power-Up.
// O que é secreto é o token de cada pessoa, que o Trello guarda no navegador dela
// e que nunca deve ser colado neste arquivo.
window.METAS_CONFIG = {
  appKey: 'c63c136ad0b038e6f291d5f75991dc40',
  appName: 'Metas',

  // Nomes exatos das listas no quadro
  listaMetas: 'Metas',
  listaEncerradas: 'Metas encerradas',

  // A partir de quantos dias sem atualização a meta é sinalizada
  diasSemAtualizacao: 5,

  // Pontos facultativos tratados como dias sem expediente (Carnaval e Corpus Christi)
  pontosFacultativosSemExpediente: true,

  // Feriados locais, no formato 'AAAA-MM-DD' (os nacionais já são calculados)
  feriadosExtras: []
};
