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

    // Frases do resumo: no máximo duas, cada fato uma vez
    function frases() {
      var m = meta, r = D.r, out = [];
      if (r.antes) return ['Começa em ' + data(m.ini) + '.'];
      if (m.tipo === 'q' && ehTaxa()) {
        if (r.sit === 'noalvo') out.push('Está no objetivo.');
        else if (r.sit === 'abaixo') out.push(M.faltam(m, r.faltaPontos) + ' ' + M.pontos(m, r.faltaPontos) + ' para o objetivo.');
        else if (r.sit === 'hit') out.push('Fechou o período no objetivo.');
        else if (r.sit === 'late') out.push('O período terminou em ' + data(m.fim) + ' abaixo do objetivo.');
        return out;
      }
      var corridos = m.ritmo === 'corridos';
      var dias = function (n) { return n + ' ' + (corridos ? (n === 1 ? 'dia' : 'dias') : (n === 1 ? 'dia útil' : 'dias úteis')); };
      var ondeEsta = '(' + r.passados + ' de ' + dias(r.total) + ')';
      if (m.tipo === 'q') {
        if (r.sit === 'hit') return ['Objetivo atingido.'];
        if (r.sit === 'late') return ['O período terminou em ' + data(m.fim) + ' sem atingir o objetivo. ' + M.faltam(m, r.falta, true) + ' ' + f(r.falta) + '.'];
        // 1. Onde deveria estar hoje e a distância até lá
        var esperado = M.arred(m, r.valorEsperado), q = M.arred(m, Math.abs(r.dif));
        var l1 = 'Até hoje ' + ondeEsta + ', o esperado era ' + f(esperado) + '.';
        if (q === 0) l1 += ' Está exatamente no esperado.';
        else if (r.dif < 0) l1 += ' ' + M.faltam(m, q) + ' ' + f(q) + ' para chegar lá.';
        else l1 += ' Está ' + f(q) + (m.dir === 'down' ? ' abaixo' : ' acima') + ' disso.';
        out.push(l1);
        // 2. O que precisa fazer até o fim
        if (r.falta > 0) {
          var fecho = { mes: 'Para fechar o mês', tri: 'Para fechar o trimestre', sem: 'Para fechar o semestre' }[m.periodo] || 'Para fechar até ' + data(m.fim);
          var n = r.diasRestantes;
          if (r.mostrarDia && n > 1) out.push(fecho + ': ' + f(r.porDiaArred) + ' por ' + (corridos ? 'dia' : 'dia útil') + ' nos ' + dias(n) + ' que restam' + (r.registrouHoje ? '.' : ', contando hoje.'));
          else if (r.mostrarDia && n === 1) out.push(fecho + ': ' + f(r.falta) + ' no último ' + (corridos ? 'dia' : 'dia útil') + '.');
          else out.push(M.faltam(m, r.falta) + ' ' + f(r.falta) + ' para o objetivo até ' + data(m.fim) + '.');
        }
        return out;
      }
      if (m.tipo === 'e') {
        if (!r.etapas) return ['Nenhuma etapa na checklist do cartão.'];
        if (r.sit === 'hit') return ['Todas as etapas foram concluídas.'];
        if (r.sit === 'late') return ['O período terminou em ' + data(m.fim) + ' com etapas pendentes.'];
        if (r.sit === 'andamento') {
          var dia = M.hoje(), modoE = corridos ? 'corridos' : 'uteis';
          while (dia < m.fim && Math.round(r.etapas * M.contarDias(m.ini, dia, modoE) / r.total) < 1) dia = M.addDias(dia, 1);
          return ['A primeira etapa é esperada até ' + data(dia) + '.'];
        }
        var espE = Math.round(r.etapas * r.esperado / 100), dE = r.feitas - espE;
        var tE = 'Até hoje ' + ondeEsta + ', o esperado era ' + espE + ' de ' + r.etapas + ' etapas.';
        if (dE < 0) tE += ' ' + (dE === -1 ? 'Falta 1' : 'Faltam ' + (-dE)) + ' para chegar lá.';
        else if (dE > 0) tE += ' Está ' + dE + (dE === 1 ? ' etapa' : ' etapas') + ' à frente.';
        else tE += ' Está exatamente no esperado.';
        return [tE];
      }
      return [];
    }

    function resumo() {
      var m = meta, r = D.r, principal, pct = '';
      if (m.tipo === 'q') {
        principal = '<span class="grande num">' + esc(f(r.atual)) + '</span><span class="sub">' + (ehTaxa() ? 'objetivo ' : 'de ') + esc(f(m.alvo)) + '</span>';
        if (!ehTaxa()) pct = '<span class="forte num det-pct">' + r.pct + '%</span>';
      } else if (m.tipo === 'e') {
        principal = '<span class="grande num">' + r.feitas + ' de ' + r.etapas + '</span><span class="sub">etapas</span>';
        pct = '<span class="forte num det-pct">' + r.pct + '%</span>';
      } else {
        principal = '<span class="forte">' + (m.aval ? 'Resultado da avaliação' : 'Avaliação em ' + data(m.fim)) + '</span>';
      }
      var linhas = frases().map(function (t2) { return '<p class="det-frase">' + esc(t2) + '</p>'; }).join('');
      if (r.parada) linhas += '<p class="det-frase parada">Sem atualização há ' + r.diasSemAtualizar + ' dias.</p>';
      return '<section class="det-resumo">' +
        '<div class="det-topo"><div class="det-valor">' + principal + '</div>' + M.selo(r) + '</div>' +
        (r.temBarra ? '<div class="det-barra">' + M.barra(r, { grossa: true, label: 'Progresso da meta' }) + pct + '</div>' : '') +
        (linhas ? '<div class="coluna gap4">' + linhas + '</div>' : '') + '</section>';
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
      el.innerHTML = '<div class="detalhe">' + cabecalho() + avisoDono + msg + resumo() + registro() + etapas() + avaliacao() + evolucao() + rodape() + '</div>';
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
          var v = M.lerNumero(campo.value);
          var falha = function (txt) { campo.setAttribute('aria-invalid', 'true'); previa.className = 'ajuda erro-campo'; previa.textContent = txt; campo.focus(); };
          if (isNaN(v)) { falha(meta.fmt === 'r' ? 'Digite um valor. Os dígitos entram pelos centavos: 50029 vira 500,29.' : 'Digite um valor.'); return; }
          if (reg() === 'add' && v <= 0) { falha('Digite um valor maior que zero. Para corrigir um registro, use Corrigir o total.'); return; }
          var novoMeta = JSON.parse(JSON.stringify(meta));
          var novo = reg() === 'add' ? M.valorAtual(novoMeta) + v : v;
          var obs = $('obs') ? $('obs').value.trim().slice(0, 60) : '';
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
