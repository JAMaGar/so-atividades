/* Atividades da Aula 7 v2 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a07v2_respostas_v1";
const ETAPAS = 6;
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── estado ───────────────────────────────────────────────────────────── */
const vazio = () => ({
  aluno: "", turma: "", grupo: "",
  red: { lab: [], dois: [], jogo: [], det: [] },   // toques de cada redução
  a1: { fechamento: "" },
  a2: { medidas: {}, casos: {} },
  a3: { decisoes: {}, pos: 0, escrita: "" },
  a4: { respostas: {}, vitima: "" },
  iniciado_em: new Date().toISOString(),
});

let R = vazio();
try {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) R = Object.assign(vazio(), JSON.parse(salvo));
} catch (e) { /* armazenamento indisponível: segue em memória */ }

const salvar = () => {
  try { localStorage.setItem(CHAVE, JSON.stringify(R)); } catch (e) {}
};

/* ── cabeçalho ────────────────────────────────────────────────────────── */
function montarCabecalho() {
  $("#topo-aula").textContent = AULA.titulo.split("—")[0].trim();
  $("#sub-aula").textContent = AULA.disciplina + " · " + AULA.instituicao;
  $("#rodape-txt").textContent = AULA.professor + " · " + AULA.instituicao;
  document.title = "Atividades — " + AULA.titulo;
  if (typeof AVISO_REDE !== "undefined" && AVISO_REDE) {
    const faixa = document.createElement("div");
    faixa.className = "faixa-rede";
    faixa.textContent = AVISO_REDE;
    $("#app").insertBefore(faixa, $("#app").firstChild);
  }
}

function montarIdentificacao() {
  [["nome", "aluno"], ["turma", "turma"], ["grupo", "grupo"]].forEach(([id, campo]) => {
    const el = document.getElementById(id);
    el.value = R[campo] || "";
    el.addEventListener("input", () => { R[campo] = el.value; salvar(); });
  });
}

/* ── helpers de componente ────────────────────────────────────────────── */
function textarea(valor, linhas, placeholder, onInput) {
  const t = document.createElement("textarea");
  t.rows = linhas || 2;
  t.placeholder = placeholder || "";
  t.value = valor || "";
  t.addEventListener("input", () => { onInput(t.value); salvar(); });
  return t;
}

function campoTexto(valor, tipo, onInput) {
  const i = document.createElement("input");
  i.type = tipo === "numero" ? "text" : "text";
  if (tipo === "numero") i.inputMode = "decimal";
  i.value = valor || "";
  i.addEventListener("input", () => { onInput(i.value); salvar(); });
  return i;
}

function botoesOpcao(opcoes, atual, coluna, onEscolha) {
  const div = document.createElement("div");
  div.className = "opcoes" + (coluna ? " coluna" : "");
  opcoes.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opc-btn" + (coluna ? " largo" : "") + (atual === o.id ? " sel" : "");
    b.textContent = o.texto;
    b.onclick = () => {
      div.querySelectorAll(".opc-btn").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      onEscolha(o.id);
      salvar();
      atualizarProgresso();
    };
    div.appendChild(b);
  });
  return div;
}

/* ── redução passo a passo (atividades 1, 3A e 4) ─────────────────────── */
const vt = (v) => "(" + v.join(", ") + ")";

