/* Detalhe de uma meta: progresso, meta do dia, atualização, gráfico e histórico.
   Usado na seção Meta do cartão e dentro do painel. */
(function () {
  var M = window.Metas, esc = M.esc;
  var COR = { ok: '--ok', risk: '--risk', late: '--late', hit: '--hit', neutral: '--sub' };

  function passoBonito(x, minimo) {
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), f = x / p;
    var n = f < 1.5 ? 1 : (f < 3 ? 2 : (f < 7 ? 5 : 10));
    return Math.max(n * p, minimo);
  }

  // Gráfico de evolução. W é a largura real em pixels, para o texto não esticar.
  function grafico(meta, r, W) {
    var h = meta.hist || [];
    var modo = meta.ritmo === 'corridos' ? 'corridos' : 'uteis';
    var dias = M.diasEntre(meta.ini, meta.fim) + 1;       // largura do período em dias
    var total = M.contarDias(meta.ini, meta.fim, modo);
    var xDe = function (dia) { return Math.max(0, Math.min(dias, M.diasEntre(meta.ini, dia) + 1)); }; // fim do dia

    // Ritmo esperado, dia a dia (fica parado em fins de semana e feriados quando a meta conta dias úteis)
    var esp = [[0, meta.vIni]], cont = 0, i, dia;
    for (i = 0; i < dias; i++) {
      dia = M.addDias(meta.ini, i);
      if (modo === 'corridos' || M.diaUtil(dia)) cont++;
      esp.push([i + 1, meta.vIni + (meta.alvo - meta.vIni) * (total ? cont / total : 1)]);
    }

    // Realizado: um ponto por dia, o último valor do dia
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

    // Escala vertical
    var vals = esp.map(function (p) { return p[1]; }).concat(real.map(function (p) { return p[1]; }));
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx === mn) { mx = mn + 1; }
    var minimo = M.casasDe(meta) === 0 ? 1 : Math.pow(10, -M.casasDe(meta));
    var passo = passoBonito((mx - mn) / 3, minimo);
    var yMin = Math.floor(mn / passo + 1e-9) * passo, yMax = Math.ceil(mx / passo - 1e-9) * passo;
    var ticks = [], tv;
    for (tv = yMin; tv <= yMax + passo / 2 && ticks.length < 8; tv += passo) ticks.push(Math.round(tv * 1e6) / 1e6);

    var H = 190, mt = 18, mb = 24, mr = 12;
    var maior = 0;
    ticks.forEach(function (v) { maior = Math.max(maior, M.rotuloEixo(meta, v).length); });
    var ml = Math.max(34, Math.round(maior * 6.4 + 12));
    var pw = Math.max(120, W - ml - mr), ph = H - mt - mb;
    var X = function (x) { return ml + x / dias * pw; };
    var Y = function (v) { return mt + (yMax - v) / (yMax - yMin) * ph; };
    var pts = function (a) { return a.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' '); };
    var cor = 'var(' + COR[r.info.cls] + ')';

    var grade = ticks.map(function (v) {
      return '<line x1="' + ml + '" y1="' + Y(v).toFixed(1) + '" x2="' + (ml + pw) + '" y2="' + Y(v).toFixed(1) + '" style="stroke:var(--borda)" stroke-width="1"/>' +
        '<text x="' + (ml - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" style="fill:var(--sub)">' + esc(M.rotuloEixo(meta, v)) + '</text>';
    }).join('');
    var linhaHoje = xHoje === null ? '' :
      '<line x1="' + X(xHoje).toFixed(1) + '" y1="' + mt + '" x2="' + X(xHoje).toFixed(1) + '" y2="' + (mt + ph) + '" style="stroke:var(--fraco)" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<text x="' + X(xHoje).toFixed(1) + '" y="' + (mt - 6) + '" text-anchor="middle" font-size="11" style="fill:var(--sub)">Hoje</text>';
    var bolas = real.slice(1).filter(function (p, k) { return k < ordem.length; }).map(function (p, k) {
      return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" style="fill:' + cor + '"><title>' + M.dataBR(ordem[k]) + ': ' + esc(M.fmtValor(meta, p[1])) + '</title></circle>';
    }).join('');
    var desc = 'Evolução de ' + M.fmtValor(meta, meta.vIni) + ' a ' + M.fmtValor(meta, M.valorAtual(meta)) + ' entre ' + M.dataBR(meta.ini) + ' e ' + M.dataBR(meta.fim) +
      '. A linha tracejada é o ritmo esperado até ' + M.fmtValor(meta, meta.alvo) + '.';

    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '" style="display:block;max-width:100%">' +
      grade + linhaHoje +
      '<polyline points="' + pts(esp) + '" fill="none" style="stroke:var(--sub)" stroke-width="1.5" stroke-dasharray="4 4" stroke-linejoin="round"/>' +
      '<polyline points="' + pts(real) + '" fill="none" style="stroke:' + cor + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + bolas +
      '<text x="' + ml + '" y="' + (H - 6) + '" text-anchor="start" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.ini) + '</text>' +
      '<text x="' + (ml + pw) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.fim) + '</text></svg>';
  }

  // o: { t, escopo, meta, card, ctx, aoSalvar, ajustar, editar, abrirCartao }
  M.detalhe = function (el, o) {
    var st = { msg: null, ocupado: false, reg: null };
    var meta = o.meta;
    var D = {};

    function reg() {
      if (st.reg) return st.reg;
      return meta.fmt === 'p' || meta.dir === 'down' ? 'tot' : 'add';
    }
    function ajustar() { if (o.ajustar) o.ajustar(); }
    function podeAtualizar() {
      if (meta.encerrada || meta.tipo !== 'q') return false;
      if (o.ctx.admin) return true;
      return meta.quem !== 'admin' && meta.dono && meta.dono.id === o.ctx.eu.id;
    }
    function nomeUnidade() { return meta.ritmo === 'corridos' ? 'dia' : 'dia útil'; }
    function plural(n, s, p) { return n === 1 ? s : p; }

    function cabecalho() {
      var m = meta;
      return '<div class="linha peq sub" style="flex-wrap:wrap"><span class="tipo">' + esc(M.TIPO[m.tipo]) + '</span>' +
        '<span>' + M.dataBRCompleta(m.ini) + ' a ' + M.dataBRCompleta(m.fim) + '</span>' +
        (m.dono ? '<span aria-hidden="true">·</span><span>' + esc(m.dono.fullName) + '</span>' : '') +
        ((m.imp || 1) > 1 ? '<span aria-hidden="true">·</span><span class="linha gap4">' + M.iconeImp(m.imp) + 'Importância ' + esc(M.IMP[m.imp].toLowerCase()) + '</span>' : '') +
        (m.encerrada ? '<span aria-hidden="true">·</span><span class="forte">Encerrada</span>' : '') + '</div>';
    }

    function blocoProgresso() {
      var r = D.r, m = meta;
      if (!r.temBarra) return '';
      var dif = M.textoDiff(m, r);
      var valor = m.tipo === 'q' ? M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo) : (r.etapas ? r.feitas + ' de ' + r.etapas + ' etapas' : 'Nenhuma etapa na checklist');
      var expl;
      if (r.antes) expl = 'A meta começa em ' + M.dataBRCompleta(m.ini) + '.';
      else if (m.tipo === 'q') expl = 'Esperado até hoje: ' + M.fmtValor(m, M.arred(m, r.valorEsperado)) + ' (' + r.esperado + '%).';
      else expl = 'Esperado até hoje: ' + r.esperado + '%. Para avançar, marque as etapas na checklist do cartão.';
      return '<section class="coluna gap8">' +
        '<div class="linha entre" style="flex-wrap:wrap"><div class="linha gap12" style="flex-wrap:wrap"><span class="grande num">' + r.pct + '%</span>' + M.selo(r) +
        (dif ? '<span class="peq ' + M.classeDiff(r) + '">' + esc(dif) + '</span>' : '') + '</div><span class="sub num">' + esc(valor) + '</span></div>' +
        M.barra(r, { grossa: true, label: 'Progresso da meta' }) +
        '<div class="linha peq sub"><span class="legenda-zona" aria-hidden="true"></span><span>' + esc(expl) + '</span></div></section>';
    }

    function blocoDia() {
      var r = D.r, m = meta;
      if (m.tipo !== 'q' || !r.mostrarDia || m.encerrada || r.depois || r.sit === 'hit' || r.porDia <= 0) return '';
      var uni = nomeUnidade(), n = r.diasRestantes;
      var sub = 'Faltam ' + M.fmtValor(m, r.falta) + ' em ' + n + ' ' + (n === 1 ? uni : uni.replace('dia', 'dias').replace('útil', 'úteis')) + '.';
      if (r.registrouHoje && !r.antes) sub += ' Hoje já tem registro, então a conta vale a partir de amanhã.';
      return '<section class="caixa coluna gap4"><div class="linha" style="align-items:baseline;flex-wrap:wrap"><span class="grande num">' + esc(M.fmtValor(m, r.porDiaArred)) + '</span>' +
        '<span class="forte">por ' + uni + ' para fechar no prazo</span></div><span class="peq sub">' + esc(sub) + '</span></section>';
    }

    function blocoAtualizar() {
      var m = meta;
      if (m.tipo !== 'q' || m.encerrada) return '';
      if (!podeAtualizar()) return '<p class="peq sub" style="margin:0">' + (m.quem === 'admin' ? 'Só admins do quadro atualizam o valor desta meta.' : 'Só ' + esc(m.dono ? m.dono.fullName : 'o responsável') + ' e os admins do quadro atualizam o valor desta meta.') + '</p>';
      var modo = reg();
      var pre = m.fmt === 'r' ? 'R$' : '', suf = m.fmt === 'p' ? '%' : (m.fmt === 'n' ? (m.unit || '') : '');
      return '<form class="caixa coluna gap12" id="fAtualizar" novalidate>' +
        '<div class="seg seg-peq" role="group" aria-label="Como informar o valor">' +
        '<button type="button" data-reg="add" aria-pressed="' + (modo === 'add') + '">Somar ao total</button>' +
        '<button type="button" data-reg="tot" aria-pressed="' + (modo === 'tot') + '">Informar o total</button></div>' +
        '<div class="linha gap12" style="align-items:flex-end;flex-wrap:wrap">' +
        '<label class="campo" style="width:200px">' + (modo === 'add' ? 'Quanto somar' : 'Novo total') +
        '<span class="campo-prefixo"><span>' + pre + '</span><input id="valor" type="text" inputmode="decimal" autocomplete="off" placeholder="' + (M.casasDe(m) ? '0,00' : '0') + '"><span>' + esc(suf) + '</span></span></label>' +
        '<label class="campo" style="flex:1;min-width:180px">Observação (opcional)<input id="obs" type="text" maxlength="60" placeholder="Ex.: pedido grande faturado"></label>' +
        '<button type="submit" class="btn btn-primario" style="height:36px"' + (st.ocupado ? ' disabled' : '') + '>Registrar</button></div>' +
        '<span class="ajuda" id="previa" aria-live="polite"></span></form>';
    }

    function blocoAvaliacao() {
      var m = meta;
      if (m.tipo !== 'a') return '';
      var html = '<div class="coluna gap8"><span class="peq forte sub">Como será avaliada</span><p style="margin:0">' + esc(m.crit || '') + '</p>';
      if (m.aval) {
        html += '<div class="linha">' + M.selo(D.r) + '<span class="peq sub">por ' + esc(m.aval.por || '') + ' em ' + M.dataBR(m.aval.em) + '</span></div>' + (m.aval.obs ? '<p class="peq" style="margin:0">' + esc(m.aval.obs) + '</p>' : '');
      } else {
        html += '<p class="peq sub" style="margin:0">Aguardando avaliação de um admin, prevista para ' + M.dataBRCompleta(m.fim) + '.</p>';
      }
      if (o.ctx.admin) {
        var n = m.aval ? m.aval.nota : '';
        html += '<form class="caixa coluna gap8" id="fAvaliar" novalidate><div class="linha gap12" style="align-items:flex-end;flex-wrap:wrap">' +
          '<label class="campo" style="width:200px">Resultado<select id="nota">' + [['nao', 'Não atingida'], ['parcial', 'Parcial'], ['atingida', 'Atingida'], ['superada', 'Superada']].map(function (op) { return '<option value="' + op[0] + '"' + (n === op[0] ? ' selected' : '') + '>' + op[1] + '</option>'; }).join('') + '</select></label>' +
          '<label class="campo" style="flex:1;min-width:180px">Comentário (opcional)<input id="avObs" type="text" maxlength="200" value="' + esc(m.aval && m.aval.obs || '') + '"></label>' +
          '<button type="submit" class="btn btn-primario" style="height:36px">' + (m.aval ? 'Alterar avaliação' : 'Salvar avaliação') + '</button></div></form>';
      }
      return html + '</div>';
    }

    function blocoGrafico() {
      if (meta.tipo !== 'q') return '';
      if (!(meta.hist || []).length) return '<section class="coluna gap8"><span class="peq forte sub">Evolução no período</span><p class="peq sub" style="margin:0">O gráfico aparece a partir do primeiro registro.</p></section>';
      return '<section class="coluna gap8"><span class="peq forte sub">Evolução no período</span><div id="graf"></div>' +
        '<div class="linha peq sub gap16"><span class="linha"><span aria-hidden="true" style="width:16px;height:3px;border-radius:2px;background:var(' + COR[D.r.info.cls] + ')"></span>Realizado</span>' +
        '<span class="linha"><span aria-hidden="true" style="width:16px;border-top:2px dashed var(--sub)"></span>Ritmo esperado</span></div></section>';
    }

    function blocoHistorico() {
      var m = meta, h = m.hist || [];
      if (m.tipo !== 'q') return '';
      if (!h.length) return '<p class="peq sub" style="margin:0">Nenhum registro ainda.</p>';
      var linhas = [];
      for (var i = h.length - 1; i >= 0 && linhas.length < 8; i--) {
        var e = h[i], ant = i > 0 ? h[i - 1][1] : m.vIni, dif = e[1] - ant;
        var bom = m.dir === 'down' ? dif <= 0 : dif >= 0;
        linhas.push('<div class="historico-linha num"><span class="sub">' + M.dataBR(e[0]) + '</span>' +
          '<span><span class="forte">' + esc(M.fmtValor(m, e[1])) + '</span> <span class="' + (bom ? 'dif-mais' : 'dif-menos') + '" style="font-weight:400">' + (dif >= 0 ? '+' : '−') + esc(M.fmtValor(m, Math.abs(dif))) + '</span></span>' +
          '<span class="sub">' + esc(e[3] || '') + (e[4] ? ' · ' + esc(e[4]) : '') + '</span></div>');
      }
      return '<section class="coluna"><span class="peq forte sub" style="padding-bottom:4px">Histórico' + (h.length > 8 ? ' (8 registros mais recentes)' : '') + '</span>' + linhas.join('') + '</section>';
    }

    function acoes() {
      var m = meta;
      if (!o.ctx.admin) return '';
      return '<div class="linha" style="padding-top:4px;flex-wrap:wrap"><button class="btn" id="encerrar"' + (st.ocupado ? ' disabled' : '') + '>' + (m.encerrada ? 'Reabrir meta' : 'Encerrar meta') + '</button>' +
        (o.editar ? '<button class="btn" id="editar">Editar meta</button>' : '') +
        '<span class="peq sub">' + (m.encerrada ? 'A meta volta a contar como em andamento.' : 'Congela a meta e move o cartão para a lista ' + esc(M.CFG.listaEncerradas) + '.') + '</span></div>';
    }

    function render() {
      D.r = M.avaliar(meta, o.card.badges);
      var r = D.r;
      var membros = (o.card.members || []).map(function (x) { return x.id; });
      var avisoDono = meta.dono && membros.indexOf(meta.dono.id) < 0 ? '<p class="aviso peq" style="margin:0">' + esc(meta.dono.fullName) + ' é o responsável por esta meta, mas não está como membro do cartão.</p>' : '';
      var msg = st.msg ? '<p class="' + (st.msg.erro ? 'erro' : 'aviso') + ' peq" role="status" style="margin:0">' + esc(st.msg.texto) + '</p>' : '';
      var parada = r.parada ? '<p class="peq parada" style="margin:0">Sem atualização há ' + r.diasSemAtualizar + ' dias.</p>' : '';
      var oque = meta.oque ? '<p class="peq" style="margin:0"><span class="forte">O que conta:</span> ' + esc(meta.oque) + '</p>' : '';
      var esq = blocoProgresso() + parada + blocoDia() + blocoAtualizar() + blocoAvaliacao() + oque;
      var dir = meta.tipo === 'q' ? blocoGrafico() + blocoHistorico() : '';
      el.innerHTML = '<div class="coluna gap16">' + cabecalho() + avisoDono + msg +
        '<div class="detalhe-grade' + (dir ? '' : ' uma') + '"><div class="coluna gap16" style="min-width:0">' + esq + '</div>' + (dir ? '<div class="coluna gap16" style="min-width:0">' + dir + '</div>' : '') + '</div>' + acoes() + '</div>';
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
      return M.salvarMeta(o.t, o.escopo, novo).then(function () {
        meta = novo; st.ocupado = false; st.msg = aviso ? { texto: aviso } : null;
        if (o.aoSalvar) o.aoSalvar(meta);
        render();
      }).catch(function (e) { st.ocupado = false; st.msg = { erro: true, texto: e.message || 'Não foi possível salvar.' }; render(); });
    }

    function ligar() {
      var f = el.querySelector('#fAtualizar');
      if (f) {
        var campo = f.querySelector('#valor'), previa = f.querySelector('#previa');
        M.mascarar(campo, M.casasDe(meta));
        var atual = M.valorAtual(meta);
        var mostrar = function () {
          var v = M.lerNumero(campo.value);
          campo.removeAttribute('aria-invalid');
          if (isNaN(v)) { previa.className = 'ajuda'; previa.textContent = 'Total atual: ' + M.fmtValor(meta, atual) + '.'; return; }
          var novo = reg() === 'add' ? atual + v : v;
          previa.className = 'ajuda';
          previa.textContent = 'Total atual: ' + M.fmtValor(meta, atual) + '. Novo total: ' + M.fmtValor(meta, Math.round(novo * 100) / 100) + '.';
        };
        mostrar();
        campo.addEventListener('input', mostrar);
        f.querySelectorAll('[data-reg]').forEach(function (b) {
          b.onclick = function () { st.reg = b.getAttribute('data-reg'); st.msg = null; render(); var c = el.querySelector('#valor'); if (c) c.focus(); };
        });
        f.onsubmit = function (ev) {
          ev.preventDefault();
          var v = M.lerNumero(campo.value);
          var exemplo = M.casasDe(meta) ? '3.200,50' : '3.200';
          var falha = function (txt) { campo.setAttribute('aria-invalid', 'true'); previa.className = 'ajuda erro-campo'; previa.textContent = txt; campo.focus(); };
          if (isNaN(v)) { falha('Digite um valor. Exemplo: ' + exemplo + '.'); return; }
          if (reg() === 'add' && v <= 0) { falha('Digite um valor maior que zero para somar. Para corrigir um registro, use Informar o total.'); return; }
          var novoMeta = JSON.parse(JSON.stringify(meta));
          var novo = reg() === 'add' ? M.valorAtual(novoMeta) + v : v;
          novoMeta.hist = novoMeta.hist || [];
          novoMeta.hist.push([M.hoje(), Math.round(novo * 100) / 100, o.ctx.eu.id, o.ctx.eu.fullName.split(' ')[0], f.querySelector('#obs').value.trim().slice(0, 60)]);
          salvar(novoMeta, 'Valor registrado.');
        };
      }
      var fa = el.querySelector('#fAvaliar');
      if (fa) fa.onsubmit = function (ev) {
        ev.preventDefault();
        var novoMeta = JSON.parse(JSON.stringify(meta));
        novoMeta.aval = { nota: el.querySelector('#nota').value, obs: el.querySelector('#avObs').value.trim(), em: M.hoje(), por: o.ctx.eu.fullName };
        salvar(novoMeta);
      };
      var ed = el.querySelector('#editar');
      if (ed) ed.onclick = function () { o.editar(); };
      var enc = el.querySelector('#encerrar');
      if (enc) enc.onclick = function () {
        var novoMeta = JSON.parse(JSON.stringify(meta));
        if (novoMeta.encerrada) { novoMeta.encerrada = false; delete novoMeta.encerradaEm; salvar(novoMeta, 'Meta reaberta. Se quiser, mova o cartão de volta para a lista ' + M.CFG.listaMetas + '.'); return; }
        novoMeta.encerrada = true; novoMeta.encerradaEm = M.hoje();
        st.ocupado = true; render();
        M.salvarMeta(o.t, o.escopo, novoMeta).then(function () {
          meta = novoMeta;
          if (o.aoSalvar) o.aoSalvar(meta);
          return M.autorizado(o.t).then(function (ok) {
            if (!ok) return 'Meta encerrada. Mova o cartão para a lista ' + M.CFG.listaEncerradas + '. Para isso acontecer sozinho, autorize o Power-Up ao criar uma meta (a autorização vale 30 dias).';
            return M.garantirLista(o.t, M.CFG.listaEncerradas, 'top').then(function (l) {
              return M.rest(o.t, 'PUT', '/cards/' + o.card.id, { idList: l.id, pos: 'top' });
            }).then(function () { return 'Meta encerrada e cartão movido para ' + M.CFG.listaEncerradas + '.'; });
          });
        }).then(function (texto) { st.ocupado = false; st.msg = { texto: texto }; render(); })
          .catch(function (e) { st.ocupado = false; st.msg = { erro: true, texto: e.message || 'Não foi possível encerrar.' }; render(); });
      };
    }

    // Redesenha só o gráfico quando a janela muda de largura
    if (M._resize) window.removeEventListener('resize', M._resize);
    var espera = null;
    M._resize = function () { clearTimeout(espera); espera = setTimeout(function () { desenhar(); ajustar(); }, 120); };
    window.addEventListener('resize', M._resize);

    render();
  };
})();
