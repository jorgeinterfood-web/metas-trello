/* Seção Meta no verso do cartão */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var D = null, msg = '', confirmar = -1, ocupado = false;

  function ajustar() { t.sizeTo('#app').catch(function () {}); }

  function carregar() {
    return Promise.all([t.get('card', 'shared', M.CHAVE), t.card('id', 'name', 'members', 'badges'), M.contexto(t)]).then(function (res) {
      if (!res[0]) { app.innerHTML = ''; ajustar(); return; }
      D = { meta: res[0], card: res[1], ctx: res[2] };
      D.r = M.avaliar(D.meta, D.card.badges);
      render();
    }).catch(function (e) {
      app.innerHTML = '<p class="erro">Não foi possível carregar a meta. ' + esc(e.message || '') + '</p>';
      ajustar();
    });
  }

  function podeAtualizar() {
    var m = D.meta, c = D.ctx;
    if (m.encerrada || m.tipo !== 'q') return false;
    if (c.admin) return true;
    return m.quem !== 'admin' && m.dono && m.dono.id === c.eu.id;
  }

  function grafico() {
    var m = D.meta, h = (m.hist || []).slice();
    if (!h.length) return '';
    var W = 500, H = 120, base = 108, topo = 12;
    var total = M.diasEntre(m.ini, m.fim) || 1;
    var x = function (d) { return Math.max(0, Math.min(W, M.diasEntre(m.ini, d) / total * W)); };
    var maxV = Math.max(m.alvo, m.vIni, h.reduce(function (a, e) { return Math.max(a, e[1]); }, 0));
    var minV = Math.min(m.alvo, m.vIni, h.reduce(function (a, e) { return Math.min(a, e[1]); }, Infinity));
    var y = function (v) { return maxV === minV ? base : base - (v - minV) / (maxV - minV) * (base - topo); };
    var pts = [[x(m.ini), y(m.vIni)]].concat(h.map(function (e) { return [x(e[0]), y(e[1])]; }));
    var poly = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var bolas = pts.slice(1).map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" style="fill:var(--ok)"/>'; }).join('');
    var desc = 'Evolução: ' + h.map(function (e) { return M.fmtValor(m, e[1]) + ' em ' + M.dataBR(e[0]); }).join(', ') + '. Linha tracejada: ritmo esperado até ' + M.fmtValor(m, m.alvo) + ' em ' + M.dataBR(m.fim) + '.';
    return '<div class="coluna gap8"><span class="peq forte sub">Evolução no período</span>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(desc) + '" style="overflow:visible">' +
      '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" style="stroke:var(--borda)" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
      '<line x1="0" y1="' + y(m.vIni).toFixed(1) + '" x2="' + W + '" y2="' + y(m.alvo).toFixed(1) + '" style="stroke:var(--sub)" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>' +
      '<polyline points="' + poly + '" fill="none" style="stroke:var(--ok)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' + bolas + '</svg>' +
      '<div class="linha peq sub entre"><span>' + M.dataBR(m.ini) + '</span><span class="linha gap16"><span class="linha"><span aria-hidden="true" style="width:16px;height:3px;border-radius:2px;background:var(--ok)"></span>Realizado</span>' +
      '<span class="linha"><span aria-hidden="true" style="width:16px;border-top:2px dashed var(--sub)"></span>Ritmo esperado</span></span><span>' + M.dataBR(m.fim) + '</span></div></div>';
  }

  function historico() {
    var m = D.meta, h = m.hist || [];
    if (!h.length) return '<p class="peq sub" style="margin:0">Nenhum registro ainda.</p>';
    var linhas = [];
    for (var i = h.length - 1; i >= 0 && linhas.length < 8; i--) {
      var e = h[i], ant = i > 0 ? h[i - 1][1] : m.vIni, dif = e[1] - ant;
      var sinal = dif >= 0 ? '+' : '−';
      linhas.push('<div class="historico-linha num"><span class="sub">' + M.dataBR(e[0]) + '</span>' +
        '<span><span class="forte">' + esc(M.fmtValor(m, e[1])) + '</span> <span class="' + (dif >= 0 ? 'dif-mais' : 'dif-menos') + '" style="font-weight:400">' + sinal + esc(M.fmtValor(m, Math.abs(dif))) + '</span></span>' +
        '<span class="sub">' + esc(e[3] || '') + (e[4] ? ' · ' + esc(e[4]) : '') + '</span>' +
        (D.ctx.admin ? '<button class="btn-link peq" data-remover="' + i + '">' + (confirmar === i ? 'Confirmar remoção' : 'Remover') + '</button>' : '<span></span>') + '</div>');
    }
    return '<div class="coluna"><span class="peq forte sub" style="padding-bottom:4px">Histórico' + (h.length > 8 ? ' (8 registros mais recentes)' : '') + '</span>' + linhas.join('') + '</div>';
  }

  function blocoProgresso() {
    var m = D.meta, r = D.r;
    if (!r.temBarra) return '';
    var dif = M.textoDiff(r), difCls = r.diff > 0 ? 'dif-mais' : (r.diff < -15 ? 'dif-menos' : 'dif-neutro');
    var valor = m.tipo === 'q' ? M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo) : (r.etapas ? r.feitas + ' de ' + r.etapas + ' etapas' : 'Nenhuma etapa na checklist');
    var expl;
    if (r.antes) expl = 'A meta começa em ' + M.dataBRCompleta(m.ini) + '.';
    else if (m.tipo === 'q') {
      var modo = m.ritmo === 'corridos' ? 'dias' : 'dias úteis';
      expl = 'Esperado hoje: ' + M.fmtValor(m, Math.round(r.valorEsperado * 100) / 100) + ' (' + r.esperado + '%).';
      if (r.falta > 0 && r.diasRestantes > 0) expl += ' Faltam ' + M.fmtValor(m, r.falta) + ' em ' + r.diasRestantes + ' ' + (r.diasRestantes === 1 ? modo.replace('dias', 'dia') : modo) + ', cerca de ' + M.fmtValor(m, Math.ceil(r.porDia)) + ' por ' + (m.ritmo === 'corridos' ? 'dia' : 'dia útil') + '.';
    } else expl = 'Esperado hoje: ' + r.esperado + '%. Marque as etapas na checklist do cartão para avançar.';
    return '<div class="coluna gap8">' +
      '<div class="linha entre" style="flex-wrap:wrap"><div class="linha gap12"><span class="grande num">' + r.pct + '%</span>' + M.selo(r) + (dif ? '<span class="peq ' + difCls + '">' + esc(dif) + '</span>' : '') + '</div><span class="sub num">' + esc(valor) + '</span></div>' +
      M.barra(r, { grossa: true, label: 'Progresso da meta' }) +
      '<div class="linha peq sub"><span class="legenda-zona" aria-hidden="true"></span><span>' + esc(expl) + '</span></div></div>';
  }

  function blocoAtualizar() {
    var m = D.meta;
    if (m.tipo !== 'q' || m.encerrada) return '';
    if (!podeAtualizar()) return '<p class="peq sub" style="margin:0">' + (m.quem === 'admin' ? 'Só admins do quadro atualizam o progresso desta meta.' : 'Só ' + esc(m.dono ? m.dono.fullName : 'o responsável') + ' e os admins do quadro atualizam o progresso desta meta.') + '</p>';
    var acc = m.reg !== 'add';
    var pre = m.fmt === 'r' ? 'R$' : '', suf = m.fmt === 'p' ? '%' : (m.fmt === 'n' ? (m.unit || '') : '');
    return '<form class="caixa coluna gap8" id="fAtualizar" novalidate>' +
      '<div class="linha gap12" style="align-items:flex-end;flex-wrap:wrap">' +
      '<label class="campo" style="width:200px">' + (acc ? 'Novo total acumulado' : 'Valor a somar') +
      '<span class="campo-prefixo"><span>' + pre + '</span><input id="valor" type="text" inputmode="decimal" required><span style="padding:0 8px 0 0">' + esc(suf) + '</span></span></label>' +
      '<label class="campo" style="flex:1;min-width:180px">Observação (opcional)<input id="obs" type="text" maxlength="60" placeholder="Ex.: pedido grande faturado"></label>' +
      '<button type="submit" class="btn btn-primario" style="height:36px"' + (ocupado ? ' disabled' : '') + '>Atualizar progresso</button></div>' +
      '<span class="ajuda">' + (acc ? 'Informe o total até hoje, não só o valor novo.' : 'O valor informado é somado ao total atual.') +
      (m.lembrete && m.lembrete !== 'nao' ? ' Lembrete: ' + { seg: 'toda segunda-feira', dia: 'todo dia útil', 15: 'a cada 15 dias' }[m.lembrete] + '.' : '') + '</span></form>';
  }

  function blocoAvaliacao() {
    var m = D.meta;
    if (m.tipo !== 'a') return '';
    var html = '<div class="coluna gap8"><span class="peq forte sub">Como será avaliada</span><p style="margin:0">' + esc(m.crit || '') + '</p>';
    if (m.aval) {
      html += '<div class="linha">' + M.selo(D.r) + '<span class="peq sub">por ' + esc(m.aval.por || '') + ' em ' + M.dataBR(m.aval.em) + '</span></div>' + (m.aval.obs ? '<p class="peq" style="margin:0">' + esc(m.aval.obs) + '</p>' : '');
    } else {
      html += '<p class="peq sub" style="margin:0">Aguardando avaliação de um admin, prevista para ' + M.dataBRCompleta(m.fim) + '.</p>';
    }
    if (D.ctx.admin) {
      var n = m.aval ? m.aval.nota : '';
      html += '<form class="caixa coluna gap8" id="fAvaliar" novalidate><div class="linha gap12" style="align-items:flex-end;flex-wrap:wrap">' +
        '<label class="campo" style="width:200px">Resultado<select id="nota">' + [['nao', 'Não atingida'], ['parcial', 'Parcial'], ['atingida', 'Atingida'], ['superada', 'Superada']].map(function (o) { return '<option value="' + o[0] + '"' + (n === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo" style="flex:1;min-width:180px">Comentário (opcional)<input id="avObs" type="text" maxlength="200" value="' + esc(m.aval && m.aval.obs || '') + '"></label>' +
        '<button type="submit" class="btn btn-primario" style="height:36px">' + (m.aval ? 'Alterar avaliação' : 'Salvar avaliação') + '</button></div></form>';
    }
    return html + '</div>';
  }

  function render() {
    var m = D.meta, r = D.r;
    var membros = (D.card.members || []).map(function (x) { return x.id; });
    var avisoDono = m.dono && membros.indexOf(m.dono.id) < 0 ? '<p class="aviso peq" style="margin:0">' + esc(m.dono.fullName) + ' é o responsável por esta meta, mas não está como membro do cartão.</p>' : '';
    var cab = '<div class="linha peq sub" style="flex-wrap:wrap"><span class="tipo">' + esc(m.tipo === 'q' && m.fmt === 'r' ? 'Quantitativa em R$' : M.TIPO[m.tipo]) + '</span>' +
      '<span>Importância ' + esc(M.IMP[m.imp || 1].toLowerCase()) + '</span><span aria-hidden="true">·</span><span>' + M.dataBRCompleta(m.ini) + ' a ' + M.dataBRCompleta(m.fim) + '</span>' +
      (m.dono ? '<span aria-hidden="true">·</span><span>' + esc(m.dono.fullName) + '</span>' : '') +
      (m.encerrada ? '<span aria-hidden="true">·</span><span class="forte">Encerrada</span>' : '') + '</div>';
    var parada = r.parada ? '<p class="peq parada" style="margin:0">Sem atualização há ' + r.diasSemAtualizar + ' dias.</p>' : '';
    var oque = m.oque ? '<p class="peq" style="margin:0"><span class="forte">O que conta:</span> ' + esc(m.oque) + '</p>' : '';
    var acoes = D.ctx.admin ? '<div class="linha" style="padding-top:4px"><button class="btn" id="encerrar"' + (ocupado ? ' disabled' : '') + '>' + (m.encerrada ? 'Reabrir meta' : 'Encerrar meta') + '</button>' +
      '<span class="peq sub">' + (m.encerrada ? 'A meta volta a contar como em andamento.' : 'Congela a meta e move o cartão para a lista ' + esc(M.CFG.listaEncerradas) + '.') + '</span></div>' : '';
    app.innerHTML = '<div class="coluna gap16">' + cab + avisoDono +
      (msg ? '<p class="' + (msg.erro ? 'erro' : 'aviso') + ' peq" role="status" style="margin:0">' + esc(msg.texto) + '</p>' : '') +
      blocoProgresso() + parada + blocoAtualizar() + blocoAvaliacao() +
      (m.tipo === 'q' ? grafico() + historico() : '') + oque + acoes + '</div>';
    ligar();
    ajustar();
  }

  function salvar(meta, aviso) {
    ocupado = true;
    return M.salvarMeta(t, 'card', meta).then(function () { msg = aviso ? { texto: aviso } : ''; ocupado = false; confirmar = -1; return carregar(); })
      .catch(function (e) { ocupado = false; msg = { erro: true, texto: e.message || 'Não foi possível salvar.' }; render(); });
  }

  function ligar() {
    var f = document.getElementById('fAtualizar');
    if (f) f.onsubmit = function (ev) {
      ev.preventDefault();
      var v = M.lerNumero(document.getElementById('valor').value);
      if (isNaN(v)) { msg = { erro: true, texto: 'Digite um número. Exemplo: 84.300,00' }; render(); return; }
      var m = JSON.parse(JSON.stringify(D.meta));
      var novo = m.reg === 'add' ? M.valorAtual(m) + v : v;
      m.hist = m.hist || [];
      m.hist.push([M.hoje(), Math.round(novo * 100) / 100, D.ctx.eu.id, D.ctx.eu.fullName.split(' ')[0], document.getElementById('obs').value.trim().slice(0, 60)]);
      salvar(m);
    };
    var fa = document.getElementById('fAvaliar');
    if (fa) fa.onsubmit = function (ev) {
      ev.preventDefault();
      var m = JSON.parse(JSON.stringify(D.meta));
      m.aval = { nota: document.getElementById('nota').value, obs: document.getElementById('avObs').value.trim(), em: M.hoje(), por: D.ctx.eu.fullName };
      salvar(m);
    };
    document.querySelectorAll('[data-remover]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-remover');
        if (confirmar !== i) { confirmar = i; render(); return; }
        var m = JSON.parse(JSON.stringify(D.meta));
        m.hist.splice(i, 1);
        salvar(m, 'Registro removido.');
      };
    });
    var enc = document.getElementById('encerrar');
    if (enc) enc.onclick = function () {
      var m = JSON.parse(JSON.stringify(D.meta));
      if (m.encerrada) { m.encerrada = false; delete m.encerradaEm; salvar(m, 'Meta reaberta. Se quiser, mova o cartão de volta para a lista ' + M.CFG.listaMetas + '.'); return; }
      m.encerrada = true; m.encerradaEm = M.hoje();
      ocupado = true; render();
      M.salvarMeta(t, 'card', m).then(function () {
        return M.autorizado(t).then(function (ok) {
          if (!ok) return 'Meta encerrada. Mova o cartão para a lista ' + M.CFG.listaEncerradas + '. Para isso acontecer sozinho, autorize o Power-Up em Nova meta (a autorização vale 30 dias).';
          return M.garantirLista(t, M.CFG.listaEncerradas, 'top').then(function (l) {
            return M.rest(t, 'PUT', '/cards/' + D.card.id, { idList: l.id, pos: 'top' });
          }).then(function () { return 'Meta encerrada e cartão movido para ' + M.CFG.listaEncerradas + '.'; });
        });
      }).then(function (texto) { ocupado = false; msg = { texto: texto }; return carregar(); })
        .catch(function (e) { ocupado = false; msg = { erro: true, texto: e.message || 'Não foi possível encerrar.' }; carregar(); });
    };
  }

  t.render(function () { carregar(); });
})();
