/* Atividades da Aula 4 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a04_respostas_v1";
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (v) => {
  const t = String(v == null ? "" : v).replace(",", ".").trim();
  if (!t) return null;
  const x = parseFloat(t);
  return isNaN(x) ? null : x;
};

/* cor fixa por processo, na ordem da carga — a mesma convenção das figuras */
const CLASSE = ["c1", "c2", "c3", "c4", "c5", "c6"];
const corDe = (carga, pid) => CLASSE[carga.findIndex((p) => p.pid === pid)] || "c0";

/* ── estado ───────────────────────────────────────────────────────────── */
const vazio = () => ({
  aluno: "", turma: "", grupo: "",
  a1: { itens: {}, fechamento: "" },
  a2: { fcfs: { seq: [], espera: {}, media: "" },
        sjf: { seq: [], espera: {}, media: "" }, fechamento: "" },
  a3: {},
  a4: { escritas: {} },
  iniciado_em: new Date().toISOString(),
});

let R = vazio();
try {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) R = Object.assign(vazio(), JSON.parse(salvo));
} catch (e) { /* armazenamento indisponível: segue em memória */ }
A4.questoes.forEach((q) => { R.a4[q.id] = R.a4[q.id] || { espera: {}, media: "", trocas: "" }; });
A3.cenarios.forEach((c) => { R.a3[c.id] = R.a3[c.id] || { pol: "", crit: "", piora: "" }; });

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

/* ── tabela da carga, reusada nas atividades 2 e 4 ───────────────────── */
function tabelaCarga(carga, alvo, comPrioridade) {
  alvo.innerHTML = `
    <div class="cartao c-navy">
      <h4>A carga</h4>
      <table class="carga">
        <tr><th>Processo</th>${carga.map((p) =>
          `<td class="${corDe(carga, p.pid)} pid">${esc(p.pid)}</td>`).join("")}</tr>
        <tr><th>Chegada</th>${carga.map((p) => `<td>${p.chegada}</td>`).join("")}</tr>
        <tr><th>Duração</th>${carga.map((p) => `<td><b>${p.duracao}</b></td>`).join("")}</tr>
        ${comPrioridade ? `<tr><th>Prioridade</th>${carga.map((p) =>
          `<td>${p.prioridade}</td>`).join("")}</tr>` : ""}
      </table>
      <p class="nota">Total de CPU: ${carga.reduce((s, p) => s + p.duracao, 0)} unidades.
        ${comPrioridade ? "Prioridade menor = mais prioritário." : ""}</p>
    </div>`;
}

/* ── atividade 1 — transições ────────────────────────────────────────── */
function montarA1() {
  $("#a1-titulo").textContent = A1.titulo;
  $("#a1-tempo").textContent = A1.tempo;
  $("#a1-instrucao").textContent = A1.instrucao;
  $("#a1-fechamento-rot").textContent = A1.fechamento;

  $("#a1-itens").innerHTML = A1.itens.map((it, i) => `
    <div class="item-q" id="q-${it.id}">
      <p class="enun"><span class="n">${i + 1}</span>${esc(it.texto)}</p>
      <label class="mini">Transição</label>
      <div class="opcoes grade">
        ${A1.transicoes.map((t) => `
          <button type="button" class="opc-btn" data-item="${it.id}" data-tr="${t.id}"
            >${esc(t.curto)}</button>`).join("")}
      </div>
      ${it.quem ? `
      <label class="mini">Quem provocou</label>
      <div class="opcoes">
        ${A1.autores.map((a) => `
          <button type="button" class="opc-btn" data-item="${it.id}" data-quem="${a.id}"
            >${esc(a.curto)}</button>`).join("")}
      </div>` : ""}
    </div>`).join("");

  $$("#a1-itens .opc-btn").forEach((b) => {
    b.onclick = () => {
      const alvo = R.a1.itens[b.dataset.item] = R.a1.itens[b.dataset.item] || {};
      if (b.dataset.tr) alvo.tr = b.dataset.tr; else alvo.quem = b.dataset.quem;
      salvar(); pintarA1(); progresso();
    };
  });
  const f = $("#a1-fechamento");
  f.value = R.a1.fechamento || "";
  f.addEventListener("input", () => { R.a1.fechamento = f.value; salvar(); });
  pintarA1();
}

