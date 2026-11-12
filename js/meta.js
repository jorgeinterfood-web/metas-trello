/* Seção Meta no verso do cartão */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');

  function ajustar() { t.sizeTo('#app').catch(function () {}); }

  function carregar() {
    return Promise.all([M.ler(t, 'card'), t.card('id', 'name', 'members', 'badges'), M.contexto(t)]).then(function (res) {
      if (!res[0]) { app.innerHTML = ''; ajustar(); return; }
      return M.prepararCard(t,res[1],res[0]).then(function () { return M.Tempo.observar(t,res[1],res[0]); }).then(function () { M.detalhe(app, { t: t, escopo: 'card', meta: res[0], card: res[1], ctx: res[2], ajustar: ajustar }); });
    }).catch(function (e) {
      app.innerHTML = '<p class="erro">Não foi possível carregar a meta. ' + esc(M.erroUsuario(e)) + '</p>';
      ajustar();
    });
  }

  M.aplicarTema(t);
  t.render(function () { M.aplicarTema(t); carregar(); });
})();
