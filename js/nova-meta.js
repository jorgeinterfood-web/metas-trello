/* Formulário de meta: criar, transformar cartão em meta, editar */
(function () {
  var M = window.Metas;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var $ = function (id) { return document.getElementById(id); };
  var modo = t.arg('modo') || 'criar';
  var cardId = t.arg('cardId');
  var S = { tipo: 'q', fmt: 'r' };
  var original = null, CTX = null, nomeCartao = '';

  var AJUDA = {
    q: 'Um valor com alvo: faturamento, quantidade de clientes, taxa de entrega no prazo. O progresso vem dos registros de valor.',
    e: 'A meta é dividida em entregas. O progresso é a parte das etapas já marcadas na checklist do cartão.',
    a: 'Sem número nem etapas. No fim do período, um admin avalia: não atingida, parcial, atingida ou superada.'
  };

  function erro(msg) { var e = $('erro'); e.textContent = msg; e.classList.toggle('oculto', !msg); if (msg) e.scrollIntoView({ block: 'nearest' }); }
  function ajustar() { t.sizeTo(document.body).catch(function () {}); }

  function aplicarTipo() {
    document.querySelectorAll('[data-tipo]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tipo') === S.tipo)); });
    $('tipoAjuda').textContent = AJUDA[S.tipo];
    $('blocoQ').classList.toggle('oculto', S.tipo !== 'q');
    $('blocoE').classList.toggle('oculto', S.tipo !== 'e');
    $('blocoA').classList.toggle('oculto', S.tipo !== 'a');
    $('campoLembrete').classList.toggle('oculto', S.tipo !== 'q');
    ajustar();
  }
  function aplicarFmt() {
    document.querySelectorAll('[data-fmt]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fmt') === S.fmt)); });
    document.querySelectorAll('.pre').forEach(function (s) { s.textContent = S.fmt === 'r' ? 'R$' : ''; });
    document.querySelectorAll('.suf').forEach(function (s) { s.textContent = S.fmt === 'p' ? '%' : ''; });
    $('campoUnidade').classList.toggle('oculto', S.fmt !== 'n');
  }
  function addEtapa(txt) {
    var n = $('etapas').children.length + 1;
    var d = document.createElement('div');
    d.className = 'linha';
    d.innerHTML = '<input class="campo-solto" type="text" maxlength="120" aria-label="Etapa ' + n + '" placeholder="Etapa ' + n + '"><button type="button" class="btn btn-icone btn-texto" aria-label="Remover etapa ' + n + '">×</button>';
    d.querySelector('input').value = txt || '';
    d.querySelector('button').onclick = function () { d.remove(); ajustar(); };
    $('etapas').appendChild(d);
    ajustar();
  }

  // Datas do período a partir do início
  function preencherPeriodo() {
    var p = $('periodo').value;
    if (p === 'livre' || !$('ini').value) return;
    var d = M.parse($('ini').value), y = d.getFullYear(), m = d.getMonth(), a, b;
    if (p === 'mes') { a = new Date(y, m, 1); b = new Date(y, m + 1, 0); }
    if (p === 'tri') { var q = Math.floor(m / 3) * 3; a = new Date(y, q, 1); b = new Date(y, q + 3, 0); }
    if (p === 'sem') { var s = m < 6 ? 0 : 6; a = new Date(y, s, 1); b = new Date(y, s + 6, 0); }
    $('ini').value = M.iso(a); $('fim').value = M.iso(b);
  }

  function montarMembros(membros, selecionado) {
    var sel = $('dono');
    membros.slice().sort(function (a, b) { return a.fullName.localeCompare(b.fullName, 'pt-BR'); }).forEach(function (m) {
      var o = document.createElement('option');
      o.value = m.id; o.textContent = m.fullName;
      if (m.id === selecionado) o.selected = true;
      sel.appendChild(o);
    });
  }

  function preencher(meta) {
    S.tipo = meta.tipo; S.fmt = meta.fmt || 'r';
    $('imp').value = String(meta.imp || 1);
    $('periodo').value = 'livre';
    $('ini').value = meta.ini; $('fim').value = meta.fim;
    if (meta.tipo === 'q') {
      $('vIni').value = M.numBR(meta.vIni); $('alvo').value = M.numBR(meta.alvo);
      $('unit').value = meta.unit || ''; $('dir').value = meta.dir || 'up'; $('reg').value = meta.reg || 'acc'; $('ritmo').value = meta.ritmo || 'uteis';
    }
    $('crit').value = meta.crit || ''; $('oque').value = meta.oque || '';
    $('lembrete').value = meta.lembrete || 'seg'; $('quem').value = meta.quem || 'resp';
  }

  function coletar() {
    var dono = CTX.membros.filter(function (m) { return m.id === $('dono').value; })[0];
    if (!dono) throw new Error('Escolha o responsável pela meta.');
    var ini = $('ini').value, fim = $('fim').value;
    if (!ini || !fim) throw new Error('Preencha o início e o fim do período.');
    if (fim < ini) throw new Error('O fim do período precisa ser igual ou depois do início.');
    var meta = {
      dono: { id: dono.id, fullName: dono.fullName, initials: dono.initials || '' },
      tipo: S.tipo, imp: +$('imp').value, ini: ini, fim: fim,
      quem: $('quem').value, oque: $('oque').value.trim(),
      criadaEm: original ? original.criadaEm : M.hoje(),
      hist: original ? (original.hist || []) : [],
      aval: original ? original.aval || null : null,
      encerrada: original ? !!original.encerrada : false
    };
    if (S.tipo === 'q') {
      var v0 = M.lerNumero($('vIni').value), alvo = M.lerNumero($('alvo').value), dir = $('dir').value;
      if (isNaN(v0)) throw new Error('O valor inicial precisa ser um número. Use 0 se a meta começa do zero.');
      if (isNaN(alvo)) throw new Error('Informe o alvo da meta.');
      if (dir === 'up' && alvo <= v0) throw new Error('Em "quanto maior, melhor", o alvo precisa ser maior que o valor inicial.');
      if (dir === 'down' && alvo >= v0) throw new Error('Em "quanto menor, melhor", o alvo precisa ser menor que o valor inicial.');
      if (S.fmt === 'n' && !$('unit').value.trim()) throw new Error('Informe a unidade, por exemplo: clientes, páginas, pedidos.');
      meta.fmt = S.fmt; meta.vIni = v0; meta.alvo = alvo; meta.dir = dir; meta.unit = S.fmt === 'n' ? $('unit').value.trim() : '';
      meta.reg = $('reg').value; meta.ritmo = $('ritmo').value; meta.lembrete = $('lembrete').value;
    }
    if (S.tipo === 'a') {
      meta.crit = $('crit').value.trim();
      if (!meta.crit) throw new Error('Explique como a meta será avaliada, para a pessoa saber o que se espera.');
    }
    return meta;
  }

  function salvar(ev) {
    ev.preventDefault();
    erro('');
    var meta;
    try { meta = coletar(); } catch (e) { erro(e.message); return; }
    var btn = $('salvar'); btn.disabled = true;

    var p;
    if (modo === 'criar') {
      var titulo = $('titulo').value.trim();
      if (!titulo) { erro('Dê um título para a meta.'); btn.disabled = false; return; }
      var etapas = S.tipo === 'e' ? Array.prototype.map.call($('etapas').querySelectorAll('input'), function (i) { return i.value.trim(); }).filter(Boolean) : [];
      if (S.tipo === 'e' && !etapas.length) { erro('Inclua pelo menos uma etapa.'); btn.disabled = false; return; }
      var due = M.parse(meta.fim); due.setHours(18, 0, 0, 0);
      var start = M.parse(meta.ini); start.setHours(12, 0, 0, 0);
      var novo;
      p = M.garantirLista(t, M.CFG.listaMetas, 'top').then(function (lista) {
        return M.rest(t, 'POST', '/cards', { idList: lista.id, name: titulo + ' · ' + meta.dono.fullName, idMembers: meta.dono.id, start: start.toISOString(), due: due.toISOString(), pos: 'bottom' });
      }).then(function (card) {
        novo = card;
        return M.salvarMeta(t, card.id, meta);
      }).then(function () {
        if (!etapas.length) return null;
        return M.rest(t, 'POST', '/checklists', { idCard: novo.id, name: 'Etapas' }).then(function (cl) {
          return etapas.reduce(function (pr, nome) { return pr.then(function () { return M.rest(t, 'POST', '/checklists/' + cl.id + '/checkItems', { name: nome }); }); }, Promise.resolve());
        });
      }).then(function () { return t.closeModal(); }).then(function () { return t.showCard(novo.id); });
    } else {
      p = M.salvarMeta(t, cardId, meta).then(function () { return t.closeModal(); });
    }
    p.catch(function (e) {
      erro(e.message || 'Não foi possível salvar a meta.');
      if (e.code === 'AUTH') verificarAuth(); else btn.disabled = false;
    });
  }

  function verificarAuth() {
    if (modo !== 'criar') return Promise.resolve();
    if (!M.chaveConfigurada()) { $('blocoSemChave').classList.remove('oculto'); $('salvar').disabled = true; return Promise.resolve(); }
    return M.autorizado(t).then(function (ok) {
      $('blocoAuth').classList.toggle('oculto', ok);
      $('salvar').disabled = !ok;
    });
  }

  function iniciar() {
    var tarefas = [M.contexto(t)];
    if (cardId) tarefas.push(t.get(cardId, 'shared', M.CHAVE), t.cards('id', 'name'));
    Promise.all(tarefas).then(function (res) {
      CTX = res[0];
      if (!CTX.admin) {
        $('carregando').textContent = 'Só admins do quadro podem criar ou editar metas.';
        return;
      }
      original = res[1] || null;
      if (cardId) { var c = (res[2] || []).filter(function (x) { return x.id === cardId; })[0]; nomeCartao = c ? c.name : ''; }

      if (modo === 'criar') {
        var h = M.parse(M.hoje());
        $('ini').value = M.inicioMes(h.getFullYear(), h.getMonth()); $('fim').value = M.fimMes(h.getFullYear(), h.getMonth());
        addEtapa(''); addEtapa('');
      } else {
        $('campoTitulo').classList.add('oculto');
        $('salvar').textContent = modo === 'editar' ? 'Salvar alterações' : 'Transformar em meta';
        $('rodapeInfo').textContent = nomeCartao ? 'Cartão: ' + nomeCartao : '';
        $('maisEtapa').classList.add('oculto');
        $('etapasAjuda').textContent = 'As etapas desta meta são a checklist do cartão. Crie ou edite as etapas direto nela.';
        var h2 = M.parse(M.hoje());
        $('ini').value = M.inicioMes(h2.getFullYear(), h2.getMonth()); $('fim').value = M.fimMes(h2.getFullYear(), h2.getMonth());
        if (original) preencher(original);
      }
      montarMembros(CTX.membros, original && original.dono ? original.dono.id : null);
      aplicarTipo(); aplicarFmt();
      $('carregando').classList.add('oculto');
      $('form').classList.remove('oculto');
      return verificarAuth();
    }).then(ajustar).catch(function (e) { $('carregando').textContent = 'Não foi possível abrir o formulário. ' + (e.message || ''); });
  }

  document.querySelectorAll('[data-tipo]').forEach(function (b) { b.onclick = function () { S.tipo = b.getAttribute('data-tipo'); aplicarTipo(); }; });
  document.querySelectorAll('[data-fmt]').forEach(function (b) { b.onclick = function () { S.fmt = b.getAttribute('data-fmt'); aplicarFmt(); }; });
  $('periodo').onchange = preencherPeriodo;
  $('ini').onchange = preencherPeriodo;
  $('maisEtapa').onclick = function () { addEtapa(''); };
  $('cancelar').onclick = function () { t.closeModal(); };
  $('autorizar').onclick = function () {
    M.autorizar(t).then(verificarAuth).catch(function () { erro('A autorização não foi concluída. Tente de novo e confirme na janela do Trello.'); });
  };
  $('form').onsubmit = salvar;
  iniciar();
})();