function montarReducao(id, alvo) {
  const red = REDUCOES[id];
  const toques = R.red[id] = R.red[id] || [];
  const box = document.createElement("div");
  box.className = "red";
  alvo.appendChild(box);
  const veredito = (r) => {
    if (red.tipo === "seguro") {
      return r.sobraram.length
        ? `<b>Estado inseguro.</b> Não há ordem em que todos terminam: ${r.sobraram.join(", ")} ficariam presos.`
        : `<b>Estado seguro.</b> Todos terminam na ordem ${r.feitos.join(" → ")}.`;
    }
    return r.sobraram.length
      ? `<b>Deadlock.</b> ${r.sobraram.join(", ")} ${r.sobraram.length > 1 ? "estão travados" : "está travado"}.`
        + (r.feitos.length ? ` (${r.feitos.join(", ")} ${r.feitos.length > 1 ? "terminaram" : "terminou"}.)` : "")
      : `<b>Sem deadlock.</b> Todos terminam: ${r.feitos.join(" → ")}.`;
  };
  function desenhar() {
    const r = REDUCAO.repetir(red, toques);
    const ult = r.log[r.log.length - 1];
    const cab = `<tr><th></th><th>tem</th><th>${esc(red.rot_precisa)}</th><th></th></tr>`;
    const linhas = red.processos.map((p) => {
      const f = r.feitos.indexOf(p) >= 0;
      return `<tr class="${f ? "feito" : ""}"><td><b>${p}</b></td><td>${vt(red.tem[p])}</td>
        <td>${vt(red.precisa[p])}</td><td>${f ? "terminou ✓" : ""}</td></tr>`;
    }).join("");
    let h = `<h4>${esc(red.titulo)}</h4>` +
      (red.img ? `<img class="red-img" src="${esc(red.img)}" alt="${esc(red.titulo)}">` : "") +
      `<table class="red-tab">${cab}${linhas}</table>
       <div class="red-livre">Livre agora: <b>${vt(r.livre)}</b>
         <span class="nota">(${esc(red.tipos.join(", "))})</span></div>`;
    if (ult) {
      if (ult.t === "ninguem") {
        h += ult.ok ? "" : `<div class="red-msg erro">Ainda há quem caiba no livre ${vt(ult.livre)}.
          Confira coluna a coluna.</div>`;
      } else if (ult.ok) {
        h += `<div class="red-msg ok"><b>${ult.t} cabe:</b> recebe o que precisa, termina e
          devolve ${vt(red.tem[ult.t])}. Livre: ${vt(ult.antes)} → <b>${vt(ult.livre)}</b>.</div>`;
      } else {
        h += `<div class="red-msg erro"><b>${ult.t} não cabe:</b> precisa de
          ${vt(red.precisa[ult.t])} e o livre é ${vt(ult.livre)}.</div>`;
      }
    }
    if (r.fim) {
      h += `<div class="red-fim">${veredito(r)}<br><span class="nota">Toques errados: ${r.erros}.</span></div>`;
      box.innerHTML = h;
      return;
    }
    box.innerHTML = h + '<p class="rot-q">Quem pode terminar agora?</p>';
    const btns = document.createElement("div");
    btns.className = "red-btns";
    red.processos.filter((p) => r.feitos.indexOf(p) < 0).forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "opc-btn"; b.textContent = p;
      b.onclick = () => { toques.push(p); salvar(); atualizarProgresso(); desenhar(); };
      btns.appendChild(b);
    });
    const n = document.createElement("button");
    n.type = "button"; n.className = "opc-btn ninguem";
    n.textContent = "Ninguém mais pode terminar";
    n.onclick = () => { toques.push("ninguem"); salvar(); atualizarProgresso(); desenhar(); };
    btns.appendChild(n);
    box.appendChild(btns);
  }
  desenhar();
}

const reducaoFeita = (id) => REDUCAO.repetir(REDUCOES[id], R.red[id] || []).fim;

/* ── atividade 1 — reduzir grafos ─────────────────────────────────────── */
function montarA1() {
  $("#a1-titulo").textContent = A1.titulo;
  $("#a1-tempo").textContent = A1.tempo;
  $("#a1-instrucao").textContent = A1.instrucao;
  $("#a1-legenda").innerHTML = '<div class="legenda">' + A1.legenda.map(([a, b]) =>
    `<span><b>${esc(a)}</b> = ${esc(b)}</span>`).join("") + "</div>";
  A1.reducoes.forEach((id) => montarReducao(id, $("#a1-reducoes")));
  $("#a1-fechamento-rot").textContent = A1.fechamento;
  const f = $("#a1-fechamento");
  f.value = R.a1.fechamento || "";
  f.addEventListener("input", () => { R.a1.fechamento = f.value; salvar(); });
}

