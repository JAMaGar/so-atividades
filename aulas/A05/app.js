/* Atividades da Aula 5 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a05_respostas_v1";
const ETAPAS = 6;
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── estado ───────────────────────────────────────────────────────────── */
const vazio = () => ({
  aluno: "", turma: "", grupo: "",
  a1: { itens: {}, escritas: {}, fechamento: "" },
  a2: {},
  a3: { campos: {}, objetivas: {}, escritas: {} },
  a4: {},
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

/* ── atividade 1 ─────────────────────────────────────────────────────── */
function montarA1() {
  $("#a1-titulo").textContent = A1.titulo;
  $("#a1-tempo").textContent = A1.tempo;
  $("#a1-instrucao").textContent = A1.instrucao;
  $("#a1-fechamento-rot").textContent = A1.fechamento;
  const alvo = $("#a1-itens");
  A1.itens.forEach((it, i) => {
    const box = document.createElement("div");
    box.className = "item-q" + (R.a1.itens[it.id] ? " respondida" : "");
    box.innerHTML = `<p class="enun"><span class="n">${i + 1}</span>${esc(it.texto)}</p>`;
    box.appendChild(botoesOpcao(A1.opcoes, R.a1.itens[it.id], false, (id) => {
      R.a1.itens[it.id] = id;
      box.classList.add("respondida");
    }));
    if (it.escrita) {
      const lab = document.createElement("label");
      lab.textContent = it.escrita;
      lab.style.marginTop = ".6rem";
      box.appendChild(lab);
      box.appendChild(textarea(R.a1.escritas[it.id], 2, "Uma ou duas frases.",
        (v) => { R.a1.escritas[it.id] = v; }));
    }
    alvo.appendChild(box);
  });
  const f = $("#a1-fechamento");
  f.value = R.a1.fechamento || "";
  f.addEventListener("input", () => { R.a1.fechamento = f.value; salvar(); });
}

/* ── atividade 2 ─────────────────────────────────────────────────────── */
function montarA2() {
  $("#a2-titulo").textContent = A2.titulo;
  $("#a2-tempo").textContent = A2.tempo;
  $("#a2-instrucao").textContent = A2.instrucao;
  const alvo = $("#a2-casos");
  A2.casos.forEach((c) => {
    R.a2[c.id] = R.a2[c.id] || {};
    const box = document.createElement("div");
    box.className = "cartao";
    box.innerHTML = `<h4>${esc(c.id)} · ${esc(c.nome)}</h4>
      <p class="nota">${esc(c.texto)}</p>
      <label>Mecanismo</label>`;
    box.appendChild(botoesOpcao(A2.mecanismos, R.a2[c.id].mec, false,
      (id) => { R.a2[c.id].mec = id; }));
    const l1 = document.createElement("label");
    l1.textContent = "Por quê, em uma frase";
    box.appendChild(l1);
    box.appendChild(textarea(R.a2[c.id].porque, 2, "A razão da escolha.",
      (v) => { R.a2[c.id].porque = v; }));
    const l2 = document.createElement("label");
    l2.textContent = "O que você aceita piorar com essa escolha";
    box.appendChild(l2);
    box.appendChild(textarea(R.a2[c.id].piora, 2, "Todo mecanismo cobra algo.",
      (v) => { R.a2[c.id].piora = v; }));
    alvo.appendChild(box);
  });
}

/* ── atividade 3 — laboratório ───────────────────────────────────────── */
function montarA3() {
  $("#a3-titulo").textContent = A3.titulo;
  $("#a3-tempo").textContent = A3.tempo;
  $("#a3-instrucao").textContent = A3.instrucao;

  const alvo = $("#a3-partes");
  A3.partes.forEach((p) => {
    const box = document.createElement("div");
    box.className = "cartao";
    box.innerHTML = `<h4>${esc(p.titulo)}</h4><p class="nota">${esc(p.tempo)}</p>`;
    p.campos.forEach((c) => {
      const lab = document.createElement("label");
      lab.innerHTML = esc(c.rot) + (c.dica ? `<span class="cmd">${esc(c.dica)}</span>` : "");
      box.appendChild(lab);
      box.appendChild(campoTexto(R.a3.campos[c.id], c.tipo,
        (v) => { R.a3.campos[c.id] = v; atualizarProgresso(); }));
    });
    if (p.nota) {
      const n = document.createElement("p");
      n.className = "nota";
      n.textContent = p.nota;
      box.appendChild(n);
    }
    alvo.appendChild(box);
  });

  const objs = $("#a3-objetivas");
  A3.objetivas.forEach((q, i) => {
    const box = document.createElement("div");
    box.className = "item-q" + (R.a3.objetivas[q.id] ? " respondida" : "");
    box.innerHTML = `<p class="enun"><span class="n">${i + 1}</span>${esc(q.pergunta)}</p>`;
    box.appendChild(botoesOpcao(q.opcoes, R.a3.objetivas[q.id], true, (id) => {
      R.a3.objetivas[q.id] = id;
      box.classList.add("respondida");
    }));
    objs.appendChild(box);
  });

  const escr = $("#a3-escritas");
  A3.escritas.forEach((e) => {
    const box = document.createElement("div");
    box.className = "cartao";
    const lab = document.createElement("label");
    lab.textContent = e.rot;
    box.appendChild(lab);
    box.appendChild(textarea(R.a3.escritas[e.id], 3, "Duas ou três frases.",
      (v) => { R.a3.escritas[e.id] = v; }));
    escr.appendChild(box);
  });
}

/* ── atividade 4 — checkpoint do projeto ─────────────────────────────── */
function montarA4() {
  $("#a4-titulo").textContent = A4.titulo;
  $("#a4-tempo").textContent = A4.tempo;
  $("#a4-instrucao").textContent = A4.instrucao;
  const alvo = $("#a4-campos");

  // o que o projeto é, antes de qualquer campo
  if (A4.oQueE) {
    const q = document.createElement("div");
    q.className = "cartao destaque";
    q.innerHTML = `<h4>O que é o projeto integrador</h4>
      <p class="nota">${esc(A4.oQueE)}</p>`;
    alvo.appendChild(q);
  }

  // exemplo completo, recolhido por padrão
  if (A4.exemplo) {
    const d = document.createElement("details");
    d.className = "exemplo";
    const itens = A4.exemplo.itens.map((it) => `
      <div class="ex-item">
        <div class="ex-rot">${esc(it.rot)}</div>
        <div class="ex-txt">${esc(it.txt).replace(/\n/g, "<br>")}</div>
        <div class="ex-nota">${esc(it.nota)}</div>
      </div>`).join("");
    const tabela = (A4.naoAprova || []).map(([ruim, bom]) =>
      `<tr><td class="ruim">${esc(ruim)}</td><td class="bom">${esc(bom)}</td></tr>`).join("");
    d.innerHTML = `<summary>Ver um exemplo completo preenchido</summary>
      <div class="ex-corpo">
        <p class="nota"><b>${esc(A4.exemplo.titulo)}</b><br>${esc(A4.exemplo.aviso)}</p>
        ${itens}
        ${tabela ? `<div class="ex-rot">O erro que todo grupo comete</div>
          <table class="ex-tab"><tr><th>não aprova</th><th>aprova</th></tr>
          ${tabela}</table>` : ""}
      </div>`;
    alvo.appendChild(d);
  }

  A4.campos.forEach((c) => {
    const box = document.createElement("div");
    box.className = "cartao";
    const lab = document.createElement("label");
    lab.innerHTML = esc(c.rot) + (c.dica ? `<span class="cmd">${esc(c.dica)}</span>` : "");
    box.appendChild(lab);
    box.appendChild(textarea(R.a4[c.id], c.linhas, "",
      (v) => { R.a4[c.id] = v; atualizarProgresso(); }));
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

function preenchidos() {
  const a1 = Object.keys(R.a1.itens).length;
  const a2 = A2.casos.filter((c) => (R.a2[c.id] || {}).mec).length;
  const a3c = Object.values(R.a3.campos).filter((v) => String(v).trim()).length;
  const a3o = Object.keys(R.a3.objetivas).length;
  const a4 = A4.campos.filter((c) => String(R.a4[c.id] || "").trim()).length;
  return { a1, a2, a3c, a3o, a4 };
}

function atualizarProgresso(etapa) {
  const p = preenchidos();
  const total = A1.itens.length + A2.casos.length
    + A3.partes.reduce((s, x) => s + x.campos.length, 0) + A3.objetivas.length
    + A4.campos.length;
  const feito = p.a1 + p.a2 + p.a3c + p.a3o + p.a4;
  const pct = Math.round(100 * feito / total);
  $("#barra").style.width = pct + "%";
}

$$("[data-ir]").forEach((b) => { b.onclick = () => ir(Number(b.dataset.ir)); });

/* ── revisão ─────────────────────────────────────────────────────────── */
function montarRevisao() {
  const p = preenchidos();
  const nCampos = A3.partes.reduce((s, x) => s + x.campos.length, 0);
  const linhas = [
    ["Atividade 1 — recursos classificados", `${p.a1} de ${A1.itens.length}`,
     p.a1 === A1.itens.length],
    ["Atividade 2 — casos com mecanismo escolhido", `${p.a2} de ${A2.casos.length}`,
     p.a2 === A2.casos.length],
    ["Laboratório — campos preenchidos", `${p.a3c} de ${nCampos}`, p.a3c === nCampos],
    ["Laboratório — conclusões marcadas", `${p.a3o} de ${A3.objetivas.length}`,
     p.a3o === A3.objetivas.length],
    ["Checkpoint 1 — itens escritos", `${p.a4} de ${A4.campos.length}`,
     p.a4 === A4.campos.length],
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
      <div><span class="n">${c.a1_acertos ?? "–"}/${A1.itens.length}</span>
           <span class="r">recursos classificados corretamente</span></div>
      <div><span class="n">${c.a3_acertos ?? "–"}/${A3.objetivas.length}</span>
           <span class="r">conclusões do laboratório</span></div>
      <div><span class="n">${c.nota_lab ?? "–"}</span>
           <span class="r">nota do laboratório (de 10)</span></div>
    </div>
    <p class="nota">As respostas escritas e o Checkpoint 1 são avaliados pelo professor;
      não entram nesta conta.</p>`;
}

/* ── baixar cópia ────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const b = new Blob([JSON.stringify(R, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = `A05_${(R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_")}.json`;
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
  const rot1 = (id) => (A1.opcoes.find((o) => o.id === id) || {}).curto || "—";
  const l1 = A1.itens.map((it, i) => {
    const certo = g.a1[it.id];
    const meu = R.a1.itens[it.id] || "";
    return `<tr class="${meu === certo.op ? "certo" : "errado"}">
      <td>${i + 1}</td><td><b>${esc(rot1(certo.op))}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  const l2 = A2.casos.map((c) => {
    const certo = g.a2[c.id];
    const meu = (R.a2[c.id] || {}).mec || "";
    const ok = certo.aceitas.indexOf(meu) >= 0;
    const nomes = certo.aceitas.map((m) =>
      (A2.mecanismos.find((x) => x.id === m) || {}).texto || m).join(" ou ");
    return `<tr class="${ok ? "certo" : "errado"}"><td>${c.id}</td>
      <td><b>${esc(nomes)}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  const l3 = A3.objetivas.map((q) => {
    const certo = g.a3_objetivas[q.id];
    const meu = R.a3.objetivas[q.id] || "";
    const rot = (q.opcoes.find((o) => o.id === certo.op) || {}).texto || "";
    return `<tr class="${meu === certo.op ? "certo" : "errado"}">
      <td>${esc(q.pergunta.slice(0, 26))}…</td>
      <td><b>${esc(rot)}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  alvo.innerHTML = `
    <div class="gab"><h4>Atividade 1 — de quem é o recurso</h4>
      <table>${l1}</table>
      <p class="nota">Verde: sua resposta coincide com o gabarito.</p></div>
    <div class="gab"><h4>Atividade 2 — mecanismo de comunicação</h4>
      <table>${l2}</table>
      <p class="nota">${esc(g.a2_nota || "")}</p></div>
    <div class="gab"><h4>Laboratório — conclusões</h4><table>${l3}</table></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao();
montarA1(); montarA2(); montarA3(); montarA4();
ir(0);
