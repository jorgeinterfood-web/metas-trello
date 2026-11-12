/* Painel de metas: uma tela só, com navegação interna (equipe, detalhe da meta, formulário) */
(function () {
  var M = window.Metas, esc = M.esc;
  var t = TrelloPowerUp.iframe({ appKey: M.chaveConfigurada() ? M.CFG.appKey : undefined, appName: M.CFG.appName });
  var app = document.getElementById('app');
  var agora = M.parse(M.hoje());
  var S = { view: 'home', cardId: null, form: null, origem: null, escala: 'mes', y: agora.getFullYear(), m: agora.getMonth(), pessoa: '', sit: '', scroll: 0, auth: false, repetir: null, tempo: {ativa:false,data:null,reproduzindo:false,vel:1} };
  var CTX = null, ITENS = [], atualizando = false, aviso = '';
  function atualizar(manual) {
    if (atualizando || S.view === 'form' || (!manual && emConsulta())) return Promise.resolve();
    var campo = document.getElementById('valor');
    if ((campo && campo.value) || document.getElementById('obs') || document.getElementById('avObs')) { if (manual) { aviso = 'Conclua ou limpe o registro antes de atualizar.';var a=document.getElementById('avisoPainel');if(a)a.textContent=aviso; } return Promise.resolve(); }
    atualizando = true;
    return Promise.all([M.contexto(t),M.carregarMetas(t,{somenteLeitura:emConsulta()})]).then(function(r){CTX=r[0];ITENS=r[1].map(recalcular);aviso='';render();}).catch(function(e){aviso=M.erroUsuario(e);var a=document.getElementById('avisoPainel');if(a)a.textContent=aviso;}).then(function(){atualizando=false;});
  }

  function icone(tracos) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tracos + '</svg>'; }
  var ICO = { esq: icone('<path d="M15 6l-6 6 6 6"/>'), dir: icone('<path d="M9 6l6 6-6 6"/>'), mais: icone('<path d="M12 5v14M5 12h14"/>'), play: icone('<path d="M8 5l11 7-11 7z"/>'), pausa: icone('<path d="M8 5v14M16 5v14"/>') };
  var CHIPS = [['ok','No ritmo'],['ahead','Adiantados'],['risk','Atrasados'],['hit','Completos'],['superada','Superados'],['abaixo','Pendentes'],['late','Não atingidos'],['future','A iniciar'],['wait','A avaliar'],['parcial','Parciais'],['andamento','Sem etapas'],['semhist','Sem histórico'],['indisponivel','Indisponíveis'],['semdias','Sem dias úteis']];
  function grupo(it) {
    if(it.tempo && it.tempo.indisponivel)return 'semhist';
    if(it.card.etapasErro)return 'indisponivel';
    if(it.r.rotulo==='Sem dias úteis')return 'semdias';
    var v=it.r.sit;
    if(v==='ok' && it.r.rotulo==='Adiantado')return 'ahead';
    return {noalvo:'hit',atingida:'hit',nao:'late'}[v] || v;
  }

  function carregar() {
    app.innerHTML = '<div class="carregando">Carregando metas…</div>';
    return Promise.all([M.contexto(t), M.carregarMetas(t)]).then(function (res) {
      CTX = res[0];
      ITENS = res[1].map(recalcular);
      if (!CTX.admin && ITENS.some(function (it) { return it.meta.dono && it.meta.dono.id === CTX.eu.id; })) S.pessoa = CTX.eu.id;
      M.autorizado(t).then(function (ok) { S.auth = ok; if (ok && CTX.admin) limparMarcadoresAntigos(); });
      return abrirPorArgumento();
    }).then(render).catch(function (e) {
      app.innerHTML = '<div class="painel-corpo"><p class="erro">Não foi possível carregar as metas. ' + esc(M.erroUsuario(e)) + '</p><div><button class="btn" id="tentar">Tentar de novo</button></div></div>';
      document.getElementById('tentar').onclick = function () { carregar(); };
    });
  }
  // Cartões de meta criados até a versão 17 ficaram com o marcador na descrição.
  // Com a meta já gravada, o marcador não tem mais função: sai em segundo plano.
  function limparMarcadoresAntigos() {
    // Metas repetidas guardam a origem antes, para o Repetir continuar sem duplicar.
    ITENS.filter(function (it) { return M.ehMarcador(it.card.desc); }).reduce(function (pr, it) {
      return pr.then(function () {
        var m = /^metas-repetir:([^:]+):/.exec(it.card.desc);
        var antes = Promise.resolve();
        if (m && !it.meta.origem) {
          var nova = JSON.parse(JSON.stringify(it.meta)); nova.origem = m[1];
          antes = M.salvarMeta(t, it.card.id, nova).then(function () { it.meta = nova; recalcular(it); });
        }
        return antes.then(function () { return M.limparMarcador(t, it.card.id).then(function () { it.card.desc = ''; }); });
      }).catch(function () { /* Fica para a próxima abertura do painel. */ });
    }, Promise.resolve());
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

  // ---------- navegação no tempo ----------
  var relogio = null;
  function emConsulta() { return !!S.tempo.ativa; }
  function referencia() { return emConsulta() ? S.tempo.data : M.hoje(); }
  function faixaTempo() { return M.Tempo.faixa(periodo()); }
  function pararTempo() { if(relogio!==null)clearTimeout(relogio); relogio=null; S.tempo.reproduzindo=false; }
  function reiniciarTempo() { pararTempo(); S.tempo.ativa=false; S.tempo.data=null; }
  function selecionarData(d) {
    var f=faixaTempo();
    if(f.b<f.a)return;
    S.tempo.data=d<f.a?f.a:(d>f.b?f.b:d);
  }
  function itensNaData() {
    if(!emConsulta())return doPeriodo();
    var p=periodo();
    return ITENS.map(function(it){return M.Tempo.reconstruir(it,referencia());}).filter(function(it){return it && M.noPeriodo(it.meta,p.a,p.b);});
  }
  function eventosNaData(itens) {
    return itens.filter(function(it){return (!S.pessoa || (it.meta.dono && it.meta.dono.id===S.pessoa)) && (!S.sit || grupo(it)===S.sit);}).map(function(it){
      var original=achar(it.card.id);
      return {it:it,eventos:M.Tempo.registros(original,referencia())};
    }).filter(function(x){return x.eventos.length;});
  }
  function controlesTempo() {
    var f=faixaTempo(), futuro=f.b<f.a;
    if(!emConsulta())return '<section class="tempo-entrada"><div><h3 class="subtitulo">Navegar no tempo</h3><p class="sub">'+(futuro?'O período ainda não começou':'Veja as metas e os registros de cada dia')+'</p></div><button class="btn" id="abrirTempo"'+(futuro?' disabled title="O período ainda não começou"':'')+'>Explorar período</button></section>';
    selecionarData(S.tempo.data || f.b);
    var total=M.diasEntre(f.a,f.b), atual=M.diasEntre(f.a,S.tempo.data), marcas=[];
    var contagens={};
    ITENS.forEach(function(it){var dias={};(it.meta.hist || []).forEach(function(e){dias[e[0]]=true;});var lt=it.meta.lt || {}; (lt.mudancas || []).forEach(function(e){dias[e[0]]=true;});(lt.etapas || []).forEach(function(e,i,es){if(!i || e[1]!==es[i-1][1] || e[2]!==es[i-1][2])dias[e[0]]=true;});Object.keys(dias).forEach(function(d){contagens[d]=(contagens[d] || 0)+1;});});
    var maior=Math.max.apply(null,[1].concat(Object.keys(contagens).map(function(k){return contagens[k];})));
    for(var i=0;i<=total;i++){var d=M.addDias(f.a,i), n=contagens[d] || 0;marcas.push('<span style="height:'+ (n?Math.round(8+n/maior*24):2)+'px" title="'+M.dataBR(d)+': '+n+' metas com registros"></span>');}
    return '<section class="tempo-controles" aria-label="Navegação no tempo"><div class="tempo-cabeca"><h3 class="subtitulo">Navegar no tempo</h3><button class="btn btn-texto" id="fecharTempo">Visão atual</button></div>'+
      '<div class="tempo-comandos"><button class="btn" id="tempoPlay" aria-pressed="'+S.tempo.reproduzindo+'"'+(total===0?' disabled':'')+'>'+(S.tempo.reproduzindo?ICO.pausa:ICO.play)+'<span>'+(S.tempo.reproduzindo?'Pausar':'Reproduzir')+'</span></button>'+
      '<button class="btn btn-icone" id="tempoAnt" aria-label="Dia anterior"'+(atual===0?' disabled':'')+'>'+ICO.esq+'</button><label class="tempo-data"><span class="sr-only">Data da consulta</span><input type="date" id="tempoData" min="'+f.a+'" max="'+f.b+'" value="'+S.tempo.data+'"></label><button class="btn btn-icone" id="tempoProx" aria-label="Próximo dia"'+(atual===total?' disabled':'')+'>'+ICO.dir+'</button>'+
      '<label class="tempo-velocidade"><span>Velocidade</span><select id="tempoVel">'+[1,2,4].map(function(v){return '<option value="'+v+'"'+(S.tempo.vel===v?' selected':'')+'>'+v+'×</option>';}).join('')+'</select></label></div>'+
      '<div class="tempo-trilha"><div class="tempo-marcas" aria-hidden="true">'+marcas.join('')+'</div><label class="sr-only" for="tempoSlider">Dia do período</label><input type="range" id="tempoSlider" min="0" max="'+total+'" step="1" value="'+atual+'" aria-describedby="tempoReferencia" aria-valuetext="'+M.dataBRCompleta(S.tempo.data)+'"'+(total===0?' disabled':'')+'><div class="tempo-limites sub num"><span>'+M.dataBR(f.a)+'</span><span>Metas com registros por dia</span><span>'+M.dataBR(f.b)+'</span></div></div>'+
      '<p class="tempo-referencia" id="tempoReferencia" role="status">'+textoReferencia()+'</p></section>';
  }
  function textoReferencia() { return (referencia()===M.hoje()?'Até agora em ':'Fim do dia ')+M.dataBRCompleta(referencia())+' · somente leitura'; }
  function avisosTempo(itens) {
    var antiga=itens.filter(function(it){return it.tempo.configAntiga;}).length;
    var sem=itens.filter(function(it){return it.tempo.indisponivel;}).length;
    var obs=itens.filter(function(it){return it.meta.tipo==='e' && it.tempo.ultimaEtapa && it.tempo.ultimaEtapa[0]!==referencia() && !it.tempo.indisponivel;}).length;
    var partes=[];
    if(antiga)partes.push(antiga+(antiga===1?' meta usa':' metas usam')+' a configuração mais antiga disponível');
    if(sem)partes.push(sem+(sem===1?' meta sem':' metas sem')+' histórico nesta data');
    if(obs)partes.push(obs+(obs===1?' meta por etapas usa':' metas por etapas usam')+' a última observação disponível');
    return partes.length?'<ul class="tempo-notas det-feedback">'+partes.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';
  }
  function blocoRegistrosDia(itens) {
    var lista=eventosNaData(itens), numero=lista.reduce(function(n,x){return n+x.eventos.length;},0);
    return '<section class="bloco tempo-registros"><h3 class="subtitulo">Registros de '+M.dataBR(referencia())+' <span class="sub peq">'+numero+(numero===1?' registro':' registros')+'</span></h3>'+
      (lista.length?'<div class="tab">'+lista.map(function(x){return '<button type="button" class="tempo-evento" data-card="'+esc(x.it.card.id)+'"><span class="forte">'+esc(tituloCurto(x.it))+'</span><span class="sub">'+esc(x.it.meta.dono && x.it.meta.dono.fullName || 'Sem responsável')+'</span><span class="tempo-evento-valores">'+x.eventos.map(function(e){return '<span>'+M.Tempo.textoEvento(x.it.meta,e)+'</span>';}).join('')+'</span></button>';}).join('')+'</div>':'<p class="sub">Nenhum registro nesta data'+(S.pessoa || S.sit?' para os filtros selecionados':'')+'</p>')+'</section>';
  }
  function conteudoEquipe() {
    var itens=itensNaData();
    if(!emConsulta()) {
      if(!itens.length)return telaVazia();
      var repetirBloco=CTX.admin && repetiveis().length?'<section class="bloco"><button class="btn" id="repetirExistentes">Repetir metas anteriores</button><p class="ajuda">Metas já repetidas por esta versão não serão duplicadas.</p>'+(S.repetir && S.repetir.erro?'<p class="erro">'+esc(S.repetir.erro)+'</p>':'')+'</section>':'';
      return resumoReais(itens)+blocoAtencao(itens)+blocoPessoas(itens)+repetirBloco;
    }
    return avisosTempo(itens)+(itens.length?resumoReais(itens)+blocoAtencao(itens)+blocoPessoas(itens):'<p class="vazio">Nenhuma meta disponível em '+M.dataBRCompleta(referencia())+'</p>')+blocoRegistrosDia(itens);
  }
  function atualizarConsulta() {
    var destino=document.getElementById('resultadosTempo');
    if(!destino)return;
    var larguras={};
    destino.querySelectorAll('.linha-tab.meta[data-card]').forEach(function(row){var fill=row.querySelector('.barra-fill');if(fill)larguras[row.getAttribute('data-card')]=fill.style.width;});
    var financeiro=destino.querySelector('.resumo-financeiro .barra-fill');if(financeiro)larguras.financeiro=financeiro.style.width;
    destino.innerHTML=conteudoEquipe();
    var reduzir=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function animar(fill,antiga){if(!fill || antiga===undefined || reduzir || !window.requestAnimationFrame)return;var nova=fill.style.width;if(nova===antiga)return;fill.style.width=antiga;fill.getBoundingClientRect();window.requestAnimationFrame(function(){fill.style.width=nova;});}
    destino.querySelectorAll('.linha-tab.meta[data-card]').forEach(function(row){animar(row.querySelector('.barra-fill'),larguras[row.getAttribute('data-card')]);});
    animar(destino.querySelector('.resumo-financeiro .barra-fill'),larguras.financeiro);
    var f=faixaTempo(), offset=M.diasEntre(f.a,referencia()), slider=document.getElementById('tempoSlider'), data=document.getElementById('tempoData'), label=document.getElementById('tempoReferencia');
    if(slider){slider.value=offset;slider.setAttribute('aria-valuetext',M.dataBRCompleta(referencia()));}
    if(data)data.value=referencia();
    if(label)label.textContent=textoReferencia();
    var ant=document.getElementById('tempoAnt'),prox=document.getElementById('tempoProx'),play=document.getElementById('tempoPlay');
    if(ant)ant.disabled=referencia()<=f.a;if(prox)prox.disabled=referencia()>=f.b;
    if(play){play.innerHTML=(S.tempo.reproduzindo?ICO.pausa:ICO.play)+'<span>'+(S.tempo.reproduzindo?'Pausar':'Reproduzir')+'</span>';play.setAttribute('aria-pressed',String(S.tempo.reproduzindo));}
    ligar(); M.dimensionarTags(app);
  }
  function agendarPasso() {
    relogio=setTimeout(function(){
      relogio=null;
      if(!S.tempo.reproduzindo || S.view!=='home' || document.hidden){pararTempo();atualizarConsulta();return;}
      selecionarData(M.addDias(referencia(),1));
      if(referencia()>=faixaTempo().b)pararTempo();
      atualizarConsulta();
      if(S.tempo.reproduzindo)agendarPasso();
    },1000/S.tempo.vel);
  }
  function ligarTempo() {
    var $=function(id){return document.getElementById(id);};
    if($('abrirTempo'))$('abrirTempo').onclick=function(){pararTempo();S.tempo.ativa=true;selecionarData(faixaTempo().b);S.sit='';render();var slider=$('tempoSlider');if(slider)slider.focus();};
    if($('fecharTempo'))$('fecharTempo').onclick=function(){reiniciarTempo();S.sit='';render();atualizar(true).then(function(){var abrir=$('abrirTempo');if(abrir)abrir.focus();});};
    if($('tempoAnt'))$('tempoAnt').onclick=function(){pararTempo();selecionarData(M.addDias(referencia(),-1));atualizarConsulta();};
    if($('tempoProx'))$('tempoProx').onclick=function(){pararTempo();selecionarData(M.addDias(referencia(),1));atualizarConsulta();};
    if($('tempoSlider'))$('tempoSlider').oninput=function(){pararTempo();selecionarData(M.addDias(faixaTempo().a,+this.value));atualizarConsulta();};
    if($('tempoData'))$('tempoData').onchange=function(){pararTempo();if(/^\d{4}-\d{2}-\d{2}$/.test(this.value))selecionarData(this.value);atualizarConsulta();};
    if($('tempoVel'))$('tempoVel').onchange=function(){S.tempo.vel=+this.value;if(S.tempo.reproduzindo){clearTimeout(relogio);agendarPasso();}};
    if($('tempoPlay'))$('tempoPlay').onclick=function(){
      if(S.tempo.reproduzindo)pararTempo();
      else {if(referencia()>=faixaTempo().b)selecionarData(faixaTempo().a);S.tempo.reproduzindo=true;agendarPasso();}
      atualizarConsulta();
    };
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden){pararTempo();atualizarConsulta();}});
  window.addEventListener('pagehide',pararTempo);

  // ---------- textos ----------
  function tituloCurto(it) {
    if(it.card.tempoTitulo!==undefined)return it.card.tempoTitulo;
    var nome = it.meta.dono && it.meta.dono.fullName, t2 = it.card.name;
    return nome && t2.slice(-(nome.length + 3)) === ' · ' + nome ? t2.slice(0, -(nome.length + 3)) : t2;
  }
  function valorTexto(it) {
    var m = it.meta, r = it.r;
    if(it.tempo && it.tempo.indisponivel)return 'Sem histórico nesta data';
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
    if(it.tempo && it.tempo.indisponivel)return null;
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
        '<button class="btn" id="atualizar">Atualizar</button>' + (CTX.admin && !emConsulta() ? '<button class="btn btn-primario linha gap4" id="nova">' + ICO.mais + 'Nova meta</button>' : '') + '</div></div>';
    }
    var titulo, direita = '';
    if (S.view === 'detalhe') {
      var it = achar(S.cardId);
      var visto=it && emConsulta() ? M.Tempo.reconstruir(it,referencia()) : it;
      titulo = visto ? tituloCurto(visto) : 'Meta';
      direita = '<div class="linha gap8">' + (CTX.admin && !emConsulta() ? '<button class="btn" id="editarMeta">Editar meta</button>' : '') + '<button class="btn" id="abrirCartao">'+(emConsulta()?'Abrir cartão atual':'Abrir cartão')+'</button></div>';
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
    if(reais.some(function(it){return it.tempo && it.tempo.indisponivel;}))return '<section class="bloco resumo-financeiro tab"><h3 class="subtitulo">Progresso financeiro da equipe</h3><p class="sub">Sem histórico completo para calcular o realizado nesta data</p></section>';
    var soma = 0, alvo = 0, esperado = 0;
    reais.forEach(function(it){ soma += it.r.atual-it.meta.vIni; alvo += it.meta.alvo-it.meta.vIni; esperado += it.r.valorEsperado-it.meta.vIni; });
    var h=referencia(), atingiu=soma>=alvo;
    var sit=h<p.a ? 'future' : (atingiu ? 'hit' : (h>p.b ? 'late' : (M.arred({fmt:'r'},soma-esperado)<0 ? 'risk':'ok')));
    var rr={temBarra:true,pct:alvo ? M.percentualExibido(soma/alvo*100,atingiu) : 0,fill:alvo ? Math.max(0,Math.min(100,soma/alvo*100)):0,info:M.SIT[sit],rotulo:M.SIT[sit].label};
    if(sit==='ok' && M.arred({fmt:'r'},soma-esperado)>0)rr.rotulo='Adiantado';
    var dinheiro={fmt:'r'};
    return '<section class="bloco resumo-financeiro tab"><h3 class="subtitulo">Progresso financeiro da equipe</h3>' +
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
      CHIPS.filter(function (c) { return ['ok','ahead','risk','hit'].indexOf(c[0])>=0 || n[c[0]] || S.sit === c[0]; }).map(function (c) {
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
    var html = '<div class="vazio"><p class="forte">Nenhuma meta em ' + esc(nomePeriodo().toLowerCase()) + '</p>';
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
    return controlesTempo()+'<div class="tempo-resultados" id="resultadosTempo">'+conteudoEquipe()+'</div>';
  }

  function repetir() {
    var lista = repetiveis(), p = periodo();
    S.repetir = { andando: true, feitas: 0, total: lista.length };
    render();
    var start = M.parse(p.a); start.setHours(12, 0, 0, 0);
    var due = M.parse(p.b); due.setHours(18, 0, 0, 0);
    var listaMetas, naLista = [];
    return M.garantirLista(t, M.CFG.listaMetas, 'top').then(function (l) {
      listaMetas = l;
      // Uma leitura só da lista Metas, para retomar uma repetição interrompida sem duplicar
      return M.cartoesDaLista(t, l.id).then(function (cs) { naLista = cs || []; });
    }).then(function () {
      return lista.reduce(function (pr, it) {
        return pr.then(function () {
          var v = it.meta, nova = JSON.parse(JSON.stringify(v)), novoCard;
          // Já repetida neste período: a meta nova guarda o cartão de origem
          var jaFeita = ITENS.some(function (x) { return x.meta.origem === it.card.id && x.meta.ini === p.a && x.meta.fim === p.b; });
          if (jaFeita) { S.repetir.feitas++; render(); return null; }
          nova.ini = p.a; nova.fim = p.b; nova.hist = []; delete nova.diaria; nova.aval = null; nova.encerrada = false; delete nova.encerradaEm; nova.criadaEm = M.hoje();
          delete nova.rev; delete nova.checklistId; delete nova.histBase; delete nova.histCortado; delete nova.histBaseEm; delete nova.lt;
          nova.origem = it.card.id;
          if (v.tipo === 'q' && v.fmt === 'p') nova.vIni = M.valorAtual(v); // taxa começa de onde parou
          var marcador='metas-repetir:'+it.card.id+':'+p.a+':'+p.b;
          var anterior = naLista.filter(function (c) { return c.desc === marcador; })[0];
          return (anterior ? Promise.resolve(anterior) : M.rest(t, 'POST', '/cards', {desc:marcador, idList: listaMetas.id, name: tituloCurto(it) + ' · ' + v.dono.fullName, idMembers: v.dono.id, start: M.dataCartao(p.a,false), due: M.dataCartao(p.b,true), pos: 'bottom' }))
            .then(function(c){novoCard=c;return M.ler(t,c.id).then(function(existe){if(existe){nova=existe;return;}return M.salvarMetaNova(t,c.id,nova);});})
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
            .then(function () { return M.limparMarcador(t, novoCard.id); })
            .then(function () { S.repetir.feitas++; render(); });
        });
      }, Promise.resolve());
    }).then(function () { S.repetir = null; return carregar(); })
      .catch(function (e) { S.repetir = { erro: 'Parou em ' + S.repetir.feitas + ' de ' + S.repetir.total + ' metas. ' + M.erroUsuario(e) }; return carregar(); });
  }

  // ---------- navegação ----------
  function irPara(view, extra) {
    pararTempo();
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
      if(emConsulta()) {
        var historico=M.Tempo.reconstruir(it,referencia());
        corpo.innerHTML=historico ? M.Tempo.detalhe(historico,referencia()) : '<p class="vazio">A meta ainda não havia sido criada nesta data</p>';
      } else M.detalhe(corpo, {
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
    M.dimensionarTags(app);
  }

  function ligar() {
    ligarTempo();
    var $ = function (id) { return document.getElementById(id); };
    var manter = function (fn) { return function () { var y = window.pageYOffset, alvoId=this.id, alvoSit=this.getAttribute && this.getAttribute('data-sit'); pararTempo(); fn.apply(this, arguments); if(emConsulta() && S.view==='home')atualizarConsulta();else render(); if(emConsulta()){if(alvoId && $(alvoId))$(alvoId).focus();else if(alvoSit!==null)app.querySelectorAll('[data-sit]').forEach(function(b){if(b.getAttribute('data-sit')===alvoSit)b.focus();});} window.scrollTo(0, y); }; };
    if ($('atualizar')) $('atualizar').onclick = function(){pararTempo();if(emConsulta())atualizarConsulta();atualizar(true);};
    if ($('ant')) $('ant').onclick = function () { reiniciarTempo(); andar(-1); S.repetir = null; render(); };
    if ($('prox')) $('prox').onclick = function () { reiniciarTempo(); andar(1); S.repetir = null; render(); };
    if ($('agoraBtn')) $('agoraBtn').onclick = function () { reiniciarTempo(); S.y = agora.getFullYear(); S.m = agora.getMonth(); S.repetir = null; render(); };
    app.querySelectorAll('[data-escala]').forEach(function (b) { b.onclick = function () { reiniciarTempo(); S.escala = b.getAttribute('data-escala'); S.repetir = null; render(); }; });
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
