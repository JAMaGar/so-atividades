/* Atividades da Aula 2 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a02_respostas_v1";
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── estado ───────────────────────────────────────────────────────────── */
// a ordem inicial é embaralhada: o arquivo de conteúdo já lista os marcos
// em ordem cronológica, e a atividade perderia a graça se viesse pronta.
const embaralhar = (a) => {
  const v = a.slice();
  for (let i = v.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
};

const vazio = () => ({
  aluno: "", turma: "", grupo: "",
  a1: { linhas: {}, fechamento: "" },
  a2: { ordem: embaralhar(A2.marcos.map((m) => m.id)), pares: {}, fechamento: "" },
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

/* ── montagem das atividades ──────────────────────────────────────────── */
function montarCabecalho() {
  $("#topo-aula").textContent = "Aula 2";
  $("#sub-aula").textContent = AULA.disciplina + " · " + AULA.professor;
  $("#rodape-txt").textContent = AULA.instituicao + " · Centro Paula Souza";
  document.title = "Atividades — " + AULA.titulo;
}

function montarA1() {
  $("#a1-titulo").textContent = A1.titulo;
  $("#a1-tempo").textContent = A1.tempo;
  $("#a1-instrucao").textContent = A1.instrucao;
  $("#a1-fech-label").textContent = A1.fechamento;
  const cores = ["c-red", "c-blue", "c-green", "c-purple", "c-red", "c-blue"];
  $("#a1-linhas").innerHTML = A1.linhas.map((l, i) => `
    <div class="cartao ${cores[i % cores.length]}">
      <div class="rec">Recurso físico</div>
      <h4>${esc(l.recurso)}</h4>
      <div class="a1-grade">
        <div>
          <label for="a1-${l.id}-abs">Abstração que o SO oferece</label>
          <textarea id="a1-${l.id}-abs" rows="2" data-a1="${l.id}" data-campo="abstracao"
            placeholder="Como o programa enxerga esse recurso"></textarea>
        </div>
        <div>
          <label for="a1-${l.id}-sem">O que você teria que fazer sem o SO</label>
          <textarea id="a1-${l.id}-sem" rows="2" data-a1="${l.id}" data-campo="sem_so"
            placeholder="Cite um detalhe concreto do hardware"></textarea>
        </div>
      </div>
    </div>`).join("");

  $$("[data-a1]").forEach((el) => {
    const id = el.dataset.a1, campo = el.dataset.campo;
    el.value = (R.a1.linhas[id] || {})[campo] || "";
    el.addEventListener("input", () => {
      R.a1.linhas[id] = R.a1.linhas[id] || {};
      R.a1.linhas[id][campo] = el.value;
      salvar();
    });
  });
  campoTexto("#a1-fechamento", () => R.a1.fechamento, (v) => { R.a1.fechamento = v; });
}

function montarA2() {
  $("#a2-titulo").textContent = A2.titulo;
  $("#a2-tempo").textContent = A2.tempo;
  $("#a2-instrucao").textContent = A2.instrucao;
  $("#a2-fech-label").textContent = A2.fechamento;

  // garante que a ordem salva contenha exatamente os marcos atuais
  const ids = A2.marcos.map((m) => m.id);
  R.a2.ordem = R.a2.ordem.filter((i) => ids.includes(i));
  ids.forEach((i) => { if (!R.a2.ordem.includes(i)) R.a2.ordem.push(i); });

  desenharOrdem();

  const opcoes = '<option value="">— nenhum marco —</option>' +
    A2.marcos.map((m) => `<option value="${m.id}">${esc(m.texto)}</option>`).join("");
  $("#a2-pares").innerHTML = A2.gargalos.map((g) => `
    <div class="par">
      <span class="gid">Gargalo ${g.id.slice(1)}</span>
      <p>${esc(g.texto)}</p>
      <select data-g="${g.id}" aria-label="Marco que resolveu o gargalo ${g.id}">${opcoes}</select>
    </div>`).join("");
  $$("[data-g]").forEach((sel) => {
    sel.value = R.a2.pares[sel.dataset.g] || "";
    sel.addEventListener("change", () => {
      R.a2.pares[sel.dataset.g] = sel.value; salvar();
    });
  });
  campoTexto("#a2-fechamento", () => R.a2.fechamento, (v) => { R.a2.fechamento = v; });
}

function desenharOrdem() {
  const txt = Object.fromEntries(A2.marcos.map((m) => [m.id, m.texto]));
  $("#a2-ordem").innerHTML = R.a2.ordem.map((id, i) => `
    <li>
      <div class="pos">${i + 1}</div>
      <div class="marco">${esc(txt[id])}</div>
      <div class="setas">
        <button type="button" data-mv="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}
                aria-label="Mover para cima">▲</button>
        <button type="button" data-mv="${i}" data-d="1"
                ${i === R.a2.ordem.length - 1 ? "disabled" : ""} aria-label="Mover para baixo">▼</button>
      </div>
    </li>`).join("");
  $$("[data-mv]").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.mv, j = i + (+b.dataset.d);
    if (j < 0 || j >= R.a2.ordem.length) return;
    const o = R.a2.ordem;
    [o[i], o[j]] = [o[j], o[i]];
    salvar(); desenharOrdem();
  }));
}

