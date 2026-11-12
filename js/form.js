/* Formulário de meta: criar, transformar cartão em meta e editar */
(function () {
  var M = window.Metas, esc = M.esc;

  var AJUDA = {
    q: 'Um valor com alvo: faturamento, quantidade de clientes, taxa de entrega no prazo. O progresso vem dos registros de valor.',
    e: 'A meta é dividida em entregas. O progresso é a parte das etapas já marcadas na checklist do cartão.',
    a: 'Sem número nem etapas. No fim do período, um admin avalia: não atingida, parcial, atingida ou superada.'
  };
  var IMP_ROT = { 1: 'Normal', 2: 'Alta', 3: 'Muito alta' };

  // Limites do período (mês, trimestre ou semestre) que contém a data de referência
  function limites(tipo, ref) {
    var d = M.parse(ref), y = d.getFullYear(), m = d.getMonth();
    if (tipo === 'mes') return [M.inicioMes(y, m), M.fimMes(y, m)];
    if (tipo === 'tri') { var q = Math.floor(m / 3) * 3; return [M.inicioMes(y, q), M.fimMes(y, q + 2)]; }
    var s = m < 6 ? 0 : 6;
    return [M.inicioMes(y, s), M.fimMes(y, s + 5)];
  }
  function detectarPeriodo(ini, fim) {
    if (!ini || !fim) return 'livre';
    var achou = 'livre';
    ['mes', 'tri', 'sem'].forEach(function (p) {
      var l = limites(p, ini);
      if (achou === 'livre' && l[0] === ini && l[1] === fim) achou = p;
    });
    return achou;
  }

  // o: { t, ctx, modo, cardId, original, nomeCartao, aoCancelar, aoSalvo, ajustar }
  M.formulario = function (el, o) {
    var t = o.t, modo = o.modo, original = o.original || null;
    var S = { tipo: 'q', fmt: 'r', imp: 1 };

    var rotuloBotao = modo === 'criar' ? 'Criar meta' : (modo === 'editar' ? 'Salvar alterações' : 'Transformar em meta');
    var info = modo === 'criar' ? 'A meta vira um cartão na lista ' + M.CFG.listaMetas + ', com a pessoa responsável como membro.' : 'Cartão: ' + (o.nomeCartao || '');

    function erroCampo(chave) { return '<span class="erro-campo oculto" data-erro="' + chave + '" role="alert"></span>'; }

    el.innerHTML =
      '<form id="f" class="form" novalidate>' +
      '<div id="blocoAuth" class="aviso linha entre oculto"><span id="authTexto">Para criar o cartão da meta, o Power-Up precisa de permissão neste navegador. A autorização vale 30 dias.</span><button type="button" class="btn btn-primario" id="autorizar">Autorizar</button></div>' +
      '<div id="blocoSemChave" class="aviso oculto">A chave da API ainda não foi configurada, então não dá para criar cartões por aqui. Crie o cartão na lista Metas e use o botão Transformar em meta dentro dele.</div>' +

      '<div class="grade3">' +
      (modo === 'criar' ? '<label class="campo" id="campoTitulo">Título<input id="titulo" type="text" placeholder="Ex.: Faturamento no mês" maxlength="120">' + erroCampo('titulo') + '</label>' : '<div class="coluna gap4"><span class="peq forte sub">Cartão</span><span style="min-height:36px;display:flex;align-items:center">' + esc(o.nomeCartao || '') + '</span></div>') +
      '<label class="campo">Responsável<select id="dono"></select>' + erroCampo('dono') + '</label>' +
      '<div class="coluna gap4"><span class="peq forte sub" id="impL">Importância</span><div class="seg" role="group" aria-labelledby="impL">' +
      [1, 2, 3].map(function (n) { return '<button type="button" data-imp="' + n + '" aria-pressed="false">' + M.iconeImp(n) + IMP_ROT[n] + '</button>'; }).join('') + '</div></div></div>' +

      '<div class="grade4">' +
      '<div class="coluna gap4"><span class="peq forte sub" id="tipoL">Tipo</span><div class="seg" role="group" aria-labelledby="tipoL">' +
      '<button type="button" data-tipo="q" aria-pressed="true">Valor</button><button type="button" data-tipo="e" aria-pressed="false">Etapas</button><button type="button" data-tipo="a" aria-pressed="false">Avaliação</button></div></div>' +
      '<label class="campo">Período<select id="periodo"><option value="mes">Mensal</option><option value="tri">Trimestral</option><option value="sem">Semestral</option><option value="livre">Datas livres</option></select></label>' +
      '<label class="campo">Início<input id="ini" type="date">' + erroCampo('ini') + '</label>' +
      '<label class="campo">Fim<input id="fim" type="date">' + erroCampo('fim') + '</label></div>' +
      '<span class="ajuda" id="tipoAjuda"></span><span class="ajuda aviso-suave oculto" id="avisoPeriodo"></span>' +

      '<div id="blocoQ" class="caixa coluna gap12">' +
      '<div class="grade4">' +
      '<div class="coluna gap4" style="grid-column:span 2"><span class="peq forte sub" id="fmtL">Formato do valor</span><div class="chips" role="group" aria-labelledby="fmtL">' +
      '<button type="button" data-fmt="r" aria-pressed="true">Dinheiro (R$)</button><button type="button" data-fmt="n" aria-pressed="false">Número</button><button type="button" data-fmt="p" aria-pressed="false">Percentual</button></div></div>' +
      '<label class="campo" id="campoUnidade" style="grid-column:span 2">Unidade<input id="unit" type="text" placeholder="Ex.: clientes" maxlength="30">' + erroCampo('unit') + '</label></div>' +
      '<div class="grade4">' +
      '<label class="campo">Ponto de partida<span class="campo-prefixo"><span class="pre"></span><input id="vIni" type="text" inputmode="decimal" autocomplete="off" value="0"><span class="suf"></span></span>' + erroCampo('vIni') + '</label>' +
      '<label class="campo">Alvo<span class="campo-prefixo"><span class="pre"></span><input id="alvo" type="text" inputmode="decimal" autocomplete="off"><span class="suf"></span></span>' + erroCampo('alvo') + '</label>' +
      '<label class="campo">Objetivo<select id="dir"><option value="up">Aumentar até o alvo</option><option value="down">Reduzir até o alvo</option></select></label>' +
      '<label class="campo" id="campoLembrete">Lembrar de atualizar<select id="lembrete"><option value="seg">Toda segunda-feira</option><option value="dia">Todo dia útil</option><option value="15">A cada 15 dias</option><option value="nao">Nunca</option></select></label></div></div>' +

      '<div id="blocoE" class="caixa coluna gap8 oculto"><span class="peq forte sub">Etapas</span><div id="etapas" class="coluna gap8"></div>' + erroCampo('etapas') +
      '<div><button type="button" class="btn" id="maisEtapa">Adicionar etapa</button></div><span class="ajuda" id="etapasAjuda">As etapas viram a checklist do cartão. Depois de criada a meta, edite as etapas direto na checklist.</span></div>' +

      '<div id="blocoA" class="caixa oculto"><label class="campo">Como a meta será avaliada<textarea id="crit" maxlength="400" placeholder="Ex.: enviar orçamento em até 4 horas úteis na maior parte dos pedidos do mês"></textarea>' + erroCampo('crit') + '</label></div>' +

      '<details class="mais"><summary>Mais opções</summary><div class="coluna gap12" style="padding-top:12px"><div class="grade3">' +
      '<label class="campo">Quem atualiza<select id="quem"><option value="resp">Responsável e admins</option><option value="admin">Só admins</option></select></label>' +
      '<label class="campo" id="campoRitmo">Contar o ritmo em<select id="ritmo"><option value="uteis">Dias úteis</option><option value="corridos">Dias corridos</option></select></label></div>' +
      '<label class="campo">O que conta para a meta<textarea id="oque" maxlength="400" placeholder="Ex.: pedidos faturados no mês, sem frete"></textarea></label></div></details>' +

      '<div class="form-rodape"><span class="peq sub" id="rodapeInfo">' + esc(info) + '</span>' +
      '<div class="linha" style="flex:none"><button type="button" class="btn btn-texto" id="cancelar">Cancelar</button><button type="submit" class="btn btn-primario" id="salvar">' + rotuloBotao + '</button></div></div>' +
      '</form>';

    var $ = function (id) { return el.querySelector('#' + id); };
    var ajustar = function () { if (o.ajustar) o.ajustar(); };
    var casasDigitacao = function () { return 2; };

    // ---------- erros ----------
    function limparErros() {
      el.querySelectorAll('[data-erro]').forEach(function (s) { s.classList.add('oculto'); s.textContent = ''; });
      el.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
      geral('');
    }
    function geral(txt) {
      var r = $('rodapeInfo');
      r.textContent = txt || info;
      r.classList.toggle('erro-texto', !!txt);
      r.setAttribute('role', txt ? 'alert' : 'status');
    }
    function Falha(chave, msg) { this.chave = chave; this.msg = msg; }
    function mostrarFalha(f) {
      var s = el.querySelector('[data-erro="' + f.chave + '"]'), campo = $(f.chave) || (f.chave === 'etapas' ? $('etapas').querySelector('input') : null);
      if (s) { s.textContent = f.msg; s.classList.remove('oculto'); } else geral(f.msg);
      if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    }

    // ---------- estado visual ----------
    function aplicarImp() {
      el.querySelectorAll('[data-imp]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-imp') === S.imp)); });
    }
    function aplicarTipo() {
      el.querySelectorAll('[data-tipo]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tipo') === S.tipo)); });
      $('tipoAjuda').textContent = AJUDA[S.tipo];
      $('blocoQ').classList.toggle('oculto', S.tipo !== 'q');
      $('blocoE').classList.toggle('oculto', S.tipo !== 'e');
      $('blocoA').classList.toggle('oculto', S.tipo !== 'a');
      $('campoRitmo').classList.toggle('oculto', S.tipo === 'a');
      avisoPeriodo();
      ajustar();
    }
    function aplicarFmt() {
      el.querySelectorAll('[data-fmt]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fmt') === S.fmt)); });
      el.querySelectorAll('.pre').forEach(function (s) { s.textContent = S.fmt === 'r' ? 'R$' : ''; });
      el.querySelectorAll('.suf').forEach(function (s) { s.textContent = S.fmt === 'p' ? '%' : ''; });
      $('campoUnidade').classList.toggle('invisivel', S.fmt !== 'n');
    }
    function avisoPeriodo() {
      var a = $('avisoPeriodo'), ini = $('ini').value;
      var passou = modo !== 'editar' && S.tipo === 'q' && ini && ini < M.hoje();
      a.textContent = passou ? 'O período já começou. O esperado de hoje conta desde ' + M.dataBR(ini) + ', então registre o resultado até agora logo depois de criar a meta.' : '';
      a.classList.toggle('oculto', !passou);
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
    function montarMembros(membros, selecionado) {
      var sel = $('dono');
      membros.slice().sort(function (a, b) { return a.fullName.localeCompare(b.fullName, 'pt-BR'); }).forEach(function (m) {
        var op = document.createElement('option');
        op.value = m.id; op.textContent = m.fullName;
        if (m.id === selecionado) op.selected = true;
        sel.appendChild(op);
      });
    }
    function preencher(meta) {
      S.tipo = meta.tipo; S.fmt = meta.fmt || 'r'; S.imp = meta.imp || 1;
      $('ini').value = meta.ini; $('fim').value = meta.fim;
      $('periodo').value = meta.periodo || detectarPeriodo(meta.ini, meta.fim);
      if (meta.tipo === 'q') {
        var c = M.casasDe(meta);
        $('vIni').value = M.numBR(meta.vIni, c); $('alvo').value = M.numBR(meta.alvo, c);
        $('unit').value = meta.unit || ''; $('dir').value = meta.dir || 'up'; $('ritmo').value = meta.ritmo || 'uteis';
        $('lembrete').value = meta.lembrete || 'seg';
      }
      $('crit').value = meta.crit || ''; $('oque').value = meta.oque || '';
      $('quem').value = meta.quem || 'resp';
      if (meta.oque || meta.quem === 'admin' || meta.ritmo === 'corridos') el.querySelector('details.mais').open = true;
    }

    // ---------- leitura e validação ----------
    function coletar() {
      var dono = o.ctx.membros.filter(function (m) { return m.id === $('dono').value; })[0];
      if (!dono) throw new Falha('dono', 'Escolha o responsável pela meta.');
      var ini = $('ini').value, fim = $('fim').value;
      if (!ini) throw new Falha('ini', 'Preencha o início do período.');
      if (!fim) throw new Falha('fim', 'Preencha o fim do período.');
      if (fim < ini) throw new Falha('fim', 'O fim precisa ser igual ou depois do início.');
      var meta = original ? JSON.parse(JSON.stringify(original)) : {};
      meta.dono = { id: dono.id, fullName: dono.fullName, initials: dono.initials || '' };
      meta.tipo = S.tipo; meta.imp = S.imp; meta.ini = ini; meta.fim = fim; meta.periodo = $('periodo').value;
      meta.quem = $('quem').value; meta.oque = $('oque').value.trim();
      meta.criadaEm = original ? original.criadaEm : M.hoje();
      meta.hist = original ? (original.hist || []) : [];
      meta.aval = original ? original.aval || null : null;
      meta.encerrada = original ? !!original.encerrada : false;
      if (S.tipo === 'q') {
        var tIni = $('vIni').value, tAlvo = $('alvo').value;
        var v0 = M.lerNumero(tIni), alvo = M.lerNumero(tAlvo), dir = $('dir').value;
        if (isNaN(v0)) throw new Falha('vIni', 'Digite o ponto de partida. Use 0 se a meta começa do zero.');
        if (isNaN(alvo)) throw new Falha('alvo', 'Digite o alvo da meta.');
        if (dir === 'up' && alvo <= v0) throw new Falha('alvo', 'Para aumentar, o alvo precisa ser maior que o ponto de partida.');
        if (dir === 'down' && alvo >= v0) throw new Falha('alvo', 'Para reduzir, o alvo precisa ser menor que o ponto de partida.');
        if (S.fmt === 'n' && !$('unit').value.trim()) throw new Falha('unit', 'Informe a unidade, por exemplo: clientes, pedidos, páginas.');
        meta.fmt = S.fmt; meta.vIni = v0; meta.alvo = alvo; meta.dir = dir; meta.unit = S.fmt === 'n' ? $('unit').value.trim() : '';
        meta.casas = S.fmt === 'r' ? 2 : Math.max(M.decimaisDigitados(tIni), M.decimaisDigitados(tAlvo));
        meta.ritmo = $('ritmo').value; meta.lembrete = $('lembrete').value;
      }
      if (S.tipo === 'e') meta.ritmo = $('ritmo').value;
      if (S.tipo === 'a') {
        meta.crit = $('crit').value.trim();
        if (!meta.crit) throw new Falha('crit', 'Explique como a meta será avaliada, para a pessoa saber o que se espera.');
      }
      return meta;
    }

    function sincronizarDatas(cardId, meta) {
      if (original && original.ini === meta.ini && original.fim === meta.fim) return Promise.resolve();
      return M.autorizado(t).then(function (ok) {
        if (!ok) return null;
        var fimD = M.parse(meta.fim); fimD.setHours(18, 0, 0, 0);
        var iniD = M.parse(meta.ini); iniD.setHours(12, 0, 0, 0);
        return M.rest(t, 'PUT', '/cards/' + cardId, { start: iniD.toISOString(), due: fimD.toISOString() }).catch(function () { return null; });
      });
    }

    function salvar(ev) {
      ev.preventDefault();
      limparErros();
      var titulo = '', etapas = [], meta;
      if (modo === 'criar') {
        titulo = $('titulo').value.trim();
        if (!titulo) { mostrarFalha(new Falha('titulo', 'Dê um título para a meta.')); return; }
      }
      try { meta = coletar(); } catch (e) { if (e instanceof Falha) { mostrarFalha(e); return; } throw e; }
      if (modo === 'criar') {
        if (S.tipo === 'e') {
          etapas = Array.prototype.map.call($('etapas').querySelectorAll('input'), function (i) { return i.value.trim(); }).filter(Boolean);
          if (!etapas.length) { mostrarFalha(new Falha('etapas', 'Inclua pelo menos uma etapa.')); return; }
        }
      }
      var btn = $('salvar'); btn.disabled = true;

      var p;
      if (modo === 'criar') {
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
        }).then(function () {
          novo.badges = { checkItems: etapas.length, checkItemsChecked: 0 };
          novo.members = [{ id: meta.dono.id }];
          if (o.aoSalvo) o.aoSalvo({ cardId: novo.id, meta: meta, card: novo, criado: true });
        });
      } else {
        p = M.salvarMeta(t, o.cardId, meta).then(function () { return sincronizarDatas(o.cardId, meta); }).then(function () {
          if (o.aoSalvo) o.aoSalvo({ cardId: o.cardId, meta: meta, criado: false });
        });
      }
      p.catch(function (e) {
        geral(e.message || 'Não foi possível salvar a meta.');
        if (e.code === 'AUTH') verificarAuth(); else btn.disabled = false;
      });
    }

    function verificarAuth() {
      if (modo !== 'criar') {
        // Na edição, a autorização só serve para as datas do cartão acompanharem o período
        if (!M.chaveConfigurada()) return Promise.resolve();
        $('authTexto').textContent = 'Autorize o Power-Up para que as datas do cartão acompanhem o período da meta. Sem isso, só a meta é salva. A autorização vale 30 dias.';
        return M.autorizado(t).then(function (ok) { $('blocoAuth').classList.toggle('oculto', ok); ajustar(); });
      }
      if (!M.chaveConfigurada()) { $('blocoSemChave').classList.remove('oculto'); $('salvar').disabled = true; return Promise.resolve(); }
      return M.autorizado(t).then(function (ok) {
        $('blocoAuth').classList.toggle('oculto', ok);
        $('salvar').disabled = !ok;
        ajustar();
      });
    }

    // ---------- início ----------
    var h = M.parse(M.hoje());
    if (original) preencher(original);
    else {
      $('ini').value = M.inicioMes(h.getFullYear(), h.getMonth()); $('fim').value = M.fimMes(h.getFullYear(), h.getMonth());
      if (modo === 'criar') { addEtapa(''); addEtapa(''); }
    }
    if (modo !== 'criar') { $('maisEtapa').classList.add('oculto'); $('etapasAjuda').textContent = 'As etapas desta meta são a checklist do cartão. Crie ou edite as etapas direto nela.'; }
    montarMembros(o.ctx.membros, original && original.dono ? original.dono.id : null);
    M.mascarar($('vIni'), casasDigitacao);
    M.mascarar($('alvo'), casasDigitacao);
    aplicarImp(); aplicarTipo(); aplicarFmt();

    el.querySelectorAll('[data-tipo]').forEach(function (b) { b.onclick = function () { S.tipo = b.getAttribute('data-tipo'); aplicarTipo(); }; });
    el.querySelectorAll('[data-fmt]').forEach(function (b) { b.onclick = function () { S.fmt = b.getAttribute('data-fmt'); aplicarFmt(); }; });
    el.querySelectorAll('[data-imp]').forEach(function (b) { b.onclick = function () { S.imp = +b.getAttribute('data-imp'); aplicarImp(); }; });
    $('periodo').onchange = function () {
      var p = $('periodo').value;
      if (p === 'livre') return;
      var l = limites(p, $('ini').value || M.hoje());
      $('ini').value = l[0]; $('fim').value = l[1];
      avisoPeriodo();
    };
    var datasMudaram = function () { $('periodo').value = detectarPeriodo($('ini').value, $('fim').value); avisoPeriodo(); };
    $('ini').onchange = datasMudaram; $('fim').onchange = datasMudaram;
    $('maisEtapa').onclick = function () { addEtapa(''); };
    $('cancelar').onclick = function () { if (o.aoCancelar) o.aoCancelar(); };
    $('autorizar').onclick = function () {
      M.autorizar(t).then(verificarAuth).catch(function () { geral('A autorização não foi concluída. Tente de novo e confirme na janela do Trello.'); });
    };
    el.querySelectorAll('input, select, textarea').forEach(function (c) {
      c.addEventListener('input', function () {
        c.removeAttribute('aria-invalid');
        var s = c.closest('label') && c.closest('label').querySelector('[data-erro]');
        if (s) { s.classList.add('oculto'); s.textContent = ''; }
      });
    });
    $('f').onsubmit = salvar;
    verificarAuth().then(ajustar);
    var primeiro = $('titulo') || $('dono');
    if (primeiro) primeiro.focus();
  };
})();
