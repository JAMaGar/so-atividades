/* Atividades da Aula 3 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a03_respostas_v1";
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── estado ───────────────────────────────────────────────────────────── */
const vazio = () => ({
  aluno: "", turma: "", grupo: "",
  a1: { itens: {}, fechamento: "" },
  a2: { campos: {}, objetivas: {}, escritas: {} },
  a3: {},
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

/* ── atividade 1 — classificação ─────────────────────────────────────── */
function montarA1() {
  $("#a1-titulo").textContent = A1.titulo;
  $("#a1-tempo").textContent = A1.tempo;
  $("#a1-instrucao").textContent = A1.instrucao;
  $("#a1-fechamento-rot").textContent = A1.fechamento;

  const legenda = '<div class="legenda">' + A1.opcoes.map((o) =>
    `<span><b>${esc(o.curto)}</b> — ${esc(o.longo)}</span>`).join("") + "</div>";

  $("#a1-itens").innerHTML = legenda + A1.itens.map((it, i) => `
    <div class="item-q" id="q-${it.id}">
      <p class="enun"><span class="n">${i + 1}</span>${esc(it.texto)}</p>
      <div class="opcoes">
        ${A1.opcoes.map((o) => `
          <button type="button" class="opc-btn" data-item="${it.id}" data-op="${o.id}">
            ${esc(o.curto)}</button>`).join("")}
      </div>
    </div>`).join("");

  $$("#a1-itens .opc-btn").forEach((b) => {
    b.onclick = () => {
      R.a1.itens[b.dataset.item] = b.dataset.op;
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
    const marcado = R.a1.itens[b.dataset.item] === b.dataset.op;
    b.classList.toggle("sel", marcado);
  });
  A1.itens.forEach((it) => {
    const q = document.getElementById("q-" + it.id);
    if (q) q.classList.toggle("respondida", !!R.a1.itens[it.id]);
  });
}

/* ── atividade 2 — laboratório ───────────────────────────────────────── */
function montarA2() {
  $("#a2-titulo").textContent = A2.titulo;
  $("#a2-tempo").textContent = A2.tempo;
  $("#a2-instrucao").textContent = A2.instrucao;

  $("#a2-partes").innerHTML = A2.partes.map((p) => `
    <div class="cartao c-blue">
      <div class="rec">${esc(p.tempo)}</div>
      <h4>${esc(p.titulo)}</h4>
      ${p.campos.map((c) => `
        <label for="f-${c.id}">${esc(c.rot)}
          ${c.dica ? `<span class="cmd">${esc(c.dica)}</span>` : ""}</label>
        <input id="f-${c.id}" data-campo="${c.id}"
               type="${c.tipo === "numero" ? "text" : "text"}"
               inputmode="${c.tipo === "numero" ? "decimal" : "text"}"
               autocomplete="off" placeholder="${c.tipo === "numero" ? "só o número" : ""}">`).join("")}
      ${p.nota ? `<p class="nota">${esc(p.nota)}</p>` : ""}
    </div>`).join("");

  $$("#a2-partes input[data-campo]").forEach((el) => {
    el.value = R.a2.campos[el.dataset.campo] || "";
    el.addEventListener("input", () => {
      R.a2.campos[el.dataset.campo] = el.value; salvar(); progresso();
    });
  });

  $("#a2-objetivas").innerHTML = A2.objetivas.map((q) => `
    <div class="item-q" id="q-${q.id}">
      <p class="enun">${esc(q.pergunta)}</p>
      <div class="opcoes coluna">
        ${q.opcoes.map((o) => `
          <button type="button" class="opc-btn largo" data-q="${q.id}" data-op="${o.id}">
            ${esc(o.texto)}</button>`).join("")}
      </div>
    </div>`).join("");
  $$("#a2-objetivas .opc-btn").forEach((b) => {
    b.onclick = () => {
      R.a2.objetivas[b.dataset.q] = b.dataset.op; salvar(); pintarA2(); progresso();
    };
  });

  $("#a2-escritas").innerHTML = A2.escritas.map((e) => `
    <div class="cartao">
      <label for="e-${e.id}">${esc(e.rot)}</label>
      <textarea id="e-${e.id}" data-esc="${e.id}" rows="3"></textarea>
    </div>`).join("");
  $$("#a2-escritas textarea[data-esc]").forEach((el) => {
    el.value = R.a2.escritas[el.dataset.esc] || "";
    el.addEventListener("input", () => {
      R.a2.escritas[el.dataset.esc] = el.value; salvar();
    });
  });
  pintarA2();
}

function pintarA2() {
  $$("#a2-objetivas .opc-btn").forEach((b) => {
    b.classList.toggle("sel", R.a2.objetivas[b.dataset.q] === b.dataset.op);
  });
  A2.objetivas.forEach((q) => {
    const el = document.getElementById("q-" + q.id);
    if (el) el.classList.toggle("respondida", !!R.a2.objetivas[q.id]);
  });
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
      <label for="arq-${c.id}">Arquitetura escolhida</label>
      <select id="arq-${c.id}" data-cen="${c.id}">
        <option value="">— escolha —</option>
        ${A3.arquiteturas.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("")}
      </select>
      <label for="just-${c.id}">Justificativa em uma frase</label>
      <textarea id="just-${c.id}" data-just="${c.id}" rows="2"></textarea>
      <label for="risco-${c.id}">Risco que você aceita ao escolher</label>
      <textarea id="risco-${c.id}" data-risco="${c.id}" rows="2"></textarea>
    </div>`).join("");

  A3.cenarios.forEach((c) => {
    R.a3[c.id] = R.a3[c.id] || { arq: "", justificativa: "", risco: "" };
    const sel = document.getElementById("arq-" + c.id);
    sel.value = R.a3[c.id].arq || "";
    sel.addEventListener("change", () => {
      R.a3[c.id].arq = sel.value; salvar(); progresso();
    });
    [["just-", "justificativa"], ["risco-", "risco"]].forEach(([pre, campo]) => {
      const el = document.getElementById(pre + c.id);
      el.value = R.a3[c.id][campo] || "";
      el.addEventListener("input", () => { R.a3[c.id][campo] = el.value; salvar(); });
    });
  });
}

/* ── navegação e progresso ───────────────────────────────────────────── */
function ir(n) {
  $$(".etapa").forEach((s) => s.classList.toggle("ativa", +s.dataset.etapa === n));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (n === 4) revisar();
  progresso(n);
}

function progresso(etapa) {
  const total = A1.itens.length + A2.objetivas.length + A3.cenarios.length;
  const feito = Object.keys(R.a1.itens).length
    + Object.keys(R.a2.objetivas).length
    + A3.cenarios.filter((c) => (R.a3[c.id] || {}).arq).length;
  $("#barra").style.width = Math.round(100 * feito / total) + "%";
}

$$("[data-ir]").forEach((b) => { b.onclick = () => ir(+b.dataset.ir); });

/* ── revisão ─────────────────────────────────────────────────────────── */
function pendencias() {
  const p = [];
  if (!(R.aluno || "").trim()) p.push("Seu nome não está preenchido.");
  const faltaA1 = A1.itens.filter((i) => !R.a1.itens[i.id]).length;
  if (faltaA1) p.push(`Atividade 1: ${faltaA1} de ${A1.itens.length} operações sem resposta.`);
  if (!(R.a1.fechamento || "").trim()) p.push("Atividade 1: a explicação final está em branco.");
  const campos = A2.partes.flatMap((x) => x.campos);
  const faltaLab = campos.filter((c) => !(R.a2.campos[c.id] || "").trim()).length;
  if (faltaLab) p.push(`Laboratório: ${faltaLab} de ${campos.length} registros em branco.`);
  A2.objetivas.forEach((q) => {
    if (!R.a2.objetivas[q.id]) p.push("Laboratório: falta responder \u201c" + q.pergunta + "\u201d");
  });
  A2.escritas.forEach((e, i) => {
    if (!(R.a2.escritas[e.id] || "").trim()) p.push(`Laboratório: resposta escrita ${i + 1} em branco.`);
  });
  A3.cenarios.forEach((c) => {
    const v = R.a3[c.id] || {};
    if (!v.arq) p.push(`Atividade 3: cenário ${c.id} sem arquitetura escolhida.`);
    else if (!(v.risco || "").trim()) p.push(`Atividade 3: cenário ${c.id} sem o risco aceito.`);
  });
  return p;
}

function revisar() {
  const curto = (id) => (A1.opcoes.find((o) => o.id === id) || {}).curto || "—";
  const lab = A2.partes.flatMap((p) => p.campos)
    .map((c) => `<div class="item"><b>${esc(c.rot)}:</b> ${
      esc(R.a2.campos[c.id]) || '<span class="vazio">em branco</span>'}</div>`).join("");

  $("#revisao").innerHTML = `
    <div class="resumo"><div class="cab">Identificação</div>
      <div class="item"><b>${esc(R.aluno) || '<span class="vazio">sem nome</span>'}</b>
        ${esc(R.turma)} ${R.grupo ? "· grupo " + esc(R.grupo) : ""}</div></div>
    <div class="resumo"><div class="cab">Atividade 1 — de que lado da fronteira?</div>
      ${A1.itens.map((it, i) => `<div class="item"><b>${i + 1}.</b> ${
        esc(it.texto.slice(0, 58))}${it.texto.length > 58 ? "…" : ""} —
        <b>${esc(curto(R.a1.itens[it.id]))}</b></div>`).join("")}
      <div class="item"><b>Explicação:</b> ${
        esc(R.a1.fechamento) || '<span class="vazio">em branco</span>'}</div></div>
    <div class="resumo"><div class="cab">Laboratório 1 — registro</div>${lab}
      ${A2.objetivas.map((q) => `<div class="item"><b>${esc(q.pergunta)}</b> ${
        esc((q.opcoes.find((o) => o.id === R.a2.objetivas[q.id]) || {}).texto)
        || '<span class="vazio">sem resposta</span>'}</div>`).join("")}</div>
    <div class="resumo"><div class="cab">Atividade 3 — arquiteturas</div>
      ${A3.cenarios.map((c) => {
        const v = R.a3[c.id] || {};
        return `<div class="item"><b>${c.id} · ${esc(c.nome)}:</b> ${
          esc(v.arq) || '<span class="vazio">sem escolha</span>'}
          ${v.risco ? "" : ' <span class="vazio">(sem o risco)</span>'}</div>`;
      }).join("")}</div>`;

  const p = pendencias();
  $("#pendencias").innerHTML = p.length
    ? `<div class="aviso"><b>Ainda falta:</b><ul>${p.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
       <p class="nota">Você pode entregar assim mesmo, mas o professor vai ver os campos vazios.</p></div>`
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
  ir(5);
  $("#recibo-linha").textContent =
    `${R.aluno} · protocolo ${j.protocolo} · recebido em ${new Date().toLocaleTimeString("pt-BR")}`;
  const c = j.correcao || {};
  $("#recibo-correcao").innerHTML = j.mostrar_correcao ? `
    <div class="placar">
      <div><span class="n">${c.a1_itens}/${A1.itens.length}</span>
        <span class="r">fronteira</span></div>
      <div><span class="n">${c.a2_objetivas}/${A2.objetivas.length}</span>
        <span class="r">conclusões do laboratório</span></div>
      <div><span class="n">${c.a3_arq}/${A3.cenarios.length}</span>
        <span class="r">arquiteturas</span></div>
      <div><span class="n">${c.lab_campos}/${c.lab_total}</span>
        <span class="r">registros preenchidos</span></div>
    </div>
    <p class="nota">A conferência automática cobre só as partes objetivas. As respostas escritas
      são lidas pelo professor — elas valem tanto quanto o acerto.</p>` : `
    <p class="nota">Entrega registrada. A correção será comentada em sala.</p>`;
}

/* ── cópia local ─────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const curto = (id) => (A1.opcoes.find((o) => o.id === id) || {}).longo || "sem resposta";
  const L = [AULA.titulo, AULA.instituicao, "",
             "Aluno: " + R.aluno, "Turma: " + R.turma, "Grupo: " + R.grupo, "",
             "ATIVIDADE 1 — DE QUE LADO DA FRONTEIRA?"];
  A1.itens.forEach((it, i) => {
    L.push(`${i + 1}. ${it.texto}`, "   → " + curto(R.a1.itens[it.id]));
  });
  L.push("", "Explicação: " + (R.a1.fechamento || ""), "", "LABORATÓRIO 1 — REGISTRO");
  A2.partes.forEach((p) => {
    L.push("  " + p.titulo);
    p.campos.forEach((c) => L.push(`   ${c.rot}: ${R.a2.campos[c.id] || ""}`));
  });
  A2.objetivas.forEach((q) => {
    const o = q.opcoes.find((x) => x.id === R.a2.objetivas[q.id]) || {};
    L.push(`   ${q.pergunta} ${o.texto || ""}`);
  });
  A2.escritas.forEach((e) => L.push(`   ${e.rot}`, "   → " + (R.a2.escritas[e.id] || "")));
  L.push("", "ATIVIDADE 3 — ARQUITETURAS");
  A3.cenarios.forEach((c) => {
    const v = R.a3[c.id] || {};
    L.push(`  [${c.id}] ${c.nome}: ${v.arq || ""}`,
           `      justificativa: ${v.justificativa || ""}`,
           `      risco aceito: ${v.risco || ""}`);
  });
  const blob = new Blob([L.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "A03_" + (R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_") + ".txt";
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
  const linhas1 = A1.itens.map((it, i) => {
    const certo = g.a1[it.id];
    const meu = R.a1.itens[it.id] || "";
    const rot = (id) => (A1.opcoes.find((o) => o.id === id) || {}).curto || "—";
    return `<tr class="${meu === certo.op ? "certo" : "errado"}">
      <td>${i + 1}</td><td><b>${esc(rot(certo.op))}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  const objs = A2.objetivas.map((q) => {
    const certo = g.a2_objetivas[q.id];
    const meu = R.a2.objetivas[q.id] || "";
    const rot = (q.opcoes.find((o) => o.id === certo.op) || {}).texto || "";
    return `<tr class="${meu === certo.op ? "certo" : "errado"}">
      <td>${esc(q.pergunta.slice(0, 26))}…</td>
      <td><b>${esc(rot)}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  const arqs = A3.cenarios.map((c) => {
    const certo = g.a3[c.id];
    const meu = (R.a3[c.id] || {}).arq || "";
    const ok = certo.aceitas.indexOf(meu) >= 0;
    return `<tr class="${ok ? "certo" : "errado"}"><td>${c.id}</td>
      <td><b>${esc(certo.aceitas.join(" ou "))}</b><br>${esc(certo.nota)}</td></tr>`;
  }).join("");
  alvo.innerHTML = `
    <div class="gab"><h4>Atividade 1 — de que lado da fronteira?</h4>
      <table>${linhas1}</table>
      <p class="nota">Verde: sua resposta coincide com o gabarito.</p></div>
    <div class="gab"><h4>Laboratório — conclusões</h4><table>${objs}</table></div>
    <div class="gab"><h4>Atividade 3 — arquiteturas</h4><table>${arqs}</table>
      <p class="nota">${esc(g.a3_nota)}</p></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao(); montarA1(); montarA2(); montarA3();
ir(0);
