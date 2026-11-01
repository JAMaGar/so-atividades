/* Painel do professor — P1 on-line: andamento ao vivo, notas, correção das
   discursivas, análise das questões, tempo extra, reabertura e liberação. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var CH = "so:chave_professor";
  var chave = sessionStorage.getItem(CH) || "";
  var dados = null, tela = "andamento", auto = null, tic = null, recebidoEm = 0;
  var ROTULO = { nao_iniciada: "não iniciou", em_andamento: "fazendo", enviada: "enviou", enviada_auto: "envio automático" };
  var POS = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "B1", "B2", "B3", "B4", "C1", "C2"];
  var LETRAS = "ABCD";

  function esc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function md(t) { return esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function br(x, c) { return x === "" || x === null || x === undefined ? "—" : Number(x).toFixed(c === undefined ? 1 : c).replace(".", ","); }
  function chamar(corpo) {
    corpo.chave = chave;
    if (!window.SO_CONFIG || /COLE_AQUI/.test(SO_CONFIG.API)) return Promise.resolve({ ok: false, erro: "config.js sem a URL do Apps Script" });
    return fetch(SO_CONFIG.API, { method: "POST", body: JSON.stringify(corpo), headers: { "Content-Type": "text/plain;charset=utf-8" } })
      .then(function (r) { return r.json(); })
      .catch(function (e) { return { ok: false, erro: "sem conexão: " + e.message }; });
  }
  function aviso(msg, tipo) {
    $("#msg").innerHTML = msg ? '<div class="aviso ' + (tipo || "") + '">' + msg + "</div>" : "";
    if (msg && tipo === "ok") setTimeout(function () { $("#msg").innerHTML = ""; }, 4000);
  }

  /* ── entrada ─────────────────────────────────────────────────────────── */
  $("#form-chave").addEventListener("submit", function (ev) {
    ev.preventDefault(); chave = $("#chave").value.trim();
    chamar({ acao: "prof_p1_painel" }).then(function (j) {
      if (!j.ok) { $("#msg-chave").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      sessionStorage.setItem(CH, chave); abrir(j);
    });
  });
  $("#bt-sair").onclick = function () { sessionStorage.removeItem(CH); location.reload(); };
  document.querySelectorAll("#abas .aba").forEach(function (b) {
    b.onclick = function () {
      tela = b.getAttribute("data-tela");
      document.querySelectorAll("#abas .aba").forEach(function (x) { x.classList.toggle("ativa", x === b); });
      aviso(""); mostrar();
    };
  });

  function abrir(j) { $("#entrada").hidden = true; $("#painel").hidden = false; receber(j); }
  function recarregar() { return chamar({ acao: "prof_p1_painel" }).then(function (j) { if (j.ok) receber(j); else aviso(esc(j.erro)); }); }
  function receber(j) {
    dados = j; recebidoEm = Date.now();
    $("#planilha").href = j.planilha;
    var c = contar();
    $("#resumo").innerHTML = "<b>" + esc(j.titulo) + "</b> · " + j.alunos.length + " cadastrados · " + c.em_andamento + " fazendo · " +
      (c.enviada + c.enviada_auto) + " enviadas (" + c.enviada_auto + " automáticas) · " + c.nao_iniciada + " não iniciaram";
    $("#controles").innerHTML =
      '<span class="st ' + (j.aberta ? "em_andamento" : "") + '">' + (j.aberta ? "aberta para início" : "fechada para início") + "</span>" +
      '<button class="btn" id="b-abrir">' + (j.aberta ? "Fechar para novos inícios" : "Abrir a prova") + "</button>" +
      '<span class="st ' + (j.liberada ? "enviada" : "") + '">' + (j.liberada ? "notas liberadas" : "notas ocultas") + "</span>" +
      '<button class="btn" id="b-liberar">' + (j.liberada ? "Ocultar notas" : "Liberar notas e correção") + "</button>" +
      '<button class="btn" id="b-csv">Notas (CSV)</button><button class="btn" id="b-atual">Atualizar</button>' +
      '<label class="auto"><input type="checkbox" id="b-auto"' + (auto ? " checked" : "") + "> atualizar a cada 20 s</label>";
    $("#b-abrir").onclick = function () {
      var v = !dados.aberta;
      if (!confirm(v ? "Abrir a prova? Qualquer aluno cadastrado poderá iniciar." :
                       "Fechar para novos inícios? Quem já começou continua até o fim do próprio tempo.")) return;
      chamar({ acao: "prof_p1_config", aberta: v }).then(function (r) { aviso(r.ok ? "Feito." : esc(r.erro), r.ok ? "ok" : ""); recarregar(); });
    };
    $("#b-liberar").onclick = function () {
      var v = !dados.liberada, fazendo = contar().em_andamento, pend = dados.alunos.filter(function (a) { return a.pendentes; }).length;
      var txt = v ? "Liberar nota e correção comentada para quem enviou?" + (fazendo ? "\n\nATENÇÃO: " + fazendo + " aluno(s) ainda estão fazendo a prova." : "") +
                    (pend ? "\n\n" + pend + " prova(s) ainda têm discursivas sem nota." : "") : "Ocultar as notas dos alunos?";
      if (!confirm(txt)) return;
      chamar({ acao: "prof_p1_config", liberada: v }).then(function (r) { aviso(r.ok ? "Feito." : esc(r.erro), r.ok ? "ok" : ""); recarregar(); });
    };
    $("#b-atual").onclick = recarregar;
    $("#b-csv").onclick = csv;
    $("#b-auto").onchange = function (e) { clearInterval(auto); auto = e.target.checked ? setInterval(function () { if (tela === "andamento") recarregar(); }, 20000) : null; };
    mostrar();
  }
  function contar() {
    var c = { nao_iniciada: 0, em_andamento: 0, enviada: 0, enviada_auto: 0 };
    dados.alunos.forEach(function (a) { c[a.status]++; });
    return c;
  }
  function mostrar() {
    clearInterval(tic);
    if (tela === "andamento") return andamento();
    if (tela === "analise") return analise();
    return discursivas(tela);
  }

  /* ── andamento ───────────────────────────────────────────────────────── */
  function restante(a) {
    var ms = Math.max(0, a.restante_ms - (Date.now() - recebidoEm)), s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function andamento() {
    var ord = { em_andamento: 0, enviada_auto: 1, enviada: 2, nao_iniciada: 3 };
    var ls = dados.alunos.slice().sort(function (a, b) { return ord[a.status] - ord[b.status] || a.nome.localeCompare(b.nome); });
    var h = '<input id="filtro" class="filtro" placeholder="filtrar por nome, RM ou turma">';
    h += '<div class="tabela-rolagem"><table class="t"><thead><tr><th>RM</th><th>Nome</th><th>Turma</th><th>Situação</th><th>Início</th>' +
         "<th>Restante</th><th>Respondidas</th><th>Envio</th><th>Obj.+cálc. (8)</th><th>Disc. (2)</th><th>Nota</th><th></th></tr></thead><tbody>";
    h += ls.map(function (a) {
      var acoes = "";
      if (a.status !== "nao_iniciada") acoes += '<button class="mini" data-det="' + esc(a.rm) + '">ver prova</button> ';
      if (a.status === "em_andamento" || a.status === "enviada_auto") acoes += '<button class="mini" data-tempo="' + esc(a.rm) + '">+ tempo</button> ';
      if (a.status !== "nao_iniciada") acoes += '<button class="mini" data-reabrir="' + esc(a.rm) + '" data-nome="' + esc(a.nome) + '">reabrir</button>';
      return '<tr data-busca="' + esc((a.rm + " " + a.nome + " " + a.turma).toLowerCase()) + '"><td>' + esc(a.rm) + "</td><td>" + esc(a.nome) +
        (a.tentativas_anteriores ? ' <i class="s">' + a.tentativas_anteriores + " reab.</i>" : "") + "</td><td>" + esc(a.turma) +
        '</td><td><span class="st ' + a.status + '">' + ROTULO[a.status] + "</span></td><td>" + esc((a.iniciada_em || "").slice(11, 16)) +
        '</td><td class="num"' + (a.status === "em_andamento" ? ' data-rest="' + esc(a.rm) + '"' : "") + ">" + (a.status === "em_andamento" ? restante(a) : "") +
        (a.extra_min ? " <small>(+" + a.extra_min + ")</small>" : "") + '</td><td class="num">' + (a.status === "nao_iniciada" ? "" : (a.respondidas || 0) + "/16") +
        "</td><td>" + esc((a.enviada_em || "").slice(11, 16)) + '</td><td class="num">' + (a.nota_auto === undefined ? "" : br(a.nota_auto, 2)) +
        '</td><td class="num">' + (a.status === "enviada" || a.status === "enviada_auto" ? (a.nota_disc === "" ? '<i class="s">' + a.pendentes + " pend.</i>" : br(a.nota_disc)) : "") +
        '</td><td class="num"><b>' + (a.nota === undefined ? "" : br(a.nota)) + "</b></td><td>" + acoes + "</td></tr>";
    }).join("") + "</tbody></table></div>";
    h += '<p class="nota">"Respondidas" conta o último rascunho salvo. O envio automático acontece no fim do tempo, mesmo com o navegador do aluno fechado; ' +
         "a linha muda de situação na primeira atualização depois disso.</p><div id=\"detalhe\"></div>";
    $("#conteudo").innerHTML = h;
    $("#filtro").oninput = function (ev) {
      var q = ev.target.value.toLowerCase();
      document.querySelectorAll("[data-busca]").forEach(function (tr) { tr.hidden = tr.getAttribute("data-busca").indexOf(q) < 0; });
    };
    tic = setInterval(function () {
      document.querySelectorAll("[data-rest]").forEach(function (td) {
        var a = dados.alunos.filter(function (x) { return x.rm === td.getAttribute("data-rest"); })[0];
        if (a) td.firstChild.textContent = restante(a);
      });
    }, 1000);
    document.querySelectorAll("[data-det]").forEach(function (b) { b.onclick = function () { detalhe(b.getAttribute("data-det")); }; });
    document.querySelectorAll("[data-tempo]").forEach(function (b) {
      b.onclick = function () {
        var m = prompt("Quantos minutos a mais para o RM " + b.getAttribute("data-tempo") + "? (1 a 90)", "10");
        if (!m) return;
        chamar({ acao: "prof_p1_tempo", rm: b.getAttribute("data-tempo"), minutos: Number(m) }).then(function (r) {
          aviso(r.ok ? "Novo prazo: " + esc(r.prazo_em) + (r.status === "em_andamento" ? "." : " (o prazo novo já passou; a prova segue enviada).") : esc(r.erro), r.ok ? "ok" : "");
          recarregar();
        });
      };
    });
    document.querySelectorAll("[data-reabrir]").forEach(function (b) {
      b.onclick = function () {
        var motivo = prompt("Reabrir a prova de " + b.getAttribute("data-nome") + "?\n\nA tentativa atual vai para a aba ProvasHistorico e o aluno faz uma prova NOVA (outro sorteio), com 90 minutos. Use só em caso de problema comprovado.\n\nMotivo:");
        if (motivo === null) return;
        chamar({ acao: "prof_p1_reabrir", rm: b.getAttribute("data-reabrir"), motivo: motivo }).then(function (r) {
          aviso(r.ok ? "Prova reaberta. Lembre que ela só pode ser iniciada com a prova aberta." : esc(r.erro), r.ok ? "ok" : ""); recarregar();
        });
      };
    });
  }

  function detalhe(rm) {
    $("#detalhe").innerHTML = '<div class="cartao"><p class="nota">Carregando…</p></div>';
    chamar({ acao: "prof_p1_detalhe", rm: rm }).then(function (j) {
      if (!j.ok) { $("#detalhe").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      var R = j.resultado, h = '<div class="cartao"><h3>' + esc(j.nome) + " · RM " + esc(j.rm) + " · " + esc(j.turma) + "</h3>" +
        '<p class="nota">Situação: ' + ROTULO[j.status] + " · início " + esc(j.iniciada_em) + " · envio " + esc(j.enviada_em || "—") +
        " · protocolo " + esc(j.protocolo || "—") + "<br>Objetivas e cálculo " + br(R.nota_auto, 2) + " · discursivas " + br(R.nota_disc) +
        " · <b>nota " + br(R.nota) + "</b></p>";
      R.questoes.forEach(function (q) {
        var c = q.correcao;
        h += '<div class="det-q"><b>' + q.n + ". " + q.pos + " · " + esc(c.id) + "</b> — " + (c.pontos === null ? "a corrigir" : br(c.pontos, 2) + " / " + br(c.max)) +
             (c.anulada ? " (anulada)" : "") + '<div class="enun" style="font-size:.92rem">' + md(q.enunciado) + "</div>";
        if (q.parte === "A") h += "<div>Marcou: <b>" + (c.marcada === null ? "em branco" : LETRAS[c.marcada] + ") " + esc(q.alternativas[c.marcada])) +
                                  "</b><br>Certa: " + LETRAS[c.certa] + ") " + esc(q.alternativas[c.certa]) + "</div>";
        else if (q.parte === "B") h += c.itens.map(function (it) { return "<div>" + esc(it.rotulo) + ": <b>" + esc(it.aluno) + "</b> · esperado " + esc(it.certo) + " · " + br(it.pontos) + "</div>"; }).join("");
        else h += '<div class="texto-aluno">' + (esc(c.texto) || "<i>(em branco)</i>") + "</div>";
        h += "</div>";
      });
      $("#detalhe").innerHTML = h + "</div>";
      $("#detalhe").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ── discursivas ─────────────────────────────────────────────────────── */
  function discursivas(pos) {
    $("#conteudo").innerHTML = '<div class="cartao"><p class="nota">Carregando as respostas de ' + pos + "…</p></div>";
    chamar({ acao: "prof_p1_discursivas", pos: pos }).then(function (j) {
      if (!j.ok) { $("#conteudo").innerHTML = '<div class="aviso">' + esc(j.erro) + "</div>"; return; }
      var ls = j.respostas, feitas = ls.filter(function (x) { return x.nota !== null; }).length;
      var h = '<p class="nota">' + ls.length + " provas enviadas · " + feitas + " corrigidas. As respostas estão agrupadas pela variante sorteada; " +
              "critério de 3 níveis (0 · 0,5 · 1,0), com décimos se precisar. A nota é gravada ao tocar no botão.</p>";
      var grupo = null;
      ls.forEach(function (x, i) {
        if (x.id !== grupo) {
          if (grupo) h += "</div>";
          grupo = x.id;
          h += '<div class="variante"><h3>' + esc(x.id) + "</h3><div class=\"enun\">" + md(x.enunciado) + '</div><details class="ref"><summary>resposta esperada e critério</summary>' +
               '<div class="coment"><b>Esperada.</b> ' + md(x.esperada) + '</div><div class="coment"><b>1,0:</b> ' + esc(x.rubrica["1.0"]) +
               "<br><b>0,5:</b> " + esc(x.rubrica["0.5"]) + "<br><b>0:</b> " + esc(x.rubrica["0"]) + "</div></details>";
        }
        h += '<div class="cartao disc-card" id="dc' + i + '"><b>' + esc(x.nome) + "</b> · RM " + esc(x.rm) +
             '<div class="texto-aluno" style="margin-top:.4rem">' + (esc(x.texto) || "<i>(em branco)</i>") + '</div><div class="notas">' +
             ["0", "0.5", "1"].map(function (n) {
               return '<button class="btn' + (x.nota !== null && Number(x.nota) === Number(n) ? " sel" : "") + '" data-n="' + n + '" data-i="' + i + '">' + br(n) + "</button>";
             }).join("") +
             '<input class="num" style="max-width:5rem;margin:0" inputmode="decimal" placeholder="outra" data-outra="' + i + '" value="' +
             (x.nota !== null && [0, 0.5, 1].indexOf(Number(x.nota)) < 0 ? br(x.nota) : "") + '">' +
             '<input class="com" placeholder="comentário para o aluno (opcional)" data-com="' + i + '" value="' + esc(x.comentario) + '">' +
             '<span class="nota" data-ok="' + i + '">' + (x.nota !== null ? "gravada: " + br(x.nota) : "") + "</span></div></div>";
      });
      if (grupo) h += "</div>";
      if (!ls.length) h += '<div class="cartao vazio"><p>Nenhuma prova enviada ainda.</p></div>';
      $("#conteudo").innerHTML = h;
      function gravar(i, nota) {
        var x = ls[i], com = document.querySelector('[data-com="' + i + '"]').value;
        document.querySelector('[data-ok="' + i + '"]').textContent = "gravando…";
        chamar({ acao: "prof_p1_nota", rm: x.rm, pos: pos, nota: nota, comentario: com }).then(function (r) {
          document.querySelector('[data-ok="' + i + '"]').textContent = r.ok ? "gravada: " + br(nota) + (r.nota !== "" ? " · nota final " + br(r.nota) : "") : r.erro;
          if (r.ok) { x.nota = nota; document.querySelectorAll('[data-i="' + i + '"]').forEach(function (b) { b.classList.toggle("sel", Number(b.getAttribute("data-n")) === nota); }); }
        });
      }
      document.querySelectorAll("[data-n]").forEach(function (b) { b.onclick = function () { gravar(Number(b.getAttribute("data-i")), Number(b.getAttribute("data-n"))); }; });
      document.querySelectorAll("[data-outra]").forEach(function (inp) {
        inp.onchange = function () {
          var n = Number(String(inp.value).replace(",", "."));
          if (inp.value.trim() === "") return;
          if (!(n >= 0 && n <= 1)) { alert("De 0 a 1, em décimos."); return; }
          gravar(Number(inp.getAttribute("data-outra")), Math.round(n * 10) / 10);
        };
      });
      document.querySelectorAll("[data-com]").forEach(function (inp) {
        inp.onchange = function () { var i = Number(inp.getAttribute("data-com")); if (ls[i].nota !== null) gravar(i, Number(ls[i].nota)); };
      });
    });
  }

  /* ── análise das questões ────────────────────────────────────────────── */
  function analise() {
    var env = dados.alunos.filter(function (a) { return a.itens; });
    if (env.length < 2) { $("#conteudo").innerHTML = '<div class="cartao vazio"><p>A análise aparece com pelo menos duas provas enviadas.</p></div>'; return; }
    var tot = function (a) { return a.itens.filter(function (i) { return i.pos[0] !== "C"; }).reduce(function (s, i) { return s + i.pontos; }, 0); };
    var ord = env.slice().sort(function (a, b) { return tot(b) - tot(a); }), k = Math.max(1, Math.round(env.length * 0.27));
    var sup = ord.slice(0, k), inf = ord.slice(-k);
    var porVar = {};
    env.forEach(function (a) {
      a.itens.forEach(function (i) {
        if (i.pos[0] === "C" || i.pontos === null) return;
        var chaveV = i.pos[0] === "B" ? i.pos : i.id;
        var v = porVar[chaveV] = porVar[chaveV] || { pos: i.pos, id: chaveV, n: 0, soma: 0, max: i.max, rms: {} };
        v.n++; v.soma += i.pontos; v.rms[a.rm] = i.pontos / i.max;
      });
    });
    var media = function (grupo, v) { var xs = grupo.filter(function (a) { return a.rm in v.rms; }).map(function (a) { return v.rms[a.rm]; });
                                      return xs.length ? xs.reduce(function (s, x) { return s + x; }, 0) / xs.length : null; };
    var linhas = Object.keys(porVar).map(function (k2) {
      var v = porVar[k2], ac = v.soma / (v.n * v.max), ms = media(sup, v), mi = media(inf, v);
      return { v: v, ac: ac, disc: ms === null || mi === null ? null : ms - mi };
    }).sort(function (a, b) { return POS.indexOf(a.v.pos) - POS.indexOf(b.v.pos) || (a.v.id < b.v.id ? -1 : 1); });
    var anul = dados.anuladas || [];
    var h = '<p class="nota">' + env.length + " provas enviadas. <b>Acerto</b> = média de pontos sobre o máximo. <b>Discriminação</b> = acerto do grupo de " +
            "notas mais altas menos o do grupo mais baixo (27% de cada lado, só objetivas e cálculo): abaixo de 0,2 a questão separa pouco quem sabe de quem não sabe; " +
            "negativa sugere enunciado ambíguo ou gabarito a conferir. Com turmas pequenas, cada variante tem poucos alunos: leia como alerta, não como veredito. " +
            "Na parte B, a análise é por posição, porque cada aluno recebe números diferentes.</p>";
    h += '<div class="tabela-rolagem"><table class="t"><thead><tr><th>Posição</th><th>Variante</th><th>Alunos</th><th>Acerto</th><th>Discriminação</th><th></th></tr></thead><tbody>';
    var porPos = {};
    linhas.forEach(function (l) { (porPos[l.v.pos] = porPos[l.v.pos] || []).push(l.ac); });
    h += linhas.map(function (l) {
      var mpos = porPos[l.v.pos].reduce(function (s, x) { return s + x; }, 0) / porPos[l.v.pos].length;
      var cls = l.ac < mpos - 0.25 ? "a-baixo" : l.ac > mpos + 0.25 ? "a-alto" : "";
      var an = anul.indexOf(l.v.id) >= 0;
      return "<tr><td>" + l.v.pos + "</td><td>" + esc(l.v.id) + (an ? ' <i class="s">anulada</i>' : "") + '</td><td class="num">' + l.v.n +
             '</td><td class="num ' + cls + '">' + Math.round(l.ac * 100) + '%</td><td class="num' + (l.disc !== null && l.disc < 0 ? " a-baixo" : "") + '">' +
             (l.disc === null ? "—" : br(l.disc, 2)) + '</td><td><button class="mini" data-anular="' + esc(l.v.id) + '" data-v="' + (an ? 0 : 1) + '">' +
             (an ? "desfazer anulação" : "anular") + "</button></td></tr>";
    }).join("") + "</tbody></table></div>";
    h += '<p class="nota">Vermelho no acerto: a variante ficou bem mais difícil que as outras da mesma posição (mais de 25 pontos percentuais abaixo da média da posição). ' +
         "Anular dá pontuação integral naquela variante (ou posição, na parte B) a todos que a receberam; as notas são recalculadas na hora.</p>";
    $("#conteudo").innerHTML = h;
    document.querySelectorAll("[data-anular]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-anular"), v = b.getAttribute("data-v") === "1";
        if (!confirm((v ? "Anular " : "Desfazer a anulação de ") + id + "?")) return;
        chamar({ acao: "prof_p1_anular", id: id, anular: v }).then(function (r) { aviso(r.ok ? "Notas recalculadas." : esc(r.erro), r.ok ? "ok" : ""); recarregar(); });
      };
    });
  }

  /* ── CSV ─────────────────────────────────────────────────────────────── */
  function csv() {
    var cab = ["RM", "Nome", "Turma", "Situação", "Início", "Envio", "Tempo extra (min)", "Objetivas e cálculo", "Discursivas", "Nota"].concat(POS);
    var q = function (x) { x = String(x == null ? "" : x); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    var num = function (x) { return x === "" || x === null || x === undefined ? "" : String(x).replace(".", ","); };
    var linhas = dados.alunos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).map(function (a) {
      var pts = {}; (a.itens || []).forEach(function (i) { pts[i.pos] = i.pontos; });
      return [a.rm, a.nome, a.turma, ROTULO[a.status], a.iniciada_em || "", a.enviada_em || "", a.extra_min || "", num(a.nota_auto), num(a.nota_disc), num(a.nota)]
        .concat(POS.map(function (p) { return num(pts[p]); })).map(q).join(";");
    });
    var b = new Blob(["\ufeff" + [cab.map(q).join(";")].concat(linhas).join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "P1_notas.csv"; document.body.appendChild(a); a.click(); a.remove();
  }

  if (chave) chamar({ acao: "prof_p1_painel" }).then(function (j) { if (j.ok) abrir(j); else { $("#entrada").hidden = false; } });
  else $("#entrada").hidden = false;
})();