/* ── atividade 2 — condição e estratégia ──────────────────────────────── */
function montarA2() {
  $("#a2-titulo").textContent = A2.titulo;
  $("#a2-tempo").textContent = A2.tempo;
  $("#a2-instrucao").textContent = A2.instrucao;
  const m = $("#a2-medidas");
  A2.medidas.forEach((it, i) => {
    const box = document.createElement("div");
    box.className = "item-q" + (R.a2.medidas[it.id] ? " respondida" : "");
    box.innerHTML = `<p class="enun"><span class="n">${i + 1}</span>${esc(it.texto)}</p>`;
    const op = A2.condicoes.map((c) => ({ id: c.id, texto: c.texto }));
    box.appendChild(botoesOpcao(op, R.a2.medidas[it.id], true, (v) => {
      R.a2.medidas[it.id] = v; box.classList.add("respondida");
    }));
    m.appendChild(box);
  });
  const c = $("#a2-casos");
  A2.casos.forEach((cs) => {
    const d = R.a2.casos[cs.id] = R.a2.casos[cs.id] || {};
    const box = document.createElement("div");
    box.className = "cartao c-blue";
    box.innerHTML = `<div class="rec">Sistema ${cs.id}</div><h4>${esc(cs.nome)}</h4>
      <p class="nota">${esc(cs.texto)}</p>`;
    box.appendChild(botoesOpcao(A2.estrategias, d.est, true, (v) => { d.est = v; }));
    const l1 = document.createElement("label"); l1.textContent = "Por quê?";
    box.appendChild(l1);
    box.appendChild(textarea(d.porque, 2, "Uma frase.", (v) => { d.porque = v; }));
    const l2 = document.createElement("label"); l2.textContent = "O que se perde com essa escolha?";
    box.appendChild(l2);
    box.appendChild(textarea(d.perde, 2, "Desempenho, uso de recursos, trabalho…",
                             (v) => { d.perde = v; }));
    c.appendChild(box);
  });
}

/* ── atividade 3 — jogo do banqueiro ──────────────────────────────────── */
const vet = (v) => "(" + v.join(", ") + ")";
const descreve = (v) => A3.tipos.map((t, i) => `${v[i]} ${t.replace(/s$/, v[i] === 1 ? "" : "s")}`)
  .join(" e ");

function montarA3() {
  $("#a3-titulo").textContent = A3.titulo;
  $("#a3-tempo").textContent = A3.tempo;
  $("#a3-faseA").textContent = A3.faseA;
  $("#a3-faseB").textContent = A3.faseB;
  montarReducao("jogo", $("#a3-reducao"));
  $("#a3-escrita-rot").textContent = A3.escrita.rot;
  const e = $("#a3-escrita");
  e.value = R.a3.escrita || "";
  e.addEventListener("input", () => { R.a3.escrita = e.value; salvar(); });

  const J = BANQUEIRO.jogar(A3);
  const raiz = $("#a3-jogo");
  raiz.className = "jogo";

  function tabela(st, destaque) {
    const ps = Object.keys(st.maximo);
    const linhas = ps.map((p) => `<tr class="${p === destaque ? "foco" : ""}">
      <td><b>${p}</b></td><td>${vet(st.aloc[p])}</td><td>${vet(st.maximo[p])}</td>
      <td><b>${vet(st.nec[p])}</b></td></tr>`).join("");
    return `<table class="jg-tab"><tr><th></th><th>tem</th><th>máximo</th><th>ainda pode pedir</th></tr>
      ${linhas}</table>
      <div class="jg-livres">Livres agora: <b>${vet(st.disp)}</b>
        <span class="nota">(impressoras, scanners)</span></div>`;
  }

  function desenhar() {
    const k = Math.min(R.a3.pos || 0, J.length);
    if (k >= J.length) {
      const ac = PEDIDOS.filter((id) => R.a3.decisoes[id] === J[+id.slice(1) - 1].certa).length;
      raiz.innerHTML = `<div class="cartao destaque"><h4>Fim do jogo</h4>
        <p class="lead">Você acertou <b>${ac} de ${PEDIDOS.length}</b> decisões na primeira tentativa.</p>
        <p class="nota">Recomeçar serve para treinar; a nota continua sendo a da primeira vez.</p>
        <button class="btn" id="jg-recomecar">Recomeçar para treinar</button></div>`;
      $("#jg-recomecar").onclick = () => {
        Object.keys(R.a3).filter((x) => x.startsWith("_t")).forEach((x) => delete R.a3[x]);
        R.a3.pos = 0; R.a3.treino = true; salvar(); desenhar(); window.scrollTo(0, raiz.offsetTop);
      };
      return;
    }
    const r = J[k], id = "r" + r.n;
    let h = `<div class="jg-rodada">Rodada ${r.n} de ${J.length}</div>` + tabela(r.antes, r.p);
    if (r.tipo === "fim") {
      h += `<div class="cartao c-green"><h4>${r.p} terminou</h4>
        <p class="nota">Devolve tudo o que tinha, ${vet(r.devolve)}. Livres passam a
        <b>${vet(r.depois)}</b>.</p></div>
        <button class="btn primario" id="jg-prox">Próxima rodada</button>`;
      raiz.innerHTML = h;
      $("#jg-prox").onclick = () => { R.a3.pos = k + 1; salvar(); desenhar(); };
      return;
    }
    h += `<div class="cartao c-blue jg-pedido"><h4>${r.p} pede ${vet(r.v)}</h4>
      <p class="nota">${esc(descreve(r.v))}. O que você faz?</p></div>`;
    const respondeu = R.a3.treino ? R.a3["_t" + id] : R.a3.decisoes[id];
    raiz.innerHTML = h;
    if (!respondeu) {
      raiz.appendChild(botoesOpcao(A3.decisoes, null, false, (v) => {
        if (R.a3.treino) R.a3["_t" + id] = v; else if (!R.a3.decisoes[id]) R.a3.decisoes[id] = v;
        salvar(); desenhar();
      }));
      return;
    }
    const ok = respondeu === r.certa;
    const nome = (A3.decisoes.find((d) => d.id === r.certa) || {}).texto;
    let porque;
    if (r.decisao === "conceder") {
      porque = `Se conceder, sobram ${vet(r.info.disp2)} e ainda há uma ordem em que todos
        terminam: <b>${r.info.teste.ordem.join(" → ")}</b>. Estado seguro.`;
    } else if (r.decisao === "negar") {
      porque = `Há recursos livres, mas se conceder sobram ${vet(r.info.disp2)} — e ninguém
        consegue terminar com isso (${r.info.teste.travados.join(", ")} ficariam presos).
        Estado inseguro: <b>${r.p} espera</b>, mesmo havendo recurso.`;
    } else if (r.decisao === "esperar") {
      porque = `Só há ${vet(r.antes.disp)} livres: não dá para atender agora.`;
    } else {
      porque = `${r.p} só pode pedir até ${vet(r.info.nec)} (máximo menos o que já tem):
        o pedido passou do máximo declarado.`;
    }
    raiz.innerHTML += `<div class="aviso ${ok ? "ok" : ""}"><b>${ok ? "Certo" : "A resposta é"}: ${esc(nome)}.</b>
      ${porque}</div>
      <p class="nota">${r.decisao === "conceder" ? `Livres passam a <b>${vet(r.depois)}</b>.`
        : "O pedido fica de fora; o estado não muda."}</p>
      <button class="btn primario" id="jg-prox">Próxima rodada</button>`;
    $("#jg-prox").onclick = () => { R.a3.pos = k + 1; salvar(); atualizarProgresso(); desenhar(); };
  }
  desenhar();
}