function pintarA1() {
  $$("#a1-itens .opc-btn").forEach((b) => {
    const r = R.a1.itens[b.dataset.item] || {};
    b.classList.toggle("sel", b.dataset.tr ? r.tr === b.dataset.tr : r.quem === b.dataset.quem);
  });
  A1.itens.forEach((it) => {
    const r = R.a1.itens[it.id] || {};
    const ok = r.tr && (!it.quem || r.quem);
    const el = document.getElementById("q-" + it.id);
    if (el) el.classList.toggle("respondida", !!ok);
  });
}

/* ── atividade 2 — simulação com fita de Gantt ───────────────────────── */
function montarA2() {
  $("#a2-titulo").textContent = A2.titulo;
  $("#a2-tempo").textContent = A2.tempo;
  $("#a2-instrucao").textContent = A2.instrucao;
  $("#a2-fechamento-rot").textContent = A2.fechamento;
  tabelaCarga(A2.carga, $("#a2-carga"), false);

  $("#a2-politicas").innerHTML = A2.politicas.map((pol) => `
    <div class="cartao c-blue" id="pol-${pol.id}">
      <h4>${esc(pol.nome)}</h4>
      <p class="nota">${esc(pol.dica)}</p>

      <label class="mini">1 · monte a sequência de execução</label>
      <div class="montador">
        ${A2.carga.map((p) => `
          <button type="button" class="chip ${corDe(A2.carga, p.pid)}"
            data-pol="${pol.id}" data-add="${p.pid}">+ ${esc(p.pid)}</button>`).join("")}
        <button type="button" class="chip c0" data-pol="${pol.id}" data-add="ocioso">+ ociosa</button>
        <span class="fatia">fatia
          <input type="number" min="1" max="30" value="1" class="qtd" id="qtd-${pol.id}">
        </span>
        <button type="button" class="chip apaga" data-pol="${pol.id}" data-undo="1">← desfazer</button>
        <button type="button" class="chip apaga" data-pol="${pol.id}" data-limpa="1">limpar</button>
      </div>
      <div class="fita-wrap"><div class="fita" id="fita-${pol.id}"></div>
        <div class="escala" id="escala-${pol.id}"></div></div>

      <label class="mini">2 · tempo de espera de cada processo</label>
      <div class="esperas">
        ${A2.carga.map((p) => `
          <div><span class="pid ${corDe(A2.carga, p.pid)}">${esc(p.pid)}</span>
            <input type="number" min="0" data-pol="${pol.id}" data-esp="${p.pid}"
                   inputmode="numeric"></div>`).join("")}
      </div>
      <label for="media-${pol.id}" class="mini">${esc(A2.pergunta_medias)}</label>
      <input id="media-${pol.id}" data-pol="${pol.id}" data-media="1" type="text"
             inputmode="decimal" placeholder="ex.: 8.75">
    </div>`).join("");

  $$("#a2-politicas [data-add]").forEach((b) => {
    b.onclick = () => {
      const pol = b.dataset.pol;
      const dur = Math.max(1, parseInt($("#qtd-" + pol).value, 10) || 1);
      R.a2[pol].seq.push([b.dataset.add, dur]);
      salvar(); desenharFita(pol); progresso();
    };
  });
  $$("#a2-politicas [data-undo]").forEach((b) => {
    b.onclick = () => { R.a2[b.dataset.pol].seq.pop(); salvar(); desenharFita(b.dataset.pol); };
  });
  $$("#a2-politicas [data-limpa]").forEach((b) => {
    b.onclick = () => { R.a2[b.dataset.pol].seq = []; salvar(); desenharFita(b.dataset.pol); };
  });
  $$("#a2-politicas [data-esp]").forEach((el) => {
    el.value = R.a2[el.dataset.pol].espera[el.dataset.esp] ?? "";
    el.addEventListener("input", () => {
      R.a2[el.dataset.pol].espera[el.dataset.esp] = el.value; salvar(); progresso();
    });
  });
  $$("#a2-politicas [data-media]").forEach((el) => {
    el.value = R.a2[el.dataset.pol].media || "";
    el.addEventListener("input", () => { R.a2[el.dataset.pol].media = el.value; salvar(); });
  });
  const f = $("#a2-fechamento");
  f.value = R.a2.fechamento || "";
  f.addEventListener("input", () => { R.a2.fechamento = f.value; salvar(); });
  A2.politicas.forEach((p) => desenharFita(p.id));
}

