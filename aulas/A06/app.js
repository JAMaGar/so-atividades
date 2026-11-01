/* Atividades da Aula 6 — lógica da página do aluno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a06_respostas_v1";
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

/* ── passo a passo: uma linha de código por toque ────────────────────── */
function montarPassoAPasso() {
  const raiz = document.createElement("div");
  raiz.className = "pp";
  if (typeof PASSO === "undefined") {
    raiz.innerHTML = '<div class="aviso">O passo a passo não carregou. Recarregue a página.</div>';
    return raiz;
  }
  const CHAVES = ["sem", "mutex", "semaforos", "trocada"];
  const COR = { P1: "t-p1", P2: "t-p2", C1: "t-c1" };
  let run = PASSO.executar("sem"), k = 0;

  raiz.innerHTML = `
    <div class="pp-abas">${CHAVES.map((c, i) => `<button type="button" data-c="${c}">
      <span class="pp-n">${i + 1}</span>${esc(PASSO.CENARIOS[c].nome)}</button>`).join("")}</div>
    <div class="pp-ideia"></div>
    <div class="pp-mem"></div>
    <div class="pp-th"></div>
    <div class="pp-cod"></div>
    <div class="pp-barra">
    <div class="pp-narra" aria-live="polite"></div>
    <div class="pp-ctrl">
      <button type="button" class="btn" data-a="ini" aria-label="Voltar ao início">⏮</button>
      <button type="button" class="btn" data-a="ant">◀</button>
      <button type="button" class="btn primario" data-a="prox">Próximo passo ▶</button>
      <button type="button" class="btn" data-a="fim" aria-label="Ir ao fim">⏭</button>
    </div></div>`;

  const chip = (id, extra) => `<span class="pp-chip ${COR[id] || ""} ${extra || ""}">${id}</span>`;
  const val = (v) => (v === null || v === undefined ? "—" : esc(String(v)));

  function desenhar() {
    const c = run.cenario, f = run.fotos[k], E = f.E, n = run.fotos.length - 1;
    raiz.querySelectorAll(".pp-abas button").forEach((b) =>
      b.classList.toggle("sel", b.dataset.c === run.chave));

    // narração
    raiz.querySelector(".pp-ideia").innerHTML =
      `<p class="pp-ef"><b>${esc(c.nome)}.</b> ${esc(c.ideia)}</p>`;
    let h = `<div class="pp-passo">Passo ${k} de ${n}</div>`;
    if (f.quem) h += `<p class="pp-ef">${chip(f.quem)} executou <code>${esc(f.txt)}</code> — ${esc(f.efeito)}</p>`;
    else h += `<p class="pp-ef">Estado inicial: buffer vazio, nenhuma thread executou. ` +
              `Toque em <b>Próximo passo</b>.</p>`;
    if (f.nota && k > 0) h += `<div class="pp-nota">${esc(f.nota)}</div>`;
    if (k === n) {
      const r = run.resumo;
      const cons = r.consumidos.map((x) => (x === null ? "(vazio)" : x)).join(", ") || "nenhum";
      h += `<div class="pp-fim ${run.impasse || r.perdidos.length ? "ruim" : "bom"}">
        <b>${run.impasse ? "Impasse." : r.perdidos.length ? "Resultado errado." : "Resultado correto."}</b>
        ${esc(c.fim)}
        <div class="pp-placar">gravados no buffer: ${esc(r.gravados.join(", ") || "nenhum")}
          · consumidos: ${esc(cons)} · passos girando: ${r.girando} de ${r.passos}</div></div>`;
    }
    raiz.querySelector(".pp-narra").innerHTML = h;

    // memória: buffer, variáveis, semáforos
    const ant = k > 0 ? run.fotos[k - 1].E : E;
    let m = '<div class="pp-rot">memória compartilhada</div><div class="pp-buf">';
    for (let i = 0; i < E.N; i++) {
      const mudou = ant.buffer[i] !== E.buffer[i] ? " mudou" : "";
      const marcas = (E.entra === i ? '<span class="pp-seta">entra</span>' : "") +
                     (E.sai === i ? '<span class="pp-seta sai">sai</span>' : "");
      m += `<div class="pp-slot${mudou}${E.buffer[i] === null ? " vazio" : ""}">
        <span class="pp-idx">[${i}]</span><b>${val(E.buffer[i])}</b><div class="pp-marcas">${marcas}</div></div>`;
    }
    m += "</div><div class=\"pp-vars\">";
    c.vars.forEach((v) => {
      m += `<span class="pp-var${ant[v] !== E[v] ? " mudou" : ""}">${v} = <b>${E[v]}</b></span>`;
    });
    Object.keys(E.sems).forEach((s) => {
      const S = E.sems[s], A = ant.sems[s];
      const mud = (A.v !== S.v || A.fila.join() !== S.fila.join()) ? " mudou" : "";
      m += `<span class="pp-var sem${mud}">${s} = <b>${S.v}</b>` +
           (S.com ? ` · com ${chip(S.com)}` : "") +
           (S.fila.length ? ` · fila: ${S.fila.map((x) => chip(x, "dorme")).join(" ")}` : "") + "</span>";
    });
    raiz.querySelector(".pp-mem").innerHTML = m + "</div>";

    // threads
    let t = '<div class="pp-rot">threads</div><div class="pp-ths">';
    run.ordem.forEach((id) => {
      const T = E.threads[id];
      let est = T.estado === "dormindo" ? `dormindo em ${T.em}` : T.estado;
      let cls = T.estado;
      if (f.quem === id) { est = "executou agora"; cls = "agora"; }
      const loc = T.tipo === "P"
        ? `item ${val(T.item !== null ? T.item : (T.estado === "terminou" ? null : T.itens[T.feitos]))}`
        : `consumiu ${T.feitos} de ${T.quer}`;
      t += `<div class="pp-t ${cls}">${chip(id)} <span class="pp-est">${esc(est)}</span>
        <span class="pp-loc">i = ${val(T.i)} · ${loc}${T.girou ? ` · girou ${T.girou}×` : ""}</span></div>`;
    });
    raiz.querySelector(".pp-th").innerHTML = t + "</div>";

    // código, com a linha executada e a posição de cada thread
    let cod = "";
    [["P", "Produtor"], ["C", "Consumidor"]].forEach(([tipo, nome]) => {
      const donos = run.ordem.filter((id) => E.threads[id].tipo === tipo);
      cod += `<div class="pp-rot">código do ${nome.toLowerCase()} (${donos.join(", ")})</div><ol class="pp-lin">`;
      c.codigo[tipo].forEach((ln, i) => {
        const exec = f.quem && f.tipo === tipo && f.linha === i;
        const aqui = donos.filter((id) => E.threads[id].estado !== "terminou" && E.threads[id].pc === i)
          .map((id) => chip(id, E.threads[id].estado === "dormindo" ? "dorme" : "")).join("");
        cod += `<li class="${exec ? "exec" : ""}"><code>${esc(ln.txt)}</code>
          <span class="pp-aqui">${exec ? `<span class="pp-feito">${f.quem} executou</span>` : ""}${aqui}</span></li>`;
      });
      cod += "</ol>";
    });
    cod += '<p class="nota pp-leg">Linha amarela: o que acabou de ser executado. Etiqueta ao lado ' +
           'de uma linha: é a próxima que aquela thread vai executar; tracejada, a thread está ' +
           'dormindo ali.</p>';
    raiz.querySelector(".pp-cod").innerHTML = cod;

    const b = (a) => raiz.querySelector(`[data-a="${a}"]`);
    b("ini").disabled = b("ant").disabled = k === 0;
    b("prox").disabled = b("fim").disabled = k === n;
    b("prox").textContent = k === n ? "Fim desta versão" : "Próximo passo ▶";
  }

  raiz.querySelector(".pp-abas").onclick = (ev) => {
    const btn = ev.target.closest("button"); if (!btn) return;
    run = PASSO.executar(btn.dataset.c); k = 0; desenhar();
  };
  raiz.querySelector(".pp-ctrl").onclick = (ev) => {
    const btn = ev.target.closest("button"); if (!btn) return;
    const n = run.fotos.length - 1;
    k = { ini: 0, ant: Math.max(0, k - 1), prox: Math.min(n, k + 1), fim: n }[btn.dataset.a];
    desenhar();
  };
  desenhar();
  return raiz;
}