/* ── atividade 4 — quiz ───────────────────────────────────────────────── */
function montarA4() {
  $("#det-titulo").textContent = DET.titulo;
  $("#det-tempo").textContent = DET.tempo;
  $("#det-instrucao").textContent = DET.instrucao;
  montarReducao("det", $("#det-reducao"));
  const vb = $("#det-vitima");
  vb.innerHTML = `<label>${esc(DET.vitima)}</label>`;
  vb.appendChild(botoesOpcao(VITIMAS.map((o) => ({ id: o.id,
    texto: `Encerrar ${o.id} · ${o.custo} ${DET.custo_rot}` })), R.a4.vitima, true, (v) => {
    R.a4.vitima = v; }));
  $("#a4-titulo").textContent = A4.titulo;
  $("#a4-tempo").textContent = A4.tempo;
  $("#a4-instrucao").textContent = A4.instrucao;
  const alvo = $("#a4-questoes");
  A4.questoes.forEach((q, i) => {
    const box = document.createElement("div");
    box.className = "item-q" + (R.a4.respostas[q.id] ? " respondida" : "");
    box.innerHTML = `<p class="enun"><span class="n">${i + 1}</span>${esc(q.pergunta)}</p>`;
    box.appendChild(botoesOpcao(q.opcoes, R.a4.respostas[q.id], true, (v) => {
      R.a4.respostas[q.id] = v; box.classList.add("respondida");
    }));
    alvo.appendChild(box);
  });
}

/* ── navegação e progresso ───────────────────────────────────────────── */
function ir(n) {
  $$(".etapa").forEach((s) => s.classList.toggle("ativa",
    Number(s.dataset.etapa) === n));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (n === 5) montarRevisao();
  atualizarProgresso(n);
}

const PEDIDOS = A3.rodadas.map((r, i) => ["r" + (i + 1), r]).filter(([, r]) => r.tipo === "pede")
                          .map(([k]) => k);

