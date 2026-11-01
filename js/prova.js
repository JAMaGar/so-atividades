/* P1 on-line — página do aluno.
   O cronômetro vale pelo servidor: o prazo foi gravado quando o aluno iniciou.
   As respostas ficam neste aparelho a cada toque e vão ao servidor como
   rascunho a cada poucos segundos; ao zerar o tempo, a prova é enviada sozinha. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var SESSAO = "so:sessao";
  var sessao = null, est = null, prova = null, resp = {}, marcadas = {}, atual = 0;
  var prazoLocal = 0, tic = null, sujo = false, salvando = false, tSalvar = null, enviando = false, avisos = {};
  var LETRAS = "ABCD";

  /* ── utilidades ──────────────────────────────────────────────────────── */
  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function md(t) { return esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function br(x) { return String(x).replace(".", ","); }
  function lerSessao() { try { var s = JSON.parse(localStorage.getItem(SESSAO) || "null"); return s && s.token ? s : null; } catch (e) { return null; } }
  function gravarSessao(s) { sessao = s; if (s) localStorage.setItem(SESSAO, JSON.stringify(s)); else localStorage.removeItem(SESSAO); }
  function chaveLocal() { return "so:p1:" + sessao.aluno.rm + ":" + (prova ? prova.iniciada_em : ""); }
  function aviso(html, tipo) { $("#msg").innerHTML = html ? '<div class="' + (tipo || "aviso") + '">' + html + "</div>" : ""; }

  function chamar(corpo, tentativas) {
    tentativas = tentativas || 1;
    if (!window.SO_CONFIG || !SO_CONFIG.API || /COLE_AQUI/.test(SO_CONFIG.API))
      return Promise.resolve({ ok: false, status: 503, erro: "o sistema ainda não foi configurado pelo professor" });
    if (sessao && corpo.acao !== "entrar") corpo.token = sessao.token;
    var n = 0;
    function uma() {
      n++;
      return fetch(SO_CONFIG.API, { method: "POST", body: JSON.stringify(corpo), redirect: "follow",
                                     headers: { "Content-Type": "text/plain;charset=utf-8" } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok && j.status === 401 && corpo.acao !== "entrar") { sair("Sua sessão expirou. Entre de novo: suas respostas estão guardadas."); return j; }
          if (!j.ok && j.status === 503 && n < tentativas) return espera(n).then(uma);
          return j;
        }, function (e) { if (n < tentativas) return espera(n).then(uma); throw e; });
    }
    return uma();
  }
  function espera(n) { return new Promise(function (ok) { setTimeout(ok, 900 * n + Math.random() * 900); }); }

  /* ── entrada ─────────────────────────────────────────────────────────── */
  var novo = false;
  function mostrarEntrada(msg) {
    $("#entrada").hidden = false; $("#area").hidden = true; $("#relogio").hidden = true;
    $("#msg-entrada").innerHTML = msg ? '<div class="aviso">' + esc(msg) + "</div>" : "";
  }
  $("#form-entrada").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var rm = $("#rm").value.replace(/\s+/g, ""), senha = $("#senha").value, bt = $("#bt-entrar");
    if (!rm || senha.length < 4) { $("#msg-entrada").innerHTML = '<div class="aviso">Informe o RM e a senha.</div>'; return; }
    var corpo = { acao: "entrar", rm: rm, senha: senha };
    if (novo) {
      if ($("#senha2").value !== senha) { $("#msg-entrada").innerHTML = '<div class="aviso">As duas senhas não são iguais.</div>'; return; }
      corpo.nome = $("#nome-c").value; corpo.turma = $("#turma-c").value;
    }
    bt.disabled = true; bt.textContent = "Conferindo…";
    chamar(corpo, 3).then(function (j) {
      if (j.ok && j.novo) { novo = true; $("#cadastro").hidden = false; bt.textContent = "Criar acesso e entrar"; return; }
      if (!j.ok) { $("#msg-entrada").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      gravarSessao({ token: j.token, aluno: j.aluno });
      $("#senha").value = ""; novo = false; $("#cadastro").hidden = true;
      carregar();
    }, function () {
      $("#msg-entrada").innerHTML = '<div class="aviso">Sem conexão com o servidor. Confira a internet e tente de novo.</div>';
    }).then(function () { bt.disabled = false; if (!novo) bt.textContent = "Entrar"; });
  });
  function sair(msg) {
    if (prova && prova.status === "em_andamento") guardarLocal();
    clearInterval(tic); tic = null;
    gravarSessao(null); est = null; prova = null;
    mostrarEntrada(msg);
  }
  $("#bt-sair").addEventListener("click", function () {
    if (prova && prova.status === "em_andamento" &&
        !confirm("Sair não para o cronômetro. Suas respostas estão salvas e você pode voltar a entrar. Sair mesmo?")) return;
    salvar(true); sair();
  });

  /* ── estado ──────────────────────────────────────────────────────────── */
  function carregar() {
    $("#entrada").hidden = true; $("#area").hidden = false;
    $("#quem").innerHTML = "<b>" + esc(sessao.aluno.nome) + "</b> · RM " + esc(sessao.aluno.rm) + " · " + esc(sessao.aluno.turma);
    $("#tela").innerHTML = '<div class="cartao"><p class="nota">Carregando…</p></div>';
    return chamar({ acao: "p1_estado" }, 4).then(receber, function () {
      $("#tela").innerHTML = '<div class="cartao"><div class="aviso">Sem conexão com o servidor.</div>' +
        '<button class="btn" id="bt-rec">Tentar de novo</button></div>';
      $("#bt-rec").onclick = carregar;
    });
  }
  function receber(j) {
    if (!j || !j.ok) { if (j && j.status !== 401) aviso(esc(j.erro)); return; }
    est = j; prova = j.prova;
    if (!prova) return telaInicio();
    if (prova.status === "em_andamento") return iniciarResolucao();
    return telaRecibo();
  }

  /* ── antes de iniciar ────────────────────────────────────────────────── */
  function telaInicio() {
    $("#relogio").hidden = true;
    var h = '<div class="cartao"><h1>' + esc(est.titulo) + "</h1>";
    h += '<ul class="regras">' +
      "<li><b>16 questões</b>: 10 de múltipla escolha (0,4 cada), 4 de cálculo (1,0 cada, com crédito parcial) e 2 discursivas curtas (1,0 cada). Total: 10,0.</li>" +
      "<li>Você tem <b>" + est.duracao_min + " minutos</b> a partir do toque em <b>Iniciar</b>. O cronômetro <b>não para</b> se você fechar a página ou perder a conexão.</li>" +
      "<li>As respostas são salvas enquanto você trabalha. Se a página fechar, entre de novo: a prova continua de onde parou.</li>" +
      "<li>Ao fim do tempo a prova é <b>enviada automaticamente</b> com o que estiver respondido.</li>" +
      "<li>Uma tentativa só. Depois de enviar, você vê o recibo; a nota e a correção aparecem quando o professor liberar.</li>" +
      "<li>A prova é individual e sem consulta. Cada aluno recebe questões e números diferentes.</li>" +
      "<li>Tenha papel e caneta à mão para os cálculos.</li></ul>";
    if (!est.aberta) {
      h += '<div class="faixa">A prova ainda não está aberta. Aguarde a liberação do professor.</div>' +
           '<button class="btn" id="bt-atual">Atualizar</button>';
    } else {
      h += '<button class="btn primario" id="bt-iniciar">Iniciar a prova (' + est.duracao_min + " min)</button>";
    }
    $("#tela").innerHTML = h + "</div>";
    if ($("#bt-atual")) $("#bt-atual").onclick = carregar;
    if ($("#bt-iniciar")) $("#bt-iniciar").onclick = function () {
      if (!confirm("Iniciar a prova agora? O cronômetro de " + est.duracao_min + " minutos começa neste momento.")) return;
      var b = $("#bt-iniciar"); b.disabled = true; b.textContent = "Iniciando…";
      chamar({ acao: "p1_iniciar" }, 4).then(function (j) {
        if (!j.ok) { aviso(esc(j.erro)); b.disabled = false; b.textContent = "Iniciar a prova"; return; }
        receber(j);
      }, function () { aviso("Sem conexão. Tente de novo."); b.disabled = false; b.textContent = "Iniciar a prova"; });
    };
  }

  /* ── resolução ───────────────────────────────────────────────────────── */
  function guardarLocal() {
    try { localStorage.setItem(chaveLocal(), JSON.stringify({ r: resp, m: marcadas, t: Date.now(), atual: atual })); } catch (e) {}
  }
  function iniciarResolucao() {
    var loc = null;
    try { loc = JSON.parse(localStorage.getItem(chaveLocal()) || "null"); } catch (e) {}
    resp = prova.respostas || {};
    if (loc && loc.r) {                    // o que está no aparelho é sempre o mais recente
      Object.keys(loc.r).forEach(function (k) { resp[k] = loc.r[k]; });
      marcadas = loc.m || {}; atual = Math.min(loc.atual || 0, prova.questoes.length - 1);
      if (JSON.stringify(loc.r) !== JSON.stringify(prova.respostas || {})) sujo = true;
    }
    prazoLocal = Date.now() + prova.restante_ms;
    $("#relogio").hidden = false;
    clearInterval(tic); tic = setInterval(relogio, 500); relogio();
    aviso("");
    desenhar();
    if (sujo) agendarSalvar(1500);
  }

  function relogio() {
    var r = Math.max(0, prazoLocal - Date.now()), s = Math.ceil(r / 1000);
    var mm = Math.floor(s / 60), ss = s % 60;
    $("#tempo").textContent = (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
    $("#relogio").className = "relogio" + (s <= 120 ? " critico" : s <= 600 ? " alerta" : "");
    if (s <= 600 && !avisos.dez) { avisos.dez = true; aviso("Faltam <b>10 minutos</b>. Revise as questões em branco no mapa.", "faixa"); }
    if (s <= 120 && !avisos.dois) { avisos.dois = true; aviso("Faltam <b>2 minutos</b>. Ao zerar, a prova é enviada sozinha.", "aviso"); }
    if (r <= 0 && !enviando) enviar(true);
  }

  function respondida(q) {
    var v = resp[q.pos];
    if (v === undefined || v === null || v === "") return false;
    if (q.tipo === "calc") return q.itens.some(function (it) { var x = v[it.id]; return x !== undefined && x !== "" && !(Array.isArray(x) && (!x.length || x.every(function (y) { return y === ""; }))); });
    if (q.tipo === "disc") return String(v).trim().length > 0;
    return true;
  }

  function desenhar() {
    var q = prova.questoes[atual], total = prova.questoes.length;
    var h = '<div class="mapa">' + prova.questoes.map(function (x, i) {
      return '<button data-ir="' + i + '" class="' + (respondida(x) ? "resp " : "") + (marcadas[x.pos] ? "marc " : "") +
             (i === atual ? "atual" : "") + '" aria-label="questão ' + (i + 1) + '">' + (i + 1) + "</button>";
    }).join("") + "</div>";
    h += '<div class="legenda"><span>azul: respondida</span><span>ponto amarelo: marcada para revisar</span></div>';
    h += '<div class="cartao" id="questao"><div class="q-cab"><span class="q-num">QUESTÃO ' + (atual + 1) + " DE " + total +
         " · " + ({ mc: "MÚLTIPLA ESCOLHA", calc: "CÁLCULO", disc: "DISCURSIVA" })[q.tipo] + '</span><span class="q-pts">' +
         br(q.pontos.toFixed(1)) + " ponto" + (q.pontos > 1 ? "s" : "") + "</span></div>";
    h += '<div class="enun">' + md(q.enunciado) + "</div>";
    if (q.tipo === "mc") h += corpoMc(q);
    else if (q.tipo === "calc") h += corpoCalc(q);
    else h += corpoDisc(q);
    h += '<label class="chip marcar' + (marcadas[q.pos] ? " sel" : "") + '"><input type="checkbox" id="marcar"' +
         (marcadas[q.pos] ? " checked" : "") + "> marcar para revisar</label>";
    h += '<div class="nav"><button class="btn" id="bt-ant"' + (atual === 0 ? " disabled" : "") + ">‹ Anterior</button>" +
         (atual < total - 1 ? '<button class="btn" id="bt-prox">Próxima ›</button>' : '<button class="btn envio" id="bt-rev">Revisar e enviar</button>') +
         "</div></div>";
    h += '<p class="nota" style="text-align:center;margin-top:.8rem"><button class="link" id="bt-rev2">revisar e enviar a prova</button></p>';
    $("#tela").innerHTML = h;
    ligar(q);
  }

  function corpoMc(q) {
    return q.alternativas.map(function (a, i) {
      var sel = resp[q.pos] === i;
      return '<label class="alt' + (sel ? " sel" : "") + '"><input type="radio" name="mc" value="' + i + '"' + (sel ? " checked" : "") +
             "><span><b>" + LETRAS[i] + ")</b> " + md(a) + "</span></label>";
    }).join("");
  }

  function tabela(t) {
    return '<div class="tab-rol"><table class="dados"><thead><tr>' + t.cab.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") +
           "</tr></thead><tbody>" + t.linhas.map(function (l) {
             return "<tr>" + l.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
           }).join("") + "</tbody></table></div>";
  }

  function corpoCalc(q) {
    var r = resp[q.pos] || {};
    var h = tabela(q.tabela) + '<div class="conv">' + md(q.convencao) + "</div>";
    q.itens.forEach(function (it) {
      var v = r[it.id];
      h += '<div class="item" data-item="' + it.id + '"><div class="rot">' + esc(it.rotulo) + " <small>" + br(it.pontos.toFixed(1)) + "</small></div>";
      if (it.tipo === "num") {
        h += '<input class="num" inputmode="decimal" autocomplete="off" data-k="' + it.id + '" value="' + esc(v || "") + '" placeholder="ex.: 6,25">';
      } else if (it.tipo === "vetor") {
        v = v || ["", "", ""];
        h += '<div class="vetor">' + ["A", "B", "C"].map(function (n, k) {
          return "<span>" + n + '</span><input inputmode="numeric" maxlength="3" data-k="' + it.id + '" data-i="' + k + '" value="' + esc(v[k] || "") + '">';
        }).join("") + "</div>";
      } else if (it.tipo === "sel") {
        h += '<div class="opcoes' + (it.opcoes.length > 2 ? " col" : "") + '">' + it.opcoes.map(function (o) {
          var s = v === o;
          return '<label class="chip' + (s ? " sel" : "") + '"><input type="radio" name="' + it.id + '" data-k="' + it.id + '" value="' + esc(o) + '"' +
                 (s ? " checked" : "") + "> " + esc(o) + "</label>";
        }).join("") + "</div>";
      } else if (it.tipo === "multi") {
        v = v || [];
        h += '<div class="opcoes">' + it.opcoes.map(function (o) {
          var s = v.indexOf(o) >= 0;
          return '<label class="chip' + (s ? " sel" : "") + '"><input type="checkbox" data-k="' + it.id + '" value="' + esc(o) + '"' + (s ? " checked" : "") + "> " + esc(o) + "</label>";
        }).join("") + '<label class="chip' + (v.indexOf("__nenhum__") >= 0 ? " sel" : "") + '"><input type="checkbox" data-k="' + it.id +
             '" value="__nenhum__"' + (v.indexOf("__nenhum__") >= 0 ? " checked" : "") + "> " + esc(it.nenhum) + "</label></div>";
      } else if (it.tipo === "seq") {
        var seq = String(v || "").match(/P\d+/g) || [];
        h += '<p class="nota">Toque nos processos na ordem em que terminam.</p><div class="seq-saida" data-saida="' + it.id + '">' +
             (seq.join(" → ") || "—") + '</div><div class="opcoes">' + it.opcoes.map(function (o) {
               return '<button type="button" class="chip" data-seq="' + it.id + '" data-p="' + o + '"' + (seq.indexOf(o) >= 0 ? " disabled" : "") + ">" + o + "</button>";
             }).join("") + '<button type="button" class="chip" data-limpar="' + it.id + '">limpar</button></div>';
      }
      h += "</div>";
    });
    return h;
  }

  function corpoDisc(q) {
    var v = String(resp[q.pos] || "");
    return '<textarea id="disc" maxlength="' + q.max + '" placeholder="Escreva aqui, de 3 a 8 linhas.">' + esc(v) + "</textarea>" +
           '<div class="cont" id="cont">' + v.length + " / " + q.max + "</div>";
  }

  function mudou() {
    sujo = true; guardarLocal(); agendarSalvar(6000);
    $("#salvo").textContent = "não salvo ainda";
    var b = document.querySelector('.mapa button[data-ir="' + atual + '"]');
    if (b) b.classList.toggle("resp", respondida(prova.questoes[atual]));
  }

  function ligar(q) {
    document.querySelectorAll("[data-ir]").forEach(function (b) { b.onclick = function () { ir(Number(b.getAttribute("data-ir"))); }; });
    if ($("#bt-ant")) $("#bt-ant").onclick = function () { ir(atual - 1); };
    if ($("#bt-prox")) $("#bt-prox").onclick = function () { ir(atual + 1); };
    if ($("#bt-rev")) $("#bt-rev").onclick = revisar;
    $("#bt-rev2").onclick = revisar;
    $("#marcar").onchange = function (e) { marcadas[q.pos] = e.target.checked; if (!e.target.checked) delete marcadas[q.pos]; guardarLocal(); desenhar(); };
    if (q.tipo === "mc") {
      document.querySelectorAll('input[name="mc"]').forEach(function (inp) {
        inp.onchange = function () {
          resp[q.pos] = Number(inp.value);
          document.querySelectorAll(".alt").forEach(function (l) { l.classList.toggle("sel", l.querySelector("input").checked); });
          mudou();
        };
      });
    } else if (q.tipo === "disc") {
      $("#disc").oninput = function (e) { resp[q.pos] = e.target.value; $("#cont").textContent = e.target.value.length + " / " + q.max; mudou(); };
    } else {
      var r = resp[q.pos] = resp[q.pos] && typeof resp[q.pos] === "object" ? resp[q.pos] : {};
      q.itens.forEach(function (it) {
        var sel = '[data-k="' + it.id + '"]';
        if (it.tipo === "num") document.querySelector(sel).oninput = function (e) { r[it.id] = e.target.value.trim(); mudou(); };
        if (it.tipo === "vetor") document.querySelectorAll(sel).forEach(function (inp) {
          inp.oninput = function () { var a = r[it.id] || ["", "", ""]; a[Number(inp.getAttribute("data-i"))] = inp.value.trim(); r[it.id] = a; mudou(); };
        });
        if (it.tipo === "sel") document.querySelectorAll(sel).forEach(function (inp) {
          inp.onchange = function () {
            r[it.id] = inp.value;
            document.querySelectorAll(sel).forEach(function (x) { x.parentNode.classList.toggle("sel", x.checked); });
            mudou();
          };
        });
        if (it.tipo === "multi") document.querySelectorAll(sel).forEach(function (inp) {
          inp.onchange = function () {
            var boxes = document.querySelectorAll(sel);
            if (inp.value === "__nenhum__" && inp.checked) boxes.forEach(function (x) { if (x !== inp) x.checked = false; });
            if (inp.value !== "__nenhum__" && inp.checked) boxes.forEach(function (x) { if (x.value === "__nenhum__") x.checked = false; });
            r[it.id] = Array.prototype.filter.call(boxes, function (x) { return x.checked; }).map(function (x) { return x.value; });
            boxes.forEach(function (x) { x.parentNode.classList.toggle("sel", x.checked); });
            mudou();
          };
        });
        if (it.tipo === "seq") {
          document.querySelectorAll('[data-seq="' + it.id + '"]').forEach(function (b) {
            b.onclick = function () {
              var s = String(r[it.id] || "").match(/P\d+/g) || [];
              if (s.indexOf(b.getAttribute("data-p")) < 0) s.push(b.getAttribute("data-p"));
              r[it.id] = s.join(", "); mudou(); desenhar();
            };
          });
          document.querySelector('[data-limpar="' + it.id + '"]').onclick = function () { r[it.id] = ""; mudou(); desenhar(); };
        }
      });
    }
  }

  function ir(i) {
    if (i < 0 || i >= prova.questoes.length) return;
    atual = i; guardarLocal(); if (sujo) salvar();
    desenhar(); window.scrollTo(0, 0);
  }

  /* ── rascunho ────────────────────────────────────────────────────────── */
  function agendarSalvar(ms) { clearTimeout(tSalvar); tSalvar = setTimeout(salvar, ms); }
  function salvar(manter) {
    if (!sujo || salvando || enviando || !prova || prova.status !== "em_andamento") return Promise.resolve();
    salvando = true; sujo = false;
    var corpo = { acao: "p1_salvar", respostas: resp };
    if (manter) {                                      // saindo da página: tentativa sem esperar resposta
      try { fetch(SO_CONFIG.API, { method: "POST", keepalive: true, body: JSON.stringify(Object.assign(corpo, { token: sessao.token })),
                                   headers: { "Content-Type": "text/plain;charset=utf-8" } }); } catch (e) {}
      salvando = false; return Promise.resolve();
    }
    return chamar(corpo, 2).then(function (j) {
      salvando = false;
      if (j.ok) {
        prazoLocal = Date.now() + j.restante_ms;
        $("#salvo").textContent = "salvo " + String(j.salvo_em).slice(11, 16);
      } else if (j.encerrada) {
        clearInterval(tic); carregar();
      } else { sujo = true; agendarSalvar(15000); $("#salvo").textContent = "salvo só neste aparelho"; }
    }, function () {
      salvando = false; sujo = true; agendarSalvar(15000);
      $("#salvo").textContent = "sem conexão · salvo neste aparelho";
    });
  }
  setInterval(function () { if (sujo) salvar(); }, 45000);
  document.addEventListener("visibilitychange", function () {
    if (!prova || prova.status !== "em_andamento") return;
    if (document.visibilityState === "hidden") { guardarLocal(); salvar(true); }
    else {                                              // voltou: o relógio do servidor manda
      chamar({ acao: "p1_estado" }, 2).then(function (j) {
        if (!j.ok || !j.prova) return;
        if (j.prova.status !== "em_andamento") { clearInterval(tic); receber(j); }
        else prazoLocal = Date.now() + j.prova.restante_ms;
      }, function () {});
    }
  });
  window.addEventListener("beforeunload", function (e) {
    if (prova && prova.status === "em_andamento" && !enviando) { guardarLocal(); salvar(true); e.preventDefault(); e.returnValue = ""; }
  });

  /* ── envio ───────────────────────────────────────────────────────────── */
  function revisar() {
    var brancas = prova.questoes.filter(function (q) { return !respondida(q); }).map(function (q) { return prova.questoes.indexOf(q) + 1; });
    var marc = prova.questoes.filter(function (q) { return marcadas[q.pos]; }).map(function (q) { return prova.questoes.indexOf(q) + 1; });
    var h = '<div class="cartao"><h2>Revisar e enviar</h2>';
    h += "<p>" + (prova.questoes.length - brancas.length) + " de " + prova.questoes.length + " questões respondidas.</p>";
    if (brancas.length) h += '<div class="faixa">Em branco: questões <b>' + brancas.join(", ") + "</b>.</div>";
    if (marc.length) h += '<div class="faixa">Marcadas para revisar: questões <b>' + marc.join(", ") + "</b>.</div>";
    h += '<p class="nota">Depois de enviar não é possível alterar nada. Nas questões de cálculo, confira se preencheu todos os itens.</p>';
    h += '<div class="nav"><button class="btn" id="bt-voltar">‹ Voltar à prova</button><button class="btn envio" id="bt-enviar">Enviar a prova</button></div></div>';
    $("#tela").innerHTML = h; window.scrollTo(0, 0);
    $("#bt-voltar").onclick = function () { desenhar(); };
    $("#bt-enviar").onclick = function () {
      if (!confirm("Enviar a prova agora? Esta é a sua única tentativa.")) return;
      enviar(false);
    };
  }

  function enviar(automatico) {
    if (enviando) return;
    enviando = true; clearTimeout(tSalvar); guardarLocal();
    if (automatico) aviso("<b>Tempo esgotado.</b> Enviando a prova com as respostas que você deu…", "aviso");
    $("#tela").innerHTML = '<div class="cartao"><p><b>Enviando…</b></p><p class="nota">Não feche esta página.</p></div>';
    var tent = 0;
    (function uma() {
      tent++;
      chamar({ acao: "p1_enviar", respostas: resp, automatico: !!automatico }, 2).then(function (j) {
        if (!j.ok && j.status !== 401) { if (tent < 8) return setTimeout(uma, 3000 * tent); }
        enviando = false; clearInterval(tic); $("#relogio").hidden = true;
        try { localStorage.removeItem(chaveLocal()); } catch (e) {}
        if (j.ok && j.fora_do_prazo) aviso("A prova foi enviada automaticamente no fim do tempo, com as respostas salvas até então.", "faixa");
        else if (j.ok) aviso("");
        carregar();
      }, function () {
        if (tent < 20) {
          $("#tela").innerHTML = '<div class="cartao"><div class="aviso">Sem conexão. Tentando enviar de novo… (' + tent + ')</div>' +
            '<p class="nota">Suas respostas estão guardadas neste aparelho. Não feche a página; se precisar, avise o professor.</p></div>';
          setTimeout(uma, Math.min(15000, 2000 * tent));
        } else { enviando = false; aviso("Não foi possível enviar. Recarregue a página quando a internet voltar."); }
      });
    })();
  }

  /* ── depois do envio ─────────────────────────────────────────────────── */
  function telaRecibo() {
    $("#relogio").hidden = true; clearInterval(tic);
    var p = prova, h = '<div class="cartao recibo"><h1>Prova enviada</h1>';
    h += "<p>Protocolo <b>" + esc(p.protocolo) + "</b> · enviada em <b>" + esc(p.enviada_em) + "</b>" +
         (p.status === "enviada_auto" ? " (envio automático no fim do tempo)" : "") + ".</p>";
    if (!p.resultado) {
      h += '<p class="nota">Guarde o protocolo. A nota e a correção comentada aparecem nesta página quando o professor liberar.</p>' +
           '<button class="btn" id="bt-atual">Atualizar</button></div>';
      $("#tela").innerHTML = h; $("#bt-atual").onclick = carregar; return;
    }
    var R = p.resultado;
    h += '<p>Nota: <span class="grande">' + (R.nota === "" ? "—" : br(Number(R.nota).toFixed(1))) + "</span> de 10,0</p>";
    h += '<p class="nota">Questões objetivas e de cálculo: ' + br(Number(R.nota_auto).toFixed(2)) + " · discursivas: " +
         (R.nota_disc === "" ? "em correção" : br(Number(R.nota_disc).toFixed(1))) + "</p></div>";
    R.questoes.forEach(function (q) { h += resultadoQuestao(q); });
    $("#tela").innerHTML = h;
  }

  function ptsHtml(c) {
    if (c.pontos === null) return '<span class="pts">em correção</span>';
    return '<span class="pts ' + (c.pontos >= c.max - 1e-9 ? "ok" : "no") + '">' + br(Number(c.pontos).toFixed(2)) + " / " + br(c.max.toFixed(1)) + "</span>";
  }

  function resultadoQuestao(q) {
    var c = q.correcao;
    var h = '<div class="cartao res-q"><div class="q-cab"><span class="q-num">QUESTÃO ' + q.n + "</span>" + ptsHtml(c) + "</div>";
    if (c.anulada) h += '<div class="faixa ok">Questão anulada: pontuação integral para todos.</div>';
    h += '<div class="enun">' + md(q.enunciado) + "</div>";
    if (q.parte === "A") {
      h += q.alternativas.map(function (a, i) {
        var cls = i === c.certa ? " certa" : i === c.marcada ? " errada" : "";
        return '<div class="alt' + cls + '"><span><b>' + LETRAS[i] + ")</b> " + md(a) + (i === c.marcada ? " <i>(sua resposta)</i>" : "") + "</span></div>";
      }).join("");
      if (c.marcada === null) h += '<p class="nota">Você deixou em branco.</p>';
      h += '<div class="coment">' + md(q.comentario) + "</div>";
    } else if (q.parte === "B") {
      h += tabela(q.tabela) + '<div class="conv">' + md(q.convencao) + "</div>";
      h += '<div class="tab-rol"><table class="dados res-itens"><thead><tr><th>Item</th><th>Sua resposta</th><th>Esperado</th><th>Pontos</th></tr></thead><tbody>' +
           c.itens.map(function (it) {
             return "<tr><td>" + esc(it.rotulo) + "</td><td>" + esc(it.aluno) + "</td><td>" + esc(it.certo) + '</td><td class="pts ' +
                    (it.ok || c.anulada ? "ok" : "no") + '">' + br(Number(it.pontos).toFixed(1)) + "</td></tr>";
           }).join("") + "</tbody></table></div>";
      h += '<div class="coment"><b>Resolução.</b> ' + q.resolucao.map(md).join("<br>") + "</div>";
    } else {
      h += '<p class="nota">Sua resposta:</p><div class="texto-aluno">' + (esc(c.texto) || "<i>(em branco)</i>") + "</div>";
      if (c.comentario_prof) h += '<div class="coment"><b>Comentário do professor.</b> ' + esc(c.comentario_prof) + "</div>";
      h += '<div class="coment"><b>Resposta esperada.</b> ' + md(q.esperada) + "</div>";
      h += '<div class="coment"><b>Critério.</b> 1,0: ' + esc(q.rubrica["1.0"]) + "<br>0,5: " + esc(q.rubrica["0.5"]) + "<br>0: " + esc(q.rubrica["0"]) + "</div>";
    }
    return h + "</div>";
  }

  /* ── início ──────────────────────────────────────────────────────────── */
  sessao = lerSessao();
  if (sessao) carregar(); else mostrarEntrada();
})();
