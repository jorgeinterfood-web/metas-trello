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
  // A projeção aparece em metas de valor acumulado ou de redução, durante o período e antes de atingir o objetivo
  function projecaoVisivel(meta, r) {
    return meta.tipo === 'q' && !r.semRitmo && Number.isFinite(r.projecao) && !r.antes && !r.depois && !meta.encerrada && r.sit !== 'hit';
  }
  function pctProjecao(meta, r) {
    var den = meta.dir === 'down' ? meta.vIni - meta.alvo : meta.alvo - meta.vIni;
    var num = meta.dir === 'down' ? meta.vIni - r.projecao : r.projecao - meta.vIni;
    return den > 0 ? Math.max(0, Math.round(num / den * 100)) : 0;
  }

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
    var real = meta.histCortado ? [] : [[0, meta.vIni]];
    ordem.forEach(function (d) { real.push([xDe(d), porDia[d]]); });
    var hojeIso = M.hoje(), xHoje = null;
    if (hojeIso >= meta.ini && hojeIso <= meta.fim) {
      xHoje = xDe(hojeIso);
      var ult = real[real.length - 1];
      if (ult && ult[0] < xHoje) real.push([xHoje, ult[1]]);
    }
    // Projeção: segue do valor de hoje até o fim do período
    var proj = xHoje !== null && real.length && projecaoVisivel(meta, r) ? [[xHoje, real[real.length - 1][1]], [dias, r.projecao]] : null;

    var vals = esp.map(function (p) { return p[1]; }).concat(real.map(function (p) { return p[1]; })).concat([meta.alvo]).concat(proj ? [r.projecao] : []);
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
    var bolas = real.slice(meta.histCortado ? 0 : 1, ordem.length + (meta.histCortado ? 0 : 1)).map(function (p, k) {
      return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" style="fill:' + cor + '"><title>' + M.dataBR(ordem[k]) + ': ' + esc(M.fmtValor(meta, p[1])) + '</title></circle>';
    }).join('');
    var desc = 'Evolução de ' + M.fmtValor(meta, meta.vIni) + ' a ' + M.fmtValor(meta, M.valorAtual(meta)) + ' entre ' + M.dataBR(meta.ini) + ' e ' + M.dataBR(meta.fim) + '. Objetivo: ' + M.fmtValor(meta, meta.alvo) + '.' + (proj ? ' Projeção: ' + M.fmtValor(meta, r.projecao) + '.' : '');

    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '" style="display:block;max-width:100%">' +
      grade + linhaAlvo + linhaHoje +
      (esp.length ? '<polyline points="' + pts(esp) + '" fill="none" style="stroke:var(--sub)" stroke-width="1.5" stroke-dasharray="4 4" stroke-linejoin="round"/>' : '') +
      (proj ? '<polyline points="' + pts(proj) + '" fill="none" style="stroke:' + cor + '" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"><title>' + esc('Projeção: ' + M.fmtValor(meta, r.projecao)) + '</title></polyline>' : '') +
      '<polyline points="' + pts(real) + '" fill="none" style="stroke:' + cor + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + bolas +
      '<text x="' + ml + '" y="' + (H - 4) + '" text-anchor="start" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.ini) + '</text>' +
      '<text x="' + (ml + pw) + '" y="' + (H - 4) + '" text-anchor="end" font-size="11" style="fill:var(--sub)">' + M.dataBR(meta.fim) + '</text></svg>';
  }

  // o: { t, escopo, meta, card, ctx, aoSalvar, ajustar, abrirCartao }
  M.detalhe = function (el, o) {
    var st = { msg: o.msg ? deMsgInicial(o.msg) : null, ocupado: false, rascunho: '', todos: false, confirmar: false, alterarAval: false };
    var meta = o.meta;
    var D = {};

    function ehTaxa() { return meta.tipo === 'q' && meta.fmt === 'p'; }
    function podeSomar() { return meta.tipo === 'q' && !ehTaxa() && meta.dir !== 'down'; }
    function reg() { return podeSomar() ? 'add' : 'tot'; }
    function ajustar() { if (o.ajustar) o.ajustar(); }
    function podeAtualizar() {
      if (!M.periodoAberto(meta) || meta.tipo !== 'q') return false;
      if (o.ctx.admin) return true;
      return meta.quem !== 'admin' && meta.dono && meta.dono.id === o.ctx.eu.id;
    }
    function f(v) { return M.fmtValor(meta, v); }

    function cabecalho() {
      var m=meta;
      var html='<p class="det-periodo"><span>Período:</span> <span class="forte num">' + esc(data(m.ini)+' a '+data(m.fim)) + '</span></p>';
      if (m.encerrada) html+='<span class="forte">Encerrada</span>';
      // Importância fica à direita, como tag alinhada à tag de situação
      if ((m.imp || 1)>1) html+='<span class="selo sit-neutral det-imp">'+M.iconeImp(m.imp)+esc(M.IMP[m.imp])+'</span>';
      return '<div class="det-cabeca">'+html+'</div>';
    }

    function frases() {
      var m = meta, r = D.r;
      if (r.antes) return ['O período começa em ' + data(m.ini)];
      if (m.tipo === 'a') return [];
      if (m.tipo === 'e') {
        if (o.card.etapasErro) return ['As etapas ainda não foram carregadas.'];
        if (!r.etapas) return ['Adicione as etapas à checklist do cartão.'];
        if (r.sit === 'hit') return [];
        if (r.sit === 'late') return ['Etapas pendentes: ' + (r.etapas-r.feitas)];
        return ['Esperado até ontem: ' + r.etapasEsperadas + (r.etapasEsperadas === 1 ? ' etapa' : ' etapas')];
      }
      if (ehTaxa()) {
        if (r.atual === m.alvo) return [];
        var out = ['Objetivo ' + (m.dir === 'down' ? 'máximo: ' : 'mínimo: ') + f(m.alvo)];
        if (r.faltaPontos > 0) out.push('Restante para o objetivo final: ' + M.pontos(m,r.faltaPontos));
        return out;
      }
      if (r.sit === 'hit') {
        var extra = m.dir === 'down' ? m.alvo - r.atual : r.atual - m.alvo;
        return extra > 0 ? ['Acima do objetivo final: ' + f(extra)] : [];
      }
      var out = [];
      if (!r.depois && !m.encerrada) {
        var diferenca = M.arred(m,Math.abs(r.dif));
        if (diferenca) out.push((r.dif < 0 ? 'Abaixo do esperado: ' : 'Acima do esperado: ') + f(diferenca));
      }
      out.push('Restante para o objetivo final: ' + f(Math.max(0,r.falta)));
      if (projecaoVisivel(m, r)) out.push('Projeção no ritmo atual: ' + f(r.projecao) + ' (' + pctProjecao(m, r) + '% do objetivo)');
      return out;
    }

    function feedback(itens) {
      itens = itens.filter(Boolean);
      if (itens.length > 1) return '<ul class="det-feedback">' + itens.map(function(txt){return '<li>' + esc(txt) + '</li>';}).join('') + '</ul>';
      return itens.length ? '<p class="det-frase">' + esc(itens[0]) + '</p>' : '';
    }

    function resumo() {
      var m = meta, r = D.r, principal, titulo;
      if (m.tipo === 'q') {
        titulo = ehTaxa() ? 'Percentual atual' : 'Progresso geral';
        principal = '<span class="forte num">' + esc(f(r.atual)) + '</span>';
        if (!ehTaxa()) principal += ' <span class="sub">' + (m.dir === 'down' ? '(objetivo: ' + esc(f(m.alvo)) + ')' : 'de ' + esc(f(m.alvo))) + '</span>';

      } else if (m.tipo === 'e') {
        titulo = 'Etapas concluídas';
        principal = '<span class="forte num">' + r.feitas + ' de ' + r.etapas + '</span>';

      } else {
        titulo = 'Avaliação da meta';
        principal = '<span class="forte">' + (m.aval ? 'registrada' : 'em ' + data(m.fim)) + '</span>';
      }
      var itens = frases().filter(Boolean);
      if (m.tipo === 'q' && !ehTaxa() && m.vIni !== 0) itens.push('Valor inicial: ' + f(m.vIni));
      if (r.parada) itens.push('Sem atualização há ' + r.diasSemAtualizar + (r.diasSemAtualizar === 1 ? ' dia' : ' dias'));
      var linhas = feedback(itens);
      // Rótulo e valor na mesma linha, no formato da linha do período
      return '<section class="det-resumo" aria-label="' + titulo + '">' +
        '<div class="det-topo"><h3 class="det-titulo det-valor det-linha">' + titulo + ': ' + principal + '</h3>' + (r.temBarra ? '' : M.selo(r)) + '</div>' +
        (r.temBarra ? '<div class="det-barra">' + M.barra(r, { grossa: true, label: titulo, texto: ehTaxa() ? f(r.atual) + (r.atual === m.alvo ? '' : '. Objetivo ' + (m.dir === 'down' ? 'máximo: ' : 'mínimo: ') + f(m.alvo)) : undefined }) + '<span class="det-status selo sit-' + r.info.cls + '">' + esc(M.textoBadge(m,r)) + '</span></div>' : '') +
        linhas + '</section>';
    }

    function objetivoHoje() {
      var m = meta, d = D.r.diaria;
      if (!d) {
        if (m.tipo === 'q' && m.dir !== 'down' && m.fmt !== 'p' && !m.encerrada && !D.r.antes && !D.r.depois && D.r.sit !== 'hit' && m.ritmo !== 'corridos' && !M.diaUtil(M.hoje())) {
          return '<section class="det-dia"><h3 class="det-titulo">Objetivo do dia</h3><p class="det-frase sub">Sem objetivo diário hoje. Os registros contam para o total.</p></section>';
        }
        return '';
      }
      var rot = M.situacaoDia(d);
      var rDia = { pct: d.pct, fill: d.fill, info: { cls: d.atingiu ? 'ok' : 'azul' } };

      var falta = d.atingiu ? (d.superou ? 'Excedente do dia: ' + f(d.realizado-d.alvo) : '') : M.faltam(m, d.falta) + ' ' + f(d.falta) + ' para concluir o objetivo do dia.';
      return '<section class="det-dia" aria-label="Objetivo do dia">' +
        '<div class="det-topo"><h3 class="det-titulo det-valor det-linha">Objetivo do dia: <span class="forte num">' + esc(f(d.realizado)) + '</span> <span class="sub">de ' + esc(f(d.alvo)) + '</span></h3></div>' +
        '<div class="det-barra">' + M.barra(rDia, { grossa: true, label: 'Progresso do dia', texto: f(d.realizado) + ' de ' + f(d.alvo) + ' no dia. ' + rot }) + '<span class="det-status selo sit-' + (d.atingiu ? 'ok' : 'neutral') + '">' + esc(M.textoProgressoDia(d)) + '</span></div>' +
        (falta ? '<p class="det-frase">' + esc(falta) + '</p>' : '') + '</section>';
    }

    function registro() {
      var m = meta;
      if (m.tipo !== 'q' || m.encerrada) return '';
      if (!M.periodoAberto(m)) return '<p class="det-frase sub">Registros disponíveis apenas durante o período da meta.</p>';
      if (!podeAtualizar()) return '<p class="det-frase sub">' + (m.quem === 'admin' ? 'Só administradores podem registrar valores.' : 'Só o responsável e administradores podem registrar valores.') + '</p>';
      var rot = podeSomar() ? 'Valor do registro' : (ehTaxa() ? 'Percentual atual' : 'Valor atual');
      var pre = m.fmt === 'r' ? 'R$' : '', suf = m.fmt === 'p' ? '%' : (m.fmt === 'n' ? M.pluralUnidade(m.unit) : '');
      return '<form class="registro" id="fAtualizar" novalidate>' +
        '<div class="registro-linha"><label class="rotulo registro-label" for="valor">' + rot + '</label>' +
        '<span class="campo-prefixo registro-entrada">' + (pre ? '<span>' + pre + '</span>' : '') + '<input id="valor" value="' + esc(st.rascunho) + '" type="text" inputmode="decimal" autocomplete="off" aria-describedby="previa" placeholder="' + (m.fmt === 'r' ? '0,00' : '0') + '">' + (suf ? '<span>' + esc(suf) + '</span>' : '') + '</span>' +
        (podeSomar() ? '<div class="registro-acoes"><button type="submit" name="operacao" value="add" class="btn btn-primario"' + (st.ocupado ? ' disabled' : '') + '>Somar</button><button type="submit" name="operacao" value="sub" class="btn"' + (st.ocupado ? ' disabled' : '') + '>Subtrair</button></div>' : '<button type="submit" class="btn btn-primario registro-submit"' + (st.ocupado ? ' disabled' : '') + '>Registrar</button>') + '</div>' +
        '<div class="ajuda registro-previa" id="previa" aria-live="polite"></div>' + '</form>';
    }

    function etapas() {
      if (meta.tipo !== 'e' || meta.encerrada) return '';
      if (o.card.etapasErro) return M.nota('aviso', o.card.etapasErro, { id: 'authEtapas', rotulo: 'Autorizar e atualizar' });
      if (o.abrirCartao) return '<div><button type="button" class="btn" id="marcar">Marcar etapas no cartão</button></div>';
      return '';
    }

    function avaliacao() {
      var m = meta;
      if (m.tipo !== 'a') return '';
      var html = '<section class="coluna gap8"><h3 class="det-titulo">Como será avaliada</h3><p class="det-frase">' + esc(m.crit || '') + '</p>';
      if (m.aval) {
        html += '<p class="det-frase sub">Avaliada por ' + esc(m.aval.por || '') + ' em ' + M.dataBR(m.aval.em) + (m.aval.obs ? '. ' + esc(m.aval.obs) : '') + '</p>';
      }
      if (o.ctx.admin) {
        var libera = M.addDias(m.fim, -6);
        if (m.aval && !st.alterarAval) html += '<div><button type="button" class="btn-link" id="alterarAval">Alterar avaliação</button></div>';
        else if (!m.aval && M.hoje() < libera) html += '<p class="det-frase sub">O resultado pode ser registrado a partir de ' + data(libera) + '</p>';
        else {
          html += '<div class="coluna gap8"><label class="campo" style="max-width:480px">Comentário (opcional)<input id="avObs" type="text" maxlength="200" value="' + esc(m.aval && m.aval.obs || '') + '"></label>' +
            '<div class="linha gap8" style="flex-wrap:wrap">' + [['nao', M.SIT.nao.label], ['parcial', M.SIT.parcial.label], ['atingida', M.SIT.atingida.label], ['superada', M.SIT.superada.label]].map(function (op) {
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
        '<span class="linha"><span aria-hidden="true" class="leg-trac"></span>' + (ehTaxa() ? 'Objetivo' : 'Ritmo esperado') + '</span>' +
        (projecaoVisivel(meta, D.r) && meta.ini <= M.hoje() ? '<span class="linha"><span aria-hidden="true" class="leg-proj" style="color:var(' + COR[D.r.info.cls] + ')"></span>Projeção</span>' : '') + '</div>' : '<p class="det-frase sub">O gráfico aparece a partir do primeiro registro.</p>';
      var linhas = [];
      for (var i = h.length - 1; i >= 0 && (st.todos || linhas.length < 8); i--) {
        var e = h[i], ant = i > 0 ? h[i - 1][1] : (meta.histBase !== undefined ? meta.histBase : meta.vIni), dif = e[1] - ant;
        var tdif = ehTaxa() ? M.pontos(meta, dif) : f(Math.abs(dif));
        linhas.push('<div class="hist-linha"><span class="sub num">' + M.dataBR(e[0]) + '</span>' +
          '<span class="num"><span class="forte">' + esc(f(e[1])) + '</span> <span class="' + (dif < 0 ? 'hist-negativo' : 'hist-positivo') + '">' + (dif >= 0 ? '+' : '−') + esc(tdif) + '</span></span>' +
          '<span class="sub hist-quem">' + esc(e[3] || '') + (e[4] ? '. ' + esc(e[4]) : '') + '</span></div>');
      }
      var hist = h.length ? '<div class="hist">' + linhas.join('') + '</div>' + (h.length > 8 ? '<button type="button" class="btn-link" id="verHist">' + (st.todos ? 'Ver últimos 8' : 'Ver histórico completo') + '</button>' : '') : '<p class="det-frase sub">Nenhum registro ainda.</p>';
      return '<div class="det-grade"><section class="coluna gap8" style="min-width:0"><h3 class="det-titulo">Evolução</h3>' + graf + '</section>' +
        '<section class="coluna gap8" style="min-width:0"><h3 class="det-titulo">Histórico</h3>'  + hist + '</section></div>';
    }

    // Mudanças na configuração da meta, da mais recente para a mais antiga
    function alteracoes() {
      var a = meta.alt || [];
      if (!a.length) return '';
      var linhas = a.slice().reverse().map(function (e) {
        return '<div class="hist-linha"><span class="sub num">' + M.dataBR(e[0]) + '</span><span>' + esc(M.textoAlteracao(e)) + '</span><span class="sub hist-quem">' + esc(e[1] || '') + '</span></div>';
      }).join('');
      return '<section class="det-alteracoes coluna gap8"><h3 class="det-titulo">Alterações</h3><div class="hist">' + linhas + '</div></section>';
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
      if(o.card.etapasErro){D.r.sit='andamento';D.r.info=M.SIT.andamento;D.r.rotulo='Etapas indisponíveis';}
      var membros = (o.card.members || []).map(function (x) { return x.id; });
      // Avisos sempre no topo do conteúdo da meta, no mesmo componente
      var notas = '';
      if (st.msg) notas += M.nota(st.msg.tipo, st.msg.texto, st.msg.acao ? { id: 'notaAcao', rotulo: st.msg.acao.rotulo } : null, 'notaFechar');
      // A pendência de atualizar o cartão já inclui o responsável: não repete o aviso
      if (meta.dono && membros.indexOf(meta.dono.id) < 0 && !(st.msg && st.msg.cobreDono)) notas += M.nota('aviso', meta.dono.fullName + ' é responsável pela meta, mas não é membro do cartão', o.ctx.admin ? { id: 'notaDono', rotulo: 'Adicionar ao cartão' } : null);
      el.innerHTML = '<div class="detalhe">' + (notas ? '<div class="notas">' + notas + '</div>' : '') + cabecalho() + resumo() + objetivoHoje() + registro() + etapas() + avaliacao() + evolucao() + alteracoes() + rodape() + '</div>';
      ligar();
      sumirSucesso();
      M.dimensionarTags(el);
      if(st.msg && st.msg.tipo !== 'erro'){var foco=el.querySelector('#valor');if(foco)foco.focus();}
      desenhar();
      ajustar();
    }

    function desenhar() {
      var g = el.querySelector('#graf');
      if (!g) return;
      g.innerHTML = grafico(meta, D.r, Math.max(280, Math.floor(g.clientWidth || 480)));
    }

    function salvar(novo, aviso, registroSilencioso) {
      var reabrindo=meta.encerrada && !novo.encerrada;
      st.ocupado = true;
      el.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      return M.salvarMeta(o.t, o.escopo, novo).then(function () {
        meta = novo; if(registroSilencioso) st.rascunho = ''; st.msg = aviso ? sucesso(aviso) : null; st.alterarAval = false;
        if (o.aoSalvar) o.aoSalvar(meta);
        return M.autorizado(o.t).then(function (ok) {
          if (!ok) return false;
          return concluirCartao().then(function () {
            if (!reabrindo) return true;
            return M.moverCartao(o.t, o.card.id, M.CFG.listaMetas).then(function () { st.msg = sucesso('Meta reaberta e cartão movido para ' + M.CFG.listaMetas); return true; });
          });
        }).catch(function () { return false; }).then(function (ok) {
          if (!ok && !registroSilencioso) {
            st.msg = reabrindo ? pendencia('Meta reaberta. O cartão continua em ' + M.CFG.listaEncerradas, 'Mover cartão', function () { acaoCartao(M.CFG.listaMetas); })
              : pendencia((aviso ? aviso + '. ' : '') + 'A conclusão do cartão não foi atualizada', 'Atualizar cartão', function () { acaoCartao(null); });
          }
          st.ocupado = false; render();
          if (registroSilencioso) { var campo = el.querySelector('#valor'); if (campo) campo.focus(); }
        });
      }).catch(function (e) { st.ocupado = false; st.msg = falhaComAtualizar(e); render(); });
    }

    // ---------- avisos ----------
    function sucesso(texto) { return { tipo: 'sucesso', texto: texto }; }
    function pendencia(texto, rotulo, fn) { return { tipo: 'aviso', texto: texto, acao: rotulo ? { rotulo: rotulo, fn: fn } : null }; }
    function falha(e) { return { tipo: 'erro', texto: M.erroUsuario(e) }; }
    function falhaComAtualizar(e) { return { tipo: 'erro', texto: M.erroUsuario(e), acao: { rotulo: 'Atualizar dados', fn: atualizarDados } }; }
    function deMsgInicial(m) {
      if (!m.pendente) return sucesso(m.texto);
      var p = pendencia(m.texto, 'Atualizar cartão', function () { sincronizarPendente(m.pendente); });
      p.cobreDono = true;
      return p;
    }
    // O aviso de sucesso some sozinho depois de alguns segundos
    function sumirSucesso() {
      if (!st.msg || st.msg.tipo !== 'sucesso' || st.msgTimer === st.msg) return;
      var alvo = st.msgTimer = st.msg;
      setTimeout(function () {
        if (st.msg !== alvo) return;
        st.msg = null;
        var n = el.querySelector('.nota-sucesso'), lista = n && n.parentNode;
        if (n) n.remove();
        if (lista && !lista.children.length) lista.remove();
        ajustar();
      }, 5000);
    }
    function concluirCartao() {
      var r = M.avaliar(meta, o.card.badges);
      return M.rest(o.t, 'PUT', '/cards/' + o.card.id, { dueComplete: r.sit === 'hit' || r.sit === 'noalvo' });
    }
    // Autoriza (a janela do Trello precisa partir do clique) e acerta o cartão
    function acaoCartao(lista) {
      st.ocupado = true; render();
      M.autorizar(o.t).then(concluirCartao).then(function () { return lista ? M.moverCartao(o.t, o.card.id, lista) : null; })
        .then(function () { st.ocupado = false; st.msg = sucesso(lista ? 'Cartão movido para ' + lista : 'Cartão atualizado'); render(); })
        .catch(function (e) { st.ocupado = false; st.msg = falha(e); render(); });
    }
    function sincronizarPendente(p) {
      st.ocupado = true; render();
      M.autorizar(o.t).then(function () { return M.sincronizarCartao(o.t, o.card.id, meta, p.nomeCartao, p.donoAnterior); })
        .then(function (nome) {
          o.card.name = nome;
          if (meta.dono && !(o.card.members || []).some(function (x) { return x.id === meta.dono.id; })) (o.card.members = o.card.members || []).push({ id: meta.dono.id });
          if (o.aoCartao) o.aoCartao(o.card);
          st.ocupado = false; st.msg = sucesso('Cartão atualizado'); render();
        }).catch(function (e) { st.ocupado = false; st.msg = falha(e); render(); });
    }
    function adicionarDono() {
      st.ocupado = true; render();
      M.autorizar(o.t).then(function () { return M.rest(o.t, 'POST', '/cards/' + o.card.id + '/idMembers', { value: meta.dono.id }); })
        .then(function () {
          (o.card.members = o.card.members || []).push({ id: meta.dono.id });
          if (o.aoCartao) o.aoCartao(o.card);
          st.ocupado = false; st.msg = sucesso(meta.dono.fullName + ' adicionado ao cartão'); render();
        }).catch(function (e) { st.ocupado = false; st.msg = falha(e); render(); });
    }
    function atualizarDados() {
      Promise.all([M.ler(o.t, o.escopo), M.contexto(o.t)]).then(function (v) {
        if (!v[0]) throw new Error('A meta não está mais disponível.');
        meta = v[0]; o.ctx = v[1];
        return M.prepararCard(o.t, o.card, meta);
      }).then(function () {
        if (o.aoSalvar) o.aoSalvar(meta);
        st.msg = pendencia('Dados atualizados. Confira o valor antes de registrar'); render();
      }).catch(function (e) { st.msg = falha(e); render(); });
    }

    function ligar() {
      var $ = function (id) { return el.querySelector('#' + id); };
      if ($('notaAcao')) $('notaAcao').onclick = function () { if (st.msg && st.msg.acao && !st.ocupado) st.msg.acao.fn(); };
      if ($('notaFechar')) $('notaFechar').onclick = function () { st.msg = null; render(); };
      if ($('notaDono')) $('notaDono').onclick = function () { if (!st.ocupado) adicionarDono(); };
      if ($('verHist')) $('verHist').onclick = function () { st.todos = !st.todos; render(); };
      var fr = $('fAtualizar');
      if (fr) {
        var campo = $('valor'), previa = $('previa');
        M.mascararValor(campo, meta.fmt, M.casasDe(meta));
        var atual = M.valorAtual(meta);
        function previaValor() {
          st.rascunho = campo.value;
          campo.removeAttribute('aria-invalid');
          previa.className = 'ajuda';
          var v = M.lerNumero(campo.value);
          if (!campo.value.trim()) { previa.textContent = 'Total atual: ' + f(atual); return; }
          try { M.validarValor(v, meta); } catch(e) { previa.textContent=e.message;previa.className='ajuda erro-campo';return; }
          var novo = reg() === 'add' ? atual + v : v;
          if (podeSomar()) {
            previa.innerHTML='<span>Após somar: '+esc(f(M.arred(meta,atual+v)))+'</span><span>'+(v>atual ? 'A subtração deixaria o total negativo.' : 'Após subtrair: '+esc(f(M.arred(meta,atual-v))))+'</span>';
          } else previa.textContent = 'Após o registro: ' + f(M.arred(meta,novo));
        }
        campo.addEventListener('input', previaValor); previaValor();
        fr.onsubmit = function (ev) {
          ev.preventDefault();
          if (st.ocupado) return;
          var v = M.lerNumero(campo.value);
          var falha = function (txt) { campo.setAttribute('aria-describedby', 'previa'); campo.setAttribute('aria-invalid', 'true'); previa.className = 'ajuda erro-campo'; previa.textContent = txt; campo.focus(); };
          if (isNaN(v)) { falha('Digite um valor.'); return; }
          if (reg() === 'add' && v <= 0) { falha('Digite um valor maior que zero.'); return; }
          try { M.validarValor(v, meta); } catch (e) { falha(e.message); return; }
          var novoMeta = JSON.parse(JSON.stringify(meta));
          var subtrair=podeSomar() && ev.submitter && ev.submitter.value==='sub';
          var novo = podeSomar() ? M.valorAtual(novoMeta) + (subtrair ? -v : v) : v;
          if (novo<0) {falha('A subtração não pode deixar o total negativo.');return;}
          try {M.validarValor(novo,meta);} catch(e){falha(e.message);return;}
          var diaFixo = M.diaria(meta);
          if (diaFixo) novoMeta.diaria = { em: diaFixo.em, base: diaFixo.base, alvo: diaFixo.alvo };
          novoMeta.hist = novoMeta.hist || [];
          novoMeta.hist.push([M.hoje(), Math.round(novo * 100) / 100, o.ctx.eu.id, o.ctx.eu.fullName.split(' ')[0], '']);
          st.rascunho = campo.value;
          salvar(novoMeta, null, true);
        };
      }
      if ($('authEtapas')) $('authEtapas').onclick = function () { M.autorizar(o.t).then(function () { return M.prepararCard(o.t,o.card,meta); }).then(function () { render(); }).catch(function(e){st.msg=falha(e);render();}); };
      if ($('marcar')) $('marcar').onclick = function () { o.abrirCartao(); };
      if ($('alterarAval')) $('alterarAval').onclick = function () { st.alterarAval = true; render(); };
      el.querySelectorAll('[data-nota]').forEach(function (b) {
        b.onclick = function () {
          var novoMeta = JSON.parse(JSON.stringify(meta));
          novoMeta.aval = { nota: b.getAttribute('data-nota'), obs: $('avObs') ? $('avObs').value.trim() : '', em: M.hoje(), por: o.ctx.eu.fullName };
          salvar(novoMeta, 'Avaliação registrada');
        };
      });
      if ($('encerrar')) $('encerrar').onclick = function () { st.confirmar = true; render(); };
      if ($('encerrarNao')) $('encerrarNao').onclick = function () { st.confirmar = false; render(); };
      if ($('reabrir')) $('reabrir').onclick = function () {
        var novoMeta = JSON.parse(JSON.stringify(meta));
        novoMeta.encerrada = false; delete novoMeta.encerradaEm;
        M.registrarEncerramento(novoMeta, o.ctx.eu, false);
        salvar(novoMeta, 'Meta reaberta');
      };
      if ($('encerrarSim')) $('encerrarSim').onclick = function () {
        var novoMeta = JSON.parse(JSON.stringify(meta));
        novoMeta.encerrada = true; novoMeta.encerradaEm = M.hoje();
        M.registrarEncerramento(novoMeta, o.ctx.eu, true);
        st.ocupado = true; render();
        M.salvarMeta(o.t, o.escopo, novoMeta).then(function () {
          meta = novoMeta;
          if (o.aoSalvar) o.aoSalvar(meta);
          return M.autorizado(o.t).then(function (ok) {
            if (!ok) return pendencia('Meta encerrada. O cartão ainda não está em ' + M.CFG.listaEncerradas, 'Mover cartão', function () { acaoCartao(M.CFG.listaEncerradas); });
            return M.moverCartao(o.t, o.card.id, M.CFG.listaEncerradas).then(function () { return sucesso('Meta encerrada e cartão movido para ' + M.CFG.listaEncerradas); });
          });
        }).then(function (msg) { st.ocupado = false; st.confirmar = false; st.msg = msg; render(); })
          .catch(function (e) { st.ocupado = false; st.confirmar = false; st.msg = falhaComAtualizar(e); render(); });
      };
    }

    if (M._resize) window.removeEventListener('resize', M._resize);
    var espera = null;
    M._resize = function () { clearTimeout(espera); espera = setTimeout(function () { desenhar(); ajustar(); }, 120); };
    window.addEventListener('resize', M._resize);

    render();
  };
})();
