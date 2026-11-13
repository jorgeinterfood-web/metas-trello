/* Configurações do Power-Up: visual escolhido por pessoa */
(function () {
  var M = window.Metas;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var OPCOES = [['trello', 'Trello'], ['shadcn', 'shadcn']];

  function ajustar() { t.sizeTo('#app').catch(function () {}); }

  function desenhar(atual, nota) {
    app.innerHTML = (nota || '') +
      '<div class="campo"><span class="rotulo" id="rotVisual">Visual</span>' +
      '<div class="seg" role="group" aria-labelledby="rotVisual">' + OPCOES.map(function (o) {
        return '<button type="button" data-visual="' + o[0] + '" aria-pressed="' + (o[0] === atual) + '">' + o[1] + '</button>';
      }).join('') + '</div></div>' +
      '<p class="ajuda">Vale só para você. As janelas do Metas que estiverem abertas mudam ao serem reabertas.</p>';
    Array.prototype.forEach.call(app.querySelectorAll('.seg button'), function (b) {
      b.onclick = function () { escolher(b.getAttribute('data-visual'), atual); };
    });
    ajustar();
  }

  function escolher(v, anterior) {
    if (v === anterior) return;
    desenhar(v);
    M.salvarVisual(t, v).catch(function (e) {
      M.marcarVisual(anterior);
      desenhar(anterior, M.nota('erro', 'Não foi possível salvar o visual. ' + M.erroUsuario(e), { id: 'tentar', rotulo: 'Tentar de novo' }));
      document.getElementById('tentar').onclick = function () { escolher(v, anterior); };
    });
  }

  M.aplicarTema(t);
  t.render(function () {
    M.aplicarTema(t);
    return M.aplicarVisual(t).then(function (v) { desenhar(v); });
  });
})();
