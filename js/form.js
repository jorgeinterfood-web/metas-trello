/* Formulário de meta: criar, transformar cartão em meta e editar */
(function () {
  var M = window.Metas, esc = M.esc;

  var TIPOS = [['r', 'Dinheiro'], ['n', 'Quantidade'], ['p', 'Percentual'], ['e', 'Etapas']];
  var AJUDA = {
    r: 'Valor em reais que acumula no período, como faturamento.',
    n: 'Contagem que acumula no período, como clientes novos ou pedidos.',
    p: 'Taxa que precisa chegar a um nível, como entrega no prazo.',
    e: 'Entregas marcadas numa checklist no cartão.',
    a: 'Sem número. Um administrador avalia o resultado no fim do período.'
  };

  function nomeMes(y, m) { return M.MESES[m].charAt(0).toUpperCase() + M.MESES[m].slice(1) + ' de ' + y; }
  function limites(tipo, ref) {
    var d = M.parse(ref), y = d.getFullYear(), m = d.getMonth();
    if (tipo === 'mes') return [M.inicioMes(y, m), M.fimMes(y, m)];
    if (tipo === 'tri') { var q = Math.floor(m / 3) * 3; return [M.inicioMes(y, q), M.fimMes(y, q + 2)]; }
    var s = m < 6 ? 0 : 6;
    return [M.inicioMes(y, s), M.fimMes(y, s + 5)];
  }
  // Nome do período quando as datas fecham um mês, trimestre ou semestre
  function rotuloPeriodo(ini, fim) {
    var d = M.parse(ini), y = d.getFullYear(), m = d.getMonth(), l;
    l = limites('mes', ini); if (l[0] === ini && l[1] === fim) return { tipo: 'mes', rot: nomeMes(y, m) };
    l = limites('tri', ini); if (l[0] === ini && l[1] === fim) return { tipo: 'tri', rot: (Math.floor(m / 3) + 1) + 'º trimestre de ' + y };
    l = limites('sem', ini); if (l[0] === ini && l[1] === fim) return { tipo: 'sem', rot: (m < 6 ? 1 : 2) + 'º semestre de ' + y };
    return null;
  }
  function opcoesPeriodo() {
    var h = M.hoje(), d = M.parse(h), y = d.getFullYear(), m = d.getMonth();
    var proxMes = M.iso(new Date(y, m + 1, 1)), proxTri = M.iso(new Date(y, Math.floor(m / 3) * 3 + 3, 1));
    return [limites('mes', h), limites('mes', proxMes), limites('tri', h), limites('tri', proxTri), limites('sem', h)].map(function (l) {
      return { valor: l[0] + '|' + l[1], rot: rotuloPeriodo(l[0], l[1]).rot };
    });
  }

  // o: { t, ctx, modo, cardId, original, nomeCartao, aoCancelar, aoSalvo, ajustar }
  M.formulario = function (el, o) {
    var t = o.t, modo = o.modo, original = o.original || null;
    var S = { kind: 'r', imp: 1, auth: false, ocupado: false, novo: null, metaSalva: false, checklist: null, etapasFeitas: 0 };
    var rotuloBotao = modo === 'criar' ? 'Criar meta' : (modo === 'editar' ? 'Salvar alterações' : 'Transformar em meta');

    function erroCampo(chave) { return '<span class="erro-campo oculto" data-erro="' + chave + '" role="alert"></span>'; }
    var ops = opcoesPeriodo();
    if (original) {
      var rp = rotuloPeriodo(original.ini, original.fim), v = original.ini + '|' + original.fim;
      if (rp && !ops.some(function (x) { return x.valor === v; })) ops.unshift({ valor: v, rot: rp.rot });
    }

    el.innerHTML =
      '<form id="f" class="form" novalidate>' +
      '<div id="blocoSemChave" class="aviso oculto">Criação indisponível. Crie um cartão em Metas e use Transformar em meta.</div>' +

      '<div class="coluna gap8"><span class="rotulo" id="tipoL">Tipo de meta</span>' +
      '<div class="seg seg-largo" role="group" aria-labelledby="tipoL">' + TIPOS.concat(original && original.tipo === 'a' ? [['a', 'Avaliação']] : []).map(function (k) { return '<button type="button" data-kind="' + k[0] + '" aria-pressed="false">' + k[1] + '</button>'; }).join('') + '</div>' +
      '<span class="ajuda" id="tipoAjuda"></span></div>' +

      '<div class="grade">' +
      '<label class="campo">Responsável<select id="dono"></select>' + erroCampo('dono') + '</label>' +
      (modo === 'criar' ? '<label class="campo">Título<input id="titulo" type="text" placeholder="Ex.: Faturamento do mês" maxlength="120">' + erroCampo('titulo') + '</label>' :
        '<div class="campo"><span class="rotulo">Cartão</span><span class="campo-texto">' + esc(o.nomeCartao || '') + '</span></div>') +
      '<label class="campo">Período<select id="periodo">' + ops.map(function (x) { return '<option value="' + x.valor + '">' + esc(x.rot) + '</option>'; }).join('') + '<option value="livre">Outras datas</option></select></label>' +
      '</div>' +

      '<div class="grade oculto" id="linhaDatas">' +
      '<label class="campo">Início<input id="ini" type="date">' + erroCampo('ini') + '</label>' +
      '<label class="campo">Fim<input id="fim" type="date">' + erroCampo('fim') + '</label></div>' +

      '<div class="grade" id="blocoQ">' +
      '<label class="campo"><span id="rotVIni">Valor inicial</span><span class="campo-prefixo"><span class="pre"></span><input id="vIni" type="text" inputmode="decimal" autocomplete="off"><span class="suf"></span></span>' + erroCampo('vIni') + '</label>' +
      '<label class="campo">Objetivo<span class="campo-prefixo"><span class="pre"></span><input id="alvo" type="text" inputmode="decimal" autocomplete="off"><span class="suf"></span></span>' + erroCampo('alvo') + '</label>' +
      '<label class="campo" id="campoUnidade">Unidade no plural<input id="unit" type="text" placeholder="Ex.: clientes" maxlength="30">' + erroCampo('unit') + '</label></div>' +
      '<label class="campo oculto" id="campoSingular">Unidade no singular<input id="unitSingular" maxlength="30" placeholder="Ex.: cliente"><span class="ajuda">Confira o singular, especialmente em unidades personalizadas.</span></label>' +

      '<div class="coluna gap8 oculto" id="blocoE"><span class="rotulo">Etapas</span><div id="etapas" class="coluna gap8"></div>' + erroCampo('etapas') +
      '<div class="linha gap12"><button type="button" class="btn" id="maisEtapa">Adicionar etapa</button><span class="ajuda" id="etapasAjuda">As etapas viram a checklist do cartão.</span></div></div>' +

      '<label class="campo oculto" id="blocoA">Como a meta será avaliada<textarea id="crit" maxlength="400" placeholder="Ex.: responder orçamentos em até 4 horas úteis na maior parte dos pedidos do mês"></textarea>' + erroCampo('crit') + '</label>' +

      '<div class="grade"><div class="campo"><span class="rotulo" id="impL">Importância</span><div class="seg" role="group" aria-labelledby="impL">' +
      [1, 2, 3].map(function (n) { return '<button type="button" data-imp="' + n + '" aria-pressed="false">' + M.iconeImp(n) + M.IMP[n] + '</button>'; }).join('') + '</div></div></div>' +

      '<details class="mais"><summary>Mais opções</summary><div class="coluna gap16 mais-corpo">' +
      '<div class="grade">' +
      '<label class="campo" id="campoQuem">Quem atualiza<select id="quem"><option value="resp">Responsável e administradores</option><option value="admin">Só administradores</option></select></label>' +
      '<label class="campo" id="campoRitmo">Contagem de dias<select id="ritmo"><option value="uteis">Dias úteis</option><option value="corridos">Dias corridos</option></select></label></div></div></details>' +

      '<div class="form-rodape"><span class="peq" id="rodapeInfo" role="status"></span>' +
      '<div class="linha gap8" style="flex:none"><button type="button" class="btn btn-texto" id="cancelar">Cancelar</button><button type="submit" class="btn btn-primario" id="salvar">' + rotuloBotao + '</button></div></div>' +
      '</form>';

    var $ = function (id) { return el.querySelector('#' + id); };
    var ajustar = function () { if (o.ajustar) o.ajustar(); };
    function ehValor() { return S.kind === 'r' || S.kind === 'n' || S.kind === 'p'; }

    // ---------- erros ----------
    function geral(txt) { var r = $('rodapeInfo'); r.textContent = txt || ''; r.className = 'peq' + (txt ? ' erro-texto' : ''); }
    function limparErros() {
      el.querySelectorAll('[data-erro]').forEach(function (s) { s.classList.add('oculto'); s.textContent = ''; });
      el.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
      geral('');
    }
    function Falha(chave, msg) { this.chave = chave; this.msg = msg; }
    function mostrarFalha(f) {
      var s = el.querySelector('[data-erro="' + f.chave + '"]'), campo = $(f.chave) || (f.chave === 'etapas' ? $('etapas').querySelector('input') : null);
      if (s) { s.textContent = f.msg; s.classList.remove('oculto'); } else geral(f.msg);
      if (s) { s.id = 'erro-' + f.chave; }
      if (campo) { campo.setAttribute('aria-describedby', 'erro-' + f.chave); campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    }

    // ---------- máscara única que segue o tipo escolhido ----------
    function mascara(input) {
      input.addEventListener('input', function () {
        var novo = S.kind === 'r' ? M.formatarCentavos(input.value) : M.formatarDigitado(input.value, 2);
        if (novo !== input.value) { input.value = novo; try { input.setSelectionRange(novo.length, novo.length); } catch (e) {} }
      });
      input.addEventListener('paste', function (ev) {
        var cb = ev.clipboardData || window.clipboardData;
        if (!cb) return;
        var n = M.lerNumero(cb.getData('text'));
        if (!Number.isFinite(n) || n < 0 || Math.abs(n*100-Math.round(n*100))>0.000001) { ev.preventDefault(); input.value=cb.getData('text'); return; }
        ev.preventDefault();
        input.value = S.kind === 'r' ? M.numBR(n, 2, 2) : M.formatarDigitado(M.numBR(n, 2), 2);
      });
    }
    function reformatar(input) {
      var n = M.lerNumero(input.value);
      if (isNaN(n)) return;
      input.value = S.kind === 'r' ? M.numBR(n, 2, 2) : M.formatarDigitado(M.numBR(n, 2), 2);
    }

    // ---------- estado visual ----------
    function aplicarImp() { el.querySelectorAll('[data-imp]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-imp') === S.imp)); }); }
    function aplicarKind() {
      el.querySelectorAll('[data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kind') === S.kind)); });
      if ($('ajudaDinheiro')) $('ajudaDinheiro').classList.toggle('oculto',S.kind!=='r');
      $('tipoAjuda').textContent = AJUDA[S.kind];
      $('blocoQ').classList.toggle('oculto', !ehValor());
      $('blocoE').classList.toggle('oculto', S.kind !== 'e');
      $('blocoA').classList.toggle('oculto', S.kind !== 'a');
      $('campoSingular').classList.toggle('oculto', S.kind !== 'n');
      $('campoUnidade').classList.toggle('invisivel', S.kind !== 'n');
      $('campoQuem').classList.toggle('oculto', !ehValor());
      $('campoRitmo').classList.toggle('oculto', S.kind === 'a' || S.kind === 'p');
      el.querySelectorAll('.pre').forEach(function (s) { s.textContent = S.kind === 'r' ? 'R$' : ''; });
      el.querySelectorAll('.suf').forEach(function (s) { s.textContent = S.kind === 'p' ? '%' : ''; });
      $('rotVIni').textContent = S.kind === 'p' ? 'Percentual inicial' : 'Valor inicial';
      reformatar($('vIni')); reformatar($('alvo'));
      ajustar();
    }
    function aplicarPeriodo() {
      var livre = $('periodo').value === 'livre';
      $('linhaDatas').classList.toggle('oculto', !livre);
      if (!livre) { var p = $('periodo').value.split('|'); $('ini').value = p[0]; $('fim').value = p[1]; }
      ajustar();
    }
    function addEtapa(txt) {
      var n = $('etapas').children.length + 1;
      var d = document.createElement('div');
      d.className = 'linha gap8';
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
      S.kind = meta.tipo === 'q' ? (meta.fmt || 'r') : meta.tipo;
      S.imp = meta.imp || 1;
      var v = meta.ini + '|' + meta.fim;
      $('periodo').value = Array.prototype.some.call($('periodo').options, function (op) { return op.value === v; }) ? v : 'livre';
      $('ini').value = meta.ini; $('fim').value = meta.fim;
      if (meta.tipo === 'q') {
        var c = M.casasDe(meta);
        $('vIni').value = meta.fmt === 'r' ? M.numBR(meta.vIni, 2, 2) : M.numBR(meta.vIni, c);
        $('alvo').value = meta.fmt === 'r' ? M.numBR(meta.alvo, 2, 2) : M.numBR(meta.alvo, c);
        $('unit').value = M.unidade(meta.unit); $('unitSingular').value = M.unidade(meta.unitSingular || M.singular(meta.unit)); $('ritmo').value = meta.ritmo || 'uteis';
      }
      if (meta.tipo === 'e') $('ritmo').value = meta.ritmo || 'uteis';
      $('crit').value = meta.crit || ''; $('quem').value = meta.quem || 'resp';
      if (meta.quem === 'admin' || meta.ritmo === 'corridos') el.querySelector('details.mais').open = true;
    }

    // ---------- leitura e validação ----------
    function coletar() {
      var dono = o.ctx.membros.filter(function (m) { return m.id === $('dono').value; })[0];
      if (!dono) throw new Falha('dono', 'Escolha o responsável pela meta.');
      var ini = $('ini').value, fim = $('fim').value;
      if (!ini) throw new Falha('ini', 'Preencha o início do período.');
      if (!fim) throw new Falha('fim', 'Preencha o fim do período.');
      if (fim < ini) throw new Falha('fim', 'A data final não pode ser anterior à inicial.');
      if ($('ritmo').value === 'uteis' && S.kind !== 'p' && S.kind !== 'a' && !M.contarDias(ini, fim, 'uteis')) throw new Falha('fim', 'Escolha um período com pelo menos um dia útil.');
      var meta = original ? JSON.parse(JSON.stringify(original)) : {};
      var rp = rotuloPeriodo(ini, fim);
      meta.dono = { id: dono.id, fullName: dono.fullName, initials: dono.initials || '' };
      meta.tipo = ehValor() ? 'q' : S.kind; meta.imp = S.imp; meta.ini = ini; meta.fim = fim; meta.periodo = rp ? rp.tipo : 'livre';
      meta.quem = $('quem').value;
      delete meta.oque; delete meta.lembrete; // campos que deixaram de existir
      meta.criadaEm = original ? original.criadaEm : M.hoje();
      meta.hist = original ? (original.hist || []) : [];
      meta.aval = original ? original.aval || null : null;
      meta.encerrada = original ? !!original.encerrada : false;
      if (ehValor()) {
        var tIni = $('vIni').value, tAlvo = $('alvo').value;
        var v0 = M.lerNumero(tIni), alvo = M.lerNumero(tAlvo);
        if (isNaN(v0)) throw new Falha('vIni', 'Digite o valor inicial. Use 0 se a meta começa do zero.');
        if (isNaN(alvo)) throw new Falha('alvo', 'Digite o objetivo da meta.');
        if (alvo === v0) throw new Falha('alvo', 'O objetivo precisa ser diferente do valor inicial.');
        if (S.kind === 'n' && !$('unit').value.trim()) throw new Falha('unit', 'Informe a unidade, por exemplo: clientes, pedidos, páginas.');
        try { M.validarValor(v0, {fmt:S.kind,casas:2}); M.validarValor(alvo, {fmt:S.kind,casas:2}); } catch (e) { throw new Falha('alvo', e.message); }
        meta.fmt = S.kind; meta.vIni = v0; meta.alvo = alvo;
        meta.dir = alvo < v0 ? 'down' : 'up'; // objetivo menor que o valor inicial: meta de redução
        meta.unit = S.kind === 'n' ? M.pluralUnidade($('unit').value) : '';
        meta.unitSingular = S.kind === 'n' ? M.unidade($('unitSingular').value || M.singular(meta.unit)) : '';
        meta.casas = S.kind === 'r' ? 2 : Math.max(M.decimaisDigitados(tIni), M.decimaisDigitados(tAlvo));
        meta.ritmo = S.kind === 'p' ? 'uteis' : $('ritmo').value;
      }
      if (S.kind === 'e') meta.ritmo = $('ritmo').value;
      if (S.kind === 'a') {
        meta.crit = $('crit').value.trim();
        if (!meta.crit) throw new Falha('crit', 'Explique como a meta será avaliada, para a pessoa saber o que se espera.');
      }
      if (original && (original.hist || []).length && (original.tipo !== meta.tipo || original.fmt !== meta.fmt || M.pluralUnidade(original.unit) !== M.pluralUnidade(meta.unit) || original.vIni !== meta.vIni || M.casasDe(original) !== meta.casas)) throw new Falha('alvo', 'Esta meta já tem registros. Crie outra para mudar o tipo, a unidade ou o valor inicial.');
      if (original && (original.ini !== meta.ini || original.fim !== meta.fim || original.alvo !== meta.alvo || original.vIni !== meta.vIni || original.tipo !== meta.tipo || original.fmt !== meta.fmt || original.ritmo !== meta.ritmo)) delete meta.diaria;
      return meta;
    }

    function datasMudaram(meta) { return !original || original.ini !== meta.ini || original.fim !== meta.fim; }
    function sincronizarDatas(cardId, meta) {
      if (!datasMudaram(meta) || !S.auth) return Promise.resolve();
      var fimD = M.parse(meta.fim); fimD.setHours(23, 59, 59, 999);
      var iniD = M.parse(meta.ini); iniD.setHours(12, 0, 0, 0);
      return M.rest(t, 'PUT', '/cards/' + cardId, { start: M.dataCartao(meta.ini,false), due: M.dataCartao(meta.fim,true) });
    }

    // A autorização abre uma janela do Trello: precisa partir do clique, antes de qualquer espera
    function garantirAuth(obrigatoria) {
      if (S.auth || !M.chaveConfigurada()) return Promise.resolve(S.auth);
      return M.autorizar(t).then(function () { S.auth = true; return true; }, function () {
        if (obrigatoria) throw new Error('A autorização do Trello não foi concluída. Clique de novo e confirme na janela que abrir.');
        return false;
      });
    }

    function salvar(ev) {
      ev.preventDefault();
      if (S.ocupado) return;
      limparErros();
      var titulo = '', etapas = [], meta;
      if (modo === 'criar') {
        titulo = $('titulo').value.trim();
        if (!titulo) { mostrarFalha(new Falha('titulo', 'Dê um título para a meta.')); return; }
      }
      try { meta = coletar(); } catch (e) { if (e instanceof Falha) { mostrarFalha(e); return; } throw e; }
      if (modo === 'criar' && S.kind === 'e') {
        etapas = Array.prototype.map.call($('etapas').querySelectorAll('input'), function (i) { return i.value.trim(); }).filter(Boolean);
        if (!etapas.length) { mostrarFalha(new Falha('etapas', 'Inclua pelo menos uma etapa.')); return; }
      }
      var btn = $('salvar'), rotulo = btn.textContent; btn.disabled = true; S.ocupado = true; btn.textContent = 'Salvando...';
      el.querySelectorAll('input,select,textarea').forEach(function(x){x.disabled=true;});
      if (modo === 'criar') btn.textContent = 'Criando…';
      var auth;
      if (modo === 'criar') auth = garantirAuth(true);
      else auth = garantirAuth(false);


      var p;
      if (modo === 'criar') {
        var due = M.parse(meta.fim); due.setHours(23, 59, 59, 999);
        var start = M.parse(meta.ini); start.setHours(12, 0, 0, 0);
        var novo = S.novo; S.op = S.op || 'metas-criar:'+Date.now().toString(36)+Math.random().toString(36).slice(2); if(S.metaPendente) meta=S.metaPendente;
        p = auth.then(function () { return M.garantirLista(t, M.CFG.listaMetas, 'top'); }).then(function (lista) {
          if (S.novo) return S.novo;
          return t.board('id').then(function(b){return M.rest(t,'GET','/boards/'+b.id+'/cards',{fields:'id,name,desc'});}).then(function(cs){var existente=cs.filter(function(c){return c.desc===S.op;})[0];if(existente)return existente;return M.rest(t, 'POST', '/cards', {desc:S.op, idList: lista.id, name: titulo + ' · ' + meta.dono.fullName, idMembers: meta.dono.id, start: M.dataCartao(meta.ini,false), due: M.dataCartao(meta.fim,true), pos: 'bottom' });});
        }).then(function (card) {
          novo = S.novo = card; S.metaPendente=meta;
          if (S.metaSalva) {meta=S.metaPendente;return;}
          return M.salvarMetaNova(t, card.id, meta).then(function () { S.metaSalva = true; });
        }).then(function () {
          if (!etapas.length) return null;
          return (S.checklist ? Promise.resolve(S.checklist) : M.rest(t, 'POST', '/checklists', { idCard: novo.id, name: 'Etapas' })).then(function (cl) {
            S.checklist = cl; meta.checklistId = cl.id;
            return etapas.slice(S.etapasFeitas).reduce(function (pr, nome) { return pr.then(function () { return M.rest(t, 'POST', '/checklists/' + cl.id + '/checkItems', { name: nome }).then(function () { S.etapasFeitas++; }); }); }, Promise.resolve());
          });
        }).then(function () {
          if (meta.checklistId) return M.salvarMeta(t,novo.id,meta).then(concluir);
          return concluir();
          function concluir() {
          novo.badges = { checkItems: etapas.length, checkItemsChecked: 0 };
          novo.members = [{ id: meta.dono.id }];
          if (o.aoSalvo) o.aoSalvo({ cardId: novo.id, meta: meta, card: novo, criado: true });
          }
        });
      } else {
        p = auth.then(function () { return M.salvarMeta(t, o.cardId, meta); }).then(function () {
          if (!S.auth) { meta.avisoSync = true; return; }
          var ant = original && original.dono && original.dono.fullName;
          var nome = o.nomeCartao || '';
          if (ant && nome.endsWith(' · ' + ant)) nome = nome.slice(0, -(ant.length + 3));
          return M.rest(t, 'POST', '/cards/' + o.cardId + '/idMembers', { value: meta.dono.id }).then(function () { return M.rest(t, 'PUT', '/cards/' + o.cardId, {name:nome + ' · ' + meta.dono.fullName}); }).then(function () { return sincronizarDatas(o.cardId, meta); }).catch(function () { meta.avisoSync = true; });
        }).then(function () {
          if (o.aoSalvo) o.aoSalvo({ cardId: o.cardId, meta: meta, criado: false, aviso: meta.avisoSync ? 'Meta salva. Responsável e datas não sincronizados no cartão.' : '' });
        });
      }
      p.catch(function (e) {
        if (e.code === 'AUTH') S.auth = false;
        geral((S.novo ? 'Cartão criado. Tente novamente para concluir sem duplicá-lo. ' : '') + M.erroUsuario(e));
        S.ocupado = false;
        if(!S.novo) el.querySelectorAll('input,select,textarea').forEach(function(x){x.disabled=false;});
        btn.disabled = false; btn.textContent = rotulo;
      });
    }

    // ---------- início ----------
    if (original) preencher(original);
    if (modo === 'criar') { addEtapa(''); addEtapa(''); }
    else { $('maisEtapa').classList.add('oculto'); $('etapasAjuda').textContent = 'As etapas desta meta ficam na checklist do cartão. Edite direto nela.'; }
    if (!original) { $('vIni').value = '0,00'; }
    montarMembros(o.ctx.membros, original && original.dono ? original.dono.id : null);
    mascara($('vIni')); mascara($('alvo'));
    aplicarImp(); aplicarKind(); aplicarPeriodo();
    if (modo === 'criar' && !M.chaveConfigurada()) { $('blocoSemChave').classList.remove('oculto'); $('salvar').disabled = true; }
    M.autorizado(t).then(function (ok) { S.auth = ok; });

    el.querySelectorAll('[data-kind]').forEach(function (b) { b.onclick = function () { S.kind = b.getAttribute('data-kind'); aplicarKind(); }; });
    el.querySelectorAll('[data-imp]').forEach(function (b) { b.onclick = function () { S.imp = +b.getAttribute('data-imp'); aplicarImp(); }; });
    $('unit').addEventListener('input', function () { $('unitSingular').value = M.singular($('unit').value); });
    $('periodo').onchange = aplicarPeriodo;
    $('maisEtapa').onclick = function () { addEtapa(''); };
    $('cancelar').onclick = function () { if (o.aoCancelar) o.aoCancelar(); };
    el.querySelectorAll('input, select, textarea').forEach(function (c) {
      c.addEventListener('input', function () {
        c.removeAttribute('aria-invalid');
        var s = c.closest('.campo') && c.closest('.campo').querySelector('[data-erro]');
        if (s) { s.classList.add('oculto'); s.textContent = ''; }
      });
    });
    el.querySelectorAll('#blocoQ .ajuda').forEach(function () {});
    var ajudaDinheiro = document.createElement('p'); ajudaDinheiro.id='ajudaDinheiro'; ajudaDinheiro.className = 'ajuda'; ajudaDinheiro.textContent = 'Em dinheiro, os dígitos entram pelos centavos: 500 resulta em R$ 5,00.'; $('blocoQ').appendChild(ajudaDinheiro);
    ajudaDinheiro.classList.toggle('oculto',S.kind!=='r');
    $('f').onsubmit = salvar;
    var primeiro = $('titulo') || $('dono');
    if (primeiro) primeiro.focus();
  };
})();
