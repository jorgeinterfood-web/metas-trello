/* Navegação diária: somente registros disponíveis, sem inferir resultados ausentes. */
(function () {
  var M = window.Metas, esc = M.esc;
  var CAMPOS = ['tipo','fmt','casas','unit','unitSingular','vIni','alvo','dir','ini','fim','ritmo','periodo','imp','dono','quem','crit','aval','encerrada','encerradaEm','checklistId'];
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function iguais(a,b) {
    if(a==null || b==null)return a==null && b==null;
    if(typeof a!=='object' || typeof b!=='object')return a===b;
    if(Array.isArray(a)!==Array.isArray(b))return false;
    var ka=Object.keys(a),kb=Object.keys(b);
    return ka.length===kb.length && ka.every(function(k){return Object.prototype.hasOwnProperty.call(b,k) && iguais(a[k],b[k]);});
  }
  // Diferenças reversas: conservam o estado anterior sem duplicar a meta inteira.
  // Registros do mesmo dia usam o estado final; não há precisão de horário no histórico.
  function prepararGravacao(ant, novo, etapas) {
    var d = M.hoje(), lt = ant && ant.lt ? copia(ant.lt) : { desde: d, mudancas: [], etapas: [] };
    lt.mudancas = lt.mudancas || []; lt.etapas = lt.etapas || [];
    if (ant) {
      var dif = {};
      CAMPOS.forEach(function (k) { if (!iguais(ant[k],novo[k])) dif[k] = ant[k] === undefined ? null : copia(ant[k]); });
      if (Object.keys(dif).length) {
        var ult = lt.mudancas[lt.mudancas.length-1];
        if (ult && ult[0] === d) Object.keys(dif).forEach(function(k){if (!(k in ult[1])) ult[1][k]=dif[k];});
        else lt.mudancas.push([d,dif]);
      }
    }
    if (etapas && novo.tipo === 'e' && Number.isInteger(etapas.checkItems) && Number.isInteger(etapas.checkItemsChecked) && etapas.checkItems >= 0 && etapas.checkItemsChecked >= 0 && etapas.checkItemsChecked <= etapas.checkItems) {
      var e = [d,etapas.checkItems,etapas.checkItemsChecked], last = lt.etapas[lt.etapas.length-1];
      if (last && last[0] === d) lt.etapas[lt.etapas.length-1] = e;
      else lt.etapas.push(e);
    }
    novo.lt = lt;
  }
  // Reduz apenas os extremos mais antigos, indicando até onde há versões confiáveis.
  function reduzir(meta) {
    var lt=meta.lt;
    if (!lt) return false;
    var m=lt.mudancas || [], e=lt.etapas || [];
    if (m.length && (e.length <= 1 || m[0][0] <= e[0][0])) { var saiu=m.shift(); lt.desde=saiu[0]; return true; }
    if (e.length > 1) { e.shift(); return true; }
    return false;
  }
  function observar(t,card,meta) {
    var modelo=t.getContext && t.getContext().card ? 'card' : 'board';
    if (meta.tipo !== 'e' || card.etapasErro || !card.badges || (t.memberCanWriteToModel && !t.memberCanWriteToModel(modelo))) return Promise.resolve(card);
    var b=card.badges, es=meta.lt && meta.lt.etapas || [], last=es[es.length-1];
    if (last && last[0] === M.hoje() && last[1] === b.checkItems && last[2] === b.checkItemsChecked) return Promise.resolve(card);
    return M.salvarMeta(t,card.id || 'card',meta,{etapas:b}).then(function(){return card;}).catch(function(){card.tempoNaoGravado=true;return card;});
  }
  function indisponivel(r) { r.temBarra=false; r.diaria=null; r.pct=0; r.fill=0; r.parada=false; r.sit='semhist'; r.info={label:'Sem histórico',cls:'neutral'}; r.rotulo='Sem histórico'; return r; }
  function reconstruir(it,ref) {
    var m=copia(it.meta), card=copia(it.card), lt=m.lt, notas=[];
    card.name=String(card.name || 'Meta');
    var nomeAtual=it.meta.dono && it.meta.dono.fullName;
    card.tempoTitulo=nomeAtual && card.name.slice(-(nomeAtual.length+3))===' · '+nomeAtual ? card.name.slice(0,-(nomeAtual.length+3)) : card.name;
    if (m.criadaEm && m.criadaEm > ref) return null;
    if (lt) (lt.mudancas || []).slice().reverse().forEach(function(e){if(e[0]>ref)Object.keys(e[1]).forEach(function(k){if(e[1][k]===null)delete m[k];else m[k]=copia(e[1][k]);});});
    var configAntiga = ref < M.hoje() && (!lt || ref < lt.desde);
    if (configAntiga) notas.push('Sem versões da configuração nesta data; objetivo e responsável usam a versão mais antiga disponível');
    if (m.encerrada && m.encerradaEm && m.encerradaEm > ref) { m.encerrada=false; delete m.encerradaEm; }
    if (m.aval && m.aval.em > ref) m.aval=null;
    var original=m.hist || [], faltamDados=false, ultimaEtapa=null;
    m.hist=original.filter(function(e){return e[0]<=ref;});
    delete m.diaria; // o snapshot de hoje não pode contaminar o dia consultado
    if (m.tipo==='q' && m.histCortado && !m.hist.length) {
      if (m.histBaseEm && ref >= m.histBaseEm && Number.isFinite(m.histBase)) { m.hist=[[m.histBaseEm,m.histBase,'','','']]; m._saldoPreservado=true; notas.push('Saldo preservado em '+M.dataBRCompleta(m.histBaseEm)+'; lançamentos anteriores indisponíveis'); }
      else { faltamDados=true; notas.push('Os registros desta data não foram preservados'); }
    }
    if (m.tipo==='q' && m.histCortado && m.histBaseEm===ref) notas.push('Parte dos lançamentos deste dia não foi preservada');
    if (m.tipo==='e') {
      var es=lt && lt.etapas || [];
      es.forEach(function(e){if(e[0]<=ref)ultimaEtapa=e;});
      // Hoje a checklist lida é mais recente que qualquer observação gravada.
      if (ref===M.hoje() && !card.etapasErro) card.badges=copia(it.card.badges || {});
      else if (ultimaEtapa) {
        card.badges={checkItems:ultimaEtapa[1],checkItemsChecked:ultimaEtapa[2]}; delete card.etapasErro;
        if(ultimaEtapa[0]!==ref)notas.push('Última observação das etapas: '+M.dataBRCompleta(ultimaEtapa[0]));
      } else { faltamDados=true; card.badges={}; notas.push('As etapas não têm uma observação nesta data'); }
    }
    var r=M.avaliar(m,card.badges,ref);
    if (faltamDados) indisponivel(r);
    if (m.tipo==='q' && m.histCortado && (!m.histBaseEm || m.histBaseEm>=ref) && original.length && original[0][0]===ref) r.diaria=null;
    return {meta:m,card:card,r:r,tempo:{ref:ref,notas:notas,indisponivel:faltamDados,configAntiga:configAntiga,ultimaEtapa:ultimaEtapa}};
  }
  function registros(it,ref) {
    var m=it.meta, hist=m.hist || [], eventos=[];
    (m._saldoPreservado ? [] : hist).forEach(function(e,i){
      if(e[0]!==ref)return;
      var base=i ? hist[i-1][1] : (m.histCortado ? m.histBase : m.vIni);
      eventos.push({tipo:'valor',valor:e[1],delta:Number.isFinite(base)?M.arred(m,e[1]-base):null,por:e[3] || '',obs:e[4] || ''});
    });
    var lt=m.lt;
    if (lt) {
      (lt.mudancas || []).forEach(function(e){if(e[0]===ref)eventos.push({tipo:'config',texto:'Configuração ou avaliação alterada'});});
      var es=lt.etapas || [];
      es.forEach(function(e,i){if(e[0]===ref && (!i || e[1]!==es[i-1][1] || e[2]!==es[i-1][2]))eventos.push({tipo:'etapas',texto:'Etapas observadas: '+e[2]+' de '+e[1]});});
    }
    if (!lt && m.aval && m.aval.em===ref) eventos.push({tipo:'config',texto:'Avaliação registrada'});
    return eventos;
  }
  function faixa(p) { return {a:p.a,b:M.hoje()<p.b ? M.hoje() : p.b}; }
  function textoEvento(m,e) {
    if(e.tipo!=='valor')return esc(e.texto);
    var delta=e.delta===null ? '' : '<span class="num '+(e.delta<0?'hist-negativo':'hist-positivo')+'">'+(e.delta<0?'−':'+')+esc(m.fmt==='p'?M.pontos(m,e.delta):M.fmtValor(m,Math.abs(e.delta)))+'</span> · ';
    return delta+'<span class="num">Total: '+esc(M.fmtValor(m,e.valor))+'</span>'+(e.por ? ' <span class="sub">por '+esc(e.por)+'</span>':'');
  }
  function detalhe(it,ref) {
    var m=it.meta,r=it.r,info=it.tempo,principal='';
    if(info.indisponivel)principal='Sem histórico para esta data';
    else if(m.tipo==='q')principal=esc(M.fmtValor(m,r.atual))+(m.fmt==='p'?'':' <span class="sub">'+(m.dir==='down'?'(objetivo: ':'de ')+esc(M.fmtValor(m,m.alvo))+(m.dir==='down'?')':'')+'</span>');
    else if(m.tipo==='e')principal=r.feitas+' de '+r.etapas;
    else principal=m.aval ? esc(r.rotulo) : 'Sem avaliação nesta data';
    var linhas=registros(it,ref);
    return '<div class="detalhe tempo-detalhe"><p class="tempo-aviso">Consulta de '+esc(M.dataBRCompleta(ref))+' · somente leitura</p><p class="det-periodo">Período: '+esc(M.dataBR(m.ini)+' a '+M.dataBR(m.fim))+'</p>'+
      '<section class="det-resumo"><p class="det-resumo-linha"><span class="det-titulo">'+(m.tipo==='q'?(m.fmt==='p'?'Percentual atual: ':'Progresso geral: '):m.tipo==='e'?'Etapas concluídas: ':'Avaliação: ')+'</span> <span class="forte num">'+principal+'</span></p>'+
      (r.temBarra?'<div class="det-barra">'+M.barra(r,{grossa:true,label:'Progresso na data consultada'})+'<span class="det-status selo sit-'+r.info.cls+'">'+esc(M.textoBadge(m,r))+'</span></div>':M.selo(r))+
      (m.fmt==='p'&&!info.indisponivel&&r.atual!==m.alvo?'<p class="det-frase">Objetivo '+(m.dir==='down'?'máximo: ':'mínimo: ')+esc(M.fmtValor(m,m.alvo))+'</p>':'')+'</section>'+
      (info.notas.length?'<ul class="det-feedback">'+info.notas.map(function(n){return '<li>'+esc(n)+'</li>';}).join('')+'</ul>':'')+
      '<section class="bloco"><h3 class="subtitulo">Registros de '+esc(M.dataBR(ref))+'</h3>'+(linhas.length?'<ul class="tempo-lista">'+linhas.map(function(e){return '<li>'+textoEvento(m,e)+(e.obs?'<p class="sub">'+esc(e.obs)+'</p>':'')+'</li>';}).join(''):'<p class="sub">Nenhum registro nesta data</p>')+'</section></div>';
  }
  M.Tempo={iguais:iguais,prepararGravacao:prepararGravacao,reduzir:reduzir,observar:observar,reconstruir:reconstruir,registros:registros,faixa:faixa,textoEvento:textoEvento,detalhe:detalhe};
})();