function desenharFita(pol) {
  const seq = R.a2[pol].seq;
  const fita = document.getElementById("fita-" + pol);
  const escala = document.getElementById("escala-" + pol);
  if (!seq.length) {
    fita.innerHTML = '<div class="vazia">toque nos processos acima para montar a fita</div>';
    escala.textContent = "";
    return;
  }
  const total = seq.reduce((s, x) => s + x[1], 0);
  fita.innerHTML = seq.map(([pid, dur]) => `
    <div class="seg ${pid === "ocioso" ? "c0" : corDe(A2.carga, pid)}"
         style="flex-grow:${dur}" title="${esc(pid)} · ${dur}u">
      <span>${pid === "ocioso" ? "—" : esc(pid)}</span><small>${dur}</small></div>`).join("");
  let t = 0;
  const marcas = [0].concat(seq.map(([, d]) => (t += d)));
  escala.innerHTML = `<span>0</span>` + seq.map(([, d], i) =>
    `<span style="flex-grow:${d}">${marcas[i + 1]}</span>`).join("");
  const alvo = document.getElementById("pol-" + pol);
  if (alvo) alvo.classList.toggle("completa", total >= A2.carga.reduce((s, p) => s + p.duracao, 0));
}

/* ── atividade 3 — cenários ──────────────────────────────────────────── */
function montarA3() {
  $("#a3-titulo").textContent = A3.titulo;
  $("#a3-tempo").textContent = A3.tempo;
  $("#a3-instrucao").textContent = A3.instrucao;

  $("#a3-cenarios").innerHTML = A3.cenarios.map((c) => `
    <div class="cartao c-red" id="cen-${c.id}">
      <div class="rec">Cenário ${esc(c.id)}</div>
      <h4>${esc(c.nome)}</h4>
      <p>${esc(c.texto)}</p>
      <div class="lado">
        <div>
          <label for="pol-${c.id}">Política escolhida</label>
          <select id="pol-${c.id}" data-cen="${c.id}" data-campo="pol">
            <option value="">— escolha —</option>
            ${A3.politicas.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="crit-${c.id}">Critério privilegiado</label>
          <select id="crit-${c.id}" data-cen="${c.id}" data-campo="crit">
            <option value="">— escolha —</option>
            ${A3.criterios.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("")}
          </select>
        </div>
      </div>
      <label for="piora-${c.id}">O que você aceita piorar</label>
      <textarea id="piora-${c.id}" data-cen="${c.id}" data-campo="piora" rows="2"></textarea>
    </div>`).join("");

  $$("#a3-cenarios [data-cen]").forEach((el) => {
    const c = el.dataset.cen, campo = el.dataset.campo;
    el.value = R.a3[c][campo] || "";
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
      R.a3[c][campo] = el.value; salvar(); progresso();
    });
  });
}

