/* Painel de metas: uma tela só, com navegação interna (equipe, detalhe da meta, formulário) */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var agora = M.parse(M.hoje());
  var S = { view: 'home', cardId: null, form: null, origem: null, escala: 'mes', y: agora.getFullYear(), m: agora.getMonth(), pessoa: '', sit: '', scroll: 0, auth: false, repetir: null };
  var CTX = null, ITENS = [], atualizando = false, aviso = '';
  function atualizar(manual) {
    if (atualizando || S.view === 'form') return Promise.resolve();
    var campo = document.getElementById('valor');
    if ((campo && campo.value) || document.getElementById('obs') || document.getElementById('avObs')) { if (manual) { aviso = 'Conclua ou limpe o registro antes de atualizar.';var a=document.getElementById('avisoPainel');if(a)a.textContent=aviso; } return Promise.resolve(); }
    atualizando = true;
    return Promise.all([M.contexto(t),M.carregarMetas(t)]).then(function(r){CTX=r[0];ITENS=r[1].map(recalcular);aviso='';render();}).catch(function(e){aviso=M.erroUsuario(e);var a=document.getElementById('avisoPainel');if(a)a.textContent=aviso;}).then(function(){atualizando=false;});
  }

  function icone(tracos) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tracos + '</svg>'; }
  var ICO = { esq: icone('<path d="M15 6l-6 6 6 6"/>'), dir: icone('<path d="M9 6l6 6-6 6"/>'), mais: icone('<path d="M12 5v14M5 12h14"/>') };
  var CHIPS = [['ok',M.SIT.ok.label],['ahead','Adiantado'],['risk',M.SIT.risk.label],['abaixo',M.SIT.abaixo.label],['late',M.SIT.late.label],['hit',M.SIT.hit.label],['future',M.SIT.future.label],['wait',M.SIT.wait.label],['parcial',M.SIT.parcial.label],['andamento','Sem etapas']];
  function grupo(it) { var v=it.r.sit; if(v==='ok' && it.r.rotulo==='Adiantado') return 'ahead'; return {noalvo:'hit',atingida:'hit',superada:'hit',nao:'late'}[v] || v; }

  function carregar() {
    app.innerHTML = '<div class="carregando">Carregando metas…</div>';
    return Promise.all([M.contexto(t), M.carregarMetas(t)]).then(function (res) {
      CTX = res[0];
      ITENS = res[1].map(recalcular);
      if (!CTX.admin && ITENS.some(function (it) { return it.meta.dono && it.meta.dono.id === CTX.eu.id; })) S.pessoa = CTX.eu.id;
      M.autorizado(t).then(function (ok) { S.auth = ok; });
      return abrirPorArgumento();
    }).then(render).catch(function (e) {
      app.innerHTML = '<div class="painel-corpo"><p class="erro">Não foi possível carregar as metas. ' + esc(M.erroUsuario(e)) + '</p><div><button class="btn" id="tentar">Tentar de novo</button></div></div>';
      document.getElementById('tentar').onclick = function () { carregar(); };
    });
  }
  function recalcular(it) { it.r = M.avaliar(it.meta, it.card.badges); if(it.card.etapasErro){it.r.sit='andamento';it.r.info=M.SIT.andamento;it.r.rotulo='Etapas indisponíveis';} return it; }
  function achar(id) { return ITENS.filter(function (it) { return it.card.id === id; })[0]; }

  // Os botões Editar meta e Transformar em meta do cartão abrem o painel já no formulário
  function abrirPorArgumento() {
    if (t.arg('view') !== 'form') return Promise.resolve();
    var id = t.arg('cardId');
    S.origem = 'cartao';
    return t.cards('id', 'name').then(function (cs) {
      var c = cs.filter(function (x) { return x.id === id; })[0], it = achar(id);
      S.view = 'form';
      S.form = { modo: it ? 'editar' : 'converter', cardId: id, nome: c ? c.name : (it ? it.card.name : ''), original: it ? it.meta : null };
    });
  }

  // ---------- período ----------
  function limitesDe(y, m) {
    if (S.escala === 'tri') { var q = Math.floor(m / 3) * 3; return { a: M.inicioMes(y, q), b: M.fimMes(y, q + 2) }; }
    return { a: M.inicioMes(y, m), b: M.fimMes(y, m) };
  }
  function periodo() { return limitesDe(S.y, S.m); }
  function nomeDe(y, m) {
    if (S.escala === 'tri') return (Math.floor(m / 3) + 1) + 'º trimestre de ' + y;
    return M.MESES[m].charAt(0).toUpperCase() + M.MESES[m].slice(1) + ' de ' + y;
  }
  function nomePeriodo() { return nomeDe(S.y, S.m); }
  function anterior() { var p = S.escala === 'tri' ? 3 : 1, m = S.m - p, y = S.y; while (m < 0) { m += 12; y--; } return { y: y, m: m }; }
  function ehAtual() { var p = periodo(), h = M.hoje(); return h >= p.a && h <= p.b; }
  function doPeriodo() { var p = periodo(); return ITENS.filter(function (it) { return M.noPeriodo(it.meta, p.a, p.b); }); }
  function esperadoPeriodo() {
    var p = periodo(), h = M.hoje();
    if (h < p.a) return 0;
    if (h > p.b) return 100;
    var tot = M.contarDias(p.a, p.b, 'uteis');
    return tot ? Math.round(M.contarDias(p.a, h, 'uteis') / tot * 100) : 100;
  }
  function andar(sentido) {
    S.m += sentido * (S.escala === 'tri' ? 3 : 1);
    while (S.m < 0) { S.m += 12; S.y--; }
    while (S.m > 11) { S.m -= 12; S.y++; }
  }

  // ---------- textos ----------
  function tituloCurto(it) {
    var nome = it.meta.dono && it.meta.dono.fullName, t2 = it.card.name;
    return nome && t2.slice(-(nome.length + 3)) === ' · ' + nome ? t2.slice(0, -(nome.length + 3)) : t2;
  }
  function valorTexto(it) {
    var m = it.meta, r = it.r;
    if (m.tipo === 'q' && m.fmt === 'p') return M.fmtValor(m, r.atual) + ', objetivo ' + M.fmtValor(m, m.alvo);
    if (m.tipo === 'q') {
      if (m.dir === 'down') return M.fmtValor(m,r.atual) + ', objetivo ' + M.fmtValor(m,m.alvo);
      if (m.fmt === 'n') return M.numBR(r.atual, M.casasDe(m)) + ' de ' + M.fmtValor(m, m.alvo);
      return M.fmtValor(m, r.atual) + ' de ' + M.fmtValor(m, m.alvo);
    }
    if (m.tipo === 'e') return r.etapas ? r.feitas + ' de ' + r.etapas + ' etapas' : 'Sem etapas na checklist';
    return m.aval ? 'Avaliada' : 'Avaliação em ' + M.dataBR(m.fim);
  }
  function atencao(it) {
    var m = it.meta, r = it.r, motivos = [], peso = 0;
    if (r.sit === 'late' || r.sit === 'nao') { motivos.push(m.tipo === 'a' ? 'Avaliada como não atingida' : (m.encerrada ? 'Encerrado sem atingir' : 'Prazo encerrado sem atingir')); peso = 4; }
    else if (r.sit === 'risk' || r.sit === 'abaixo' || r.sit === 'parcial') { var d = M.textoDiff(m, r); motivos.push(d ? d.charAt(0).toUpperCase() + d.slice(1) : (r.sit === 'parcial' ? 'Resultado parcial' : 'Atrasado')); peso = 3; }
    if (m.tipo === 'a' && r.sit === 'wait' && r.depois) { motivos.push('Avaliação pendente desde ' + M.dataBR(m.fim)); peso = Math.max(peso, 2); }
    if (r.parada) { motivos.push('Sem atualização há ' + r.diasSemAtualizar + ' dias'); peso = Math.max(peso, 1); }
    if (!motivos.length) return null;
    return { it: it, texto: motivos.join('. '), peso: peso };
  }

  // ---------- topo ----------
  function topo() {
    if (S.view === 'home') {
      return '<div class="painel-topo"><div class="painel-topo-in"><div class="linha gap8 periodo-controles">' +
        '<button class="btn btn-icone" id="ant" aria-label="' + (S.escala === 'tri' ? 'Trimestre anterior' : 'Mês anterior') + '">' + ICO.esq + '</button>' +
        '<span class="periodo-nome">' + esc(nomePeriodo()) + '</span>' +
        '<button class="btn btn-icone" id="prox" aria-label="' + (S.escala === 'tri' ? 'Próximo trimestre' : 'Próximo mês') + '">' + ICO.dir + '</button>' +
        (ehAtual() ? '' : '<button class="btn" id="agoraBtn">Hoje</button>') +
        '<div class="seg seg-peq" role="group" aria-label="Ver por">' +
        '<button type="button" data-escala="mes" aria-pressed="' + (S.escala === 'mes') + '">Mês</button><button type="button" data-escala="tri" aria-pressed="' + (S.escala === 'tri') + '">Trimestre</button></div></div>' +
        '<button class="btn" id="atualizar">Atualizar</button>' + (CTX.admin ? '<button class="btn btn-primario linha gap4" id="nova">' + ICO.mais + 'Nova meta</button>' : '') + '</div></div>';
    }
    var titulo, direita = '';
    if (S.view === 'detalhe') {
      var it = achar(S.cardId);
      titulo = it ? tituloCurto(it) : 'Meta';
      direita = '<div class="linha gap8">' + (CTX.admin ? '<button class="btn" id="editarMeta">Editar meta</button>' : '') + '<button class="btn" id="abrirCartao">Abrir cartão</button></div>';
    } else titulo = S.form.modo === 'criar' ? 'Nova meta' : (S.form.modo === 'editar' ? 'Editar meta' : 'Transformar em meta');
    var voltar = S.view === 'form' && S.origem === 'cartao' ? 'Fechar' : (S.view === 'form' && S.form.de === 'detalhe' ? 'Voltar à meta' : 'Voltar para a equipe');
    return '<div class="painel-topo"><div class="painel-topo-in estreito"><div class="linha gap12" style="min-width:0"><button class="btn linha gap4" id="voltar">' + ICO.esq + esc(voltar) + '</button>' +
      '<h2 class="painel-titulo">' + esc(titulo) + '</h2></div>' + direita + '</div></div>';
  }

  // ---------- tela da equipe ----------
  function resumoReais(itens) {
    var p = periodo();
    var reais = itens.filter(function (it) { return it.meta.ini === p.a && it.meta.fim === p.b && it.meta.tipo === 'q' && it.meta.fmt === 'r' && it.meta.dir !== 'down'; });
    if (!reais.length) return '';
    var soma = 0, alvo = 0, esperado = 0;
    reais.forEach(function(it){ soma += it.r.atual-it.meta.vIni; alvo += it.meta.alvo-it.meta.vIni; esperado += it.r.valorEsperado-it.meta.vIni; });
    var h=M.hoje(), atingiu=soma>=alvo;
    var sit=h<p.a ? 'future' : (atingiu ? 'hit' : (h>p.b ? 'late' : (M.arred({fmt:'r'},soma-esperado)<0 ? 'risk':'ok')));
    var rr={temBarra:true,pct:alvo ? M.percentualExibido(soma/alvo*100,atingiu) : 0,fill:alvo ? Math.max(0,Math.min(100,soma/alvo*100)):0,info:M.SIT[sit],rotulo:M.SIT[sit].label};
    if(sit==='ok' && M.arred({fmt:'r'},soma-esperado)>0)rr.rotulo='Adiantado';
    var dinheiro={fmt:'r'};
    return '<section class="bloco resumo-financeiro"><h3 class="subtitulo">Progresso financeiro da equipe</h3>' +
      '<div class="financeiro-valores"><p>Realizado: <span class="forte num">' + esc(M.fmtValor(dinheiro,soma)) + '</span></p><p>Objetivo: <span class="forte num">' + esc(M.fmtValor(dinheiro,alvo)) + '</span></p></div>' +
      '<div class="det-barra">' + M.barra(rr,{grossa:true,label:'Progresso financeiro da equipe'}) + '<span class="det-status selo sit-' + rr.info.cls + '">' + esc(M.textoBadge({tipo:'q',fmt:'r'},rr)) + '</span></div>' +
      (reais.some(function(it){return it.meta.vIni!==0;}) ? '<p class="ajuda">Os valores mostram o avanço a partir dos valores iniciais.</p>':'') + '</section>';
  }

  function blocoAtencao(itens) {
    var lista = itens.map(atencao).filter(Boolean).sort(function (a, b) {
      return (b.it.meta.imp || 1) - (a.it.meta.imp || 1) || b.peso - a.peso || a.it.r.pct - b.it.r.pct;
    });
    var cab = '<h3 class="subtitulo">Precisa de atenção</h3>';
    if (!lista.length) return '<section class="bloco">' + cab + '<p class="det-frase sub">Nenhuma meta precisa de atenção neste período.</p></section>';
    var linhas = lista.map(function (a) {
      var it = a.it;
      return '<button type="button" class="linha-tab atencao" data-card="' + esc(it.card.id) + '"><span class="cel-titulo">' + imp(it) + '<span class="trunca" title="' + esc(tituloCurto(it)) + '">' + esc(tituloCurto(it)) + '</span></span>' +
        '<span class="sub trunca">' + esc(it.meta.dono ? it.meta.dono.fullName : 'Sem responsável') + '</span><span class="cel-motivo">' + esc(a.texto) + '</span></button>';
    }).join('');
    return '<section class="bloco">' + cab + '<div class="tab">' + linhas + '</div></section>';
  }
  function filtros(itens) {
    var n = {}; CHIPS.forEach(function(c){n[c[0]]=0;});
    itens.forEach(function (it) { n[grupo(it)] = (n[grupo(it)] || 0) + 1; });
    var chips = '<button type="button" class="chip" data-sit="" aria-pressed="' + (!S.sit) + '">Todas <span class="num">' + itens.length + '</span></button>' +
      CHIPS.filter(function (c) { return n[c[0]] || S.sit === c[0]; }).map(function (c) {
        return '<button type="button" class="chip" data-sit="' + c[0] + '" aria-pressed="' + (S.sit === c[0]) + '">' + c[1] + ' <span class="num">' + n[c[0]] + '</span></button>';
      }).join('');
    var donos = {};
    itens.forEach(function (it) { var d = it.meta.dono || { id: '?', fullName: 'Sem responsável' }; donos[d.id] = d; });
    var lista = Object.keys(donos).map(function (k) { return donos[k]; }).sort(function (a, b) { return a.fullName.localeCompare(b.fullName, 'pt-BR'); });
    return '<div class="filtros"><div class="chips" role="group" aria-label="Filtrar por situação">' + chips + '</div>' +
      '<label class="filtro-pessoa">Pessoa<select id="fPessoa"><option value="">Todas</option>' + lista.map(function (d) { return '<option value="' + esc(d.id) + '"' + (S.pessoa === d.id ? ' selected' : '') + '>' + esc(d.fullName) + '</option>'; }).join('') + '</select></label></div>';
  }
  // O ícone de importância ocupa sempre o mesmo espaço, para os títulos alinharem
  function imp(it) { return M.iconeImp(it.meta.imp) || '<span class="imp imp-vazio" aria-hidden="true"></span>'; }
  function linhaMeta(it) {
    var r = it.r;
    return '<button type="button" class="linha-tab meta" data-card="' + esc(it.card.id) + '">' +
      '<span class="cel-titulo">' + imp(it) + '<span class="trunca" title="' + esc(tituloCurto(it)) + '">' + esc(tituloCurto(it)) + '</span></span>' +
      '<span>' + (r.temBarra ? M.barra(r, { label: tituloCurto(it) }) : '') + '</span>' +
      '<span class="sub num trunca">' + esc(valorTexto(it)) + '</span>' +
      '<span class="cel-selo"><span class="selo sit-' + r.info.cls + '">' + esc(M.textoBadge(it.meta,r)) + '</span>' + '</span></button>';
  }
  function blocoPessoas(itens) {
    var filtrados = itens.filter(function (it) {
      return (!S.pessoa || (it.meta.dono && it.meta.dono.id === S.pessoa)) && (!S.sit || grupo(it) === S.sit);
    });
    var pessoas = {}, ordem = [];
    filtrados.forEach(function (it) {
      var d = it.meta.dono || { id: '?', fullName: 'Sem responsável' };
      if (!pessoas[d.id]) { pessoas[d.id] = { dono: d, itens: [] }; ordem.push(d.id); }
      pessoas[d.id].itens.push(it);
    });
    var html = ordem.map(function (k) { return pessoas[k]; }).sort(function (a, b) { return a.dono.fullName.localeCompare(b.dono.fullName, 'pt-BR'); }).map(function (p) {
      p.itens.sort(function (a, b) { return (b.meta.imp || 1) - (a.meta.imp || 1) || tituloCurto(a).localeCompare(tituloCurto(b), 'pt-BR'); });
      return '<div class="pessoa"><div class="pessoa-cabeca">' + M.avatar(p.dono, 28) + '<span class="forte">' + esc(p.dono.fullName) + '</span><span class="sub peq">' + p.itens.length + (p.itens.length === 1 ? ' meta' : ' metas') + '</span></div>' +
        p.itens.map(linhaMeta).join('') + '</div>';
    }).join('');
    return '<section class="bloco"><h3 class="subtitulo">Metas por pessoa</h3>' + filtros(itens) +
      '<div class="tab">' + (html || '<p class="vazio">Nenhuma meta com esse filtro.</p>') + '</div></section>';
  }

  // Metas do período anterior que podem ser repetidas (mesmo tipo de período)
  function repetiveis() {
    var a = anterior(), p = limitesDe(a.y, a.m);
    return ITENS.filter(function (it) { return it.meta.ini === p.a && it.meta.fim === p.b; });
  }
  function telaVazia() {
    var html = '<div class="vazio"><p class="forte">Nenhuma meta em ' + esc(nomePeriodo().toLowerCase()) + '.</p>';
    var rep = CTX.admin ? repetiveis() : [];
    var a = anterior(), nomeAnt = nomeDe(a.y, a.m).toLowerCase();
    if (S.repetir && S.repetir.andando) html += '<p>Criando ' + S.repetir.feitas + ' de ' + S.repetir.total + ' metas…</p>';
    else if (S.repetir && S.repetir.confirmar) {
      html += '<p>Criar ' + rep.length + (rep.length === 1 ? ' meta' : ' metas') + ' em ' + esc(nomePeriodo().toLowerCase()) + ' com os mesmos responsáveis, títulos e objetivos de ' + esc(nomeAnt) + '? O histórico será reiniciado; valores iniciais serão preservados. Taxas começam no último valor.</p>' +
        '<div class="linha gap8" style="justify-content:center"><button class="btn btn-primario" id="repetirSim">Criar ' + rep.length + (rep.length === 1 ? ' meta' : ' metas') + '</button><button class="btn btn-texto" id="repetirNao">Cancelar</button></div>';
    } else if (rep.length) html += '<div class="linha gap8" style="justify-content:center"><button class="btn btn-primario" id="repetir">Repetir metas de ' + esc(nomeAnt) + '</button>' + '<span class="sub">ou crie pelo botão Nova meta.</span></div>';
    else html += '<p>' + (CTX.admin ? 'Crie a primeira pelo botão Nova meta.' : 'Quando um admin criar uma meta, ela aparece aqui.') + '</p>';
    if (S.repetir && S.repetir.erro) html += '<p class="erro">' + esc(S.repetir.erro) + '</p>';
    return html + '</div>';
  }
  function telaEquipe() {
    var itens = doPeriodo();
    if (!itens.length) return telaVazia();
    var repetirBloco = CTX.admin && repetiveis().length ? '<section class="bloco"><button class="btn" id="repetirExistentes">Repetir metas anteriores</button><p class="ajuda">Metas já repetidas por esta versão não serão duplicadas.</p>' + (S.repetir && S.repetir.erro ? '<p class="erro">'+esc(S.repetir.erro)+'</p>' : '') + '</section>' : '';
    return resumoReais(itens) + blocoAtencao(itens) + blocoPessoas(itens) + repetirBloco;
  }

  function repetir() {
    var lista = repetiveis(), p = periodo();
    S.repetir = { andando: true, feitas: 0, total: lista.length };
    render();
    var start = M.parse(p.a); start.setHours(12, 0, 0, 0);
    var due = M.parse(p.b); due.setHours(18, 0, 0, 0);
    return M.garantirLista(t, M.CFG.listaMetas, 'top').then(function (listaMetas) {
      return lista.reduce(function (pr, it) {
        return pr.then(function () {
          var v = it.meta, nova = JSON.parse(JSON.stringify(v)), novoCard;
          nova.ini = p.a; nova.fim = p.b; nova.hist = []; delete nova.diaria; nova.aval = null; nova.encerrada = false; delete nova.encerradaEm; nova.criadaEm = M.hoje();
          delete nova.rev; delete nova.checklistId; delete nova.histBase; delete nova.histCortado;
          if (v.tipo === 'q' && v.fmt === 'p') nova.vIni = M.valorAtual(v); // taxa começa de onde parou
          var marcador='metas-repetir:'+it.card.id+':'+p.a+':'+p.b;
          return t.board('id').then(function(b){return M.rest(t,'GET','/boards/'+b.id+'/cards',{fields:'id,name,desc'});}).then(function(cs){var anterior=cs.filter(function(c){return c.desc===marcador;})[0];if(anterior)return anterior;return M.rest(t, 'POST', '/cards', {desc:marcador, idList: listaMetas.id, name: tituloCurto(it) + ' · ' + v.dono.fullName, idMembers: v.dono.id, start: M.dataCartao(p.a,false), due: M.dataCartao(p.b,true), pos: 'bottom' });})
            .then(function(c){novoCard=c;return t.get(c.id,'shared',M.CHAVE).then(function(existe){if(existe){nova=existe;return;}return M.salvarMetaNova(t,c.id,nova);});})
            .then(function () {
              if (v.tipo !== 'e') return null;
              return M.rest(t, 'GET', '/cards/' + it.card.id + '/checklists', { fields: 'name', checkItem_fields: 'name' }).then(function (cls) {
                var nomes = []; cls = (cls || []).filter(function(cl){return v.checklistId ? cl.id === v.checklistId : cl.name === 'Etapas';}); cls.forEach(function (cl) { (cl.checkItems || []).forEach(function (ci) { nomes.push(ci.name); }); });
                if (!nomes.length) return null;
                return M.rest(t,'GET','/cards/'+novoCard.id+'/checklists',{checkItem_fields:'name'}).then(function(existentes){var cl=existentes.filter(function(c){return c.name==='Etapas';})[0];return cl || M.rest(t, 'POST', '/checklists', { idCard: novoCard.id, name: 'Etapas' });}).then(function (cl) {
                  nova.checklistId = cl.id; return nomes.slice((cl.checkItems || []).length).reduce(function (q, nome) { return q.then(function () { return M.rest(t, 'POST', '/checklists/' + cl.id + '/checkItems', { name: nome }); }); }, Promise.resolve()).then(function(){return M.salvarMeta(t,novoCard.id,nova);});
                });
              });
            })
            .then(function () { S.repetir.feitas++; render(); });
        });
      }, Promise.resolve());
    }).then(function () { S.repetir = null; return carregar(); })
      .catch(function (e) { S.repetir = { erro: 'Parou em ' + S.repetir.feitas + ' de ' + S.repetir.total + ' metas. ' + M.erroUsuario(e) }; return carregar(); });
  }

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
    app.innerHTML = topo() + '<p id="avisoPainel" role="status" class="aviso-painel">' + esc(aviso) + '</p>' + '<div class="painel-corpo' + (S.view === 'home' ? '' : ' estreito') + '" id="corpo"></div>';
    var corpo = document.getElementById('corpo');
    if (S.view === 'home') corpo.innerHTML = telaEquipe();
    else if (S.view === 'detalhe') {
      var it = achar(S.cardId);
      M.detalhe(corpo, {
        t: t, escopo: S.cardId, meta: it.meta, card: it.card, ctx: CTX,
        aoSalvar: function (meta) { it.meta = meta; recalcular(it); },
        abrirCartao: function () { t.showCard(S.cardId); }
      });
    } else {
      M.formulario(corpo, {
        t: t, ctx: CTX, modo: S.form.modo, cardId: S.form.cardId, original: S.form.original, nomeCartao: S.form.nome,
        aoCancelar: voltar,
        aoSalvo: function (res) {
          if (S.origem === 'cartao' && !res.aviso) { t.closeModal(); return; }
          aviso = res.aviso || '';
          var it2 = achar(res.cardId);
          if (it2) { it2.meta = res.meta; if(res.meta.dono) {var antNome=it2.card.name.split(' · ')[0];it2.card.name=antNome+' · '+res.meta.dono.fullName;} recalcular(it2); }
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
    var manter = function (fn) { return function () { var y = window.pageYOffset; fn.apply(this, arguments); render(); window.scrollTo(0, y); }; };
    if ($('atualizar')) $('atualizar').onclick = function(){atualizar(true);};
    if ($('ant')) $('ant').onclick = function () { andar(-1); S.repetir = null; render(); };
    if ($('prox')) $('prox').onclick = function () { andar(1); S.repetir = null; render(); };
    if ($('agoraBtn')) $('agoraBtn').onclick = function () { S.y = agora.getFullYear(); S.m = agora.getMonth(); S.repetir = null; render(); };
    app.querySelectorAll('[data-escala]').forEach(function (b) { b.onclick = function () { S.escala = b.getAttribute('data-escala'); S.repetir = null; render(); }; });
    if ($('nova')) $('nova').onclick = function () { abrirFormulario('criar', null, 'home'); };
    if ($('voltar')) $('voltar').onclick = voltar;
    if ($('abrirCartao')) $('abrirCartao').onclick = function () { t.showCard(S.cardId); };
    if ($('editarMeta')) $('editarMeta').onclick = function () { abrirFormulario('editar', S.cardId, 'detalhe'); };
    app.querySelectorAll('[data-card]').forEach(function (b) { b.onclick = function () { irPara('detalhe', { cardId: b.getAttribute('data-card') }); }; });
    app.querySelectorAll('[data-sit]').forEach(function (b) { b.onclick = manter(function () { S.sit = b.getAttribute('data-sit'); }); });
    var fp = $('fPessoa');
    if (fp) fp.onchange = manter(function () { S.pessoa = fp.value; });
    if ($('repetirExistentes')) $('repetirExistentes').onclick = function(){if(S.repetir && S.repetir.andando)return;M.autorizar(t).then(function(){S.auth=true;return repetir();}).catch(function(e){aviso=M.erroUsuario(e);render();});};
    if ($('repetir')) $('repetir').onclick = function () { S.repetir = { confirmar: true }; render(); };
    if ($('repetirNao')) $('repetirNao').onclick = function () { S.repetir = null; render(); };
    if ($('repetirSim')) $('repetirSim').onclick = function () {
      // A autorização abre uma janela do Trello: precisa partir deste clique
      if (S.auth) { repetir(); return; }
      M.autorizar(t).then(function () { S.auth = true; repetir(); }, function () { S.repetir = { erro: 'A autorização do Trello não foi concluída. Clique de novo e confirme na janela que abrir.' }; render(); });
    };
  }

  M.aplicarTema(t);
  t.render(function () { M.aplicarTema(t); if (!CTX) return carregar(); return atualizar(false); });
  setInterval(function(){ if (!document.hidden) atualizar(false); },30000);
})();
