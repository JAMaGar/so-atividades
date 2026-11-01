/* Ponte entre a página de uma aula e o sistema on-line.

   As páginas das aulas foram feitas para o servidor da sala (api/entregar,
   api/gabarito). Este arquivo, carregado ANTES do app.js de cada aula, troca
   esse servidor pelo back-end on-line sem mexer na lógica da atividade:

   · nome e turma vêm do cadastro (RM + senha) e não podem ser editados;
   · as respostas em andamento ficam salvas neste aparelho, separadas por RM;
   · antes de entregar, pede confirmação: a entrega é única;
   · depois da entrega, a página abre no recibo, em modo de consulta;
   · o gabarito só aparece quando o professor libera.

   A página precisa estar dentro do index.html do site (é ele que guarda a sessão). */
(function () {
  "use strict";
  var SO = null;
  try { SO = window.parent && window.parent !== window && window.parent.SO; } catch (e) { SO = null; }
  if (!SO) {                                   // aberta fora do site: volta para a entrada
    location.replace("../../index.html");
    return;
  }
  var AULA = document.documentElement.getAttribute("data-aula");
  var sessao = SO.sessao();
  var info = SO.aula(AULA) || {};
  var entregue = info.entrega || null;
  var PREFIXO = "so:" + sessao.aluno.rm + ":";
  window.SO_PONTE = { aula: AULA, entregue: !!entregue };

  /* ── armazenamento separado por RM ──────────────────────────────────── */
  var S = Storage.prototype, getItem = S.getItem, setItem = S.setItem, removeItem = S.removeItem;
  function ehLocal(st) { try { return st === window.localStorage; } catch (e) { return false; } }
  function comIdentidade(txt) {
    var o = {};
    try { o = txt ? JSON.parse(txt) : {}; } catch (e) { o = {}; }
    if (!o || typeof o !== "object" || Array.isArray(o)) o = {};
    o.aluno = sessao.aluno.nome;
    o.turma = sessao.aluno.turma;
    return JSON.stringify(o);
  }
  S.getItem = function (k) {
    if (!ehLocal(this) || String(k).indexOf("so_") !== 0) return getItem.call(this, k);
    if (entregue) return comIdentidade(JSON.stringify(entregue.respostas || {}));
    return comIdentidade(getItem.call(this, PREFIXO + k));
  };
  S.setItem = function (k, v) {
    if (!ehLocal(this) || String(k).indexOf("so_") !== 0) return setItem.call(this, k, v);
    if (entregue) return;                      // consulta: nada muda
    return setItem.call(this, PREFIXO + k, v);
  };
  S.removeItem = function (k) {
    if (!ehLocal(this) || String(k).indexOf("so_") !== 0) return removeItem.call(this, k);
    return removeItem.call(this, PREFIXO + k);
  };

  /* ── o servidor da sala vira o back-end on-line ──────────────────────── */
  var fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  function resposta(corpo, status) {
    return new Response(JSON.stringify(corpo), { status: status || 200,
                                                 headers: { "Content-Type": "application/json" } });
  }
  function rota(u) {
    var s = String(u && u.url ? u.url : u);
    if (/(^|\/)api\/entregar(\?|$)/.test(s)) return "entregar";
    if (/(^|\/)api\/gabarito(\?|$)/.test(s)) return "gabarito";
    return null;
  }
  window.fetch = function (u, op) {
    var r = rota(u);
    if (!r) return fetchOriginal(u, op);
    if (r === "gabarito") {
      return SO.chamar({ acao: "gabarito", aula: AULA }).then(function (j) {
        return j.ok ? resposta(j.gabarito, 200) : resposta(j, j.status || 403);
      }, function (e) { return resposta({ ok: false, erro: String(e.message || e) }, 503); });
    }
    var R;
    try { R = JSON.parse((op && op.body) || "{}"); } catch (e) { R = {}; }
    if (entregue) return Promise.resolve(resposta({ ok: false, erro: "esta aula já foi entregue" }, 409));
    var chaveEnvio = "envio:" + sessao.aluno.rm + ":" + AULA;
    var envio = sessionStorage.getItem(chaveEnvio);
    if (!envio) {
      envio = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(chaveEnvio, envio);
    }
    return SO.chamar({ acao: "entregar", aula: AULA, respostas: R, envio_id: envio }, 3).then(function (j) {
      if (j.ok) {
        sessionStorage.removeItem(chaveEnvio);
        entregue = { respostas: R, protocolo: j.protocolo, recebido_em: j.recebido_em, correcao: j.correcao };
        window.SO_PONTE.entregue = true;
        SO.atualizar();
        setTimeout(modoConsulta, 50);
      } else if (j.status === 401) {
        SO.sessaoExpirada();
      }
      return resposta(j, j.ok ? 200 : (j.status || 400));
    }, function (e) {
      return resposta({ ok: false, erro: "sem conexão com o servidor (" + (e.message || e) + ")" }, 503);
    });
  };

  /* ── confirmação: a entrega é única ─────────────────────────────────── */
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("#entregar");
    if (!b) return;
    if (entregue) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    var ok = window.confirm("A entrega é ÚNICA: depois de entregar, você não poderá mudar as respostas " +
                            "desta aula.\n\nConfira tudo antes. Entregar agora?");
    if (!ok) { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }, true);

  /* ── modo de consulta, depois da entrega ────────────────────────────── */
  var NAVEGAR = "[data-ir], #ver-gabarito, #baixar, .topo, .abas-etapas";
  function bloquear(ev) {
    if (!entregue) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest(NAVEGAR) || t.closest("#gabarito") || t.closest(".so-faixa")) return;
    if (t.closest("main") && (t.closest("button, a, input, select, textarea, label, [role=button], [data-op], .opc-btn"))) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
  }
  ["click", "input", "change", "keydown", "pointerdown"].forEach(function (tipo) {
    document.addEventListener(tipo, bloquear, true);
  });

  function etapaRecibo() {
    var r = document.getElementById("recibo-linha") || document.getElementById("ver-gabarito");
    var sec = r && r.closest("[data-etapa]");
    return sec ? Number(sec.getAttribute("data-etapa")) : null;
  }

  function modoConsulta() {
    if (!entregue) return;
    document.documentElement.classList.add("so-entregue");
    document.querySelectorAll("main input, main textarea").forEach(function (x) { x.readOnly = true; });
    document.querySelectorAll("main select").forEach(function (x) { x.disabled = true; });
    var sec = document.getElementById("recibo-linha");
    sec = sec && sec.closest("[data-etapa]");
    if (sec) sec.querySelectorAll('[data-ir="0"]').forEach(function (x) { x.textContent = "Rever minhas respostas"; });
    var bt = document.getElementById("entregar");
    if (bt) { bt.disabled = true; bt.textContent = "Entregue"; }
    document.querySelectorAll("#pendencias, #status-envio").forEach(function (x) { x.style.display = "none"; });
    if (!document.querySelector(".so-faixa")) {
      var f = document.createElement("div");
      f.className = "so-faixa";
      f.innerHTML = "<b>Entregue</b> · protocolo " + esc(entregue.protocolo) + " · " +
        esc(String(entregue.recebido_em || "").slice(0, 16)) +
        ". Você pode rever as respostas, mas não alterá-las.";
      var main = document.querySelector("main");
      if (main) main.insertBefore(f, main.firstChild);
    }
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ── rolagem: a página da aula não rola sozinha (o quadro tem a altura toda),
        então "voltar ao topo" ao trocar de etapa precisa rolar a página de fora ── */
  var rolarOriginal = window.scrollTo ? window.scrollTo.bind(window) : null;
  window.scrollTo = function (a, b) {
    var y = (a && typeof a === "object") ? (a.top || 0) : (b || 0);
    try { SO.rolar(AULA, y); } catch (e) { if (rolarOriginal) rolarOriginal(a, b); }
  };

  /* ── identidade fixa e abertura ─────────────────────────────────────── */
  function travarIdentidade() {
    [["nome", sessao.aluno.nome], ["turma", sessao.aluno.turma]].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (!el) return;
      el.value = p[1];
      el.readOnly = true;
      el.classList.add("so-fixo");
      el.title = "vem do seu cadastro (RM " + sessao.aluno.rm + ")";
    });
    var g = document.getElementById("grupo");
    if (g && entregue) g.readOnly = true;
  }

  function altura() {
    try { SO.altura(AULA, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)); } catch (e) {}
  }

  window.addEventListener("DOMContentLoaded", function () {
    travarIdentidade();
    var est = document.createElement("style");
    est.textContent =
      ".so-fixo{background:#F2F5F9 !important;color:#43506A !important}" +
      ".so-faixa{background:#EAF3E4;border-left:4px solid #548235;border-radius:0 8px 8px 0;" +
      "padding:.6rem .8rem;margin:.2rem 0 1rem;font-size:.92rem;color:#2F4A1C}" +
      ".so-entregue main .opc-btn, .so-entregue main [data-op]{cursor:default}" +
      ".so-entregue #entregar{opacity:.55}";
    document.head.appendChild(est);
  });
  window.addEventListener("load", function () {
    travarIdentidade();
    if (entregue) {
      modoConsulta();
      var n = etapaRecibo();
      try {
        if (typeof window.mostrarRecibo === "function") {
          window.mostrarRecibo({ ok: true, protocolo: entregue.protocolo, recebido_em: entregue.recebido_em,
                                 correcao: entregue.correcao, mostrar_correcao: true });
        }
        if (n !== null && typeof window.ir === "function") window.ir(n);
      } catch (e) { /* a página continua utilizável */ }
    }
    altura();
    if (window.ResizeObserver) new ResizeObserver(altura).observe(document.body);
    setInterval(altura, 1500);
  });
  window.addEventListener("message", function (ev) {
    if (ev.data === "so:altura") altura();
  });
})();
