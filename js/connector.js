/* Conector do Power-Up Metas: diz ao Trello onde cada parte aparece */
(function () {
  var M = window.Metas;
  var base = window.location.href.replace(/[^/]*$/, '');
  var ICONE = { light: base + 'img/icone-claro.svg', dark: base + 'img/icone-escuro.svg' };

  function abrirPainel(t) {
    return t.modal({ url: './painel.html', fullscreen: true, title: 'Metas' });
  }
  // Editar e transformar em meta abrem o painel direto no formulário
  function abrirFormulario(t, cardId, modo, titulo) {
    return t.modal({ url: './painel.html', fullscreen: true, title: titulo, args: { view: 'form', modo: modo, cardId: cardId } });
  }

  // Cada selo é recalculado a cada refresh, com os dados mais novos do cartão
  function selo(t, montar) {
    return {
      dynamic: function () {
        return Promise.all([t.get('card', 'shared', M.CHAVE), t.card('badges')]).then(function (res) {
          var m = res[0];
          if (!m) return { text: '' };
          var r = M.avaliar(m, res[1].badges);
          return montar(m, r) || { text: '' };
        });
      }
    };
  }

  TrelloPowerUp.initialize({
    'board-buttons': function () {
      return [{ icon: ICONE, text: 'Metas', callback: abrirPainel, condition: 'always' }];
    },

    'card-badges': function (t) {
      return t.get('card', 'shared', M.CHAVE).then(function (meta) {
        if (!meta) return [];
        return [
          selo(t, function (m, r) { return { text: M.textoBadge(m, r), color: r.info.badge, refresh: 300 }; }),
          // Segundo selo: a meta do dia
          selo(t, function (m, r) {
            if (M.temMetaDia(m, r)) return { text: M.textoMetaDia(m, r), refresh: 300 };
            return null;
          })
        ];
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
          return [{ icon: ICONE.light, text: 'Editar meta', callback: function (tt) { return abrirFormulario(tt, cardId, 'editar', 'Editar meta'); } }];
        }
        return [{ icon: ICONE.light, text: 'Transformar em meta', callback: function (tt) { return abrirFormulario(tt, cardId, 'converter', 'Transformar em meta'); } }];
      });
    }
  }, {
    appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined,
    appName: M.CFG.appName
  });
})();
