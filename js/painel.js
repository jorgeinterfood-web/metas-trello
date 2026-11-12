/* Painel de metas: uma tela só, com navegação interna (equipe, detalhe da meta, formulário) */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var agora = M.parse(M.hoje());
  var S = { view: 'home', cardId: null, form: null, origem: null, escala: 'mes', y: agora.getFullYear(), m: agora.getMonth(), pessoa: '', sit: '', ord: 'nome', abertos: {}, scroll: 0 };
  var CTX = null, ITENS = [];

  function icone(tracos) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tracos + '</svg>'; }
  var ICO = {
    esq: icone('<path d="M15 6l-6 6 6 6"/>'), dir: icone('<path d="M9 6l6 6-6 6"/>'), mais: icone('<path d="M12 5v14M5 12h14"/>'),
    abrir: icone('<path d="M6 9l6 6 6-6"/>'), fechar: icone('<path d="M18 15l-6-6-6 6"/>')
  };
  var CONT = {
    ok: ['no ritmo', 'no ritmo'], risk: ['em risco', 'em risco'], late: ['não atingida', 'não atingidas'], hit: ['atingida', 'atingidas'],
    'Aguardando avaliação': ['aguardando avaliação', 'aguardando avaliação'], 'Ainda não começou': ['ainda não começou', 'ainda não começaram']
  };

  function carregar() {
    app.innerHTML = '<div class="carregando">Carregando metas…</div>';
    return Promise.all([M.contexto(t), M.carregarMetas(t)]).then(function (res) {
      CTX = res[0];
      ITENS = res[1].map(recalcular);
      if (!CTX.admin && ITENS.some(function (it) { return it.meta.dono && it.meta.dono.id === CTX.eu.id; })) S.pessoa = CTX.eu.id;
      return abrirPorArgumento();
    }).then(render).catch(function (e) {
      app.innerHTML = '<div class="painel-corpo"><p class="erro">Não foi possível carregar as metas. ' + esc(e.message || '') + '</p><div><button class="btn" id="tentar">Tentar de novo</button></div></div>';
      document.getElementById('tentar').onclick = function () { carregar(); };
    });
  }
  function recalcular(it) { it.r = M.avaliar(it.meta, it.card.badges); return it; }
  function achar(id) { return ITENS.filter(function (it) { return it.card.id === id; })[0]; }

  // O botão Editar meta do cartão abre o painel já no formulário
  function abrirPorArgumento() {
    var v = t.arg('view');
    if (v !== 'form') return Promise.resolve();
    var id = t.arg('cardId'), modo = t.arg('modo') || 'editar';
    S.origem = 'cartao';
    return t.cards('id', 'name').then(function (cs) {
      var c = cs.filter(function (x) { return x.id === id; })[0];
      var it = achar(id);
      S.view = 'form'; S.form = { modo: it ? 'editar' : 'converter', cardId: id, nome: c ? c.name : (it ? it.card.name : ''), original: it ? it.meta : null };
      if (modo === 'editar' && !it) S.form.modo = 'converter';
    });
  }

  // ---------- período ----------
  function periodo() {
    if (S.escala === 'tri') { var q = Math.floor(S.m / 3) * 3; return { a: M.inicioMes(S.y, q), b: M.fimMes(S.y, q + 2) }; }
    return { a: M.inicioMes(S.y, S.m), b: M.fimMes(S.y, S.m) };
  }
  function nomePeriodo() {
    if (S.escala === 'tri') return (Math.floor(S.m / 3) + 1) + 'º trimestre de ' + S.y;
    return M.MESES[S.m].charAt(0).toUpperCase() + M.MESES[S.m].slice(1) + ' de ' + S.y;
  }
  function doPeriodo() { var p = periodo(); return ITENS.filter(function (it) { return M.noPeriodo(it.meta, p.a, p.b); }); }
  function esperadoPeriodo() {
    var p = periodo(), h = M.hoje();
    if (h < p.a) return 0;
    if (h > p.b) return 100;
    var tot = M.contarDias(p.a, p.b, 'uteis');
    return tot ? Math.round(M.contarDias(p.a, h, 'uteis') / tot * 100) : 100;
  }
  function andar(sentido) {
    var passo = S.escala === 'tri' ? 3 : 1;
    S.m += sentido * passo;
    while (S.m < 0) { S.m += 12; S.y--; }
    while (S.m > 11) { S.m -= 12; S.y++; }
  }

  // ---------- cálculos do painel ----------
  function media(itens) {
    var soma = 0, pesos = 0;
    itens.forEach(function (it) {
      if (!it.r.temBarra) return;
      var p = it.meta.imp || 1;
      soma += it.r.fill * p; pesos += p;
    });
    return pesos ? Math.round(soma / pesos) : null;
  }
  function ehReais(it) { return it.meta.tipo === 'q' && it.meta.fmt === 'r' && it.meta.dir !== 'down'; }
  function totaisReais(itens) {
    var reais = itens.filter(ehReais), soma = 0, alvo = 0, proj = 0, comProj = 0;
    reais.forEach(function (it) {
      soma += it.r.atual; alvo += it.meta.alvo;
      if (it.r.projecao !== undefined) { proj += it.r.projecao; comProj++; } else proj += it.r.atual;
    });
    return { n: reais.length, soma: soma, alvo: alvo, proj: proj, temProj: comProj > 0 };
  }
  function contar(itens) {
    var n = { ok: 0, risk: 0, late: 0, hit: 0, neutral: 0 };
    itens.forEach(function (it) { n[it.r.info.cls]++; });
    return n;
  }
  function pilha(n, rotulo) {
    var tot = n.ok + n.risk + n.late + n.hit + n.neutral;
    if (!tot) return '';
    var segs = ['ok', 'risk', 'late', 'hit', 'neutral'].filter(function (k) { return n[k]; }).map(function (k) { return '<span class="sit-' + k + '" style="flex:' + n[k] + '"></span>'; }).join('');
    return '<div class="pilha" role="img" aria-label="' + esc(rotulo) + '">' + segs + '</div>';
  }
  function textoContagem(itens) {
    var grupos = {}, ordem = [];
    itens.forEach(function (it) {
      var k = it.r.info.cls === 'neutral' ? it.r.info.label : it.r.info.cls;
      if (!grupos[k]) { grupos[k] = 0; ordem.push(k); }
      grupos[k]++;
    });
    var peso = { ok: 0, risk: 1, late: 2, hit: 3 };
    ordem.sort(function (a, b) { return (peso[a] === undefined ? 9 : peso[a]) - (peso[b] === undefined ? 9 : peso[b]); });
    return ordem.map(function (k) { var rot = CONT[k] || [k.toLowerCase(), k.toLowerCase()]; return grupos[k] + ' ' + rot[grupos[k] === 1 ? 0 : 1]; }).join(', ');
  }
  function tituloCurto(it) {
    var nome = it.meta.dono && it.meta.dono.fullName, t2 = it.card.name;
    return nome && t2.slice(-(nome.length + 3)) === ' · ' + nome ? t2.slice(0, -(nome.length + 3)) : t2;
  }
  function valorTexto(it) {
    var m = it.meta, r = it.r;
    if (m.tipo === 'q') return M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo);
    if (m.tipo === 'e') return r.etapas ? r.feitas + ' de ' + r.etapas + ' etapas' : 'Sem etapas na checklist';
    return m.aval ? 'Avaliada' : 'Avaliação em ' + M.dataBR(m.fim);
  }

  // O que pede atenção do gestor, com o motivo principal
  function atencao(it) {
    var m = it.meta, r = it.r, motivos = [], peso = 0;
    if (r.sit === 'late') { motivos.push(m.tipo === 'a' ? 'Não atingida' : 'Período encerrado sem atingir o alvo'); peso = 4; }
    else if (r.sit === 'risk') { motivos.push(M.textoDiff(m, r) || 'Em risco'); peso = 3; }
    if (m.tipo === 'a' && r.sit === 'wait' && r.depois) { motivos.push('Avaliação pendente desde ' + M.dataBR(m.fim)); peso = Math.max(peso, 2); }
    if (r.parada) { motivos.push('Sem atualização há ' + r.diasSemAtualizar + ' dias'); peso = Math.max(peso, 1); }
    if (!motivos.length) return null;
    return { it: it, texto: motivos.join(' · '), peso: peso };
  }

  // ---------- topo ----------
  function topo() {
    if (S.view === 'home') {
      return '<div class="painel-topo"><div class="painel-acoes">' +
        '<button class="btn btn-icone" id="ant" aria-label="' + (S.escala === 'tri' ? 'Trimestre anterior' : 'Mês anterior') + '">' + ICO.esq + '</button>' +
        '<button class="btn" id="agoraBtn" title="Voltar para o período atual" style="min-width:150px">' + esc(nomePeriodo()) + '</button>' +
        '<button class="btn btn-icone" id="prox" aria-label="' + (S.escala === 'tri' ? 'Próximo trimestre' : 'Próximo mês') + '">' + ICO.dir + '</button>' +
        '<div class="seg seg-peq" role="group" aria-label="Escala do período" style="margin-left:12px">' +
        '<button type="button" data-escala="mes" aria-pressed="' + (S.escala === 'mes') + '">Mês</button><button type="button" data-escala="tri" aria-pressed="' + (S.escala === 'tri') + '">Trimestre</button></div></div>' +
        (CTX.admin ? '<button class="btn btn-primario linha" id="nova" style="gap:6px">' + ICO.mais + 'Nova meta</button>' : '') + '</div>';
    }
    var titulo, direita = '';
    if (S.view === 'detalhe') {
      var it = achar(S.cardId);
      titulo = it ? tituloCurto(it) : 'Meta';
      direita = '<button class="btn" id="abrirCartao">Abrir cartão</button>';
    } else titulo = S.form.modo === 'criar' ? 'Nova meta' : (S.form.modo === 'editar' ? 'Editar meta' : 'Transformar em meta');
    var voltar = S.view === 'form' && S.origem === 'cartao' ? 'Fechar' : (S.view === 'form' && S.form.de === 'detalhe' ? 'Voltar à meta' : 'Voltar para a equipe');
    return '<div class="painel-topo"><div class="painel-acoes"><button class="btn linha" id="voltar" style="gap:4px;padding-left:8px">' + ICO.esq + esc(voltar) + '</button>' +
      '<h2 class="painel-titulo">' + esc(titulo) + '</h2></div>' + direita + '</div>';
  }

  // ---------- tela da equipe ----------
  function resumoGeral(itens) {
    var pct = media(itens), esp = esperadoPeriodo();
    var r = { pct: pct || 0, fill: Math.min(pct || 0, 100), esperado: esp, info: { cls: 'azul' } };
    var frase = 'de progresso em ' + itens.length + (itens.length === 1 ? ' meta' : ' metas');
    var corpo = pct === null ? '<p class="peq sub" style="margin:0">Só há metas por avaliação neste período, então não há progresso numérico.</p>' :
      '<div class="linha" style="align-items:baseline"><span class="grande num">' + pct + '%</span><span class="sub">' + esc(frase) + ' (peso pela importância)</span></div>' + M.barra(r, { label: 'Progresso geral', cor: 'azul' }) +
      '<div class="linha peq sub"><span class="legenda-zona" aria-hidden="true"></span><span>A parte cinza mostra onde as metas deveriam estar hoje: ' + esp + '%.</span></div>';
    return '<div class="caixa coluna gap8">' + corpo + '<span class="peq sub">' + esc(textoContagem(itens)) + '</span></div>';
  }
  function resumoReais(itens) {
    var tr = totaisReais(itens);
    if (!tr.n) return '';
    var fmt = { fmt: 'r' }, esp = esperadoPeriodo();
    var pct = tr.alvo ? Math.round(tr.soma / tr.alvo * 100) : 0;
    var rr = { pct: pct, fill: Math.min(pct, 100), esperado: esp, info: { cls: pct >= esp - 15 ? 'ok' : 'risk' } };
    var proj = '';
    var p = periodo();
    if (tr.temProj && M.hoje() >= p.a && M.hoje() <= p.b) {
      var pp = tr.alvo ? Math.round(tr.proj / tr.alvo * 100) : 0;
      var cls = pp >= 100 ? 'dif-mais' : (pp < 90 ? 'dif-menos' : 'dif-neutro');
      proj = '<div class="coluna"><span class="' + cls + '">No ritmo atual, o período fecha em ' + esc(M.fmtValor(fmt, Math.round(tr.proj))) + '</span><span class="peq sub">' + pp + '% do alvo somado. Projeção linear pelo que já foi realizado.</span></div>';
    }
    return '<div class="caixa coluna gap8"><div class="linha" style="align-items:baseline;flex-wrap:wrap"><span class="grande num">' + esc(M.fmtValor(fmt, tr.soma)) + '</span><span class="sub">de ' + esc(M.fmtValor(fmt, tr.alvo)) + ' em ' + tr.n + (tr.n === 1 ? ' meta em reais' : ' metas em reais') + '</span></div>' +
      M.barra(rr, { label: 'Soma das metas em reais' }) + proj + '</div>';
  }
  function blocoAtencao(itens) {
    var lista = itens.map(atencao).filter(Boolean).sort(function (a, b) {
      return (b.it.meta.imp || 1) - (a.it.meta.imp || 1) || b.peso - a.peso || a.it.r.pct - b.it.r.pct;
    });
    var cab = '<h3 class="subtitulo">Precisa de atenção' + (lista.length ? ' <span class="sub" style="font-weight:400">(' + lista.length + ')</span>' : '') + '</h3>';
    if (!lista.length) return '<section class="coluna gap8">' + cab + '<p class="peq sub" style="margin:0">Nenhuma meta em risco, atrasada ou sem atualização neste período.</p></section>';
    var linhas = lista.slice(0, 6).map(function (a) {
      var it = a.it, dono = it.meta.dono ? it.meta.dono.fullName : 'Sem responsável';
      return '<div class="atencao-linha"><div class="linha" style="min-width:0">' + M.iconeImp(it.meta.imp) + '<button class="meta-titulo" data-card="' + esc(it.card.id) + '">' + esc(tituloCurto(it)) + '</button></div>' +
        '<span class="sub">' + esc(dono) + '</span><span class="peq">' + esc(a.texto) + '</span><span style="justify-self:end">' + M.selo(it.r) + '</span></div>';
    }).join('');
    return '<section class="coluna gap8">' + cab + '<div class="lista-borda">' + linhas + '</div>' + (lista.length > 6 ? '<span class="peq sub">E mais ' + (lista.length - 6) + '. Use os filtros abaixo para ver todas.</span>' : '') + '</section>';
  }

  function telaEquipe() {
    var itens = doPeriodo();
    if (!itens.length) {
      return '<div class="vazio"><p class="forte">Nenhuma meta em ' + esc(nomePeriodo().toLowerCase()) + '.</p>' +
        (CTX.admin ? '<p>Crie a primeira pelo botão Nova meta, ou mude o período acima.</p>' : '<p>Quando um admin criar uma meta, ela aparece aqui.</p>') + '</div>';
    }
    var html = '<div class="resumos">' + resumoGeral(itens) + resumoReais(itens) + '</div>' + blocoAtencao(itens);

    var pessoas = {};
    itens.forEach(function (it) {
      var d = it.meta.dono || { id: '?', fullName: 'Sem responsável' };
      if (!pessoas[d.id]) pessoas[d.id] = { dono: d, itens: [] };
      pessoas[d.id].itens.push(it);
    });
    var nomes = Object.keys(pessoas).map(function (k) { return pessoas[k]; });
    var opSit = [['', 'Todas'], ['ok', 'No ritmo'], ['risk', 'Em risco'], ['late', 'Não atingida'], ['hit', 'Atingida ou superada'], ['neutral', 'Aguardando ou não começou'], ['parada', 'Sem atualização há ' + M.CFG.diasSemAtualizacao + ' dias ou mais']];
    html += '<section class="coluna gap12"><h3 class="subtitulo">Pessoas</h3><div class="filtros">' +
      '<label>Pessoa <select id="fPessoa"><option value="">Todas</option>' + nomes.slice().sort(porNome).map(function (p) { return '<option value="' + esc(p.dono.id) + '"' + (S.pessoa === p.dono.id ? ' selected' : '') + '>' + esc(p.dono.fullName) + '</option>'; }).join('') + '</select></label>' +
      '<label>Situação <select id="fSit">' + opSit.map(function (op) { return '<option value="' + op[0] + '"' + (S.sit === op[0] ? ' selected' : '') + '>' + op[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Ordenar por <select id="fOrd">' + [['nome', 'Nome'], ['menor', 'Menor progresso primeiro'], ['maior', 'Maior progresso primeiro']].map(function (op) { return '<option value="' + op[0] + '"' + (S.ord === op[0] ? ' selected' : '') + '>' + op[1] + '</option>'; }).join('') + '</select></label></div>';

    var filtro = function (it) {
      if (!S.sit) return true;
      if (S.sit === 'parada') return it.r.parada;
      return it.r.info.cls === S.sit;
    };
    var lista = nomes.filter(function (p) { return (!S.pessoa || p.dono.id === S.pessoa) && p.itens.some(filtro); }).map(function (p) { p.media = media(p.itens); return p; });
    lista.sort(S.ord === 'nome' ? porNome : function (x, y) { var a = x.media === null ? -1 : x.media, b = y.media === null ? -1 : y.media; return S.ord === 'menor' ? a - b : b - a; });

    var cab = '<div class="tab-linha tab-cab"><span>Pessoa</span><span>Progresso</span><span>Situação das metas</span><span>Projeção em reais</span><span></span></div>';
    var linhas = lista.map(function (p) {
      var n = contar(p.itens), aberto = !!S.abertos[p.dono.id];
      var rm = { pct: p.media || 0, fill: Math.min(p.media || 0, 100), esperado: esperadoPeriodo(), info: { cls: 'azul' } };
      var tr = totaisReais(p.itens), projTxt = '<span class="sub">Sem metas em reais</span>';
      if (tr.n) {
        projTxt = tr.temProj && esperadoPeriodo() > 0 && esperadoPeriodo() < 100 ?
          '<div class="coluna"><span class="forte num">' + esc(M.fmtValor({ fmt: 'r' }, Math.round(tr.proj))) + '</span><span class="peq sub num">' + (tr.alvo ? Math.round(tr.proj / tr.alvo * 100) : 0) + '% de ' + esc(M.fmtValor({ fmt: 'r' }, tr.alvo)) + '</span></div>' :
          '<div class="coluna"><span class="forte num">' + esc(M.fmtValor({ fmt: 'r' }, tr.soma)) + '</span><span class="peq sub num">de ' + esc(M.fmtValor({ fmt: 'r' }, tr.alvo)) + '</span></div>';
      }
      var subs = aberto ? '<div class="sub-metas">' + p.itens.filter(filtro).map(function (it) {
        var r = it.r;
        return '<div class="sub-meta"><div class="linha" style="min-width:0">' + M.iconeImp(it.meta.imp) + '<button class="meta-titulo" style="font-size:14px;font-weight:400" data-card="' + esc(it.card.id) + '">' + esc(tituloCurto(it)) + '</button></div>' +
          (r.temBarra ? M.barra(r, { fina: true, label: it.card.name }) : '<span></span>') +
          '<span class="peq sub num">' + esc(valorTexto(it)) + (r.parada ? ' · <span class="parada">parada</span>' : '') + '</span><span style="justify-self:end">' + M.selo(r) + '</span></div>';
      }).join('') + '</div>' : '';
      return '<div class="tab-pessoa"><div class="tab-linha">' +
        '<div class="linha">' + M.avatar(p.dono, 28) + '<div class="coluna"><span class="forte">' + esc(p.dono.fullName) + '</span><span class="peq sub">' + p.itens.length + (p.itens.length === 1 ? ' meta' : ' metas') + '</span></div></div>' +
        (p.media === null ? '<span class="peq sub">Só metas por avaliação</span>' : '<div class="linha gap12"><div style="flex:1">' + M.barra(rm, { label: 'Progresso de ' + p.dono.fullName, cor: 'azul' }) + '</div><span class="forte num" style="width:40px;text-align:right">' + p.media + '%</span></div>') +
        '<div class="coluna gap4">' + pilha(n, textoContagem(p.itens)) + '<span class="peq sub">' + esc(textoContagem(p.itens)) + '</span></div>' +
        projTxt +
        '<button class="btn btn-icone btn-texto" data-abrir="' + esc(p.dono.id) + '" aria-expanded="' + aberto + '" aria-label="' + (aberto ? 'Esconder' : 'Mostrar') + ' as metas de ' + esc(p.dono.fullName) + '">' + (aberto ? ICO.fechar : ICO.abrir) + '</button>' +
        '</div>' + subs + '</div>';
    }).join('');
    html += '<div class="tabela">' + cab + (linhas || '<div class="vazio">Nenhuma pessoa com metas nessa situação.</div>') + '</div></section>';
    return html;
  }
  function porNome(a, b) { return a.dono.fullName.localeCompare(b.dono.fullName, 'pt-BR'); }

  // ---------- navegação ----------
  function irPara(view, extra) {
    if (S.view === 'home') S.scroll = window.pageYOffset || document.documentElement.scrollTop || 0;
    S.view = view;
    if (extra) Object.keys(extra).forEach(function (k) { S[k] = extra[k]; });
    render();
    window.scrollTo(0, view === 'home' ? S.scroll : 0);
  }
  function voltar() {
    if (S.view === 'form') {
      if (S.origem === 'cartao') { t.closeModal(); return; }
      if (S.form.de === 'detalhe' && achar(S.form.cardId)) { irPara('detalhe', { cardId: S.form.cardId }); return; }
    }
    irPara('home');
  }
  function abrirFormulario(modo, cardId, de) {
    var it = cardId ? achar(cardId) : null;
    irPara('form', { form: { modo: modo, cardId: cardId, nome: it ? it.card.name : '', original: it ? it.meta : null, de: de } });
  }

  function render() {
    if (!CTX) return;
    if (S.view === 'form' && !CTX.admin) S.view = 'home';
    if (S.view === 'detalhe' && !achar(S.cardId)) S.view = 'home';
    app.innerHTML = topo() + '<div class="painel-corpo' + (S.view === 'home' ? '' : ' estreito') + '" id="corpo"></div>';
    var corpo = document.getElementById('corpo');
    if (S.view === 'home') { corpo.innerHTML = telaEquipe(); }
    else if (S.view === 'detalhe') {
      var it = achar(S.cardId);
      M.detalhe(corpo, {
        t: t, escopo: S.cardId, meta: it.meta, card: it.card, ctx: CTX,
        aoSalvar: function (meta) { it.meta = meta; recalcular(it); },
        editar: CTX.admin ? function () { abrirFormulario('editar', S.cardId, 'detalhe'); } : null
      });
    } else {
      M.formulario(corpo, {
        t: t, ctx: CTX, modo: S.form.modo, cardId: S.form.cardId, original: S.form.original, nomeCartao: S.form.nome,
        aoCancelar: voltar,
        aoSalvo: function (res) {
          if (S.origem === 'cartao') { t.closeModal(); return; }
          var it2 = achar(res.cardId);
          if (it2) { it2.meta = res.meta; recalcular(it2); }
          else {
            var c = res.card || {};
            ITENS.push(recalcular({ card: { id: res.cardId, name: c.name || '', idList: c.idList, members: c.members || [], badges: c.badges || {}, url: c.shortUrl || c.url }, meta: res.meta }));
          }
          S.scroll = 0;
          irPara('detalhe', { cardId: res.cardId });
        }
      });
    }
    ligar();
  }

  function ligar() {
    var $ = function (id) { return document.getElementById(id); };
    if ($('ant')) $('ant').onclick = function () { andar(-1); render(); };
    if ($('prox')) $('prox').onclick = function () { andar(1); render(); };
    if ($('agoraBtn')) $('agoraBtn').onclick = function () { S.y = agora.getFullYear(); S.m = agora.getMonth(); render(); };
    app.querySelectorAll('[data-escala]').forEach(function (b) { b.onclick = function () { S.escala = b.getAttribute('data-escala'); render(); }; });
    if ($('nova')) $('nova').onclick = function () { abrirFormulario('criar', null, 'home'); };
    if ($('voltar')) $('voltar').onclick = voltar;
    if ($('abrirCartao')) $('abrirCartao').onclick = function () { t.showCard(S.cardId); };
    app.querySelectorAll('[data-card]').forEach(function (b) { b.onclick = function () { irPara('detalhe', { cardId: b.getAttribute('data-card') }); }; });
    app.querySelectorAll('[data-abrir]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-abrir'); S.abertos[id] = !S.abertos[id]; var y = window.pageYOffset; render(); window.scrollTo(0, y); }; });
    var fp = $('fPessoa'), fs = $('fSit'), fo = $('fOrd');
    var refiltrar = function () { var y = window.pageYOffset; render(); window.scrollTo(0, y); };
    if (fp) fp.onchange = function () { S.pessoa = fp.value; refiltrar(); };
    if (fs) fs.onchange = function () { S.sit = fs.value; refiltrar(); };
    if (fo) fo.onchange = function () { S.ord = fo.value; refiltrar(); };
  }

  M.aplicarTema(t);
  t.render(function () { M.aplicarTema(t); if (!CTX) carregar(); });
})();