/* ── simulador do produtor-consumidor (modo celular) ─────────────────── */
function montarSimulador() {
  const conj = document.createElement("div");
  const pp = document.createElement("div");
  pp.className = "cartao destaque";
  pp.innerHTML = `<h4>Simulador, etapa 1 — passo a passo</h4>
    <p class="nota">Duas threads produtoras (P1, P2) e uma consumidora (C1), buffer de 2
      posições. Cada toque em <b>Próximo passo</b> executa UMA linha de código de UMA thread,
      na ordem que o escalonador escolheu. Percorra as quatro versões, na ordem das abas, e
      leia as notas destacadas: são os momentos que explicam o resultado.</p>`;
  pp.appendChild(montarPassoAPasso());
  conj.appendChild(pp);

  const box = document.createElement("div");
  box.className = "cartao destaque sim";
  conj.appendChild(box);
  if (typeof SIMULADOR === "undefined") {
    box.innerHTML = '<div class="aviso">O simulador não carregou. Recarregue a página.</div>';
    return conj;
  }
  const milhar = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  box.innerHTML = `<h4>Simulador, etapa 2 — em escala: ${milhar(SIMULADOR.TOTAL)} itens</h4>
    <p class="nota">O mesmo código do passo a passo, agora com 2 produtores, 2 consumidores,
      buffer de ${SIMULADOR.CAPACIDADE} e ${milhar(SIMULADOR.TOTAL)} itens. Em vez de um roteiro fixo, o
      escalonador <b>sorteia</b> qual thread executa a cada passo — por isso o número de
      perdidos muda a cada execução. <b>CPU desperdiçada</b> é a parte dos passos gasta em
      voltas como as do passo 2 da versão só mutex; quem dorme num semáforo não gasta
      passo nenhum.</p>
    <button class="btn primario" type="button" id="sim-rodar">Rodar as três versões</button>
    <div id="sim-saida"></div>
    <details class="exemplo sim-extra">
      <summary>Experimente: trocar a ordem dos wait no produtor</summary>
      <div class="ex-corpo">
        <p class="nota">O produtor faz wait(mutex) ANTES de wait(vazio). É a pergunta 3 das
          conclusões — rode e veja o que acontece.</p>
        <button class="btn" type="button" id="sim-trocada">Rodar a versão com a ordem trocada</button>
        <div id="sim-trocada-saida"></div>
      </div>
    </details>`;
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  box.querySelector("#sim-rodar").onclick = () => {
    const rs = ["sem", "mutex", "semaforos"].map((v) => SIMULADOR.rodar(v));
    const linhas = rs.map((r) => `<tr class="${r.correto ? "certo" : "errado"}">
        <td>${esc(r.nome)}</td><td><b>${fmt(r.perdidos)}</b></td>
        <td>${r.duplicados}</td><td><b>${r.cpu_pct}%</b></td>
        <td>${r.correto ? "CORRETO" : "ERRADO"}</td></tr>`).join("");
    box.querySelector("#sim-saida").innerHTML = `
      <table class="ex-tab sim-tab"><tr><th>versão</th><th>perdidos</th><th>duplic.</th>
        <th>CPU desp.</th><th></th></tr>${linhas}</table>
      <p class="nota">Anote nos campos abaixo: perdidos e CPU desperdiçada de cada versão.
        Toque de novo para outra execução.</p>`;
    box.querySelector("#sim-rodar").textContent = "Rodar de novo";
  };
  box.querySelector("#sim-trocada").onclick = () => {
    const r = SIMULADOR.rodar("trocada");
    box.querySelector("#sim-trocada-saida").innerHTML = r.impasse
      ? `<div class="aviso">IMPASSE no passo ${fmt(r.passos)}: as quatro threads estão
           dormindo (${esc(r.dormindo.join(", "))}) e nenhuma vai acordar outra.
           ${fmt(SIMULADOR.TOTAL - r.perdidos)} de ${fmt(SIMULADOR.TOTAL)} itens chegaram
           antes de travar. É o assunto da aula 7.</div>`
      : `<div class="aviso ok">Desta vez não travou — o buffer não chegou a encher com o
           mutex na mão de um produtor. Rode de novo.</div>`;
  };
  return conj;
}