/* ── atividade 4 — lista prática ─────────────────────────────────────── */
function montarA4() {
  $("#a4-titulo").textContent = A4.titulo;
  $("#a4-tempo").textContent = A4.tempo;
  $("#a4-instrucao").textContent = A4.instrucao;
  tabelaCarga(A4.carga, $("#a4-carga"), true);

  $("#a4-questoes").innerHTML = A4.questoes.map((q) => `
    <div class="cartao c-gold" id="qq-${q.id}">
      <h4>${esc(q.nome)}</h4>
      <p class="nota">${esc(q.dica)}</p>
      <label class="mini">Tempo de espera de cada processo</label>
      <div class="esperas">
        ${A4.carga.map((p) => `
          <div><span class="pid ${corDe(A4.carga, p.pid)}">${esc(p.pid)}</span>
            <input type="number" min="0" inputmode="numeric"
                   data-q="${q.id}" data-esp="${p.pid}"></div>`).join("")}
      </div>
      <div class="lado">
        <div>
          <label for="m-${q.id}">Espera média</label>
          <input id="m-${q.id}" type="text" inputmode="decimal" data-q="${q.id}"
                 data-media="1" placeholder="ex.: 5.5">
        </div>
        ${q.pede_trocas ? `
        <div>
          <label for="tr-${q.id}">Trocas de contexto</label>
          <input id="tr-${q.id}" type="number" min="0" inputmode="numeric"
                 data-q="${q.id}" data-trocas="1">
        </div>` : "<div></div>"}
      </div>
    </div>`).join("");

  $$("#a4-questoes [data-esp]").forEach((el) => {
    el.value = R.a4[el.dataset.q].espera[el.dataset.esp] ?? "";
    el.addEventListener("input", () => {
      R.a4[el.dataset.q].espera[el.dataset.esp] = el.value; salvar(); progresso();
    });
  });
  $$("#a4-questoes [data-media]").forEach((el) => {
    el.value = R.a4[el.dataset.q].media || "";
    el.addEventListener("input", () => { R.a4[el.dataset.q].media = el.value; salvar(); });
  });
  $$("#a4-questoes [data-trocas]").forEach((el) => {
    el.value = R.a4[el.dataset.q].trocas || "";
    el.addEventListener("input", () => { R.a4[el.dataset.q].trocas = el.value; salvar(); });
  });

  $("#a4-escritas").innerHTML = A4.escritas.map((e) => `
    <div class="cartao">
      <label for="e-${e.id}">${esc(e.rot)}</label>
      <textarea id="e-${e.id}" data-esc="${e.id}" rows="3"></textarea>
    </div>`).join("");
  $$("#a4-escritas [data-esc]").forEach((el) => {
    el.value = R.a4.escritas[el.dataset.esc] || "";
    el.addEventListener("input", () => {
      R.a4.escritas[el.dataset.esc] = el.value; salvar();
    });
  });
}

/* ── navegação e progresso ───────────────────────────────────────────── */
function ir(n) {
  $$(".etapa").forEach((s) => s.classList.toggle("ativa", +s.dataset.etapa === n));
  window.scrollTo({ top: 0 });
  if (n === 5) revisar();
  progresso();
}

function progresso() {
  const total = A1.itens.length + A2.politicas.length * (A2.carga.length + 1)
    + A3.cenarios.length + A4.questoes.length * (A4.carga.length + 1);
  let feito = A1.itens.filter((i) => (R.a1.itens[i.id] || {}).tr).length;
  A2.politicas.forEach((p) => {
    feito += A2.carga.filter((c) => String(R.a2[p.id].espera[c.pid] ?? "") !== "").length;
    if (R.a2[p.id].seq.length) feito += 1;
  });
  feito += A3.cenarios.filter((c) => R.a3[c.id].pol).length;
  A4.questoes.forEach((q) => {
    feito += A4.carga.filter((c) => String(R.a4[q.id].espera[c.pid] ?? "") !== "").length;
    if (String(R.a4[q.id].media || "") !== "") feito += 1;
  });
  $("#barra").style.width = Math.min(100, Math.round(100 * feito / total)) + "%";
}

$$("[data-ir]").forEach((b) => { b.onclick = () => ir(+b.dataset.ir); });