function montarA3() {
  $("#a3-titulo").textContent = A3.titulo;
  $("#a3-tempo").textContent = A3.tempo;
  $("#a3-instrucao").textContent = A3.instrucao;
  const opc = '<option value="">— escolha —</option>' +
    TIPOS.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  const cores = ["c-red", "c-blue", "c-green", "c-purple"];
  $("#a3-cenarios").innerHTML = A3.cenarios.map((c, i) => `
    <div class="cartao ${cores[i]}">
      <div class="rec">Cenário ${c.id}</div>
      <h4>${esc(c.nome)}</h4>
      <p style="font-size:.92rem;margin:.3rem 0 .2rem">${esc(c.texto)}</p>
      <label for="a3-${c.id}-tipo">1. Tipo de sistema operacional adequado</label>
      <select id="a3-${c.id}-tipo" data-a3="${c.id}" data-campo="tipo">${opc}</select>
      <label for="a3-${c.id}-met">2. Métrica de sucesso</label>
      <textarea id="a3-${c.id}-met" rows="2" data-a3="${c.id}" data-campo="metrica"
        placeholder="O que precisa ser medido para dizer que o sistema cumpriu o papel"></textarea>
      <label for="a3-${c.id}-viz">3. O que daria errado com o tipo vizinho</label>
      <textarea id="a3-${c.id}-viz" rows="2" data-a3="${c.id}" data-campo="vizinho"
        placeholder="Qual tipo vizinho e qual a consequência concreta"></textarea>
    </div>`).join("");
  $$("[data-a3]").forEach((el) => {
    const id = el.dataset.a3, campo = el.dataset.campo;
    el.value = (R.a3[id] || {})[campo] || "";
    const ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, () => {
      R.a3[id] = R.a3[id] || {};
      R.a3[id][campo] = el.value; salvar();
    });
  });
}

function campoTexto(sel, ler, escrever) {
  const el = $(sel);
  el.value = ler() || "";
  el.addEventListener("input", () => { escrever(el.value); salvar(); });
}

function montarIdentificacao() {
  [["#nome", "aluno"], ["#turma", "turma"], ["#grupo", "grupo"]].forEach(([s, k]) => {
    const el = $(s);
    el.value = R[k] || "";
    el.addEventListener("input", () => { R[k] = el.value; salvar(); });
  });
}

/* ── navegação ────────────────────────────────────────────────────────── */
let etapa = 0;
const ETAPAS = 5;

