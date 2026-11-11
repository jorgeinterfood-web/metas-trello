/* Lógica compartilhada do Power-Up Metas */
(function () {
  var CFG = window.METAS_CONFIG;
  var CHAVE = 'meta';
  var LIMITE = 3800; // margem abaixo dos 4096 caracteres por cartão

  // ---------- Datas ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hoje() { return iso(new Date()); }
  function addDias(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function diasEntre(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function dataBR(s) { var p = s.split('-'); return p[2] + '/' + p[1]; }
  function dataBRCompleta(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function pascoa(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return iso(new Date(y, mes - 1, dia));
  }
  var cacheFeriados = {};
  function feriados(y) {
    if (cacheFeriados[y]) return cacheFeriados[y];
    var p = pascoa(y), lista = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].map(function (md) { return y + '-' + md; });
    lista.push(addDias(p, -2)); // Sexta-feira Santa
    if (CFG.pontosFacultativosSemExpediente) {
      lista.push(addDias(p, -48), addDias(p, -47), addDias(p, 60)); // Carnaval e Corpus Christi
    }
    (CFG.feriadosExtras || []).forEach(function (f) { if (f.indexOf(y + '-') === 0) lista.push(f); });
    var set = {}; lista.forEach(function (f) { set[f] = true; });
    cacheFeriados[y] = set;
    return set;
  }
  function diaUtil(s) {
    var w = parse(s).getDay();
    if (w === 0 || w === 6) return false;
    return !feriados(+s.slice(0, 4))[s];
  }
  // Conta dias de a até b, inclusive
  function contarDias(a, b, modo) {
    if (b < a) return 0;
    if (modo === 'corridos') return diasEntre(a, b) + 1;
    var n = 0, d = a;
    while (d <= b) { if (diaUtil(d)) n++; d = addDias(d, 1); }
    return n;
  }
  function inicioMes(y, m) { return iso(new Date(y, m, 1)); }
  function fimMes(y, m) { return iso(new Date(y, m + 1, 0)); }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  // ---------- Valores ----------
  function numBR(v, casas) {
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas || 0, maximumFractionDigits: casas === undefined ? 2 : casas });
  }
  function fmtValor(meta, v) {
    if (meta.fmt === 'r') return 'R$ ' + numBR(v, Math.round(v) === v ? 0 : 2);
    if (meta.fmt === 'p') return numBR(v) + '%';
    return numBR(v) + (meta.unit ? ' ' + meta.unit : '');
  }
  function lerNumero(txt) {
    if (txt === null || txt === undefined) return NaN;
    var s = String(txt).replace(/[R$\s%]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return s === '' ? NaN : Number(s);
  }

  // ---------- Situação ----------
  var SIT = {
    ok: { label: 'No ritmo', cls: 'ok', badge: 'green' },
    risk: { label: 'Em risco', cls: 'risk', badge: 'yellow' },
    late: { label: 'Atrasada', cls: 'late', badge: 'red' },
    hit: { label: 'Atingida', cls: 'hit', badge: 'blue' },
    wait: { label: 'Aguardando avaliação', cls: 'neutral', badge: 'light-gray' },
    future: { label: 'Ainda não começou', cls: 'neutral', badge: 'light-gray' },
    nao: { label: 'Não atingida', cls: 'late', badge: 'red' },
    parcial: { label: 'Parcial', cls: 'risk', badge: 'yellow' },
    atingida: { label: 'Atingida', cls: 'hit', badge: 'blue' },
    superada: { label: 'Superada', cls: 'hit', badge: 'blue' }
  };
  var IMP = { 1: 'Normal', 2: 'Alta', 3: 'Muito alta' };
  var TIPO = { q: 'Quantitativa', e: 'Etapas', a: 'Avaliação' };

  function valorAtual(meta) {
    var h = meta.hist || [];
    return h.length ? h[h.length - 1][1] : meta.vIni;
  }
  function ultimaAtualizacao(meta) {
    var h = meta.hist || [];
    return h.length ? h[h.length - 1][0] : meta.criadaEm;
  }

  // badges: objeto badges do cartão (checkItems, checkItemsChecked)
  function avaliar(meta, badges, ref) {
    var d = ref || hoje();
    var r = { tipo: meta.tipo };
    var modo = meta.ritmo === 'corridos' ? 'corridos' : 'uteis';
    var total = contarDias(meta.ini, meta.fim, modo);
    var passados = d < meta.ini ? 0 : contarDias(meta.ini, d > meta.fim ? meta.fim : d, modo);
    r.esperado = total ? Math.round(passados / total * 100) : 100;
    r.antes = d < meta.ini;
    r.depois = d > meta.fim;

    if (meta.tipo === 'a') {
      r.temBarra = false;
      r.sit = meta.aval ? meta.aval.nota : (r.antes ? 'future' : 'wait');
    } else {
      var pct;
      if (meta.tipo === 'e') {
        var t = (badges && badges.checkItems) || 0, f = (badges && badges.checkItemsChecked) || 0;
        pct = t ? f / t * 100 : 0;
        r.feitas = f; r.etapas = t;
      } else {
        var cur = valorAtual(meta), den;
        r.atual = cur;
        if (meta.dir === 'down') { den = meta.vIni - meta.alvo; pct = den > 0 ? (meta.vIni - cur) / den * 100 : (cur <= meta.alvo ? 100 : 0); }
        else { den = meta.alvo - meta.vIni; pct = den > 0 ? (cur - meta.vIni) / den * 100 : (cur >= meta.alvo ? 100 : 0); }
        r.valorEsperado = meta.vIni + (meta.alvo - meta.vIni) * r.esperado / 100;
        var restanteDias = d >= meta.fim ? 0 : contarDias(addDias(d < meta.ini ? addDias(meta.ini, -1) : d, 1), meta.fim, modo);
        r.diasRestantes = restanteDias;
        r.falta = meta.dir === 'down' ? cur - meta.alvo : meta.alvo - cur;
        r.porDia = restanteDias && r.falta > 0 ? r.falta / restanteDias : 0;
      }
      pct = Math.max(0, Math.round(pct));
      r.pct = pct; r.fill = Math.min(pct, 100); r.temBarra = true;
      r.diff = pct - r.esperado;
      if (pct >= 100) r.sit = 'hit';
      else if (meta.encerrada || r.depois) r.sit = 'late';
      else if (r.antes) r.sit = 'future';
      else if (pct < r.esperado - 15) r.sit = 'risk';
      else r.sit = 'ok';
    }
    // Sem atualização e lembrete (só metas quantitativas em andamento)
    r.parada = false; r.pendente = false;
    if (meta.tipo === 'q' && !meta.encerrada && !r.antes && !r.depois && r.sit !== 'hit') {
      var ult = ultimaAtualizacao(meta), dias = diasEntre(ult, d);
      r.diasSemAtualizar = dias;
      r.parada = dias >= CFG.diasSemAtualizacao;
      if (meta.lembrete === 'dia') r.pendente = ult < d && diaUtil(d);
      else if (meta.lembrete === 'seg') {
        var dt = parse(d), back = (dt.getDay() + 6) % 7, seg = addDias(d, -back);
        r.pendente = ult < seg;
      } else if (meta.lembrete === '15') r.pendente = dias >= 15;
    }
    r.info = SIT[r.sit];
    return r;
  }

  function textoDiff(r) {
    if (!r.temBarra || r.antes || r.sit === 'hit') return '';
    if (r.diff === 0) return 'no ponto esperado';
    var n = Math.abs(r.diff);
    return n + (n === 1 ? ' ponto ' : ' pontos ') + (r.diff > 0 ? 'à frente' : 'atrás');
  }
  function textoBadge(r) {
    if (!r.temBarra) return r.info.label;
    return r.pct + '% · ' + r.info.label;
  }

  // ---------- Contexto e dados ----------
  function contexto(t) {
    return Promise.all([t.member('id', 'fullName', 'initials'), t.board('id', 'name', 'members', 'memberships')])
      .then(function (res) {
        var eu = res[0], quadro = res[1];
        var adm = (quadro.memberships || []).some(function (m) { return m.idMember === eu.id && m.memberType === 'admin'; });
        return { eu: eu, quadro: quadro, admin: adm, membros: quadro.members || [] };
      });
  }
  function ehAdmin(t) { return contexto(t).then(function (c) { return c.admin; }); }

  function listasDeMetas(t) {
    return t.lists('id', 'name').then(function (ls) {
      var r = { metas: null, encerradas: null };
      ls.forEach(function (l) {
        if (l.name.trim() === CFG.listaMetas) r.metas = l;
        if (l.name.trim() === CFG.listaEncerradas) r.encerradas = l;
      });
      return r;
    });
  }

  // Todas as metas do quadro, em qualquer lista (cartões abertos)
  function carregarMetas(t) {
    return t.cards('id', 'name', 'idList', 'members', 'badges', 'url').then(function (cards) {
      return Promise.all(cards.map(function (c) {
        return t.get(c.id, 'shared', CHAVE).then(function (m) { return m ? { card: c, meta: m } : null; }, function () { return null; });
      }));
    }).then(function (lista) { return lista.filter(Boolean); });
  }

  function salvarMeta(t, escopo, meta) {
    meta.v = 1;
    var s = JSON.stringify(meta);
    while (s.length > LIMITE && meta.hist && meta.hist.length > 2) {
      meta.hist.splice(0, 1);
      s = JSON.stringify(meta);
    }
    if (s.length > LIMITE) return Promise.reject(new Error('Os textos desta meta passaram do limite que o Trello permite guardar. Encurte o critério ou as observações.'));
    return t.set(escopo, 'shared', CHAVE, meta);
  }

  function noPeriodo(meta, a, b) { return meta.ini <= b && meta.fim >= a; }

  // ---------- API REST (criar e mover cartões) ----------
  function chaveConfigurada() { return CFG.appKey && CFG.appKey.indexOf('COLE_AQUI') < 0; }
  function api(t) { return t.getRestApi(); }
  // Confere se há token e se ele ainda vale (a autorização vence em 30 dias)
  function autorizado(t) {
    if (!chaveConfigurada()) return Promise.resolve(false);
    return api(t).isAuthorized().then(function (ok) {
      if (!ok) return false;
      return rest(t, 'GET', '/members/me', { fields: 'id' }).then(function () { return true; }, function () { return false; });
    }).catch(function () { return false; });
  }
  function autorizar(t) {
    return api(t).authorize({ scope: 'read,write', expiration: '30days' });
  }
  function rest(t, metodo, caminho, params) {
    return api(t).getToken().then(function (token) {
      if (!token) throw new Error('O Power-Up ainda não foi autorizado neste navegador.');
      var q = new URLSearchParams(params || {});
      q.set('key', CFG.appKey); q.set('token', token);
      return fetch('https://api.trello.com/1' + caminho + '?' + q.toString(), { method: metodo })
        .then(function (resp) {
          if (resp.status === 401) {
            return api(t).clearToken().catch(function () {}).then(function () {
              var e = new Error('A autorização do Power-Up venceu (ela vale 30 dias). Clique em Autorizar e tente de novo.');
              e.code = 'AUTH'; throw e;
            });
          }
          if (!resp.ok) return resp.text().then(function (txt) { throw new Error('O Trello recusou a operação (' + resp.status + '): ' + txt); });
          return resp.json();
        });
    });
  }
  function garantirLista(t, nome, pos) {
    return t.lists('id', 'name').then(function (ls) {
      var achou = ls.filter(function (l) { return l.name.trim() === nome; })[0];
      if (achou) return achou;
      return t.board('id').then(function (b) { return rest(t, 'POST', '/lists', { name: nome, idBoard: b.id, pos: pos || 'top' }); });
    });
  }

  // ---------- Interface ----------
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function barra(r, opts) {
    opts = opts || {};
    var titulo = 'Esperado hoje: ' + r.esperado + '%';
    return '<div class="barra' + (opts.grossa ? ' barra-grossa' : '') + (opts.fina ? ' barra-fina' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + r.pct +
      '" aria-label="' + esc((opts.label || 'Progresso') + ', ' + titulo) + '" title="' + titulo + '">' +
      '<div class="barra-zona" style="width:' + r.esperado + '%"></div>' +
      '<div class="barra-fill sit-' + (opts.cor || r.info.cls) + '" style="width:' + r.fill + '%"></div></div>';
  }
  function selo(r) { return '<span class="selo sit-' + r.info.cls + '">' + esc(r.info.label) + '</span>'; }
  function avatar(m, tam) {
    var ini = (m.initials || (m.fullName || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('')).toUpperCase();
    return '<span class="avatar" style="width:' + (tam || 28) + 'px;height:' + (tam || 28) + 'px" title="' + esc(m.fullName) + '">' + esc(ini) + '</span>';
  }

  window.Metas = {
    CFG: CFG, SIT: SIT, IMP: IMP, TIPO: TIPO, MESES: MESES,
    iso: iso, parse: parse, hoje: hoje, addDias: addDias, diasEntre: diasEntre, dataBR: dataBR, dataBRCompleta: dataBRCompleta,
    contarDias: contarDias, diaUtil: diaUtil, inicioMes: inicioMes, fimMes: fimMes,
    numBR: numBR, fmtValor: fmtValor, lerNumero: lerNumero,
    valorAtual: valorAtual, ultimaAtualizacao: ultimaAtualizacao, avaliar: avaliar, textoDiff: textoDiff, textoBadge: textoBadge,
    contexto: contexto, ehAdmin: ehAdmin, listasDeMetas: listasDeMetas, carregarMetas: carregarMetas, salvarMeta: salvarMeta, noPeriodo: noPeriodo,
    chaveConfigurada: chaveConfigurada, autorizado: autorizado, autorizar: autorizar, rest: rest, garantirLista: garantirLista,
    esc: esc, barra: barra, selo: selo, avatar: avatar, CHAVE: CHAVE
  };
})();
