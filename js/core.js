/* Lógica compartilhada do Power-Up Metas */
(function () {
  var CFG = window.METAS_CONFIG;
  var CHAVE = 'meta';
  var LIMITE = 3800; // margem abaixo dos 4096 caracteres por cartão

  // ---------- Datas ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hoje() { var partes=new Intl.DateTimeFormat('en-CA',{timeZone:CFG.fusoHorario || 'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); var d={};partes.forEach(function(p){d[p.type]=p.value;});return d.year+'-'+d.month+'-'+d.day; }
  function dataCartao(s, fim) { return new Date(s + (fim ? 'T23:59:59.999' : 'T00:00:00.000') + (CFG.deslocamentoUTC || '-03:00')).toISOString(); }
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
  // max e min são o número máximo e mínimo de casas decimais
  function numBR(v, max, min) {
    var mx = max === undefined ? 2 : max, mn = min === undefined ? 0 : min;
    if (mn > mx) mn = mx;
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: mn, maximumFractionDigits: mx });
  }
  // Casas decimais da meta: dinheiro tem 2; número e percentual seguem o que foi digitado no alvo
  function casasDe(meta) {
    if (meta.casas !== undefined && meta.casas !== null) return meta.casas;
    if (meta.fmt === 'r') return 2;
    var frac = function (x) { return Math.abs(x - Math.round(x)) > 0.0001; };
    return frac(meta.alvo) || frac(meta.vIni) ? 2 : 0;
  }
  // Singular de uma unidade digitada no plural ("clientes novos" vira "cliente novo")
  function unidade(txt) {
    return String(txt || '').trim().split(/\s+/).map(function (p) {
      var baixo=p.toLocaleLowerCase('pt-BR');
      if (/^(clientes?|pedidos?|vendas?|visitas?|unidades?|contatos?|páginas?|horas?|dias?|meses?|países?|bônus|lápis|novos?|novas?|ativos?|ativas?)$/.test(baixo)) return baixo;
      return /^[A-ZÁÉÍÓÚÇ]{2,}s?$/.test(p) ? p : baixo;
    }).join(' ');
  }
  function pluralUnidade(txt) { var mapa={cliente:'clientes',pedido:'pedidos',venda:'vendas',visita:'visitas',unidade:'unidades',contato:'contatos',página:'páginas',hora:'horas',dia:'dias',mês:'meses',país:'países',novo:'novos',nova:'novas',ativo:'ativos',ativa:'ativas'};return unidade(txt).split(' ').map(function(p){return mapa[p] || p;}).join(' '); }
  function singular(txt) {
    var mapa = { clientes:'cliente', novos:'novo', novas:'nova', pedidos:'pedido', vendas:'venda', unidades:'unidade', visitas:'visita', contatos:'contato', páginas:'página', horas:'hora', dias:'dia', meses:'mês', países:'país', ações:'ação', propostas:'proposta', entregas:'entrega', projetos:'projeto', ativos:'ativo', ativas:'ativa', úteis:'útil', leads:'lead', bônus:'bônus', lápis:'lápis' };
    return unidade(txt).split(' ').map(function (p) { return mapa[p] || (/^[A-Z]{2,}s$/.test(p) ? p.slice(0,-1) : p); }).join(' ');
  }
  function erroUsuario(e) {
    if (e && e.usuario) return e.message;
    var msg = String(e && e.message || '');
    if (/autoriza|permiss|histórico|limite|unidade|número|meta|cartão|data|valor|objetivo/i.test(msg) && !/not found|PluginData|fetch|JSON|TypeError/i.test(msg)) return msg;
    if (/fetch|network|offline/i.test(msg)) return 'Sem conexão com o Trello. Tente novamente.';
    return 'Não foi possível concluir a operação. Atualize os dados e tente novamente.';
  }
  function falha(txt, code) { var e = new Error(txt); e.usuario = true; e.code = code; return e; }
  function validarValor(v, meta) {
    if (!Number.isFinite(v) || Math.abs(v) > 1e12) throw falha('Digite um valor válido de até 1 trilhão.');
    if (v < 0) throw falha('O valor não pode ser negativo.');
    if (meta && meta.fmt === 'p' && v > 100) throw falha('Use um percentual entre 0 e 100.');
    if (meta && Math.abs(v - arred(meta, v)) > 0.000001) throw falha('Use até ' + casasDe(meta) + ' casas decimais.');
    return v;
  }
  function periodoAberto(meta, ref) { var d = ref || hoje(); return !meta.encerrada && d >= meta.ini && d <= meta.fim; }

  function ehUm(meta, v) { return Math.abs(arred(meta, v)) === 1; }
  // "Falta 1 cliente" e "Faltam 2 clientes"; dinheiro fica sempre no plural
  function faltam(meta, v, passado) {
    var um = ehUm(meta, v);
    return passado ? (um ? 'Faltou' : 'Faltaram') : (um ? 'Falta' : 'Faltam');
  }
  function fmtValor(meta, v) {
    if (meta.fmt === 'r') return 'R$ ' + numBR(v, 2, 2);
    if (meta.fmt === 'p') return numBR(v, casasDe(meta)) + '%';
    return numBR(v, casasDe(meta)) + (meta.unit ? ' ' + (ehUm(meta, v) ? unidade(meta.unitSingular || singular(meta.unit)) : pluralUnidade(meta.unit)) : '');
  }
  // Rótulo curto para o eixo do gráfico
  function rotuloEixo(meta, v) {
    var a = Math.abs(v);
    if (meta.fmt === 'r') {
      if (a >= 1e6) return 'R$ ' + numBR(v / 1e6, 1) + ' mi';
      if (a >= 1e4) return 'R$ ' + numBR(v / 1e3, a >= 1e5 ? 0 : 1) + ' mil';
      return 'R$ ' + numBR(v, 0);
    }
    if (meta.fmt === 'p') return numBR(v, casasDe(meta)) + '%';
    return numBR(v, casasDe(meta));
  }
  function arredCima(meta, v) {
    var f = Math.pow(10, casasDe(meta));
    return Math.ceil(v * f - 1e-9) / f;
  }
  function arred(meta, v) {
    var f = Math.pow(10, casasDe(meta));
    return Math.round(v * f) / f;
  }
  function lerNumero(txt) {
    if (txt === null || txt === undefined) return NaN;
    var s = String(txt).replace(/[R$\s%]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return s === '' ? NaN : Number(s);
  }

  // Máscara de digitação: pontos de milhar automáticos, vírgula para os decimais, sem letras
  function formatarDigitado(txt, casas) {
    if (/-/.test(String(txt)) || (casas === 0 && /[,\.]\d{1,2}$/.test(String(txt)))) return String(txt);
    var s = String(txt).replace(/[^0-9,]/g, '');
    var i = s.indexOf(','), inteiro, dec = null;
    if (i >= 0 && casas > 0) {
      inteiro = s.slice(0, i);
      dec = s.slice(i + 1).replace(/,/g, '').slice(0, casas);
    } else inteiro = s.replace(/,/g, '');
    inteiro = inteiro.replace(/^0+(?=\d)/, '');
    if (inteiro === '' && dec !== null) inteiro = '0';
    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return dec === null ? inteiro : inteiro + ',' + dec;
  }
  // casas pode ser um número ou uma função que devolve o número
  function mascarar(input, casas) {
    var quantas = function () { return typeof casas === 'function' ? casas() : casas; };
    input.addEventListener('input', function () {
      var antes = input.value, pos = input.selectionStart;
      var novo = formatarDigitado(antes, quantas());
      if (novo === antes) return;
      var chaves = pos === null || pos === undefined ? null : antes.slice(0, pos).replace(/[^0-9,]/g, '').length;
      input.value = novo;
      if (chaves !== null) {
        var n = 0, p = 0;
        while (p < novo.length && n < chaves) { if (/[0-9,]/.test(novo.charAt(p))) n++; p++; }
        try { input.setSelectionRange(p, p); } catch (e) {}
      }
    });
    input.addEventListener('paste', function (ev) {
      var cb = ev.clipboardData || window.clipboardData;
      if (!cb) return;
      var n = lerNumero(cb.getData('text'));
      if (!Number.isFinite(n) || n < 0 || Math.abs(n * Math.pow(10, quantas()) - Math.round(n * Math.pow(10, quantas()))) > 0.000001) { ev.preventDefault(); input.value = cb.getData('text'); return; }
      ev.preventDefault();
      input.value = formatarDigitado(numBR(n, quantas()), quantas());
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  // Dinheiro no estilo de banco: os dígitos entram pelos centavos (50029 vira 500,29)
  function formatarCentavos(txt) {
    if (/-/.test(String(txt))) return String(txt);
    var dig = String(txt).replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
    if (!dig) return '';
    return numBR(parseInt(dig, 10) / 100, 2, 2);
  }
  function mascararDinheiro(input) {
    input.addEventListener('input', function () {
      var novo = formatarCentavos(input.value);
      if (novo !== input.value) input.value = novo;
      try { input.setSelectionRange(novo.length, novo.length); } catch (e) {}
    });
    input.addEventListener('paste', function (ev) {
      var cb = ev.clipboardData || window.clipboardData;
      if (!cb) return;
      var n = lerNumero(cb.getData('text'));
      if (!Number.isFinite(n) || n < 0) { ev.preventDefault(); input.value = cb.getData('text'); return; }
      ev.preventDefault();
      input.value = numBR(n, 2, 2);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  // Escolhe a máscara pelo formato da meta
  function mascararValor(input, fmt, casas) {
    if (fmt === 'r') mascararDinheiro(input); else mascarar(input, casas);
  }
  function decimaisDigitados(txt) {
    var i = String(txt).indexOf(',');
    return i < 0 ? 0 : String(txt).length - i - 1;
  }

  // ---------- Situação ----------
  var SIT = {
    ok: { label: 'No ritmo', cls: 'ok', badge: 'green' },
    risk: { label: 'Atrasado', cls: 'risk', badge: 'yellow' },
    late: { label: 'Não atingido', cls: 'late', badge: 'red' },
    hit: { label: 'Atingido', cls: 'hit', badge: 'blue' },
    noalvo: { label: 'Atingido', cls: 'hit', badge: 'blue' },
    andamento: { label: 'Em andamento', cls: 'neutral', badge: 'light-gray' },
    abaixo: { label: 'Pendente', cls: 'risk', badge: 'yellow' },
    wait: { label: 'A avaliar', cls: 'neutral', badge: 'light-gray' },
    future: { label: 'A iniciar', cls: 'neutral', badge: 'light-gray' },
    nao: { label: 'Não atingido', cls: 'late', badge: 'red' },
    parcial: { label: 'Parcial', cls: 'risk', badge: 'yellow' },
    atingida: { label: 'Atingido', cls: 'hit', badge: 'blue' },
    superada: { label: 'Superado', cls: 'hit', badge: 'blue' }
  };
  var IMP = { 1: 'Normal', 2: 'Alta', 3: 'Muito alta' };
  var TIPO = { q: 'Valor', e: 'Etapas', a: 'Avaliação' };
  var FORMATO = { r: 'Dinheiro', n: 'Quantidade', p: 'Percentual', e: 'Etapas', a: 'Avaliação' };

  function valorAtual(meta) {
    var h = meta.hist || [];
    return h.length ? h[h.length - 1][1] : meta.vIni;
  }
  function ultimaAtualizacao(meta) {
    var h = meta.hist || [];
    return h.length ? h[h.length - 1][0] : meta.criadaEm;
  }

  // O alvo diário usa o saldo no início do dia. O primeiro registro guarda
  // essa referência, inclusive quando o histórico antigo precisar ser reduzido.
  function diaria(meta, ref) {
    var d = ref || hoje();
    if (meta.tipo !== 'q' || meta.dir === 'down' || meta.fmt === 'p' || meta.encerrada || d < meta.ini || d > meta.fim) return null;
    var modo = meta.ritmo === 'corridos' ? 'corridos' : 'uteis';
    if (modo === 'uteis' && !diaUtil(d)) return null;
    var base = meta.vIni;
    (meta.hist || []).forEach(function (e) { if (e[0] < d) base = e[1]; });
    var n = contarDias(d, meta.fim, modo);
    var alvo = n ? arredCima(meta, Math.max(0, meta.alvo - base) / n) : 0;
    var fixo = meta.diaria;
    if (fixo && fixo.em === d && Number.isFinite(fixo.base) && Number.isFinite(fixo.alvo)) {
      base = fixo.base; alvo = fixo.alvo;
    }
    if (alvo <= 0) return null;
    var realizado = arred(meta, valorAtual(meta) - base);
    var raw = realizado / alvo * 100;
    var atingiu = realizado >= alvo;
    return { em: d, base: base, alvo: alvo, realizado: realizado,
      falta: arred(meta, Math.max(0, alvo - realizado)),
      pct: percentualExibido(raw, atingiu), fill: Math.max(0, Math.min(100, raw)),
      atingiu: atingiu, superou: realizado > alvo };
  }
  function percentualExibido(raw, atingiu) {
    var n = Math.max(0, Math.round(raw * 10) / 10);
    return !atingiu && n >= 100 ? 99.9 : n;
  }

  // badges: objeto badges do cartão (checkItems, checkItemsChecked)
  function avaliar(meta, badges, ref) {
    var d = ref || hoje();
    var r = { tipo: meta.tipo };
    var modo = meta.ritmo === 'corridos' ? 'corridos' : 'uteis';
    var total = contarDias(meta.ini, meta.fim, modo);
    var referencia = d > meta.fim ? meta.fim : addDias(d, -1);
    var passados = d <= meta.ini ? 0 : contarDias(meta.ini, referencia, modo);
    var frac = total ? passados / total : 0;
    r.total = total; r.passados = passados;
    r.esperado = Math.round(frac * 100);
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
        r.etapasEsperadas = Math.round(t * frac);
        r.difEtapas = f - r.etapasEsperadas;
      } else {
        var cur = valorAtual(meta), den;
        r.atual = cur;
        if (meta.dir === 'down') { den = meta.vIni - meta.alvo; pct = den > 0 ? (meta.vIni - cur) / den * 100 : (cur <= meta.alvo ? 100 : 0); }
        else { den = meta.alvo - meta.vIni; pct = den > 0 ? (cur - meta.vIni) / den * 100 : (cur >= meta.alvo ? 100 : 0); }
        r.valorEsperado = meta.vIni + (meta.alvo - meta.vIni) * frac;
        r.dif = meta.dir === 'down' ? r.valorEsperado - cur : cur - r.valorEsperado; // positivo: à frente
        r.falta = meta.dir === 'down' ? cur - meta.alvo : meta.alvo - cur;
        r.registrouHoje = (meta.hist || []).some(function (e) { return e[0] === d; });
        r.diasRestantes = d > meta.fim ? 0 : contarDias(d < meta.ini ? meta.ini : d, meta.fim, modo);
        r.mostrarDia = meta.dir !== 'down' && meta.fmt !== 'p';
        r.diaria = diaria(meta, d);
        // Projeção linear pelo ritmo realizado até agora
        // Só a partir de um terço do período: antes disso a projeção oscila demais
        if (r.depois || meta.encerrada) r.projecao = cur;
        else if (total && passados / total >= 1 / 3) r.projecao = meta.vIni + (cur - meta.vIni) * total / passados;
      }
      var atingiu = meta.tipo === 'e' ? r.etapas > 0 && r.feitas >= r.etapas : r.falta <= 0;
      r.pct = percentualExibido(pct, atingiu);
      r.fill = Math.max(0, Math.min(pct, 100)); r.temBarra = true;
      r.diff = pct - r.esperado;
      if (meta.tipo === 'q' && meta.fmt === 'p') {
        r.semRitmo = true;
        r.fill = Math.max(0, Math.min(100, cur));
        r.marcaEm = Math.max(0, Math.min(100, meta.alvo));
        r.faltaPontos = meta.dir === 'down' ? cur - meta.alvo : meta.alvo - cur;
        if (r.antes) r.sit = 'future';
        else if (r.depois || meta.encerrada) r.sit = atingiu ? 'hit' : 'late';
        else r.sit = atingiu ? 'noalvo' : 'abaixo';
      } else if (r.antes) r.sit = 'future';
      else if (atingiu) r.sit = 'hit';
      else if (meta.encerrada || r.depois) r.sit = 'late';
      else if (meta.tipo === 'e' && !r.etapas) r.sit = 'andamento';
      else if (meta.tipo === 'e') r.sit = r.difEtapas < 0 ? 'risk' : 'ok';
      else r.sit = arred(meta, r.dif) < 0 ? 'risk' : 'ok';
    }
    // Sem atualização há dias (só metas de valor em andamento)
    r.parada = false;
    if (meta.tipo === 'q' && !meta.encerrada && !r.antes && !r.depois && r.sit !== 'hit' && r.sit !== 'noalvo') {
      var ult = ultimaAtualizacao(meta), dias = diasEntre(ult, d);
      r.diasSemAtualizar = dias;
      r.parada = dias >= CFG.diasSemAtualizacao;
    }
    r.info = SIT[r.sit];
    r.rotulo = r.sit === 'future' ? 'A iniciar' : r.info.label;
    if (!total && !r.antes && !r.depois && !meta.encerrada) r.rotulo = 'Sem dias úteis';


    if (r.sit === 'ok' && (meta.tipo === 'e' ? r.difEtapas > 0 : arred(meta, r.dif) > 0)) r.rotulo = 'Adiantado';
    if (meta.tipo === 'e' && !r.etapas && !r.antes && !r.depois && !meta.encerrada) r.rotulo = 'Sem etapas';
    return r;
  }

  // Quanto a meta está à frente ou atrás do esperado, na unidade da própria meta
  function textoDiff(meta, r) {
    if (!r.temBarra || r.antes || r.sit === 'hit' || r.sit === 'noalvo') return '';
    if (r.semRitmo) return r.faltaPontos > 0 ? faltam(meta, r.faltaPontos).toLowerCase() + ' ' + pontos(meta, r.faltaPontos) + ' para o objetivo' : '';
    if (meta.tipo === 'e') {
      var n = r.difEtapas || 0;
      if (!n) return 'no ritmo esperado';
      var a = Math.abs(n);
      return a + (a === 1 ? ' etapa ' : ' etapas ') + (n > 0 ? 'à frente' : 'atrás') + ' do esperado';
    }
    var q = arred(meta, Math.abs(r.dif));
    if (q === 0) return 'no ritmo esperado';
    return fmtValor(meta, q) + (r.dif > 0 ? ' à frente' : ' atrás') + ' do esperado';
  }
  function pontos(meta, n) {
    var v = arred(meta, Math.abs(n));
    return numBR(v, casasDe(meta)) + (meta.fmt === 'p' ? (v === 1 ? ' ponto percentual' : ' pontos percentuais') : (v === 1 ? ' ponto' : ' pontos'));
  }
  function classeDiff(r) { return r.diff > 0 ? 'dif-mais' : (r.diff < 0 ? 'dif-menos' : 'dif-neutro'); }
  function separar(partes) {
    return partes.filter(Boolean).map(function (p) { return String(p).trim().replace(/\.$/, ''); }).join(': ');
  }
  function situacaoDia(d) { return d.superou ? 'Superado' : (d.atingiu ? 'Atingido' : 'Em andamento'); }
  function dimensionarTags(root) {
    try {
      if (!root || !root.querySelectorAll || typeof document === 'undefined' || !window.getComputedStyle) return;
      var tags=root.querySelectorAll('.det-status, .cel-selo .selo');
      if (!tags.length) return;
      var estilo=window.getComputedStyle(tags[0]);
      var ctx=document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font=estilo.font || (estilo.fontWeight+' '+estilo.fontSize+' '+estilo.fontFamily);
      var textos=Object.keys(SIT).map(function(k){return SIT[k].label;}).concat(['Adiantado','Sem dias úteis','Sem etapas','Etapas indisponíveis']);
      var largura=0;
      textos.forEach(function(txt){largura=Math.max(largura,ctx.measureText(txt+': 000,00%').width);});
      Array.prototype.forEach.call(tags,function(tag){largura=Math.max(largura,ctx.measureText(tag.textContent).width);});
      largura=Math.ceil(largura + parseFloat(estilo.paddingLeft || 0) + parseFloat(estilo.paddingRight || 0) + 4);
      document.documentElement.style.setProperty('--metas-tag-largura',largura+'px');
    } catch (e) { /* A largura de reserva do CSS continua válida. */ }
  }
  function textoBadge(meta, r) {
    if (!r.temBarra || r.rotulo === 'Etapas indisponíveis') return r.rotulo;
    var valor = r.semRitmo ? fmtValor(meta,r.atual) : numBR(r.pct,1) + '%';
    return separar([r.rotulo, valor]);
  }
  function textoProgressoDia(d) { return separar([situacaoDia(d), numBR(d.pct,1) + '%']); }
  function textoMetaDia(meta, r) {
    return r.diaria ? textoProgressoDia(r.diaria) + ' no dia' : '';
  }
  function temMetaDia(meta, r) {
    return !!r.diaria;
  }

  // ---------- Contexto e dados ----------
  function aplicarTema(t) {
    try {
      var th = t.getContext().theme;
      if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-color-mode', th);
    } catch (e) {}
  }
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

  function prepararCard(t, card, meta) {
    if (meta.tipo !== 'e') return Promise.resolve(card);
    return autorizado(t).then(function (ok) {
      if (!ok) throw falha('Autorize o acesso ao Trello para carregar as etapas.');
      return rest(t, 'GET', '/cards/' + card.id + '/checklists', {checkItem_fields:'name,state'});
    }).then(function (cls) {
      var lista = meta.checklistId ? cls.filter(function (c) { return c.id === meta.checklistId; }) : cls.filter(function (c) { return c.name === 'Etapas'; });
      if (!lista.length && !meta.checklistId && cls.length === 1) lista = cls;
      if (lista.length !== 1) throw falha('Mantenha uma única checklist chamada Etapas no cartão.');
      var itens = lista[0].checkItems || [];
      card.badges = { checkItems: itens.length, checkItemsChecked: itens.filter(function (i) { return i.state === 'complete'; }).length };
      delete card.etapasErro; return card;
    }).catch(function (e) { card.etapasErro = erroUsuario(e); card.badges = {checkItems:0,checkItemsChecked:0}; return card; });
  }

  // Todas as metas do quadro, em qualquer lista (cartões abertos)
  function carregarMetas(t) {
    return t.cards('id', 'name', 'idList', 'members', 'badges', 'url').then(function (cards) {
      return Promise.all(cards.map(function (c) {
        return t.get(c.id, 'shared', CHAVE).then(function (m) { return m ? prepararCard(t,c,m).then(function () { return {card:c,meta:m}; }) : null; });
      }));
    }).then(function (lista) { return lista.filter(Boolean); });
  }

  function salvarMeta(t, escopo, meta) {
    function gravar() {
      if (t.memberCanWriteToModel && !t.memberCanWriteToModel(escopo === 'card' ? 'card' : 'board')) return Promise.reject(falha('Você não tem permissão para alterar este cartão.'));
      return Promise.all([t.get(escopo, 'shared', CHAVE), contexto(t)]).then(function (dados) {
        var atual = dados[0], ctx = dados[1];
        if (!ctx.admin) {
          if (!atual || !atual.dono || atual.dono.id !== ctx.eu.id || atual.quem === 'admin' || !periodoAberto(atual) || atual.tipo !== 'q') throw falha('Você não tem permissão para alterar esta meta.');
          var protegido = function (x) { var c=JSON.parse(JSON.stringify(x)); delete c.hist; delete c.diaria; delete c.rev; delete c.v; return JSON.stringify(c); };
          if (protegido(atual) !== protegido(meta)) throw falha('Somente administradores podem editar a configuração da meta.');
        }
        if ((atual && atual.rev || '') !== (meta.rev || '')) throw falha('Esta meta mudou em outra tela. Atualize os dados antes de salvar.', 'CONFLICT');
        var novo = JSON.parse(JSON.stringify(meta));
        novo.v = 1; novo.rev = Date.now().toString(36) + Math.random().toString(36).slice(2,10);
        if (JSON.stringify(novo).length > LIMITE) throw falha('Esta meta atingiu o limite de armazenamento. Crie outra meta para continuar sem apagar os registros existentes.', 'HISTORY');
        return t.set(escopo, 'shared', CHAVE, novo).then(function () {
          return t.get(escopo, 'shared', CHAVE).then(function (checagem) {
            if (!checagem || checagem.rev !== novo.rev) throw falha('Outra gravação ocorreu ao mesmo tempo. Atualize e confira o histórico.', 'CONFLICT');
            meta.rev = novo.rev; meta.v = novo.v;
          });
        });
      });
    }
    // Serializa abas da mesma origem no mesmo navegador. Entre computadores,
    // a API não fornece compare-and-swap; a revisão detecta conflitos conhecidos.
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('metas:' + escopo, gravar);
    return gravar();
  }

  // Cartão recém-criado pela API demora um pouco para o Trello reconhecer no quadro aberto.
  // Antes disso, gravar nele dá "Card not found or not on current board". Espera e tenta de novo.
  function pausa(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function esperarCartao(t, id, restam) {
    restam = restam === undefined ? 30 : restam;
    return t.cards('id').then(function (cs) {
      if (cs.some(function (c) { return c.id === id; })) return true;
      if (restam <= 0) return false;
      return pausa(500).then(function () { return esperarCartao(t, id, restam - 1); });
    });
  }
  function salvarMetaNova(t, id, meta) {
    var tentar = function (n) {
      return salvarMeta(t, id, meta).catch(function (e) {
        if (n <= 0 || !/not found|not on current board/i.test(e && e.message || '')) throw e;
        return pausa(1500).then(function () { return tentar(n - 1); });
      });
    };
    return esperarCartao(t, id).then(function () { return tentar(4); }).catch(function (e) {
      if (/not found|not on current board/i.test(e && e.message || '')) {
        throw new Error('O cartão foi criado, mas o Trello demorou para reconhecê-lo e os dados da meta não foram gravados. Abra o cartão na lista ' + CFG.listaMetas + ' e use Transformar em meta.');
      }
      throw e;
    });
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
              var e = new Error('Autorize novamente o acesso ao Trello para continuar.');
              e.code = 'AUTH'; throw e;
            });
          }
          if (!resp.ok) return resp.text().then(function (txt) { throw falha(resp.status === 403 ? 'Você não tem permissão para esta operação.' : (resp.status === 429 ? 'Muitas operações em sequência. Aguarde e tente novamente.' : 'O Trello não concluiu a operação. Tente novamente.')); });
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
  // O marcador é exclusivo de taxas: ali ele indica o percentual-alvo.
  // Ritmo esperado é explicado em texto, sem um segundo significado na barra.
  function barra(r, opts) {
    opts = opts || {};
    var pos = r.marcaEm === undefined ? null : r.marcaEm;
    var titulo = opts.texto || ('Progresso: ' + numBR(r.pct, 1) + '%');
    if (pos !== null) titulo = opts.texto || ('O traço marca o objetivo de ' + numBR(r.marcaEm) + '%');
    var valor = pos !== null ? r.fill : Math.max(0, Math.min(100, r.pct));
    return '<div class="barra' + (opts.grossa ? ' barra-grossa' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + valor +
      '" aria-valuetext="' + esc(titulo) + '" aria-label="' + esc(opts.label || 'Progresso') + '" title="' + esc(titulo) + '">' +
      '<div class="barra-fill sit-' + (opts.cor || r.info.cls) + '" style="width:' + r.fill + '%"></div>' +
      (pos !== null ? '<div class="barra-marca" style="left:' + pos + '%"></div>' : '') + '</div>';
  }
  function selo(r) { return '<span class="selo sit-' + r.info.cls + '">' + esc(r.rotulo || r.info.label) + '</span>'; }
  function avatar(m, tam) {
    var ini = (m.initials || (m.fullName || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('')).toUpperCase();
    return '<span class="avatar" style="width:' + (tam || 28) + 'px;height:' + (tam || 28) + 'px" title="' + esc(m.fullName) + '">' + esc(ini) + '</span>';
  }
  // Ícone de importância: só aparece para Alta e Muito alta
  function iconeImp(imp) {
    if (!imp || imp < 2) return '';
    var nome = 'Importância ' + IMP[imp].toLowerCase();
    var cor = imp === 3 ? 'var(--late)' : 'var(--imp-alta)';
    var tracos = imp === 3 ? '<path d="M5 10l5-5 5 5M5 16l5-5 5 5"/>' : '<path d="M5 13l5-5 5 5"/>';
    return '<span class="imp" title="' + nome + '" role="img" aria-label="' + nome + '">' +
      '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:' + cor + '" aria-hidden="true">' + tracos + '</svg></span>';
  }

  window.Metas = {
    CFG: CFG, unidade: unidade, pluralUnidade: pluralUnidade, erroUsuario: erroUsuario, validarValor: validarValor, periodoAberto: periodoAberto, singular: singular, faltam: faltam, SIT: SIT, IMP: IMP, TIPO: TIPO, FORMATO: FORMATO, MESES: MESES, pontos: pontos,
    formatarCentavos: formatarCentavos, mascararDinheiro: mascararDinheiro, mascararValor: mascararValor,
    dimensionarTags: dimensionarTags, textoProgressoDia: textoProgressoDia, separar: separar, situacaoDia: situacaoDia, dataCartao: dataCartao, iso: iso, parse: parse, hoje: hoje, addDias: addDias, diasEntre: diasEntre, dataBR: dataBR, dataBRCompleta: dataBRCompleta,
    contarDias: contarDias, diaUtil: diaUtil, inicioMes: inicioMes, fimMes: fimMes,
    numBR: numBR, casasDe: casasDe, fmtValor: fmtValor, rotuloEixo: rotuloEixo, arred: arred, arredCima: arredCima,
    lerNumero: lerNumero, formatarDigitado: formatarDigitado, mascarar: mascarar, decimaisDigitados: decimaisDigitados,
    diaria: diaria, percentualExibido: percentualExibido, valorAtual: valorAtual, ultimaAtualizacao: ultimaAtualizacao, avaliar: avaliar,
    textoDiff: textoDiff, classeDiff: classeDiff, textoBadge: textoBadge, textoMetaDia: textoMetaDia, temMetaDia: temMetaDia,
    prepararCard: prepararCard, aplicarTema: aplicarTema, contexto: contexto, ehAdmin: ehAdmin, listasDeMetas: listasDeMetas, carregarMetas: carregarMetas, salvarMeta: salvarMeta, salvarMetaNova: salvarMetaNova, noPeriodo: noPeriodo,
    chaveConfigurada: chaveConfigurada, autorizado: autorizado, autorizar: autorizar, rest: rest, garantirLista: garantirLista,
    esc: esc, barra: barra, selo: selo, avatar: avatar, iconeImp: iconeImp, CHAVE: CHAVE
  };
})();