/* ── revisão ─────────────────────────────────────────────────────────── */
function pendencias() {
  const p = [];
  if (!(R.aluno || "").trim()) p.push("Seu nome não está preenchido.");
  const f1 = A1.itens.filter((i) => !(R.a1.itens[i.id] || {}).tr).length;
  if (f1) p.push(`Atividade 1: ${f1} de ${A1.itens.length} situações sem transição marcada.`);
  const f1q = A1.itens.filter((i) => i.quem && !(R.a1.itens[i.id] || {}).quem).length;
  if (f1q) p.push(`Atividade 1: ${f1q} situações sem indicar quem provocou.`);
  A2.politicas.forEach((pol) => {
    if (!R.a2[pol.id].seq.length) p.push(`Atividade 2: a fita de ${pol.nome.split("—")[0].trim()} está vazia.`);
    const faltam = A2.carga.filter((c) => String(R.a2[pol.id].espera[c.pid] ?? "") === "").length;
    if (faltam) p.push(`Atividade 2 (${pol.nome.split("—")[0].trim()}): ${faltam} esperas em branco.`);
  });
  A3.cenarios.forEach((c) => {
    const v = R.a3[c.id];
    if (!v.pol) p.push(`Atividade 3: cenário ${c.id} sem política.`);
    else if (!(v.piora || "").trim()) p.push(`Atividade 3: cenário ${c.id} sem o que aceita piorar.`);
  });
  A4.questoes.forEach((q) => {
    const faltam = A4.carga.filter((c) => String(R.a4[q.id].espera[c.pid] ?? "") === "").length;
    if (faltam) p.push(`${q.nome}: ${faltam} esperas em branco.`);
    if (String(R.a4[q.id].media || "") === "") p.push(`${q.nome}: espera média em branco.`);
    if (q.pede_trocas && String(R.a4[q.id].trocas || "") === "")
      p.push(`${q.nome}: número de trocas em branco.`);
  });
  A4.escritas.forEach((e, i) => {
    if (!(R.a4.escritas[e.id] || "").trim()) p.push(`Lista prática: resposta escrita ${i + 1} em branco.`);
  });
  return p;
}

function revisar() {
  const tr = (id) => (A1.transicoes.find((t) => t.id === id) || {}).curto || "—";
  const esperas = (obj, carga) => carga.map((c) =>
    `${c.pid} ${obj[c.pid] ?? "—"}`).join(" · ");

  $("#revisao").innerHTML = `
    <div class="resumo"><div class="cab">Identificação</div>
      <div class="item"><b>${esc(R.aluno) || '<span class="vazio">sem nome</span>'}</b>
        ${esc(R.turma)} ${R.grupo ? "· grupo " + esc(R.grupo) : ""}</div></div>

    <div class="resumo"><div class="cab">Atividade 1 — transições</div>
      ${A1.itens.map((it, i) => {
        const r = R.a1.itens[it.id] || {};
        return `<div class="item"><b>${i + 1}.</b> ${esc(tr(r.tr))}${
          it.quem ? " — " + esc((A1.autores.find((a) => a.id === r.quem) || {}).curto || "quem?") : ""}</div>`;
      }).join("")}
      <div class="item"><b>Explicação:</b> ${
        esc(R.a1.fechamento) || '<span class="vazio">em branco</span>'}</div></div>

    <div class="resumo"><div class="cab">Atividade 2 — simulação</div>
      ${A2.politicas.map((p) => `<div class="item"><b>${esc(p.nome.split("—")[0].trim())}:</b>
        fita ${R.a2[p.id].seq.map((x) => x[0] + ":" + x[1]).join(" → ") || "vazia"}<br>
        esperas ${esc(esperas(R.a2[p.id].espera, A2.carga))} · média ${
          esc(R.a2[p.id].media) || "—"}</div>`).join("")}</div>

    <div class="resumo"><div class="cab">Atividade 3 — políticas por sistema</div>
      ${A3.cenarios.map((c) => {
        const v = R.a3[c.id];
        return `<div class="item"><b>${c.id} · ${esc(c.nome)}:</b> ${
          esc(v.pol) || '<span class="vazio">sem escolha</span>'} ${
          v.crit ? "(" + esc(v.crit) + ")" : ""}${
          v.piora ? "" : ' <span class="vazio">— sem o que piora</span>'}</div>`;
      }).join("")}</div>

    <div class="resumo"><div class="cab">Lista prática 1</div>
      ${A4.questoes.map((q) => `<div class="item"><b>${esc(q.nome)}:</b>
        ${esc(esperas(R.a4[q.id].espera, A4.carga))} · média ${esc(R.a4[q.id].media) || "—"}${
        q.pede_trocas ? " · trocas " + (esc(R.a4[q.id].trocas) || "—") : ""}</div>`).join("")}
      ${A4.escritas.map((e, i) => `<div class="item"><b>${i + 1}ª escrita:</b> ${
        esc((R.a4.escritas[e.id] || "").slice(0, 90)) || '<span class="vazio">em branco</span>'}</div>`).join("")}
    </div>`;

  const p = pendencias();
  $("#pendencias").innerHTML = p.length
    ? `<div class="aviso"><b>Ainda falta:</b><ul>${p.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
       <p class="nota">Você pode entregar assim mesmo — o professor vê o que ficou vazio.</p></div>`
    : `<div class="cartao c-green"><b>Tudo respondido.</b> Pode entregar.</div>`;
}