function ir(n) {
  if (n === 1 && !R.aluno.trim()) {
    alert("Escreva seu nome completo antes de começar.");
    $("#nome").focus(); return;
  }
  etapa = n;
  $$(".etapa").forEach((s) => s.classList.toggle("ativa", +s.dataset.etapa === n));
  $("#barra").style.width = Math.round((Math.min(n, ETAPAS) / ETAPAS) * 100) + "%";
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (n === 4) revisar();
}
$$("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(+b.dataset.ir)));

/* ── revisão ──────────────────────────────────────────────────────────── */
function preenchidas() {
  return A1.linhas.filter((l) => {
    const v = R.a1.linhas[l.id] || {};
    return (v.abstracao || "").trim() && (v.sem_so || "").trim();
  }).length;
}

function revisar() {
  const nA1 = preenchidas();
  const nPares = Object.values(R.a2.pares).filter((v) => v).length;
  const nTipos = A3.cenarios.filter((c) => (R.a3[c.id] || {}).tipo).length;
  const nMet = A3.cenarios.filter((c) => ((R.a3[c.id] || {}).metrica || "").trim()).length;

  $("#revisao").innerHTML = `
    <div class="resumo">
      <div class="cab">${esc(R.aluno)}${R.turma ? " · " + esc(R.turma) : ""}${R.grupo ? " · grupo " + esc(R.grupo) : ""}</div>
      <div class="item"><b>Atividade 1</b> — ${nA1} de ${A1.linhas.length} linhas completas ·
        fechamento ${R.a1.fechamento.trim() ? "escrito" : '<span class="vazio">em branco</span>'}</div>
      <div class="item"><b>Atividade 2</b> — ordem definida · ${nPares} de ${A2.gargalos.length} gargalos pareados ·
        fechamento ${R.a2.fechamento.trim() ? "escrito" : '<span class="vazio">em branco</span>'}</div>
      <div class="item"><b>Atividade 3</b> — ${nTipos} de ${A3.cenarios.length} tipos escolhidos ·
        ${nMet} de ${A3.cenarios.length} métricas escritas</div>
    </div>`;

  const faltas = [];
  if (nA1 < A1.minimo) faltas.push(`Complete pelo menos ${A1.minimo} linhas da Atividade 1 (você tem ${nA1}).`);
  if (nPares < 4) faltas.push("Pareie pelo menos metade dos gargalos da Atividade 2.");
  if (nTipos < A3.cenarios.length) faltas.push("Escolha o tipo de sistema para os quatro cenários da Atividade 3.");
  $("#pendencias").innerHTML = faltas.length
    ? `<div class="aviso"><b>Ainda dá para melhorar antes de entregar:</b><ul>${
        faltas.map((f) => "<li>" + esc(f) + "</li>").join("")}</ul>
        Você pode entregar assim mesmo, mas o professor vê o que ficou em branco.</div>`
    : "";
}

/* ── entrega ──────────────────────────────────────────────────────────── */
$("#entregar").addEventListener("click", async () => {
  if (!R.aluno.trim()) { alert("Escreva seu nome antes de entregar."); ir(0); return; }
  const bt = $("#entregar");
  bt.disabled = true; bt.textContent = "Enviando…";
  $("#status-envio").textContent = "";
  R.enviado_em = new Date().toISOString();
  try {
    const resp = await fetch("api/entregar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(R),
    });
    const dados = await resp.json();
    if (!resp.ok || !dados.ok) throw new Error(dados.erro || "resposta inesperada do servidor");
    mostrarRecibo(dados);
    ir(5);
  } catch (e) {
    $("#status-envio").innerHTML =
      '<span style="color:#A6192E"><b>Não consegui enviar.</b> Confira se o celular continua ' +
      "conectado à internet e toque em Entregar de novo. Suas respostas não foram perdidas.</span>";
  } finally {
    bt.disabled = false; bt.textContent = "Entregar atividades";
  }
});