function preenchidos() {
  const a1 = A1.reducoes.filter(reducaoFeita).length;
  const a3a = reducaoFeita("jogo") ? 1 : 0;
  const det = (reducaoFeita("det") ? 1 : 0) + (R.a4.vitima ? 1 : 0);
  const a2m = Object.keys(R.a2.medidas).length;
  const a2c = A2.casos.filter((c) => (R.a2.casos[c.id] || {}).est).length;
  const a3 = PEDIDOS.filter((k) => R.a3.decisoes[k]).length;
  const a4 = Object.keys(R.a4.respostas).length;
  return { a1, a2m, a2c, a3, a4, a3a, det };
}

function atualizarProgresso(etapa) {
  const p = preenchidos();
  const total = A1.reducoes.length + A2.medidas.length + A2.casos.length + 1 + PEDIDOS.length
    + 2 + A4.questoes.length;
  const feito = p.a1 + p.a2m + p.a2c + p.a3a + p.a3 + p.det + p.a4;
  const pct = Math.round(100 * feito / total);
  $("#barra").style.width = pct + "%";
}

$$("[data-ir]").forEach((b) => { b.onclick = () => ir(Number(b.dataset.ir)); });

/* ── revisão ─────────────────────────────────────────────────────────── */
function montarRevisao() {
  const p = preenchidos();
  const linhas = [
    ["Atividade 1 — grafos reduzidos", `${p.a1} de ${A1.reducoes.length}`, p.a1 === A1.reducoes.length],
    ["Atividade 2 — medidas classificadas", `${p.a2m} de ${A2.medidas.length}`,
     p.a2m === A2.medidas.length],
    ["Atividade 2 — sistemas com estratégia", `${p.a2c} de ${A2.casos.length}`,
     p.a2c === A2.casos.length],
    ["Jogo — fase A, teste de segurança", p.a3a ? "feito" : "falta", p.a3a === 1],
    ["Jogo — fase B, decisões", `${p.a3} de ${PEDIDOS.length}`, p.a3 === PEDIDOS.length],
    ["Atividade 4 — detecção e vítima", `${p.det} de 2`, p.det === 2],
    ["Quiz — questões respondidas", `${p.a4} de ${A4.questoes.length}`,
     p.a4 === A4.questoes.length],
  ];
  $("#revisao").innerHTML = '<div class="gab"><table>' + linhas.map(([r, v, ok]) =>
    `<tr class="${ok ? "certo" : ""}"><td>${esc(r)}</td><td>${esc(v)}</td></tr>`).join("")
    + "</table></div>";
  const faltas = [];
  if (!R.aluno.trim()) faltas.push("seu nome completo");
  linhas.forEach(([r, , ok]) => { if (!ok) faltas.push(r.toLowerCase()); });
  $("#pendencias").innerHTML = faltas.length
    ? `<div class="aviso"><b>Ainda falta:</b> ${esc(faltas.join("; "))}.<br>
       A entrega é única: se entregar agora, não poderá completar depois.</div>`
    : '<div class="aviso ok">Tudo preenchido. Pode entregar.</div>';
}

/* ── entrega, com reenvio automático ─────────────────────────────────── */
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function enviar(tentativas = 4) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const r = await fetch("api/entregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(R),
      });
      if (r.ok) return await r.json();
      if (r.status >= 400 && r.status < 500) {
        return { erro: (await r.json()).erro || "pedido recusado pelo servidor" };
      }
    } catch (e) { /* rede caiu: tenta de novo */ }
    if (i < tentativas) {
      $("#status-envio").textContent =
        `A rede está cheia. Tentando de novo (${i} de ${tentativas - 1})…`;
      await espera(400 * Math.pow(2, i - 1) + Math.random() * 300);
    }
  }
  return { erro: "não consegui falar com o servidor" };
}

$("#entregar").onclick = async () => {
  if (!R.aluno.trim()) {
    $("#status-envio").textContent = "Escreva seu nome completo na primeira etapa.";
    return ir(0);
  }
  const bt = $("#entregar");
  bt.disabled = true;
  $("#status-envio").textContent = "Entregando…";
  const resp = await enviar();
  bt.disabled = false;
  if (resp.erro) {
    $("#status-envio").innerHTML =
      `<span class="erro-txt">Não deu: ${esc(resp.erro)}.</span> Confira a conexão com a internet e toque em Entregar de novo —
       nada foi perdido.`;
    return;
  }
  R.protocolo = resp.protocolo;
  R.recebido_em = resp.recebido_em;
  salvar();
  $("#status-envio").textContent = "";
  mostrarRecibo(resp);
  ir(6);
};

