/* Detalhe de uma meta: resumo, registro, gráfico e histórico.
   Usado na seção Meta do cartão e dentro do painel. */
(function () {
  var M = window.Metas, esc = M.esc;
  var COR = { ok: '--ok', risk: '--risk', late: '--late', hit: '--hit', neutral: '--sub' };

  function passoBonito(x, minimo) {
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), f = x / p;
    var n = f < 1.5 ? 1 : (f < 3 ? 2 : (f < 7 ? 5 : 10));
    return Math.max(n * p, minimo);
  }
  function data(s) { return s.slice(0, 4) === M.hoje().slice(0, 4) ? M.dataBR(s) : M.dataBRCompleta(s); }

  // Gráfico de evolução. W é a largura real em pixels, para o texto não esticar.
  function grafico(meta, r, W) {
    var h = meta.hist || [];
    var modo = meta.ritmo === 'corridos' ? 'corridos' : 'uteis';
    var dias = M.diasEntre(meta.ini, meta.fim) + 1;
    var total = M.contarDias(meta.ini, meta.fim, modo);
    var xDe = function (dia) { return Math.max(0, Math.min(dias, M.diasEntre(meta.ini, dia) + 1)); };

    var esp = [];
    if (!r.semRitmo) {
      esp.push([0, meta.vIni]);
      var cont = 0, i, dia;
      for (i = 0; i < dias; i++) {
        dia = M.addDias(meta.ini, i);
        if (modo === 'corridos' || M.diaUtil(dia)) cont++;
        esp.push([i + 1, meta.vIni + (meta.alvo - meta.vIni) * (total ? cont / total : 1)]);
      }
    }
    var porDia = {}, ordem = [];
    h.forEach(function (e) { if (!(e[0] in porDia)) ordem.push(e[0]); porDia[e[0]] = e[1]; });
    var real = [[0, meta.vIni]];
    ordem.forEach(function (d) { real.push([xDe(d), porDia[d]]); });
    var hojeIso = M.hoje(), xHoje = null;
    if (hojeIso >= meta.ini && hojeIso <= meta.fim) {
      xHoje = xDe(hojeIso);
      var ult = real[real.length - 1];
      if (ult[0] < xHoje) real.push([xHoje, ult[1]]);
    }

    var vals = esp.map(function (p) { return p[1]; }).concat(real.map(function (p) { return p[1]; })).concat([meta.alvo]);
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx === mn) mx = mn + 1;
    var minimo = M.casasDe(meta) === 0 || meta.fmt === 'r' ? 1 : Math.pow(10, -M.casasDe(meta));
    var passo = passoBonito((mx - mn) / 3, minimo);
    var yMin = Math.floor(mn / passo + 1e-9) * passo, yMax = Math.ceil(mx / passo - 1e-9) * passo;
    var ticks = [], tv;
    for (tv = yMin; tv <= yMax + passo / 2 && ticks.length < 8; tv += passo) ticks.push(Math.round(tv * 1e6) / 1e6);

    var H = 180, mt = 18, mb = 22, mr = 4;
    var maior = 0;
    ticks.forEach(function (v) { maior = Math.max(maior, M.rotuloEixo(meta, v).length); });
    var ml = Math.max(30, Math.round(maior * 6.4 + 10));
    var pw = Math.max(120, W - ml - mr), ph = H - mt - mb;
    var X = function (x) { return ml + x / dias * pw; };
    var Y = function (v) { return mt + (yMax - v) / (yMax - yMin) * ph; };
    var pts = function (a) { return a.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' '); };
    var cor = 'var(' + COR[r.info.cls] + ')';

    var grade = ticks.map(function (v) {
      return '<line x1="' + ml + '" y1="' + Y(v).toFixed(1) + '" x2="' + (ml + pw) + '" y2="' + Y(v).toFixed(1) + '" style="stroke:var(--borda)" stroke-width="1"/>' +
        '<text x="' + (ml - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" style="fill:var(--sub)">' + esc(M.rotuloEixo(meta, v)) + '</text>';
    }).join('');
    var linhaAlvo = r.semRitmo ? '<line x1="' + ml + '" y1="' + Y(meta.alvo).toFixed(1) + '" x2="' + (ml + pw) + '" y2="' + Y(meta.alvo).toFixed(1) + '" style="stroke:var(--sub)" stroke-width="1.5" stroke-dasharray="4 4"/>' : '';
    var linhaHoje = xHoje === null ? '' :
      '<line x1="' + X(xHoje).toFixed(1) + '" y1="' + mt + '" x2="' + X(xHoje).toFixed(1) + '" y2="' + (mt + ph) + '" style="stroke:var(--fraco)" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<text x="' + X(xHoje).toFixed(1) + '" y="' + (mt - 6) + '" text-anchor="middle" font-size="11" style="fill:var(--sub)">Hoje</text>';
    var bolas = real.slice(1, ordem.length + 1).map(function (p, k) {
      return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" style="fill:' + cor + '"><title>' + M.dataBR(ordem[k]) + ': ' + esc(M.fmtValor(meta, p[1])) + '</title></circle>';
    }).join('');
    var desc = 'Evolução de ' + M.fmtValor(meta, meta.vIni) + ' a ' + M.fmtValor(meta, M.valorAtual(meta)) + ' entre ' + M.dataBR(meta.ini) + ' e ' + M.dataBR(meta.fim) + '. Objetivo: ' + M.fmtValor(meta, meta.alvo) + '.';

    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '" style="display:block;max-width:100%">' +
      grade + linhaAlvo + linhaHoje +
      (esp.length ? '<polyline points="' + pts(esp) + '" fill="none" style="stroke:var(--sub)" stroke-width="1.5" stroke-dasharray="4 4" stroke-linejoin="round"/>' : '') +
      '<polyline points="' + pts(real) + '" fill="none" style="stroke:' + cor + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + bolas +
      '<text x="' + ml + '" y="' + (H - 4) + '" text-anchor="start" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.ini) + '</text>' +
      '<text x="' + (ml + pw) + '" y="' + (H - 4) + '" text-anchor="end" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.fim) + '</text></svg>';
  }

  // o: { t, escopo, meta, card, ctx, aoSalvar, ajustar, abrirCartao }
  M.detalhe = function (el, o) {
    var st = { msg: null, ocupado: false, reg: null, obs: false, confirmar: false, alterarAval: false };
    var meta = o.meta;
    var D = {};

    function ehTaxa() { return meta.tipo === 'q' && meta.fmt === 'p'; }
    function podeSomar() { return meta.tipo === 'q' && !ehTaxa() && meta.dir !== 'down'; }
    function reg() { return podeSomar() ? (st.reg || 'add') : 'tot'; }
    function ajustar() { if (o.ajustar) o.ajustar(); }
    function podeAtualizar() {
      if (meta.encerrada || meta.tipo !== 'q') return false;
      if (o.ctx.admin) return true;
      return meta.quem !== 'admin' && meta.dono && meta.dono.id === o.ctx.eu.id;
    }
    function f(v) { return M.fmtValor(meta, v); }

    function cabecalho() {
      var m = meta, partes = [data(m.ini) + ' a ' + data(m.fim)];
      if (m.dono) partes.push(esc(m.dono.fullName));
      var html = partes.join('<span aria-hidden="true">·</span>');
      if ((m.imp || 1) > 1) html += '<span aria-hidden="true">·</span><span class="linha gap4">' + M.iconeImp(m.imp) + esc(M.IMP[m.imp]) + '</span>';
      if (m.encerrada) html += '<span aria-hidden="true">·</span><span class="forte">Encerrada</span>';
      return '<div class="det-cabeca">' + html + '</div>';
    }

    function frases() {
      var m = meta, r = D.r;
      if (r.antes) return ['O período começa em ' + data(m.ini) + '.'];
      if (m.tipo === 'a') return [];
      if (m.tipo === 'e') {
        if (!r.etapas) return ['Adicione as etapas à checklist do cartão.'];
        if (r.sit === 'hit') return ['Todas as etapas foram concluídas.'];
        var pendentes = r.etapas - r.feitas;
        if (r.sit === 'late') return [(m.encerrada ? 'Meta encerrada' : 'Prazo encerrado em ' + data(m.fim)) + ' com ' + pendentes + (pendentes === 1 ? ' etapa pendente.' : ' etapas pendentes.')];
        return ['Esperado até hoje: ' + r.etapasEsperadas + ' de ' + r.etapas + ' etapas. ' + M.textoDiff(m, r) + '.'];
      }
      if (ehTaxa()) {
        var limite = m.dir === 'down' ? 'no máximo ' : 'pelo menos ';
        var texto = 'Objetivo: ' + limite + f(m.alvo) + '.';
        if (r.faltaPontos > 0) texto += (M.arred(m, r.faltaPontos) === 1 ? ' Falta 1 ponto percentual' : ' Faltam ' + M.numBR(r.faltaPontos, M.casasDe(m)) + ' pontos percentuais') + ' para alcançá-lo.';
        if (r.sit === 'late') texto += m.encerrada ? ' A meta foi encerrada sem alcançar o objetivo.' : ' O prazo terminou em ' + data(m.fim) + '.';
        return [texto];
      }
      if (r.sit === 'hit') {
        var extra = m.dir === 'down' ? m.alvo - r.atual : r.atual - m.alvo;
        return [extra > 0 ? 'Objetivo superado em ' + f(extra) + '.' : 'O valor registrado alcançou o objetivo do período.'];
      }
      if (r.sit === 'late') return [(m.encerrada ? 'Meta encerrada' : 'Prazo encerrado em ' + data(m.fim)) + '. ' + M.faltam(m, r.falta, true) + ' ' + f(r.falta) + ' para o objetivo.'];
      return ['Esperado até hoje: ' + f(M.arred(m, r.valorEsperado)) + '. ' + M.textoDiff(m, r) + '.',
        M.faltam(m, r.falta) + ' ' + f(r.falta) + ' para o objetivo do período, até ' + data(m.fim) + '.'];
    }

    function resumo() {
      var m = meta, r = D.r, principal, pct = '', titulo;
      if (m.tipo === 'q') {
        titulo = ehTaxa() ? 'Percentual atual' : 'Progresso da meta';
        principal = '<span class="grande num">' + esc(f(r.atual)) + '</span><span class="sub">' + (m.dir === 'down' || ehTaxa() ? 'objetivo: ' : 'de ') + esc(f(m.alvo)) + '</span>';
        if (!ehTaxa()) pct = '<span class="forte num det-pct">' + M.numBR(r.pct, 1) + '%</span>';
      } else if (m.tipo === 'e') {
        titulo = 'Etapas concluídas';
        principal = '<span class="grande num">' + r.feitas + ' de ' + r.etapas + '</span><span class="sub">etapas</span>';
        pct = '<span class="forte num det-pct">' + M.numBR(r.pct, 1) + '%</span>';
      } else {
        titulo = 'Avaliação da meta';
        principal = '<span class="forte">' + (m.aval ? 'Resultado da avaliação' : 'Avaliação em ' + data(m.fim)) + '</span>';
      }
      var linhas = frases().map(function (txt) { return '<p class="det-frase">' + esc(txt) + '</p>'; }).join('');
      if (m.tipo === 'q' && !ehTaxa() && m.vIni !== 0) linhas += '<p class="det-frase sub">O progresso mede o percurso entre o valor inicial de ' + esc(f(m.vIni)) + ' e o objetivo.</p>';
      if (r.parada) linhas += '<p class="det-frase parada">Sem atualização há ' + r.diasSemAtualizar + ' dias.</p>';
      return '<section class="det-resumo" aria-label="' + titulo + '"><h3 class="det-titulo">' + titulo + '</h3>' +
        '<div class="det-topo"><div class="det-valor">' + principal + '</div>' + M.selo(r) + '</div>' +
        (r.temBarra ? '<div class="det-barra">' + M.barra(r, { grossa: true, label: titulo, texto: ehTaxa() ? f(r.atual) + '; objetivo ' + (m.dir === 'down' ? 'no máximo ' : 'pelo menos ') + f(m.alvo) : undefined }) + pct + '</div>' : '') +
        (linhas ? '<div class="coluna gap4">' + linhas + '</div>' : '') + '</section>';
    }

    function objetivoHoje() {
      var m = meta, d = D.r.diaria;
      if (!d) {
        if (m.tipo === 'q' && m.dir !== 'down' && m.fmt !== 'p' && !m.encerrada && !D.r.antes && !D.r.depois && D.r.sit !== 'hit' && m.ritmo !== 'corridos' && !M.diaUtil(M.hoje())) {
          return '<section class="det-dia"><h3 class="det-titulo">Objetivo de hoje</h3><p class="det-frase sub">Hoje não entra na contagem de dias úteis. Os registros continuam disponíveis e contam para o progresso total.</p></section>';
        }
        return '';
      }
      var rot = d.superou ? 'Objetivo de hoje superado' : (d.atingiu ? 'Objetivo de hoje atingido' : 'Objetivo de hoje pendente');
      var rDia = { pct: d.pct, fill: d.fill, info: { cls: d.atingiu ? 'ok' : 'azul' } };
      var status = '<span class="selo sit-' + (d.atingiu ? 'ok' : 'neutral') + '">' + rot + '</span>';
      var falta = d.atingiu ? (d.superou ? 'Acima do objetivo de hoje: ' + f(d.realizado - d.alvo) + '.' : 'O objetivo de hoje foi concluído.') : M.faltam(m, d.falta) + ' ' + f(d.falta) + ' para concluir o objetivo de hoje.';
      return '<section class="det-dia" aria-label="Objetivo de hoje"><h3 class="det-titulo">Objetivo de hoje</h3>' +
        '<div class="det-topo"><div class="det-valor"><span class="forte num">' + esc(f(d.realizado)) + '</span><span class="sub">de ' + esc(f(d.alvo)) + ' hoje</span></div>' + status + '</div>' +
        '<div class="det-barra">' + M.barra(rDia, { grossa: true, label: 'Progresso de hoje', texto: f(d.realizado) + ' de ' + f(d.alvo) + ' hoje; ' + rot.toLowerCase() }) + '<span class="forte num det-pct">' + M.numBR(d.pct, 1) + '%</span></div>' +
        '<p class="det-frase">' + esc(falta) + '</p><p class="peq sub">Calculado pelo saldo no início do dia e pelos dias restantes. O realizado é a variação líquida do total registrado hoje, incluindo correções.</p></section>';
    }

    function registro() {
      var m = meta;
      if (m.tipo !== 'q' || m.encerrada) return '';
      if (!podeAtualizar()) return '<p class="det-frase sub">' + (m.quem === 'admin' ? 'Só admins do quadro atualizam o valor desta meta.' : 'Só ' + esc(m.dono ? m.dono.fullName : 'o responsável') + ' e os admins do quadro atualizam o valor desta meta.') + '</p>';
      var modo = reg();
      var rot = modo === 'add' ? 'Adicionar' : (ehTaxa() ? 'Novo valor' : 'Novo total');
      var pre = m.fmt === 'r' ? 'R$' : '', suf = m.fmt === 'p' ? '%' : (m.fmt === 'n' ? (m.unit || '') : '');
      var links = [];
      if (podeSomar()) links.push('<button type="button" class="btn-link" id="trocaReg">' + (modo === 'add' ? 'Corrigir o total' : 'Voltar a somar') + '</button>');
      if (!st.obs) links.push('<button type="button" class="btn-link" id="maisObs">Adicionar observação</button>');
      return '<form class="registro" id="fAtualizar" novalidate>' +
        '<div class="registro-linha"><label for="valor" class="registro-rotulo">' + rot + '</label>' +
        '<span class="campo-prefixo registro-valor">' + (pre ? '<span>' + pre + '</span>' : '') + '<input id="valor" type="text" inputmode="decimal" autocomplete="off" placeholder="' + (m.fmt === 'r' ? '0,00' : '0') + '">' + (suf ? '<span>' + esc(suf) + '</span>' : '') + '</span>' +
        (st.obs ? '<input id="obs" class="campo-solto registro-obs" type="text" maxlength="60" placeholder="Observação, ex.: pedido grande faturado" aria-label="Observação">' : '') +
        '<button type="submit" class="btn btn-primario"' + (st.ocupado ? ' disabled' : '') + '>Registrar</button></div>' +
        '<div class="registro-pe">' + (links.length ? '<span class="linha gap12">' + links.join('') + '</span>' : '') + '<span class="ajuda" id="previa" aria-live="polite"></span></div></form>';
    }

    function etapas() {
      if (meta.tipo !== 'e' || meta.encerrada) return '';
      if (o.abrirCartao) return '<div><button type="button" class="btn" id="marcar">Marcar etapas no cartão</button></div>';
      return '';
    }

    function avaliacao() {
      var m = meta;
      if (m.tipo !== 'a') return '';
      var html = '<section class="coluna gap8"><h3 class="det-titulo">Como será avaliada</h3><p class="det-frase">' + esc(m.crit || '') + '</p>';
      if (m.aval) {
        html += '<p class="det-frase sub">Avaliada por ' + esc(m.aval.por || '') + ' em ' + M.dataBR(m.aval.em) + '.' + (m.aval.obs ? ' ' + esc(m.aval.obs) : '') + '</p>';
      }
      if (o.ctx.admin) {
        var libera = M.addDias(m.fim, -6);
        if (m.aval && !st.alterarAval) html += '<div><button type="button" class="btn-link" id="alterarAval">Alterar avaliação</button></div>';
        else if (!m.aval && M.hoje() < libera) html += '<p class="det-frase sub">O resultado pode ser registrado a partir de ' + data(libera) + '.</p>';
        else {
          html += '<div class="coluna gap8"><label class="campo" style="max-width:480px">Comentário (opcional)<input id="avObs" type="text" maxlength="200" value="' + esc(m.aval && m.aval.obs || '') + '"></label>' +
            '<div class="linha gap8" style="flex-wrap:wrap">' + [['nao', 'Não atingida'], ['parcial', 'Parcial'], ['atingida', 'Atingida'], ['superada', 'Superada']].map(function (op) {
              return '<button type="button" class="btn' + (m.aval && m.aval.nota === op[0] ? ' btn-marcado' : '') + '" data-nota="' + op[0] + '">' + op[1] + '</button>';
            }).join('') + '</div></div>';
        }
      }
      return html + '</section>';
    }

    function evolucao() {
      if (meta.tipo !== 'q') return '';
      var h = meta.hist || [];
      var graf = h.length ? '<div id="graf"></div><div class="linha peq sub gap16"><span class="linha"><span aria-hidden="true" class="leg-linha" style="background:var(' + COR[D.r.info.cls] + ')"></span>Realizado</span>' +
        '<span class="linha"><span aria-hidden="true" class="leg-trac"></span>' + (ehTaxa() ? 'Objetivo' : 'Ritmo esperado') + '</span></div>' : '<p class="det-frase sub">O gráfico aparece a partir do primeiro registro.</p>';
      var linhas = [];
      for (var i = h.length - 1; i >= 0 && linhas.length < 8; i--) {
        var e = h[i], ant = i > 0 ? h[i - 1][1] : meta.vIni, dif = e[1] - ant;
        var bom = meta.dir === 'down' ? dif <= 0 : dif >= 0;
        var tdif = ehTaxa() ? M.pontos(meta, dif) : f(Math.abs(dif));
        linhas.push('<div class="hist-linha"><span class="sub num">' + M.dataBR(e[0]) + '</span>' +
          '<span class="num"><span class="forte">' + esc(f(e[1])) + '</span> <span class="' + (bom ? 'dif-mais' : 'dif-menos') + '">' + (dif >= 0 ? '+' : '−') + esc(tdif) + '</span></span>' +
          '<span class="sub hist-quem">' + esc(e[3] || '') + (e[4] ? ' · ' + esc(e[4]) : '') + '</span></div>');
      }
      var hist = h.length ? '<div class="hist">' + linhas.join('') + '</div>' + (h.length > 8 ? '<span class="peq sub">Mostrando os 8 registros mais recentes.</span>' : '') : '<p class="det-frase sub">Nenhum registro ainda.</p>';
      return '<div class="det-grade"><section class="coluna gap8" style="min-width:0"><h3 class="det-titulo">Evolução</h3>' + graf + '</section>' +
        '<section class="coluna gap8" style="min-width:0"><h3 class="det-titulo">Histórico</h3>' + hist + '</section></div>';
    }

    function rodape() {
      if (!o.ctx.admin) return '';
      if (meta.encerrada) return '<div class="det-rodape"><button type="button" class="btn-link" id="reabrir">Reabrir meta</button></div>';
      if (st.confirmar) return '<div class="det-rodape det-confirma"><span>Encerrar a meta e mover o cartão para a lista ' + esc(M.CFG.listaEncerradas) + '?</span>' +
        '<span class="linha gap8"><button type="button" class="btn btn-perigo" id="encerrarSim"' + (st.ocupado ? ' disabled' : '') + '>Encerrar meta</button><button type="button" class="btn btn-texto" id="encerrarNao">Cancelar</button></span></div>';
      return '<div class="det-rodape"><button type="button" class="btn-link sub" id="encerrar">Encerrar meta</button></div>';
    }

    function render() {
      D.r = M.avaliar(meta, o.card.badges);
      var membros = (o.card.members || []).map(function (x) { return x.id; });
      var avisoDono = meta.dono && membros.indexOf(meta.dono.id) < 0 ? '<p class="aviso">' + esc(meta.dono.fullName) + ' é o responsável por esta meta, mas não está como membro do cartão.</p>' : '';
      var msg = st.msg ? '<p class="' + (st.msg.erro ? 'erro' : 'sucesso') + '" role="status">' + esc(st.msg.texto) + '</p>' : '';
      el.innerHTML = '<div class="detalhe">' + cabecalho() + avisoDono + msg + resumo() + objetivoHoje() + registro() + etapas() + avaliacao() + evolucao() + rodape() + '</div>';
      ligar();
      desenhar();
      ajustar();
    }

    function desenhar() {
      var g = el.querySelector('#graf');
      if (!g) return;
      g.innerHTML = grafico(meta, D.r, Math.max(280, Math.floor(g.clientWidth || 480)));
    }

    function salvar(novo, aviso) {
      st.ocupado = true;
      el.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      return M.salvarMeta(o.t, o.escopo, novo).then(function () {
        meta = novo; st.ocupado = false; st.msg = aviso ? { texto: aviso } : null; st.alterarAval = false;
        if (o.aoSalvar) o.aoSalvar(meta);
        render();
      }).catch(function (e) { st.ocupado = false; st.msg = { erro: true, texto: e.message || 'Não foi possível salvar.' }; render(); });
    }

    function ligar() {
      var $ = function (id) { return el.querySelector('#' + id); };
      var fr = $('fAtualizar');
      if (fr) {
        var campo = $('valor'), previa = $('previa');
        M.mascararValor(campo, meta.fmt, M.casasDe(meta));
        var atual = M.valorAtual(meta);
        campo.addEventListener('input', function () {
          campo.removeAttribute('aria-invalid');
          previa.className = 'ajuda';
          var v = M.lerNumero(campo.value);
          if (isNaN(v)) { previa.textContent = ''; return; }
          var novo = reg() === 'add' ? atual + v : v;
          previa.textContent = (reg() === 'add' ? 'Novo total: ' : 'Antes: ' + f(atual) + '. Depois: ') + f(Math.round(novo * 100) / 100) + '.';
        });
        if ($('trocaReg')) $('trocaReg').onclick = function () { st.reg = reg() === 'add' ? 'tot' : 'add'; st.msg = null; render(); $('valor').focus(); };
        if ($('maisObs')) $('maisObs').onclick = function () { var v = campo.value; st.obs = true; render(); $('valor').value = v; $('obs').focus(); };
        fr.onsubmit = function (ev) {
          ev.preventDefault();
          if (st.ocupado) return;
          var v = M.lerNumero(campo.value);
          var falha = function (txt) { campo.setAttribute('aria-invalid', 'true'); previa.className = 'ajuda erro-campo'; previa.textContent = txt; campo.focus(); };
          if (isNaN(v)) { falha(meta.fmt === 'r' ? 'Digite um valor. Os dígitos entram pelos centavos: 50029 vira 500,29.' : 'Digite um valor.'); return; }
          if (reg() === 'add' && v <= 0) { falha('Digite um valor maior que zero. Para corrigir um registro, use Corrigir o total.'); return; }
          var novoMeta = JSON.parse(JSON.stringify(meta));
          var novo = reg() === 'add' ? M.valorAtual(novoMeta) + v : v;
          var obs = $('obs') ? $('obs').value.trim().slice(0, 60) : '';
          var diaFixo = M.diaria(meta);
          if (diaFixo) novoMeta.diaria = { em: diaFixo.em, base: diaFixo.base, alvo: diaFixo.alvo };
          novoMeta.hist = novoMeta.hist || [];
          novoMeta.hist.push([M.hoje(), Math.round(novo * 100) / 100, o.ctx.eu.id, o.ctx.eu.fullName.split(' ')[0], obs]);
          st.obs = false; st.reg = null;
          salvar(novoMeta, 'Registrado. Total agora: ' + f(Math.round(novo * 100) / 100) + '.');
        };
      }
      if ($('marcar')) $('marcar').onclick = function () { o.abrirCartao(); };
      if ($('alterarAval')) $('alterarAval').onclick = function () { st.alterarAval = true; render(); };
      el.querySelectorAll('[data-nota]').forEach(function (b) {
        b.onclick = function () {
          var novoMeta = JSON.parse(JSON.stringify(meta));
          novoMeta.aval = { nota: b.getAttribute('data-nota'), obs: $('avObs') ? $('avObs').value.trim() : '', em: M.hoje(), por: o.ctx.eu.fullName };
          salvar(novoMeta, 'Avaliação registrada.');
        };
      });
      if ($('encerrar')) $('encerrar').onclick = function () { st.confirmar = true; render(); };
      if ($('encerrarNao')) $('encerrarNao').onclick = function () { st.confirmar = false; render(); };
      if ($('reabrir')) $('reabrir').onclick = function () {
        var novoMeta = JSON.parse(JSON.stringify(meta));
        novoMeta.encerrada = false; delete novoMeta.encerradaEm;
        salvar(novoMeta, 'Meta reaberta. Se quiser, mova o cartão de volta para a lista ' + M.CFG.listaMetas + '.');
      };
      if ($('encerrarSim')) $('encerrarSim').onclick = function () {
        var novoMeta = JSON.parse(JSON.stringify(meta));
        novoMeta.encerrada = true; novoMeta.encerradaEm = M.hoje();
        st.ocupado = true; render();
        M.salvarMeta(o.t, o.escopo, novoMeta).then(function () {
          meta = novoMeta;
          if (o.aoSalvar) o.aoSalvar(meta);
          return M.autorizado(o.t).then(function (ok) {
            if (!ok) return 'Meta encerrada. Mova o cartão para a lista ' + M.CFG.listaEncerradas + '.';
            return M.garantirLista(o.t, M.CFG.listaEncerradas, 'top').then(function (l) {
              return M.rest(o.t, 'PUT', '/cards/' + o.card.id, { idList: l.id, pos: 'top' });
            }).then(function () { return 'Meta encerrada e cartão movido para ' + M.CFG.listaEncerradas + '.'; });
          });
        }).then(function (texto) { st.ocupado = false; st.confirmar = false; st.msg = { texto: texto }; render(); })
          .catch(function (e) { st.ocupado = false; st.confirmar = false; st.msg = { erro: true, texto: e.message || 'Não foi possível encerrar.' }; render(); });
      };
    }

    if (M._resize) window.removeEventListener('resize', M._resize);
    var espera = null;
    M._resize = function () { clearTimeout(espera); espera = setTimeout(function () { desenhar(); ajustar(); }, 120); };
    window.addEventListener('resize', M._resize);

    render();
  };
})();