function mostrarRecibo(d) {
  const h = new Date(R.enviado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  $("#recibo-linha").textContent =
    `${R.aluno} — recebido às ${h}. Protocolo ${d.protocolo}.`;
  const c = d.correcao || {};
  $("#recibo-correcao").innerHTML = d.mostrar_correcao === false ? "" : `
    <p class="nota">Conferência automática das partes objetivas:</p>
    <div class="placar">
      <div><span class="n">${c.a2_ordem}/10</span><span class="r">marcos na posição certa</span></div>
      <div><span class="n">${c.a2_pares}/8</span><span class="r">gargalos pareados corretamente</span></div>
      <div><span class="n">${c.a3_tipos}/4</span><span class="r">cenários classificados</span></div>
    </div>
    <p class="nota">As respostas escritas são lidas pelo professor — não têm nota automática.</p>`;
  $("#baixar").onclick = () => baixarCopia(d);
}

/* ── cópia local ──────────────────────────────────────────────────────── */
function baixarCopia(d) {
  const txt = [
    AULA.titulo, AULA.disciplina, "",
    `Aluno: ${R.aluno}   Turma: ${R.turma}   Grupo: ${R.grupo}`,
    `Entregue em: ${new Date(R.enviado_em).toLocaleString("pt-BR")}   Protocolo: ${d.protocolo}`,
    "", "== ATIVIDADE 1 — DO RECURSO À ABSTRAÇÃO ==",
    ...A1.linhas.map((l) => {
      const v = R.a1.linhas[l.id] || {};
      return `\n- ${l.recurso}\n  Abstração: ${v.abstracao || "(em branco)"}\n  Sem o SO: ${v.sem_so || "(em branco)"}`;
    }),
    `\nFechamento: ${R.a1.fechamento || "(em branco)"}`,
    "", "== ATIVIDADE 2 — LINHA DO TEMPO ==", "Ordem cronológica indicada:",
    ...R.a2.ordem.map((id, i) => `  ${i + 1}. ${A2.marcos.find((m) => m.id === id).texto}`),
    "Pareamentos:",
    ...A2.gargalos.map((g) => {
      const m = R.a2.pares[g.id];
      return `  ${g.id} → ${m ? A2.marcos.find((x) => x.id === m).texto : "(nenhum)"}`;
    }),
    `Fechamento: ${R.a2.fechamento || "(em branco)"}`,
    "", "== ATIVIDADE 3 — ESTUDO DE CASO ==",
    ...A3.cenarios.map((c) => {
      const v = R.a3[c.id] || {};
      return `\n- Cenário ${c.id} (${c.nome})\n  Tipo: ${v.tipo || "(em branco)"}\n  Métrica: ${v.metrica || "(em branco)"}\n  Tipo vizinho: ${v.vizinho || "(em branco)"}`;
    }),
  ].join("\n");
  const nome = "A02_" + (R.aluno.trim().replace(/[^\wÀ-ÿ]+/g, "_") || "aluno") + ".txt";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
  a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ── gabarito (só depois que o professor libera) ──────────────────────── */
$("#ver-gabarito").addEventListener("click", async () => {
  const alvo = $("#gabarito");
  alvo.innerHTML = '<p class="nota">Consultando…</p>';
  try {
    const r = await fetch("api/gabarito");
    if (r.status === 403) {
      alvo.innerHTML = '<div class="aviso">O professor ainda não liberou o gabarito. ' +
        "Tente de novo depois da correção comentada em sala.</div>";
      return;
    }
    desenharGabarito(await r.json(), alvo);
  } catch (e) {
    alvo.innerHTML = '<div class="aviso">Não consegui consultar o gabarito agora.</div>';
  }
});

function desenharGabarito(g, alvo) {
  const txt = Object.fromEntries(A2.marcos.map((m) => [m.id, m.texto]));
  const linhas1 = A1.linhas.map((l) => `<tr><td>${esc(l.recurso)}</td><td>${esc(g.a1[l.id])}</td></tr>`).join("");
  const ordem = g.a2_ordem.map((id, i) => {
    const acertou = R.a2.ordem[i] === id;
    return `<tr class="${acertou ? "certo" : "errado"}"><td>${i + 1}º</td><td>${esc(txt[id])} <span style="color:#768499">(${g.a2_anos[id]})</span></td></tr>`;
  }).join("");
  const pares = A2.gargalos.map((gg) => {
    const esperado = g.a2_pares[gg.id] || [];
    const dado = R.a2.pares[gg.id] || "";
    const ok = esperado.includes(dado);
    return `<tr class="${ok ? "certo" : "errado"}"><td>${gg.id}</td><td>${
      esperado.map((m) => esc(txt[m])).join(" ou ")}</td></tr>`;
  }).join("");
  const casos = A3.cenarios.map((c) => {
    const ok = ((R.a3[c.id] || {}).tipo || "") === g.a3[c.id].tipo;
    return `<tr class="${ok ? "certo" : "errado"}"><td>${c.id}</td><td><b>${esc(g.a3[c.id].tipo)}</b><br>${esc(g.a3[c.id].metrica)}</td></tr>`;
  }).join("");
  alvo.innerHTML = `
    <div class="gab"><h4>Atividade 1 — abstrações de referência</h4><table>${linhas1}</table></div>
    <div class="gab"><h4>Atividade 2 — ordem cronológica</h4><table>${ordem}</table>
      <p class="nota">Verde: você acertou a posição.</p></div>
    <div class="gab"><h4>Atividade 2 — pareamentos</h4><table>${pares}</table>
      <p class="nota">${esc(g.a2_nota)}</p></div>
    <div class="gab"><h4>Atividade 3 — classificação</h4><table>${casos}</table></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao(); montarA1(); montarA2(); montarA3();
ir(0);