/* ── entrega ─────────────────────────────────────────────────────────── */
$("#entregar").onclick = async () => {
  if (!(R.aluno || "").trim()) {
    $("#status-envio").textContent = "Escreva seu nome na primeira etapa antes de entregar.";
    ir(0); return;
  }
  const b = $("#entregar");
  b.disabled = true; b.textContent = "Enviando…";
  R.enviado_em = new Date().toISOString();
  try {
    const r = await fetch("api/entregar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(R),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.erro || "falha no envio");
    mostrarRecibo(j);
  } catch (e) {
    $("#status-envio").textContent =
      "Não consegui enviar (" + e.message + "). Confira se você continua conectado à internet "
      + "e toque em Entregar de novo — nada do que você escreveu foi perdido.";
  } finally {
    b.disabled = false; b.textContent = "Entregar atividades";
  }
};

function mostrarRecibo(j) {
  ir(6);
  $("#recibo-linha").textContent =
    `${R.aluno} · protocolo ${j.protocolo} · recebido em ${new Date().toLocaleTimeString("pt-BR")}`;
  const c = j.correcao || {};
  $("#recibo-correcao").innerHTML = j.mostrar_correcao ? `
    <div class="placar">
      <div><span class="n">${c.a1_transicoes}/${A1.itens.length}</span>
        <span class="r">transições</span></div>
      <div><span class="n">${c.a1_autores}/${c.a1_autores_total}</span>
        <span class="r">quem provocou</span></div>
      <div><span class="n">${c.a2_esperas}/${c.a2_total}</span>
        <span class="r">esperas da simulação</span></div>
      <div><span class="n">${c.a4_esperas}/${c.a4_total}</span>
        <span class="r">esperas da lista prática</span></div>
      <div><span class="n">${c.nota_lista}</span>
        <span class="r">lista prática (de 10)</span></div>
    </div>
    <p class="nota">A conferência automática cobre os valores numéricos e as marcações. As quatro
      respostas escritas da lista e as justificativas dos cenários são lidas pelo professor —
      elas valem parte da nota.</p>` : `
    <p class="nota">Entrega registrada. A correção será comentada em sala.</p>`;
}

/* ── cópia local ─────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const tr = (id) => (A1.transicoes.find((t) => t.id === id) || {}).curto || "sem resposta";
  const aut = (id) => (A1.autores.find((a) => a.id === id) || {}).curto || "—";
  const L = [AULA.titulo, AULA.instituicao, "",
             "Aluno: " + R.aluno, "Turma: " + R.turma, "Grupo: " + R.grupo, "",
             "ATIVIDADE 1 — TRANSIÇÕES"];
  A1.itens.forEach((it, i) => {
    const r = R.a1.itens[it.id] || {};
    L.push(`${i + 1}. ${it.texto}`,
           `   → ${tr(r.tr)}${it.quem ? "   provocada por: " + aut(r.quem) : ""}`);
  });
  L.push("", "Explicação: " + (R.a1.fechamento || ""), "", "ATIVIDADE 2 — SIMULAÇÃO");
  A2.politicas.forEach((p) => {
    const v = R.a2[p.id];
    L.push("  " + p.nome,
           "   fita: " + v.seq.map((x) => `${x[0]}(${x[1]})`).join(" → "),
           "   esperas: " + A2.carga.map((c) => `${c.pid}=${v.espera[c.pid] ?? ""}`).join("  "),
           "   espera média: " + (v.media || ""));
  });
  L.push("   " + (R.a2.fechamento || ""), "", "ATIVIDADE 3 — POLÍTICA POR SISTEMA");
  A3.cenarios.forEach((c) => {
    const v = R.a3[c.id];
    L.push(`  [${c.id}] ${c.nome}: ${v.pol || ""}`,
           `      critério: ${v.crit || ""}`,
           `      aceita piorar: ${v.piora || ""}`);
  });
  L.push("", "LISTA PRÁTICA 1");
  A4.questoes.forEach((q) => {
    const v = R.a4[q.id];
    L.push("  " + q.nome,
           "   esperas: " + A4.carga.map((c) => `${c.pid}=${v.espera[c.pid] ?? ""}`).join("  "),
           "   espera média: " + (v.media || "") + (q.pede_trocas ? "   trocas: " + (v.trocas || "") : ""));
  });
  A4.escritas.forEach((e) => L.push("  " + e.rot, "   → " + (R.a4.escritas[e.id] || "")));
  const blob = new Blob([L.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "A04_" + (R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_") + ".txt";
  a.click(); URL.revokeObjectURL(a.href);
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
  const tr = (id) => (A1.transicoes.find((t) => t.id === id) || {}).curto || "—";
  const l1 = A1.itens.map((it, i) => {
    const certo = g.a1[it.id];
    const meu = R.a1.itens[it.id] || {};
    const ok = meu.tr === certo.tr && (!it.quem || meu.quem === certo.quem);
    return `<tr class="${ok ? "certo" : "errado"}"><td>${i + 1}</td>
      <td><b>${esc(tr(certo.tr))}</b>${certo.quem ? " · " + esc(certo.quem) : ""}<br>
      ${esc(certo.nota || "")}</td></tr>`;
  }).join("");

  alvo.innerHTML = `
    <div class="gab"><h4>Atividade 1 — transições</h4><table>${l1}</table>
      <p class="nota">Verde: transição (e autor, quando pedido) coincidem com o gabarito.</p></div>
    ${Object.keys(g.politicas).map((k) => {
      const c = g.politicas[k];
      const meuObj = (c.atividade === "a2" ? R.a2[c.slot] : R.a4[c.slot]) || {};
      const linhas = c.ordem.map((pid) => {
        const meu = num((meuObj.espera || {})[pid]);
        return `<tr class="${meu === c.espera[pid] ? "certo" : "errado"}">
          <td>${pid}</td><td><b>${c.espera[pid]}</b></td></tr>`;
      }).join("");
      return `<div class="gab"><h4>${esc(c.nome)}</h4>
        <p class="nota">fita: ${esc(c.fita)}</p>
        <table>${linhas}</table>
        <p class="nota">espera média <b>${c.media}</b> · retorno médio ${c.retorno}${
          c.trocas != null ? " · trocas " + c.trocas : ""}</p>
        ${c.nota ? `<p class="nota">${esc(c.nota)}</p>` : ""}</div>`;
    }).join("")}
    <div class="gab"><h4>Atividade 3 — políticas por sistema</h4>
      <table>${A3.cenarios.map((c) => {
        const certo = g.a3[c.id];
        const ok = certo.aceitas.indexOf((R.a3[c.id] || {}).pol) >= 0;
        return `<tr class="${ok ? "certo" : "errado"}"><td>${c.id}</td>
          <td><b>${esc(certo.aceitas.join(" ou "))}</b><br>${esc(certo.nota)}</td></tr>`;
      }).join("")}</table>
      <p class="nota">${esc(g.a3_nota)}</p></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao();
montarA1(); montarA2(); montarA3(); montarA4();
ir(0);
