/* Conector do Power-Up Metas: diz ao Trello onde cada parte aparece */
(function () {
  var M = window.Metas;
  var base = window.location.href.replace(/[^/]*$/, '');
  var ICONE = { light: base + 'img/icone-claro.svg', dark: base + 'img/icone-escuro.svg' };

  function abrirPainel(t) {
    return t.modal({ url: './painel.html', fullscreen: true, title: 'Metas' });
  }
  function abrirFormulario(t, args, titulo) {
    return t.modal({ url: './nova-meta.html', args: args, title: titulo, height: 760 });
  }

  TrelloPowerUp.initialize({
    'board-buttons': function () {
      return [{ icon: ICONE, text: 'Metas', callback: abrirPainel, condition: 'always' }];
    },

    'card-badges': function (t) {
      return t.get('card', 'shared', M.CHAVE).then(function (meta) {
        if (!meta) return [];
        return [{
          dynamic: function () {
            return Promise.all([t.get('card', 'shared', M.CHAVE), t.card('badges')]).then(function (res) {
              var m = res[0];
              if (!m) return { text: '' };
              var r = M.avaliar(m, res[1].badges);
              return { text: M.textoBadge(r), color: r.info.badge, refresh: 300 };
            });
          }
        }, {
          dynamic: function () {
            return Promise.all([t.get('card', 'shared', M.CHAVE), t.card('badges')]).then(function (res) {
              var m = res[0];
              if (!m) return { text: '' };
              var r = M.avaliar(m, res[1].badges);
              if (r.pendente || r.parada) return { text: 'Atualizar progresso', color: 'orange', refresh: 300 };
              return { text: '', refresh: 300 };
            });
          }
        }];
      });
    },

    'card-back-section': function (t) {
      return t.get('card', 'shared', M.CHAVE).then(function (meta) {
        if (!meta) return null;
        return {
          title: 'Meta',
          icon: ICONE.light,
          content: { type: 'iframe', url: t.signUrl('./meta.html'), height: 360 }
        };
      });
    },

    'card-buttons': function (t) {
      return Promise.all([M.ehAdmin(t), t.get('card', 'shared', M.CHAVE)]).then(function (res) {
        if (!res[0]) return [];
        var cardId = t.getContext().card;
        if (res[1]) {
          return [{ icon: ICONE.light, text: 'Editar meta', callback: function (tt) { return abrirFormulario(tt, { cardId: cardId, modo: 'editar' }, 'Editar meta'); } }];
        }
        return [{ icon: ICONE.light, text: 'Transformar em meta', callback: function (tt) { return abrirFormulario(tt, { cardId: cardId, modo: 'converter' }, 'Transformar em meta'); } }];
      });
    }
  }, {
    appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined,
    appName: M.CFG.appName
  });
})();
