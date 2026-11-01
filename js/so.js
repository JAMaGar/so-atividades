/* Página de entrada: RM + senha, abas por aula, sessão compartilhada com as páginas das aulas. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var CHAVE = "so:sessao";
  var estado = null, sessao = null, abaAtual = null;

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function lerSessao() {
    try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); return s && s.token ? s : null; }
    catch (e) { return null; }
  }
  function gravarSessao(s) { sessao = s; if (s) localStorage.setItem(CHAVE, JSON.stringify(s)); else localStorage.removeItem(CHAVE); }

  /* chamada ao back-end; tentativas extras só para falhas de rede ou servidor ocupado */
  function chamar(corpo, tentativas) {
    tentativas = tentativas || 1;
    if (!window.SO_CONFIG || !SO_CONFIG.API || /COLE_AQUI/.test(SO_CONFIG.API)) {
      return Promise.resolve({ ok: false, status: 503, erro: "o sistema ainda não foi configurado pelo professor" });
    }
    if (sessao && !corpo.token && corpo.acao !== "entrar") corpo.token = sessao.token;
    var n = 0;
    function uma() {
      n++;
      return fetch(SO_CONFIG.API, { method: "POST", body: JSON.stringify(corpo),
                                     headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok && j.status === 503 && n < tentativas) return espera(n).then(uma);
          return j;
        }, function (e) {
          if (n < tentativas) return espera(n).then(uma);
          throw e;
        });
    }
    return uma();
  }
  function espera(n) { return new Promise(function (ok) { setTimeout(ok, 800 * n + Math.random() * 700); }); }

  /* interface usada pelas páginas das aulas (js/ponte.js) */
  window.SO = {
    sessao: function () { return sessao; },
    aula: function (id) { return estado && estado.aulas.filter(function (a) { return a.id === id; })[0]; },
    chamar: chamar,
    atualizar: function () { return carregarEstado(); },
    sessaoExpirada: function () { sair("Sua sessão expirou. Entre de novo: as respostas continuam salvas neste aparelho."); },
    rolar: function (id, y) {
      var f = document.getElementById("quadro");
      if (!f || id !== abaAtual) return;
      var topo = f.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo(0, Math.max(0, topo + y - 8));
    },
    altura: function (id, h) {
      var f = document.getElementById("quadro");
      if (f && id === abaAtual) f.style.height = Math.max(600, h + 20) + "px";
    },
  };

  /* ── entrada ─────────────────────────────────────────────────────────── */
  var novo = false;
  function mostrarEntrada(msg) {
    $("#entrada").hidden = false; $("#area").hidden = true;
    $("#msg-entrada").innerHTML = msg ? '<div class="aviso">' + esc(msg) + "</div>" : "";
  }
  function setNovo(v) {
    novo = v;
    $("#cadastro").hidden = !v;
    $("#bt-entrar").textContent = v ? "Criar acesso e entrar" : "Entrar";
    $("#dica-senha").textContent = v
      ? "Primeiro acesso deste RM: a senha que você digitou passa a ser a sua. Guarde-a."
      : "No primeiro acesso, a senha que você digitar passa a ser a sua.";
  }
  $("#form-entrada").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var rm = $("#rm").value.replace(/\s+/g, ""), senha = $("#senha").value;
    var bt = $("#bt-entrar");
    if (!rm || senha.length < 4) { $("#msg-entrada").innerHTML = '<div class="aviso">Informe o RM e uma senha de pelo menos 4 caracteres.</div>'; return; }
    var corpo = { acao: "entrar", rm: rm, senha: senha };
    if (novo) {
      if ($("#senha2").value !== senha) { $("#msg-entrada").innerHTML = '<div class="aviso">As duas senhas não são iguais.</div>'; return; }
      corpo.nome = $("#nome-c").value; corpo.turma = $("#turma-c").value;
    }
    bt.disabled = true; bt.textContent = "Conferindo…"; $("#msg-entrada").innerHTML = "";
    chamar(corpo, 3).then(function (j) {
      if (j.ok && j.novo) { setNovo(true); $("#nome-c").focus(); return; }
      if (!j.ok) { $("#msg-entrada").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      gravarSessao({ token: j.token, aluno: j.aluno });
      $("#senha").value = ""; $("#senha2").value = "";
      setNovo(false);
      receberEstado(j.estado);
      entrarArea();
    }, function () {
      $("#msg-entrada").innerHTML = '<div class="aviso">Sem conexão com o servidor. Confira a internet e tente de novo.</div>';
    }).then(function () { bt.disabled = false; bt.textContent = novo ? "Criar acesso e entrar" : "Entrar"; });
  });
  $("#rm").addEventListener("input", function () { if (novo) setNovo(false); });

  function sair(msg) {
    gravarSessao(null); estado = null; abaAtual = null;
    $("#quadro").src = "about:blank"; $("#quadro").hidden = true; $("#vazio").hidden = false; $("#cab-aula").innerHTML = "";
    mostrarEntrada(msg);
  }
  $("#bt-sair").addEventListener("click", function () { sair(); });

  /* ── abas ────────────────────────────────────────────────────────────── */
  function situacao(a) {
    if (a.entrega) return a.gabarito_liberado ? ["entregue · gabarito", "ok"] : ["entregue", "ok"];
    return a.aberta ? ["aberta", "aberta"] : ["fechada", "fechada"];
  }
  function receberEstado(e) {
    estado = e;
    $("#quem").textContent = sessao.aluno.nome + " · RM " + sessao.aluno.rm + " · " + sessao.aluno.turma;
    $("#abas").innerHTML = e.aulas.map(function (a) {
      var s = situacao(a);
      return '<button class="aba' + (a.id === abaAtual ? " ativa" : "") + '" data-aula="' + a.id + '" role="tab">' +
        "<b>Aula " + Number(a.id.slice(1)) + "</b><span class=\"selo " + s[1] + '">' + s[0] + "</span></button>";
    }).join("");
    document.querySelectorAll("#abas .aba").forEach(function (b) {
      b.onclick = function () { abrir(b.getAttribute("data-aula")); };
    });
    if (abaAtual) mostrarCabecalho(abaAtual);
  }
  function carregarEstado() {
    return chamar({ acao: "estado" }, 3).then(function (j) {
      if (j.ok) receberEstado(j);
      else if (j.status === 401) SO.sessaoExpirada();
      return j;
    });
  }
  function mostrarCabecalho(id) {
    var a = SO.aula(id);
    if (!a) return;
    var txt;
    if (a.entrega) txt = "Entregue em " + esc(String(a.entrega.recebido_em).slice(0, 16)) + " · protocolo <b>" +
      esc(a.entrega.protocolo) + "</b>." + (a.gabarito_liberado ? " O gabarito já está liberado: veja no fim da página." : "");
    else if (a.aberta) txt = "<b>Entrega única.</b> Responda com calma; as respostas ficam salvas neste aparelho até você entregar.";
    else txt = "Esta atividade está <b>fechada</b> para entregas. Você pode ver as questões, mas não entregar.";
    $("#cab-aula").innerHTML = "<h2>" + esc(a.titulo) + "</h2><p>" + txt + "</p>";
  }
  function abrir(id) {
    abaAtual = id;
    $("#quadro").src = "about:blank";
    carregarEstado().then(function () { if (abaAtual === id) mostrarAula(id); },
                          function () { if (abaAtual === id) mostrarAula(id); });
  }
  function mostrarAula(id) {
    document.querySelectorAll("#abas .aba").forEach(function (b) { b.classList.toggle("ativa", b.getAttribute("data-aula") === id); });
    mostrarCabecalho(id);
    $("#vazio").hidden = true;
    var f = $("#quadro");
    f.hidden = false; f.style.height = "900px";
    f.src = "aulas/" + id + "/index.html?v=" + encodeURIComponent(SO_CONFIG.VERSAO || "1");
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () {   // voltou para a aba do navegador
    if (!document.hidden && sessao && estado) carregarEstado();
  });
  function entrarArea() {
    $("#entrada").hidden = true; $("#area").hidden = false;
    var h = location.hash.replace("#", "");
    if (SO.aula(h)) { abaAtual = h; mostrarAula(h); }
  }

  /* ── trocar senha ────────────────────────────────────────────────────── */
  $("#bt-senha").addEventListener("click", function () {
    var atual = prompt("Senha atual:");
    if (atual === null) return;
    var nova = prompt("Nova senha (4 a 40 caracteres):");
    if (nova === null) return;
    chamar({ acao: "trocar_senha", senha: atual, nova: nova }, 2).then(function (j) {
      alert(j.ok ? "Senha trocada." : "Não deu: " + j.erro);
    });
  });

  /* ── início ──────────────────────────────────────────────────────────── */
  sessao = lerSessao();
  setNovo(false);
  if (sessao) {
    $("#entrada").hidden = true; $("#area").hidden = false;
    $("#quem").textContent = sessao.aluno.nome + " · RM " + sessao.aluno.rm;
    carregarEstado().then(function (j) { if (j.ok) entrarArea(); },
      function () { $("#vazio").innerHTML = '<div class="aviso">Sem conexão com o servidor. Recarregue a página.</div>'; });
  } else {
    mostrarEntrada();
  }
})();
