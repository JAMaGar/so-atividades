/* Painel do professor.

   A planilha guarda as entregas; este painel as lê pelo back-end e passa cada
   uma pelo atividade.py ORIGINAL da aula, rodando no navegador (Pyodide). Assim
   os relatórios, os CSV e o texto de cada entrega são os mesmos do servidor da sala.
   Se o Pyodide não carregar, o painel funciona com a correção guardada na planilha. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var CH = "so:chave_professor";
  var chave = sessionStorage.getItem(CH) || "";
  var resumo = null, aulaAtual = null, dadosAula = null, py = null, pyPromessa = null, fontes = null;
  var auto = null;

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function chamar(corpo) {
    corpo.chave = chave;
    if (!window.SO_CONFIG || /COLE_AQUI/.test(SO_CONFIG.API)) return Promise.resolve({ ok: false, erro: "config.js sem a URL do Apps Script" });
    return fetch(SO_CONFIG.API, { method: "POST", body: JSON.stringify(corpo),
                                  headers: { "Content-Type": "text/plain;charset=utf-8" } })
      .then(function (r) { return r.json(); })
      .catch(function (e) { return { ok: false, erro: "sem conexão: " + e.message }; });
  }
  function aviso(msg, tipo) {
    $("#msg").innerHTML = msg ? '<div class="aviso ' + (tipo || "") + '">' + msg + "</div>" : "";
    if (msg && tipo === "ok") setTimeout(function () { if ($("#msg").textContent.indexOf(msg.replace(/<[^>]+>/g, "").slice(0, 20)) >= 0) $("#msg").innerHTML = ""; }, 4000);
  }

  /* ── Python no navegador ─────────────────────────────────────────────── */
  function iniciarPython() {
    if (pyPromessa) return pyPromessa;
    $("#py").textContent = "carregando o Python das aulas…";
    pyPromessa = chamar({ acao: "prof_fontes" }).then(function (f) {
      if (!f.ok) throw new Error(f.erro);
      fontes = f;
      return loadPyodide({ indexURL: "pyodide/" });
    }).then(function (p) {
      p.FS.writeFile("/home/pyodide/painel.py", fontes.painel);
      p.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import painel");
      py = p.pyimport("painel");
      Object.keys(fontes.fontes).forEach(function (a) { py.carregar(a, JSON.stringify(fontes.fontes[a])); });
      $("#py").textContent = "relatórios com o código Python das aulas";
      $("#py").className = "py ok";
      return py;
    }).catch(function (e) {
      console.error(e);
      $("#py").textContent = "Python indisponível — painel em modo simples (" + e.message + ")";
      $("#py").className = "py erro";
      py = null;
      return null;
    });
    return pyPromessa;
  }

  /* ── entrada ─────────────────────────────────────────────────────────── */
  $("#form-chave").addEventListener("submit", function (ev) {
    ev.preventDefault();
    chave = $("#chave").value.trim();
    carregarResumo(true);
  });
  $("#bt-sair").addEventListener("click", function () {
    sessionStorage.removeItem(CH); chave = ""; location.reload();
  });

  function carregarResumo(primeira) {
    return chamar({ acao: "prof_resumo" }).then(function (j) {
      if (!j.ok) {
        if (primeira) { $("#entrada").hidden = false; $("#painel").hidden = true; $("#msg-chave").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; }
        else aviso(esc(j.erro));
        return;
      }
      sessionStorage.setItem(CH, chave);
      resumo = j;
      $("#entrada").hidden = true; $("#painel").hidden = false;
      $("#planilha").href = j.planilha;
      $("#n-alunos").textContent = j.alunos;
      $("#abas").innerHTML = j.aulas.map(function (a) {
        return '<button class="aba' + (a.id === aulaAtual ? " ativa" : "") + '" data-aula="' + a.id + '"><b>Aula ' +
          Number(a.id.slice(1)) + "</b><span>" + a.entregas + " entrega" + (a.entregas === 1 ? "" : "s") + "</span>" +
          '<span class="selos">' + (a.aberta ? '<i class="s aberta">aberta</i>' : '<i class="s fechada">fechada</i>') +
          (a.gabarito_liberado ? '<i class="s ok">gabarito</i>' : "") + "</span></button>";
      }).join("") + '<button class="aba' + (aulaAtual === "alunos" ? " ativa" : "") + '" data-aula="alunos"><b>Alunos</b><span>' +
        j.alunos + " cadastrados</span></button>";
      document.querySelectorAll("#abas .aba").forEach(function (b) {
        b.onclick = function () { abrir(b.getAttribute("data-aula")); };
      });
      if (primeira) { iniciarPython(); abrir(location.hash.replace("#", "") || "A02"); }
    });
  }

  function abrir(id) {
    aulaAtual = id;
    document.querySelectorAll("#abas .aba").forEach(function (b) { b.classList.toggle("ativa", b.getAttribute("data-aula") === id); });
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
    $("#detalhe").innerHTML = "";
    if (id === "alunos") return carregarAlunos();
    return carregarAula();
  }

  /* ── uma aula ────────────────────────────────────────────────────────── */
  function maximo(x) {
    if (typeof x === "number") return x;
    var m = /\/(\d+)/.exec(String(x || ""));
    return m ? Number(m[1]) : null;
  }
  function cor(v, max) {
    if (max == null || typeof v !== "number") return "";
    var p = v / max; return p >= 0.75 ? "alto" : (p < 0.5 ? "baixo" : "");
  }
  function carregarAula() {
    var id = aulaAtual;
    $("#conteudo").innerHTML = '<p class="nota">Carregando…</p>';
    return chamar({ acao: "prof_aula", aula: id }).then(function (d) {
      if (id !== aulaAtual) return;
      if (!d.ok) { $("#conteudo").innerHTML = '<div class="aviso">' + esc(d.erro) + "</div>"; return; }
      dadosAula = d;
      desenharAula(d, null);
      return iniciarPython().then(function (p) {
        if (!p || id !== aulaAtual) return;
        try {
          var R = JSON.parse(p.montar(id, JSON.stringify(d)));
          desenharAula(d, R);
        } catch (e) { console.error(e); $("#py").textContent = "erro no Python desta aula: " + e.message; }
      });
    });
  }

  function desenharAula(d, R) {
    var cols = d.painel_cols, kpis = d.kpis;
    var linhas = R ? R.linhas : d.entregas.map(function (e) {
      return { rm: e.rm, nome: e.nome, turma: e.turma, grupo: (e.respostas || {}).grupo || "", recebido_em: e.recebido_em,
               protocolo: e.protocolo, tentativas: e.tentativas, correcao: e.correcao, texto: null, respostas: e.respostas };
    });
    var ag = R ? R.agregados : {};
    var entregaram = {};
    d.entregas.forEach(function (e) { entregaram[e.rm] = true; });
    var faltam = d.alunos.filter(function (a) { return !entregaram[a.rm]; });
    var kp = kpis.map(function (k) {
      var v = (k[1] === null || k[1] === "entregas") ? d.entregas.length : (R ? ag[k[1]] : "…");
      if (v && typeof v === "object") v = "–";
      return '<div class="kpi"><b>' + esc(v == null ? "–" : v) + "</b><span>" + esc(k[0]) + "</span></div>";
    }).join("");
    var fracos = R ? (ag.fracos || ag.comentar || []) : [];
    var html =
      '<div class="cab"><h2>' + esc(R ? R.titulo : d.titulo) + "</h2>" +
      '<div class="controles">' +
      '<button class="btn ' + (d.aberta ? "" : "primario") + '" id="b-aberta">' + (d.aberta ? "Fechar entregas" : "Abrir entregas") + "</button>" +
      '<button class="btn ' + (d.gabarito_liberado ? "" : "primario") + '" id="b-gab">' + (d.gabarito_liberado ? "Ocultar gabarito" : "Liberar gabarito") + "</button>" +
      '<button class="btn" id="b-csv1"' + (R ? "" : " disabled") + ">Relatório (CSV)</button>" +
      '<button class="btn" id="b-csv2"' + (R ? "" : " disabled") + ">Respostas escritas (CSV)</button>" +
      '<button class="btn" id="b-atual">Atualizar</button>' +
      '<label class="auto"><input type="checkbox" id="b-auto"' + (auto ? " checked" : "") + "> atualizar a cada 20 s</label>" +
      "</div><p class=\"nota\">Entregas <b>" + (d.aberta ? "abertas" : "fechadas") + "</b> · gabarito <b>" +
      (d.gabarito_liberado ? "liberado" : "oculto") + "</b> para quem já entregou.</p></div>" +
      '<div class="kpis">' + kp + "</div>" +
      (fracos.length && d.entregas.length ? '<div class="comentar"><b>Comentar na correção</b> (abaixo de 60%): ' + esc(fracos.join(" · ")) + "</div>" : "") +
      (R && R.divergentes.length ? '<div class="aviso">Atenção: a correção guardada difere da do Python para ' + esc(R.divergentes.join(", ")) + ". O painel mostra a do Python.</div>" : "") +
      '<div class="tabela-rolagem"><table class="t"><thead><tr><th>Hora</th><th>RM</th><th>Aluno</th><th>Turma</th><th>Gr.</th>' +
      cols.map(function (c) { return "<th>" + esc(c[0]) + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" +
      (linhas.length ? linhas.map(function (l, i) {
        var c = l.correcao || {};
        var tds = cols.map(function (k) {
          var v = c[k[1]], max = maximo(k[2]);
          var txt = (v == null || v === "") ? "–" : (k[1] === "objetivo_pct" ? v + "%" : (k[1] === "razao_tempos" ? v + "x" :
                    (typeof v === "boolean" ? (v ? "sim" : "não") : v)));
          return '<td class="num ' + cor(v, max) + '">' + esc(txt) + "</td>";
        }).join("");
        return "<tr><td>" + esc(String(l.recebido_em).slice(5, 16)) + "</td><td>" + esc(l.rm) + '</td><td><a href="#" data-i="' + i + '">' +
          esc(l.nome) + "</a>" + (l.tentativas > 1 ? ' <i class="s">' + l.tentativas + "ª</i>" : "") + "</td><td>" + esc(l.turma) +
          "</td><td>" + esc(l.grupo) + "</td>" + tds + '<td><button class="mini" data-reabrir="' + esc(l.rm) + '" data-nome="' + esc(l.nome) +
          '">reabrir</button></td></tr>';
      }).join("") : '<tr><td colspan="' + (6 + cols.length) + '" class="nota">Nenhuma entrega ainda.</td></tr>') +
      "</tbody></table></div>" +
      '<details class="faltam"><summary>' + faltam.length + " aluno(s) cadastrado(s) ainda sem entrega nesta aula</summary><p>" +
      (faltam.map(function (a) { return esc(a.nome) + " (" + esc(a.rm) + ")"; }).join(" · ") || "—") + "</p></details>";
    $("#conteudo").innerHTML = html;

    $("#b-aberta").onclick = function () { config({ aberta: !d.aberta }); };
    $("#b-gab").onclick = function () { config({ gabarito_liberado: !d.gabarito_liberado }); };
    $("#b-atual").onclick = function () { carregarAula(); carregarResumo(false); };
    $("#b-auto").onchange = function (ev) {
      if (auto) clearInterval(auto);
      auto = ev.target.checked ? setInterval(function () { if (aulaAtual && aulaAtual !== "alunos") carregarAula(); }, 20000) : null;
    };
    if (R) {
      $("#b-csv1").onclick = function () { baixar(R.csv_resumo, aulaAtual + "_relatorio.csv"); };
      $("#b-csv2").onclick = function () { baixar(R.csv_detalhado, aulaAtual + "_detalhado.csv"); };
    }
    document.querySelectorAll("[data-i]").forEach(function (a) {
      a.onclick = function (ev) {
        ev.preventDefault();
        var l = linhas[Number(a.getAttribute("data-i"))];
        var corpo = l.texto != null ? l.texto : JSON.stringify(l.respostas, null, 1);
        $("#detalhe").innerHTML = '<div class="cartao"><h3>' + esc(l.nome) + " · RM " + esc(l.rm) + " · protocolo " + esc(l.protocolo) +
          '</h3><pre>' + esc(corpo) + "</pre></div>";
        $("#detalhe").scrollIntoView({ behavior: "smooth" });
      };
    });
    document.querySelectorAll("[data-reabrir]").forEach(function (b) {
      b.onclick = function () { reabrir(b.getAttribute("data-reabrir"), b.getAttribute("data-nome")); };
    });
  }

  function config(mud) {
    mud.acao = "prof_config"; mud.aula = aulaAtual;
    chamar(mud).then(function (j) {
      if (!j.ok) return aviso(esc(j.erro));
      aviso("Aula " + Number(aulaAtual.slice(1)) + ": entregas " + (j.aberta ? "abertas" : "fechadas") + ", gabarito " +
            (j.gabarito_liberado ? "liberado" : "oculto") + ".", "ok");
      carregarResumo(false); carregarAula();
    });
  }

  function reabrir(rm, nome) {
    var motivo = prompt("Reabrir a entrega de " + nome + " (RM " + rm + ") na aula " + Number(aulaAtual.slice(1)) +
      "?\n\nA entrega atual é ZERADA: sai do relatório e vai para a aba Historico da planilha. " +
      "O aluno poderá entregar de novo.\n\nMotivo (opcional):", "");
    if (motivo === null) return;
    chamar({ acao: "prof_reabrir", aula: aulaAtual, rm: rm, motivo: motivo }).then(function (j) {
      if (!j.ok) return aviso(esc(j.erro));
      aviso("Entrega de " + esc(nome) + " reaberta. A anterior está na aba Historico da planilha.", "ok");
      carregarResumo(false); carregarAula();
    });
  }

  function baixar(txt, nome) {
    var b = new Blob([txt], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ── alunos ──────────────────────────────────────────────────────────── */
  function carregarAlunos() {
    $("#conteudo").innerHTML = '<p class="nota">Carregando…</p>';
    chamar({ acao: "prof_alunos" }).then(function (j) {
      if (aulaAtual !== "alunos") return;
      if (!j.ok) { $("#conteudo").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      var ls = j.alunos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      $("#conteudo").innerHTML = '<div class="cab"><h2>Alunos cadastrados</h2><p class="nota">Para um aluno que esqueceu a senha: ' +
        "zere a senha; a próxima que ele digitar passa a valer. Zere só quando o próprio aluno pedir.</p></div>" +
        '<input id="filtro" placeholder="filtrar por nome, RM ou turma" class="filtro">' +
        '<div class="tabela-rolagem"><table class="t"><thead><tr><th>RM</th><th>Nome</th><th>Turma</th><th>Entregas</th><th>Último acesso</th><th></th></tr></thead><tbody>' +
        ls.map(function (a) {
          return '<tr data-busca="' + esc((a.rm + " " + a.nome + " " + a.turma).toLowerCase()) + '"><td>' + esc(a.rm) + "</td><td>" + esc(a.nome) +
            "</td><td>" + esc(a.turma) + "</td><td>" + (a.entregas.map(function (x) { return "A" + Number(x.slice(1)); }).join(" ") || "—") +
            "</td><td>" + esc(String(a.ultimo_acesso).slice(0, 16)) + "</td><td>" +
            (a.tem_senha ? '<button class="mini" data-zerar="' + esc(a.rm) + '" data-nome="' + esc(a.nome) + '">zerar senha</button>' : '<i class="s">senha zerada</i>') +
            "</td></tr>";
        }).join("") + "</tbody></table></div>";
      $("#filtro").oninput = function (ev) {
        var q = ev.target.value.toLowerCase();
        document.querySelectorAll("[data-busca]").forEach(function (tr) { tr.hidden = tr.getAttribute("data-busca").indexOf(q) < 0; });
      };
      document.querySelectorAll("[data-zerar]").forEach(function (b) {
        b.onclick = function () {
          if (!confirm("Zerar a senha de " + b.getAttribute("data-nome") + "? A próxima senha que alguém digitar com esse RM passa a valer.")) return;
          chamar({ acao: "prof_zerar_senha", rm: b.getAttribute("data-zerar") }).then(function (r) {
            aviso(r.ok ? "Senha zerada. Peça ao aluno para entrar agora com uma senha nova." : esc(r.erro), r.ok ? "ok" : "");
            carregarAlunos();
          });
        };
      });
    });
  }

  /* ── início ──────────────────────────────────────────────────────────── */
  if (chave) carregarResumo(true); else { $("#entrada").hidden = false; }
})();