function mostrarRecibo(resp) {
  $("#recibo-linha").textContent =
    `${R.aluno} · protocolo ${resp.protocolo} · recebido às ` +
    `${String(resp.recebido_em || "").slice(11, 19)}`;
  const c = resp.correcao || {};
  $("#recibo-correcao").innerHTML = `
    <div class="placar">
      <div><span class="n">${c.red_certas ?? "–"}/4</span>
           <span class="r">reduções sem erro</span></div>
      <div><span class="n">${c.a3_acertos ?? "–"}/${PEDIDOS.length}</span>
           <span class="r">decisões certas no jogo</span></div>
      <div><span class="n">${c.nota_quiz ?? "–"}</span>
           <span class="r">nota do quiz (de 10)</span></div>
    </div>
    <p class="nota">A atividade 2 e o quiz aparecem no gabarito, quando o professor
      liberar. As justificativas são lidas pelo professor.</p>`;
}

/* ── baixar cópia ────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const b = new Blob([JSON.stringify(R, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = `A07v2_${(R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ── gabarito (só depois que o professor libera) ─────────────────────── */
$("#ver-gabarito").onclick = async () => {
  const alvo = $("#gabarito");
  alvo.innerHTML = '<p class="nota">consultando…</p>';
  try {
    const r = await fetch("api/gabarito");
    if (r.status === 403) {
      alvo.innerHTML = '<div class="aviso">O gabarito ainda não foi liberado. '
        + "O professor libera depois da correção comentada.</div>";
      return;
    }
    desenharGabarito(await r.json(), alvo);
  } catch (e) {
    alvo.innerHTML = '<div class="aviso">Não consegui consultar o gabarito agora.</div>';
  }
};

function desenharGabarito(g, alvo) {
  const l1 = Object.keys(REDUCOES).map((id) => {
    const c = g.reducoes[id], r = REDUCAO.repetir(REDUCOES[id], R.red[id] || []);
    return `<tr class="${r.correto ? "certo" : "errado"}"><td>${esc(REDUCOES[id].titulo)}</td>
      <td><b>${esc(c.resposta)}</b><br>${esc(c.nota)}</td></tr>`;
  }).join("");
  const lv = `<tr class="${R.a4.vitima === g.vitima.op ? "certo" : "errado"}"><td>vítima</td>
      <td><b>Encerrar ${esc(g.vitima.op)}</b><br>${esc(g.vitima.nota)}</td></tr>`;
  const rotC = (id) => (A2.condicoes.find((x) => x.id === id) || {}).texto || id;
  const l2 = A2.medidas.map((m, i) => {
    const c = g.a2_medidas[m.id];
    return `<tr class="${R.a2.medidas[m.id] === c.op ? "certo" : "errado"}"><td>${i + 1}</td>
      <td><b>${esc(rotC(c.op))}</b><br>${esc(c.nota)}</td></tr>`;
  }).join("");
  const rotE = (id) => (A2.estrategias.find((x) => x.id === id) || {}).texto || id;
  const l3 = A2.casos.map((cs) => {
    const c = g.a2_casos[cs.id];
    return `<tr class="${(R.a2.casos[cs.id] || {}).est === c.op ? "certo" : "errado"}">
      <td>${cs.id}</td><td><b>${esc(rotE(c.op))}</b><br>${esc(c.nota)}</td></tr>`;
  }).join("");
  const l4 = A4.questoes.map((q, i) => {
    const c = g.a4[q.id];
    const rot = (q.opcoes.find((o) => o.id === c.op) || {}).texto || "";
    return `<tr class="${R.a4.respostas[q.id] === c.op ? "certo" : "errado"}"><td>${i + 1}</td>
      <td><b>${esc(rot)}</b><br>${esc(c.nota)}</td></tr>`;
  }).join("");
  alvo.innerHTML = `
    <div class="gab"><h4>Reduções (atividades 1, 3A e 4)</h4><table>${l1}${lv}</table>
      <p class="nota">${esc(g.a1_fechamento || "")}</p>
      <p class="nota">Verde: feita sem nenhum toque errado.</p></div>
    <div class="gab"><h4>Atividade 2A — condição quebrada</h4><table>${l2}</table></div>
    <div class="gab"><h4>Atividade 2B — estratégia</h4><table>${l3}</table></div>
    <div class="gab"><h4>Jogo — rodada 7</h4><p class="nota">${esc(g.a3_escrita || "")}</p></div>
    <div class="gab"><h4>Quiz formativo 2</h4><table>${l4}</table>
      <p class="nota">Verde: sua resposta coincide com o gabarito.</p></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao();
montarA1(); montarA2(); montarA3(); montarA4();
ir(0);
