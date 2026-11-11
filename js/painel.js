/* Painel de metas */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var agora = M.parse(M.hoje());
  var S = { aba: 'minhas', y: agora.getFullYear(), m: agora.getMonth(), pessoa: '', sit: '', ord: 'nome', abertos: {} };
  var CTX = null, ITENS = [];

  var ICO = {
    esq: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    dir: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    mais: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    abrir: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    fechar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>'
  };

  function carregar() {
    app.innerHTML = '<div class="carregando">Carregando metas…</div>';
    return Promise.all([M.contexto(t), M.carregarMetas(t)]).then(function (res) {
      CTX = res[0];
      ITENS = res[1].map(function (it) { it.r = M.avaliar(it.meta, it.card.badges); return it; });
      render();
    }).catch(function (e) {
      app.innerHTML = '<div class="painel-corpo"><p class="erro">Não foi possível carregar as metas. ' + esc(e.message || '') + '</p><button class="btn" id="tentar">Tentar de novo</button></div>';
      document.getElementById('tentar').onclick = carregar;
    });
  }

  function periodo() { return { a: M.inicioMes(S.y, S.m), b: M.fimMes(S.y, S.m) }; }
  function nomeMes() { return M.MESES[S.m].charAt(0).toUpperCase() + M.MESES[S.m].slice(1) + ' de ' + S.y; }
  function doMes() { var p = periodo(); return ITENS.filter(function (it) { return M.noPeriodo(it.meta, p.a, p.b); }); }

  function esperadoMes() {
    var p = periodo(), h = M.hoje();
    if (h < p.a) return 0;
    if (h > p.b) return 100;
    var tot = M.contarDias(p.a, p.b, 'uteis');
    return tot ? Math.round(M.contarDias(p.a, h, 'uteis') / tot * 100) : 100;
  }
  function media(itens) {
    var soma = 0, pesos = 0;
    itens.forEach(function (it) {
      if (!it.r.temBarra) return;
      var p = it.meta.imp || 1;
      soma += it.r.fill * p; pesos += p;
    });
    return pesos ? Math.round(soma / pesos) : null;
  }
  function contagem(itens) {
    var ordem = ['ok', 'risk', 'late', 'hit', 'neutral'], grupos = {};
    itens.forEach(function (it) {
      var k = it.r.info.cls, lab = it.r.info.label;
      var chave = k === 'neutral' ? 'neutral:' + lab : k;
      if (!grupos[chave]) grupos[chave] = { cls: k, label: lab, n: 0 };
      grupos[chave].n++;
    });
    return Object.keys(grupos).sort(function (x, y) { return ordem.indexOf(grupos[x].cls) - ordem.indexOf(grupos[y].cls); })
      .map(function (k) { var g = grupos[k]; return '<span class="selo sit-' + g.cls + '">' + g.n + ' ' + esc(g.label.toLowerCase()) + '</span>'; }).join('');
  }
  function resumo(itens, frase) {
    var pct = media(itens), esp = esperadoMes();
    var r = { pct: pct || 0, fill: Math.min(pct || 0, 100), esperado: esp, info: { cls: 'azul' } };
    var bar = pct === null ? '<p class="peq sub">Só há metas por avaliação neste mês, então não há progresso numérico.</p>' :
      '<div class="linha" style="align-items:baseline"><span class="grande">' + pct + '%</span><span class="sub">' + esc(frase) + '</span></div>' + M.barra(r, { label: frase, cor: 'azul' }) +
      '<div class="linha peq sub"><span class="legenda-zona" aria-hidden="true"></span><span>A parte sombreada mostra onde as metas deveriam estar hoje.</span></div>';
    return '<div class="caixa coluna gap8">' + bar + '<div class="chips" style="margin-top:4px">' + contagem(itens) + '</div></div>';
  }

  function linhaMeta(it) {
    var m = it.meta, r = it.r, valor = '', dif = M.textoDiff(r);
    if (m.tipo === 'q') valor = M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo);
    if (m.tipo === 'e') valor = r.etapas ? r.feitas + ' de ' + r.etapas + ' etapas' : 'Sem etapas na checklist';
    var difCls = r.diff > 0 ? 'dif-mais' : (r.diff < -15 ? 'dif-menos' : 'dif-neutro');
    var upd = m.tipo === 'q' ? (r.parada ? '<span class="parada">Sem atualização há ' + r.diasSemAtualizar + ' dias</span>' : 'Atualizada em ' + M.dataBR(M.ultimaAtualizacao(m))) :
      (m.tipo === 'a' ? (m.aval ? 'Avaliada' : 'Avaliação em ' + M.dataBR(m.fim)) : M.dataBR(m.ini) + ' a ' + M.dataBR(m.fim));
    var meio = r.temBarra ?
      '<div class="coluna gap4"><div class="linha entre peq"><span class="sub num">' + esc(valor) + '</span><span class="' + difCls + '">' + esc(dif) + '</span></div>' + M.barra(r, { label: it.card.name }) + '</div>' :
      '<span class="peq sub">' + (m.aval ? 'Avaliação: ' + esc(r.info.label) : 'Sem barra de progresso. O gestor avalia no fim do período, em ' + M.dataBRCompleta(m.fim) + '.') + '</span>';
    return '<div class="meta-linha">' +
      '<div class="coluna gap4" style="min-width:0"><button class="meta-titulo" data-card="' + esc(it.card.id) + '">' + esc(tituloCurto(it)) + '</button>' +
      '<div class="linha peq sub" style="flex-wrap:wrap"><span class="tipo">' + esc(rotuloTipo(m)) + '</span><span>Importância ' + esc(M.IMP[m.imp || 1].toLowerCase()) + '</span><span aria-hidden="true">·</span><span>' + upd + '</span>' +
      (m.encerrada ? '<span aria-hidden="true">·</span><span>Encerrada</span>' : '') + '</div></div>' +
      '<div>' + meio + '</div>' +
      '<div class="coluna gap4" style="align-items:flex-end">' + (r.temBarra ? '<span class="forte num" style="font-size:16px">' + r.pct + '%</span>' : '') + M.selo(r) + '</div></div>';
  }
  function rotuloTipo(m) { return m.tipo === 'q' && m.fmt === 'r' ? 'Quantitativa em R$' : M.TIPO[m.tipo]; }
  function tituloCurto(it) {
    var nome = it.meta.dono && it.meta.dono.fullName, t2 = it.card.name;
    return nome && t2.slice(-(nome.length + 3)) === ' · ' + nome ? t2.slice(0, -(nome.length + 3)) : t2;
  }

  function topo() {
    var abas = '<div class="abas" role="tablist"><button role="tab" data-aba="minhas" aria-selected="' + (S.aba === 'minhas') + '">Minhas metas</button>' +
      (CTX.admin ? '<button role="tab" data-aba="equipe" aria-selected="' + (S.aba === 'equipe') + '">Equipe</button>' : '') + '</div>';
    var acoes = '<div class="painel-acoes"><button class="btn btn-icone" id="ant" aria-label="Mês anterior">' + ICO.esq + '</button>' +
      '<button class="btn" id="mesAtual" title="Voltar para o mês atual">' + esc(nomeMes()) + '</button>' +
      '<button class="btn btn-icone" id="prox" aria-label="Próximo mês">' + ICO.dir + '</button>' +
      (CTX.admin ? '<button class="btn btn-primario linha" id="nova" style="margin-left:12px;gap:6px">' + ICO.mais + 'Nova meta</button>' : '') + '</div>';
    return '<div class="painel-topo">' + abas + acoes + '</div>';
  }

  function abaMinhas() {
    var meus = doMes().filter(function (it) { return it.meta.dono && it.meta.dono.id === CTX.eu.id; });
    if (!meus.length) {
      return '<div class="vazio"><p class="forte">Você não tem metas em ' + esc(M.MESES[S.m]) + ' de ' + S.y + '.</p>' +
        (CTX.admin ? '<p>Crie uma pelo botão Nova meta, ou veja as metas do time na aba Equipe.</p>' : '<p>Quando o gestor criar uma meta para você, ela aparece aqui.</p>') + '</div>';
    }
    return resumo(meus, 'de progresso geral, considerando a importância de cada meta') +
      '<div class="coluna gap8">' + meus.map(linhaMeta).join('') + '</div>';
  }

  function abaEquipe() {
    var itens = doMes();
    if (!itens.length) return '<div class="vazio"><p class="forte">Nenhuma meta em ' + esc(M.MESES[S.m]) + ' de ' + S.y + '.</p><p>Crie a primeira pelo botão Nova meta.</p></div>';
    var pessoas = {};
    itens.forEach(function (it) {
      var d = it.meta.dono || { id: '?', fullName: 'Sem responsável' };
      if (!pessoas[d.id]) pessoas[d.id] = { dono: d, itens: [] };
      pessoas[d.id].itens.push(it);
    });
    var html = '<div class="resumos">' + resumo(itens, 'de progresso da equipe em ' + itens.length + (itens.length === 1 ? ' meta' : ' metas'));
    var reais = itens.filter(function (it) { return it.meta.tipo === 'q' && it.meta.fmt === 'r' && it.meta.dir !== 'down'; });
    if (reais.length) {
      var soma = 0, alvo = 0;
      reais.forEach(function (it) { soma += it.r.atual; alvo += it.meta.alvo; });
      var pct = alvo ? Math.round(soma / alvo * 100) : 0, esp = esperadoMes();
      var rr = { pct: pct, fill: Math.min(pct, 100), esperado: esp, info: { cls: pct >= esp - 15 ? 'ok' : 'risk' } };
      html += '<div class="caixa coluna gap8"><div class="linha" style="align-items:baseline;flex-wrap:wrap"><span class="grande num">' + esc(M.fmtValor({ fmt: 'r' }, soma)) + '</span><span class="sub">de ' + esc(M.fmtValor({ fmt: 'r' }, alvo)) + ' em metas em reais</span></div>' +
        M.barra(rr, { label: 'Soma das metas em reais' }) +
        '<span class="peq sub">' + pct + '% do total somado de ' + reais.length + (reais.length === 1 ? ' meta' : ' metas') + (soma < alvo ? '. Faltam ' + esc(M.fmtValor({ fmt: 'r' }, alvo - soma)) + '.' : '.') + '</span></div>';
    }
    html += '</div>';

    var nomes = Object.keys(pessoas).map(function (k) { return pessoas[k]; });
    html += '<div class="filtros">' +
      '<label>Pessoa <select id="fPessoa"><option value="">Todas</option>' + nomes.slice().sort(porNome).map(function (p) { return '<option value="' + esc(p.dono.id) + '"' + (S.pessoa === p.dono.id ? ' selected' : '') + '>' + esc(p.dono.fullName) + '</option>'; }).join('') + '</select></label>' +
      '<label>Situação <select id="fSit">' + [['', 'Todas'], ['ok', 'No ritmo'], ['risk', 'Em risco'], ['late', 'Atrasada ou não atingida'], ['hit', 'Atingida ou superada'], ['neutral', 'Aguardando ou não começou'], ['parada', 'Sem atualização há ' + M.CFG.diasSemAtualizacao + ' dias ou mais']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (S.sit === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Ordenar por <select id="fOrd">' + [['nome', 'Nome'], ['menor', 'Menor progresso primeiro'], ['maior', 'Maior progresso primeiro']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (S.ord === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';

    var filtro = function (it) {
      if (!S.sit) return true;
      if (S.sit === 'parada') return it.r.parada;
      return it.r.info.cls === S.sit;
    };
    var lista = nomes.filter(function (p) { return (!S.pessoa || p.dono.id === S.pessoa) && p.itens.some(filtro); })
      .map(function (p) { p.media = media(p.itens); return p; });
    lista.sort(S.ord === 'nome' ? porNome : function (x, y) { var a = x.media === null ? -1 : x.media, b = y.media === null ? -1 : y.media; return S.ord === 'menor' ? a - b : b - a; });

    var cab = '<div class="tab-linha tab-cab"><span>Pessoa</span><span>Progresso geral</span><span class="r">No ritmo</span><span class="r">Em risco</span><span class="r">Atrasadas</span><span class="r">Atingidas</span><span class="r">Aguardando</span><span></span></div>';
    var linhas = lista.map(function (p) {
      var n = { ok: 0, risk: 0, late: 0, hit: 0, neutral: 0 };
      p.itens.forEach(function (it) { n[it.r.info.cls]++; });
      var aberto = !!S.abertos[p.dono.id];
      var num = function (v, forte) { return '<span class="r num' + (v ? (forte ? ' forte' : '') : ' zero') + '">' + v + '</span>'; };
      var rm = { pct: p.media || 0, fill: Math.min(p.media || 0, 100), esperado: esperadoMes(), info: { cls: 'azul' } };
      var subs = aberto ? '<div class="sub-metas">' + p.itens.filter(filtro).map(function (it) {
        var m = it.meta, r = it.r, v = m.tipo === 'q' ? M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo) : (m.tipo === 'e' ? r.feitas + ' de ' + r.etapas + ' etapas' : (m.aval ? 'Avaliada' : 'Avaliação em ' + M.dataBR(m.fim)));
        return '<div class="sub-meta"><button class="meta-titulo" style="font-size:14px;font-weight:400" data-card="' + esc(it.card.id) + '">' + esc(tituloCurto(it)) + '</button>' +
          (r.temBarra ? M.barra(r, { fina: true, label: it.card.name }) : '<span></span>') +
          '<span class="peq sub num">' + esc(v) + (r.parada ? ' · <span class="parada">parada</span>' : '') + '</span><span style="justify-self:end">' + M.selo(r) + '</span></div>';
      }).join('') + '</div>' : '';
      return '<div class="tab-pessoa"><div class="tab-linha">' +
        '<div class="linha">' + M.avatar(p.dono, 28) + '<div class="coluna"><span class="forte">' + esc(p.dono.fullName) + '</span><span class="peq sub">' + p.itens.length + (p.itens.length === 1 ? ' meta' : ' metas') + '</span></div></div>' +
        (p.media === null ? '<span class="peq sub">Só metas por avaliação</span>' : '<div class="linha gap12"><div style="flex:1">' + M.barra(rm, { label: 'Progresso de ' + p.dono.fullName, cor: 'azul' }) + '</div><span class="forte num" style="width:40px;text-align:right">' + p.media + '%</span></div>') +
        num(n.ok) + num(n.risk, true) + num(n.late, true) + num(n.hit) + num(n.neutral) +
        '<button class="btn btn-icone btn-texto" data-abrir="' + esc(p.dono.id) + '" aria-expanded="' + aberto + '" aria-label="' + (aberto ? 'Esconder' : 'Mostrar') + ' as metas de ' + esc(p.dono.fullName) + '">' + (aberto ? ICO.fechar : ICO.abrir) + '</button>' +
        '</div>' + subs + '</div>';
    }).join('');
    html += '<div class="tabela">' + cab + (linhas || '<div class="vazio">Nenhuma pessoa com metas nessa situação.</div>') + '</div>';
    return html;
  }
  function porNome(a, b) { return a.dono.fullName.localeCompare(b.dono.fullName, 'pt-BR'); }

  function render() {
    if (S.aba === 'equipe' && !CTX.admin) S.aba = 'minhas';
    app.innerHTML = topo() + '<div class="painel-corpo">' + (S.aba === 'minhas' ? abaMinhas() : abaEquipe()) + '</div>';
    ligar();
  }

  function ligar() {
    app.querySelectorAll('[data-aba]').forEach(function (b) { b.onclick = function () { S.aba = b.getAttribute('data-aba'); render(); }; });
    document.getElementById('ant').onclick = function () { S.m--; if (S.m < 0) { S.m = 11; S.y--; } render(); };
    document.getElementById('prox').onclick = function () { S.m++; if (S.m > 11) { S.m = 0; S.y++; } render(); };
    document.getElementById('mesAtual').onclick = function () { S.y = agora.getFullYear(); S.m = agora.getMonth(); render(); };
    var nova = document.getElementById('nova');
    if (nova) nova.onclick = function () { t.modal({ url: './nova-meta.html', args: { modo: 'criar' }, title: 'Nova meta', height: 760 }); };
    app.querySelectorAll('[data-card]').forEach(function (b) { b.onclick = function () { t.showCard(b.getAttribute('data-card')); }; });
    app.querySelectorAll('[data-abrir]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-abrir'); S.abertos[id] = !S.abertos[id]; render(); }; });
    var fp = document.getElementById('fPessoa'), fs = document.getElementById('fSit'), fo = document.getElementById('fOrd');
    if (fp) fp.onchange = function () { S.pessoa = fp.value; render(); };
    if (fs) fs.onchange = function () { S.sit = fs.value; render(); };
    if (fo) fo.onchange = function () { S.ord = fo.value; render(); };
  }

  t.render(function () { if (!CTX) carregar(); });
})();