/* ── atividade 3 — prática guiada ─────────────────────────────────────── */
function montarA3() {
  $("#a3-titulo").textContent = A3.titulo;
  $("#a3-tempo").textContent = A3.tempo;
  const celular = typeof MODO_PRATICA !== "undefined" && MODO_PRATICA === "celular"
    && A3.celular;
  if (celular) {
    A3.instrucao = A3.celular.instrucao;
    A3.partes = A3.partes.map((p) => (p.id === "pb" ? A3.celular.parteB : p));
    A3.escritas = A3.escritas.map((e) =>
      (e.id === "obs_cpu" ? { id: e.id, rot: A3.celular.obs_cpu } : e));
  }
  $("#a3-instrucao").textContent = A3.instrucao;

  const alvo = $("#a3-partes");
  if (A3.download && !celular) {
    const dl = document.createElement("div");
    dl.className = "cartao destaque";
    dl.innerHTML = `<a class="btn" href="${esc(A3.download.arquivo)}" download>`
      + `${esc(A3.download.rot)}</a>
      <p class="nota">No computador do laboratório, abra este mesmo endereço e baixe o
        arquivo. Depois, no terminal, na pasta de downloads:
        <span class="cmd">python produtor_consumidor.py</span></p>`;
    alvo.appendChild(dl);
  }
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
    if (celular && p.id === "pb") alvo.insertBefore(montarSimulador(), box);
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
    ["Atividade 1 — situações classificadas", `${p.a1} de ${A1.itens.length}`,
     p.a1 === A1.itens.length],
    ["Atividade 2 — casos com mecanismo escolhido", `${p.a2} de ${A2.casos.length}`,
     p.a2 === A2.casos.length],
    ["Prática — campos preenchidos", `${p.a3c} de ${nCampos}`, p.a3c === nCampos],
    ["Prática — conclusões marcadas", `${p.a3o} de ${A3.objetivas.length}`,
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
           <span class="r">situações classificadas corretamente</span></div>
      <div><span class="n">${c.a3_acertos ?? "–"}/${A3.objetivas.length}</span>
           <span class="r">conclusões da prática</span></div>
      <div><span class="n">${c.nota_lab ?? "–"}</span>
           <span class="r">nota da prática (de 10)</span></div>
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
    <div class="gab"><h4>Atividade 1 — precisa sincronizar?</h4>
      <table>${l1}</table>
      <p class="nota">Verde: sua resposta coincide com o gabarito.</p></div>
    <div class="gab"><h4>Estudo de caso 1 — mecanismo de sincronização</h4>
      <table>${l2}</table>
      <p class="nota">${esc(g.a2_nota || "")}</p></div>
    <div class="gab"><h4>Prática — parte A, o traço</h4>
      <table><tr>${Object.keys(g.a3_traco || {}).map((k, i) => {
        const meu = String(R.a3.campos[k] || "").trim();
        const ok = meu !== "" && Number(meu.replace(",", ".")) === g.a3_traco[k];
        return `<td class="${ok ? "certo" : "errado"}">${i + 1}<br><b>${g.a3_traco[k]}</b></td>`;
      }).join("")}</tr></table>
      <p class="nota">Bloqueiam: ${esc((g.a3_bloqueadas || []).join(", "))}. Os passos 6 e 7
        acordam quem estava na fila, por isso S continua em 0.</p></div>
    <div class="gab"><h4>Prática — conclusões</h4><table>${l3}</table></div>
    <div class="gab"><h4>Atividade 1 — o critério</h4>
      <p class="nota">${esc(g.a1_fechamento || "")}</p></div>`;
}

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao();
montarA1(); montarA2(); montarA3(); montarA4();
ir(0);
