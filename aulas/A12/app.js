/* Atividades da Aula 12 — lógica da página do aluno.
   Renderizador das quatro etapas de ETAPAS_DADOS (dados.js). Tipos de item:
     "numero"     — número (ponto é separador de milhar)
     "opcao"      — botões de escolha
     "blocos"     — tocar, em ordem, nos blocos livres do mapa de bits
     "texto"      — resposta livre (não vale ponto)
   Etapas formativas (1 a 3): botão Conferir com o passo a passo; a PRIMEIRA
   resposta conferida fica registrada e é a que vale. Etapa 4: sem retorno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a12_respostas_v1";
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const COR = { red: "#A6192E", blue: "#1F4E78", green: "#548235", gold: "#BF9000",
              purple: "#7B4FA6", teal: "#1B6E6E", navy: "#08192D" };
const ULTIMA = ETAPAS_DADOS.length;
const POL = { fifo: "FIFO", lru: "LRU", otimo: "ótimo", relogio: "relógio" };
const ESPECIAIS = ["falta", "ilegal"];
const SEQ = ["substituir", "ordem", "blocos"];

/* ── estado ───────────────────────────────────────────────────────────── */
const vazio = () => {
  const r = { aluno: "", turma: "", grupo: "", iniciado_em: new Date().toISOString() };
  ETAPAS_DADOS.forEach((et) => { r[et.id] = { itens: {}, primeira: {} }; });
  return r;
};

let R = vazio();
try {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) {
    R = Object.assign(vazio(), JSON.parse(salvo));
    ETAPAS_DADOS.forEach((et) => {
      if (!R[et.id] || !R[et.id].itens) R[et.id] = { itens: {}, primeira: {} };
      if (!R[et.id].primeira) R[et.id].primeira = {};
    });
  }
} catch (e) { /* armazenamento indisponível: segue em memória */ }

const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(R)); } catch (e) {} };

/* ── correção local (a mesma regra de atividade.py) ─────────────────── */
function numero(x) {
  const s = String(x == null ? "" : x).trim().replace(/\./g, "").replace(/\s/g, "").replace(",", ".");
  if (!/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(s)) return null;
  return parseFloat(s);
}
function pontos(tipo, resp, certo, tol = 0) {
  if (resp == null || String(resp).trim() === "") return 0;
  if (SEQ.includes(tipo)) {
    const a = String(resp).split(";"), c = String(certo).split(";");
    return c.filter((x, i) => a[i] === x).length / c.length;
  }
  if (tipo === "opcao") return String(resp) === String(certo) ? 1 : 0;
  const r = String(resp).trim().toLowerCase();
  if (tipo === "vm" && (ESPECIAIS.includes(String(certo)) || ESPECIAIS.includes(r))) return r === String(certo) ? 1 : 0;
  const v = numero(resp);
  return v !== null && Math.abs(v - Number(certo)) < (tol || 0) + 0.011 ? 1 : 0;
}
const fmt = (v) => (typeof v === "number" ? v.toLocaleString("pt-BR") : String(v));

/* ── cabeçalho e identificação ───────────────────────────────────────── */
function montarCabecalho() {
  $("#topo-aula").textContent = AULA.titulo.split("—")[0].trim();
  $("#sub-aula").textContent = AULA.disciplina + " · " + AULA.instituicao;
  $("#rodape-txt").textContent = AULA.professor + " · " + AULA.instituicao;
  document.title = "Atividades — " + AULA.titulo;
  if (typeof AVISO_REDE !== "undefined" && AVISO_REDE) {
    const faixa = document.createElement("div");
    faixa.className = "faixa-rede"; faixa.textContent = AVISO_REDE;
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

/* ── componentes ─────────────────────────────────────────────────────── */
function botoesOpcao(opcoes, atual, coluna, onEscolha) {
  const div = document.createElement("div");
  div.className = "opcoes" + (coluna ? " coluna" : "");
  opcoes.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opc-btn" + (coluna ? " largo" : "") + (atual === o.id ? " sel" : "");
    b.textContent = o.texto; b.dataset.op = o.id;
    b.onclick = () => {
      div.querySelectorAll(".opc-btn").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel"); onEscolha(o.id); salvar(); atualizarProgresso();
    };
    div.appendChild(b);
  });
  return div;
}

function tabelaHTML(t) {
  return '<div class="gab"><table><tr>' + t.cab.map((c) => `<td><b>${esc(c)}</b></td>`).join("")
    + "</tr>" + t.linhas.map((l) => "<tr>" + l.map((c) => `<td>${esc(c)}</td>`).join("")
    + "</tr>").join("") + "</table></div>";
}

function textoCerto(it, v) {
  if (it.tipo === "opcao") return (it.opcoes.find((o) => o.id === String(v)) || {}).texto || v;
  if (it.tipo === "ordem") return String(v).split(";").map((k, i) => `${i + 1}. ${(it.opcoes.find((o) => o.id === k) || {}).texto || k}`).join("  ");
  if (it.tipo === "substituir") return String(v).split(";").map((x) => (x === "a" ? "acerto" : "q" + x)).join(" · ");
  if (it.tipo === "blocos") return "blocos " + String(v).split(";").join(", ");
  return fmt(v);
}

function caixaRetorno(it, valor) {
  const p = pontos(it.tipo, valor, it.resp, it.tol);
  let cab;
  if (p === 1) cab = '<b class="ok-txt">Certo.</b>';
  else if (it.tipo === "ordem" || it.tipo === "blocos") {
    const n = String(it.resp).split(";").length;
    cab = `<b class="erro-txt">${Math.round(p * n)} de ${n} na posição certa.</b> ` +
      (it.tipo === "blocos" ? `Resposta: <b>${esc(textoCerto(it, it.resp))}</b>.` : "A ordem:");
  } else cab = `<b class="erro-txt">Não.</b> Resposta: <b>${esc(textoCerto(it, it.resp))}</b>.`;
  return `<div class="retorno ${p === 1 ? "certo" : "errado"}">${cab}<ol>` +
    it.passos.map((x) => `<li>${esc(x)}</li>`).join("") + "</ol></div>";
}

/* Quadros na vertical, um por linha: página, e no relógio o bit e o ponteiro. */
function quadrosHTML(estado, it, clicavel) {
  return '<div class="quadros">' + estado.quadros.map((pg, i) => {
    const vazio = pg === null;
    const extra = it.politica === "relogio" && !vazio
      ? `<span class="bit${estado.bit[i] ? " um" : ""}">bit ${estado.bit[i]}</span>` : "";
    const ptr = it.politica === "relogio" && estado.ptr === i ? '<span class="ptr">▲ ponteiro</span>' : "";
    const corpo = `<span class="qid">q${i}</span><span class="pg">${vazio ? "vazio" : "página " + pg}</span>${extra}${ptr}`;
    return clicavel ? `<button type="button" class="qd${vazio ? " vazio" : ""}" data-q="${i}">${corpo}</button>`
                    : `<div class="qd${vazio ? " vazio" : ""}">${corpo}</div>`;
  }).join("") + "</div>";
}

function cadeiaHTML(it, k, escolhas) {
  const certo = String(it.resp).split(";");
  return '<div class="cadeia">' + it.cadeia.map((pg, t) => {
    const cls = t === k ? "atual" : t < k ? (escolhas[t] === certo[t] ? "feito ok" : "feito erro") : "";
    const marca = t < k ? (it.passos_sub[t].falta ? "F" : "·") : "";
    return `<span class="ref ${cls}"><b>${pg}</b><i>${marca}</i></span>`;
  }).join("") + "</div>";
}

function montarSubstituir(et, it, box) {
  const prim = R[et.id].primeira, resp = R[et.id].itens;
  const alvo = document.createElement("div");
  box.appendChild(alvo);
  const escolhas = () => (resp[it.id] ? String(resp[it.id]).split(";") : []);
  const certo = String(it.resp).split(";");
  const n = it.cadeia.length;
  const inicial = { quadros: Array(it.n).fill(null), bit: Array(it.n).fill(0), ptr: 0 };
  function desenhar() {
    const e = escolhas(), k = e.length;
    let h = cadeiaHTML(it, k, e);
    if (k > 0) {
      const ok = e[k - 1] === certo[k - 1];
      h += `<div class="retorno ${ok ? "certo" : "errado"}"><b class="${ok ? "ok-txt" : "erro-txt"}">` +
        `Referência ${k}: ${ok ? "certo." : "não."}</b> ${esc(it.passos_sub[k - 1].motivo)}</div>`;
    }
    const estado = k === 0 ? inicial : it.passos_sub[k - 1].depois;
    if (k < n) {
      h += `<p class="pedido">Referência ${k + 1} de ${n}: <b>página ${it.cadeia[k]}</b>. No ${POL[it.politica]}, onde ela fica?</p>`;
      if (it.politica === "otimo") h += `<p class="nota">Daqui em diante a cadeia usa: ${esc(it.cadeia.slice(k + 1).join(" ") || "nada")}.</p>`;
      h += quadrosHTML(estado, it, true);
      h += '<button type="button" class="opc-btn largo" data-q="a">Acerto: a página já está na memória</button>';
    } else {
      h += quadrosHTML(estado, it, false);
      const p = pontos("substituir", resp[it.id], it.resp);
      h += `<div class="retorno ${p === 1 ? "certo" : "errado"}"><b>${Math.round(p * n)} de ${n} referências certas.</b> ` +
        `${esc(it.passos.join(" "))}</div>`;
      if (prim[it.id] !== undefined) {
        const pp = pontos("substituir", prim[it.id], it.resp);
        h += `<p class="nota">Vale a primeira rodada: ${Math.round(pp * n)} de ${n}.</p>`;
      }
      h += '<button type="button" class="btn leve" data-recomecar="1">Recomeçar para treinar</button>';
    }
    alvo.innerHTML = h;
    alvo.querySelectorAll("[data-q]").forEach((b) => {
      b.onclick = () => {
        const v = escolhas(); v.push(b.dataset.q); resp[it.id] = v.join(";");
        if (v.length === n && prim[it.id] === undefined) prim[it.id] = resp[it.id];
        box.classList.add("respondida"); salvar(); atualizarProgresso(); desenhar();
      };
    });
    const rc = alvo.querySelector("[data-recomecar]");
    if (rc) rc.onclick = () => { resp[it.id] = ""; salvar(); desenhar(); };
  }
  desenhar();
}

function montarOrdem(et, it, box, limpar, marcar) {
  const resp = R[et.id].itens;
  const alvo = document.createElement("div");
  box.appendChild(alvo);
  function desenhar() {
    const sel = resp[it.id] ? String(resp[it.id]).split(";") : [];
    let h = '<div class="opcoes coluna">' + it.opcoes.map((o) => {
      const pos = sel.indexOf(o.id);
      return `<button type="button" class="opc-btn largo ordem-btn${pos >= 0 ? " sel" : ""}" data-o="${o.id}"` +
        `${pos >= 0 ? " disabled" : ""}><span class="pos">${pos >= 0 ? pos + 1 : ""}</span>${esc(o.texto)}</button>`;
    }).join("") + "</div>";
    if (sel.length) h += '<button type="button" class="btn leve" data-limpar="1">Recomeçar a ordem</button>';
    alvo.innerHTML = h;
    alvo.querySelectorAll("[data-o]").forEach((b) => {
      b.onclick = () => {
        const v = resp[it.id] ? String(resp[it.id]).split(";") : [];
        v.push(b.dataset.o); resp[it.id] = v.join(";");
        marcar(v.length === it.opcoes.length ? resp[it.id] : ""); limpar(); salvar(); atualizarProgresso(); desenhar();
      };
    });
    const lb = alvo.querySelector("[data-limpar]");
    if (lb) lb.onclick = () => { resp[it.id] = ""; marcar(""); limpar(); salvar(); atualizarProgresso(); desenhar(); };
  }
  desenhar();
}

/* Mapa de bits: um botão por bloco; ocupados (1) desativados. Toque em ordem. */
function montarBlocos(et, it, box, limpar, marcar) {
  const resp = R[et.id].itens;
  const alvo = document.createElement("div");
  box.appendChild(alvo);
  function desenhar() {
    const sel = resp[it.id] ? String(resp[it.id]).split(";") : [];
    let h = '<div class="mapa-bits">' + it.mapa.map((b, i) => {
      const pos = sel.indexOf(String(i));
      return `<button type="button" class="bit${b ? " ocup" : ""}${pos >= 0 ? " sel" : ""}" data-b="${i}"` +
        `${b || pos >= 0 || sel.length >= it.n ? " disabled" : ""}><span class="v">${b}</span>` +
        `<span class="i">${i}</span>${pos >= 0 ? `<span class="o">${pos + 1}º</span>` : ""}</button>`;
    }).join("") + "</div>";
    h += `<p class="nota">${sel.length} de ${it.n} escolhidos${sel.length ? ": blocos " + sel.join(", ") : ""}.</p>`;
    if (sel.length) h += '<button type="button" class="btn leve" data-limpar="1">Recomeçar</button>';
    alvo.innerHTML = h;
    alvo.querySelectorAll("[data-b]").forEach((b) => {
      b.onclick = () => {
        const v = resp[it.id] ? String(resp[it.id]).split(";") : [];
        if (v.length >= it.n) return;
        v.push(b.dataset.b); resp[it.id] = v.join(";");
        marcar(v.length === it.n ? resp[it.id] : ""); limpar(); salvar(); atualizarProgresso(); desenhar();
      };
    });
    const lb = alvo.querySelector("[data-limpar]");
    if (lb) lb.onclick = () => { resp[it.id] = ""; marcar(""); limpar(); salvar(); atualizarProgresso(); desenhar(); };
  }
  desenhar();
}

function montarItem(et, it, n) {
  const resp = R[et.id].itens, prim = R[et.id].primeira;
  const box = document.createElement("div");
  box.className = "item-q" + (String(resp[it.id] || "").trim() ? " respondida" : "");
  box.dataset.item = it.id;
  box.innerHTML = `<p class="enun"><span class="n">${n}</span>${esc(it.rot)}</p>`;
  const marcar = (v) => box.classList.toggle("respondida", String(v || "").trim() !== "");
  if (it.tipo === "substituir") { montarSubstituir(et, it, box); return box; }
  const ret = document.createElement("div");
  const limpar = () => { ret.innerHTML = ""; };
  if (it.tipo === "opcao") {
    box.appendChild(botoesOpcao(it.opcoes, resp[it.id], it.coluna,
      (v) => { resp[it.id] = v; marcar(v); limpar(); }));
  } else if (it.tipo === "ordem") {
    montarOrdem(et, it, box, limpar, marcar);
  } else if (it.tipo === "blocos") {
    montarBlocos(et, it, box, limpar, marcar);
  } else if (it.tipo === "numero" || it.tipo === "vm") {
    const linha = document.createElement("div"); linha.className = "linha-end";
    const i = document.createElement("input");
    i.type = "text"; i.inputMode = it.tol ? "decimal" : "numeric";
    i.placeholder = it.tipo === "vm" ? "endereço físico" : "número";
    i.value = resp[it.id] && !ESPECIAIS.includes(resp[it.id]) ? resp[it.id] : "";
    linha.appendChild(i);
    const bts = [];
    if (it.tipo === "vm") {
      ESPECIAIS.forEach((esp) => {
        const tb = document.createElement("button"); tb.type = "button";
        tb.className = "opc-btn trap" + (resp[it.id] === esp ? " sel" : ""); tb.textContent = esp; tb.dataset.esp = esp;
        tb.onclick = () => {
          const v = resp[it.id] === esp ? "" : esp;
          resp[it.id] = v; bts.forEach((x) => x.classList.toggle("sel", x.dataset.esp === v)); if (v) i.value = "";
          marcar(v); limpar(); salvar(); atualizarProgresso();
        };
        bts.push(tb); linha.appendChild(tb);
      });
    }
    i.addEventListener("input", () => {
      resp[it.id] = i.value; bts.forEach((x) => x.classList.remove("sel"));
      marcar(i.value); limpar(); salvar(); atualizarProgresso();
    });
    box.appendChild(linha);
  } else {
    const t = document.createElement("textarea");
    t.rows = 3; t.placeholder = it.dica || "Duas ou três frases."; t.value = resp[it.id] || "";
    t.addEventListener("input", () => { resp[it.id] = t.value; marcar(t.value); salvar(); atualizarProgresso(); });
    box.appendChild(t);
  }
  if (et.formativa && !it.livre && it.passos) {
    const bc = document.createElement("button");
    bc.type = "button"; bc.className = "btn conferir"; bc.textContent = "Conferir";
    bc.onclick = () => {
      const v = resp[it.id];
      if (v == null || String(v).trim() === "" ||
          (it.tipo === "ordem" && String(v).split(";").length < it.opcoes.length) ||
          (it.tipo === "blocos" && String(v).split(";").length < it.n)) {
        ret.innerHTML = '<p class="nota">Responda antes de conferir.</p>'; return;
      }
      if (prim[it.id] === undefined) prim[it.id] = v;
      salvar();
      let h = caixaRetorno(it, v);
      if (String(prim[it.id]) !== String(v)) {
        const pp = pontos(it.tipo, prim[it.id], it.resp, it.tol);
        const nn = it.tipo === "blocos" ? it.n : (it.opcoes || []).length;
        const rotp = (it.tipo === "ordem" || it.tipo === "blocos") ? `${Math.round(pp * nn)} de ${nn} na posição certa`
          : (pp === 1 ? "certa" : "errada");
        h += `<p class="nota">Vale a primeira resposta conferida: ${rotp}.</p>`;
      }
      ret.innerHTML = h;
    };
    box.appendChild(bc);
  }
  box.appendChild(ret);
  return box;
}

function montarEtapas() {
  const alvo = $("#etapas-geradas");
  ETAPAS_DADOS.forEach((et, k) => {
    const n = k + 1;
    const sec = document.createElement("section");
    sec.className = "etapa"; sec.dataset.etapa = String(n);
    sec.innerHTML = `<div class="eyebrow">${esc(et.eyebrow)}</div><h2>${esc(et.titulo)}</h2>
      <p class="nota">${esc(et.tempo)}</p><p class="lead">${esc(et.instrucao)}</p>`;
    (et.downloads || []).forEach((dl) => {
      const a = document.createElement("a");
      a.className = "btn"; a.href = dl.arquivo; a.download = dl.arquivo;
      a.textContent = dl.rot; sec.appendChild(a);
    });
    let cont = 0;
    et.grupos.forEach((g) => {
      const gr = document.createElement("div");
      gr.className = "cartao grupo-q";
      gr.style.borderLeft = `4px solid ${COR[g.cor] || COR.navy}`;
      let h = `<h4 style="color:${COR[g.cor] || COR.navy}">${esc(g.titulo)}</h4>`;
      if (g.texto) h += `<p class="nota">${esc(g.texto)}</p>`;
      if (g.tabela) h += tabelaHTML(g.tabela);
      gr.innerHTML = h;
      g.itens.forEach((it) => { cont += 1; gr.appendChild(montarItem(et, it, cont)); });
      sec.appendChild(gr);
    });
    const nav = document.createElement("div");
    nav.className = "nav";
    nav.innerHTML = `<button class="btn" data-ir="${n - 1}">Voltar</button>` +
      `<button class="btn primario" data-ir="${n + 1}">${n === ULTIMA ? "Revisar e entregar" : "Próxima etapa"}</button>`;
    sec.appendChild(nav);
    alvo.appendChild(sec);
  });
}

/* ── navegação e progresso ───────────────────────────────────────────── */
function ir(n) {
  $$(".etapa").forEach((s) => s.classList.toggle("ativa", Number(s.dataset.etapa) === n));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (n === ULTIMA + 1) montarRevisao();
  atualizarProgresso();
}

function completo(et, it) {
  const v = String(R[et.id].itens[it.id] || "").trim();
  if (it.tipo === "substituir") return v.split(";").filter(Boolean).length === it.cadeia.length || R[et.id].primeira[it.id] !== undefined;
  if (it.tipo === "ordem") return v.split(";").filter(Boolean).length === it.opcoes.length;
  return v !== "";
}
function contagem(et) {
  const itens = et.grupos.flatMap((g) => g.itens).filter((it) => !it.livre);
  return [itens.filter((it) => completo(et, it)).length, itens.length];
}
function atualizarProgresso() {
  let f = 0, t = 0;
  ETAPAS_DADOS.forEach((et) => { const [a, b] = contagem(et); f += a; t += b; });
  $("#barra").style.width = Math.round(100 * f / t) + "%";
}

/* ── revisão ─────────────────────────────────────────────────────────── */
function montarRevisao() {
  const linhas = ETAPAS_DADOS.map((et) => { const [a, b] = contagem(et); return [et.titulo, `${a} de ${b}`, a === b]; });
  $("#revisao").innerHTML = '<div class="gab"><table>' + linhas.map(([r, v, ok]) =>
    `<tr class="${ok ? "certo" : ""}"><td>${esc(r)}</td><td>${esc(v)}</td></tr>`).join("") + "</table></div>";
  const faltas = [];
  if (!R.aluno.trim()) faltas.push("seu nome completo");
  linhas.forEach(([r, , ok]) => { if (!ok) faltas.push(r.toLowerCase()); });
  $("#pendencias").innerHTML = faltas.length
    ? `<div class="aviso"><b>Ainda falta:</b> ${esc(faltas.join("; "))}.<br>
       A entrega é única: se entregar agora, não poderá completar depois.</div>`
    : '<div class="aviso ok">Tudo preenchido. Pode entregar.</div>';
}

/* ── entrega, com novas tentativas automáticas ─────────────────────────────────── */
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function enviar(tentativas = 4) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const r = await fetch("api/entregar", { method: "POST", headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify(R) });
      if (r.ok) return await r.json();
      if (r.status >= 400 && r.status < 500) return { erro: (await r.json()).erro || "pedido recusado pelo servidor" };
    } catch (e) { /* rede caiu: tenta de novo */ }
    if (i < tentativas) {
      $("#status-envio").textContent = `A rede está cheia. Tentando de novo (${i} de ${tentativas - 1})…`;
      await espera(400 * Math.pow(2, i - 1) + Math.random() * 300);
    }
  }
  return { erro: "não consegui falar com o servidor" };
}

$("#entregar").onclick = async () => {
  if (!R.aluno.trim()) { $("#status-envio").textContent = "Escreva seu nome completo na primeira etapa."; return ir(0); }
  const bt = $("#entregar");
  bt.disabled = true; $("#status-envio").textContent = "Entregando…";
  const resp = await enviar();
  bt.disabled = false;
  if (resp.erro) {
    $("#status-envio").innerHTML = `<span class="erro-txt">Não deu: ${esc(resp.erro)}.</span> Confira a conexão com a internet e toque em Entregar de novo — nada foi perdido.`;
    return;
  }
  R.protocolo = resp.protocolo; salvar();
  $("#status-envio").textContent = "";
  mostrarRecibo(resp); ir(ULTIMA + 2);
};

function mostrarRecibo(resp) {
  const hora = new Date().toTimeString().slice(0, 8);
  $("#recibo-linha").textContent = `${R.aluno} · protocolo ${resp.protocolo} · ${hora}`;
  const c = resp.correcao || {};
  $("#recibo-correcao").innerHTML = `
    <div class="placar">
      <div><span class="n">${c.formativas_pct ?? "–"}%</span><span class="r">acerto nas etapas 1 a 3</span></div>
      <div><span class="n">✓</span><span class="r">Laboratório 4 recebido</span></div>
    </div>
    <p class="nota">A nota do Laboratório 4 e a correção comentada aparecem quando o professor
      liberar o gabarito.</p>`;
}

/* ── baixar cópia ────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const b = new Blob([JSON.stringify(R, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = `A11_${(R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_")}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};

/* ── gabarito (só depois que o professor libera) ─────────────────────── */
$("#ver-gabarito").onclick = async () => {
  const alvo = $("#gabarito");
  alvo.innerHTML = '<p class="nota">consultando…</p>';
  try {
    const r = await fetch("api/gabarito");
    if (r.status === 403) {
      alvo.innerHTML = '<div class="aviso">O gabarito ainda não foi liberado. O professor libera depois da correção comentada.</div>';
      return;
    }
    desenharGabarito(await r.json(), alvo);
  } catch (e) { alvo.innerHTML = '<div class="aviso">Não consegui consultar o gabarito agora.</div>'; }
};

function desenharGabarito(g, alvo) {
  let html = "", acertos = 0, total = 0;
  ETAPAS_DADOS.forEach((et) => {
    const gab = g[et.id];
    if (!gab) return;
    let n = 0;
    const linhas = et.grupos.flatMap((gr) => gr.itens.map((it) => {
      n += 1;
      const c = gab[it.id];
      if (!c) return "";
      const vale = et.formativa && R[et.id].primeira[it.id] !== undefined ? R[et.id].primeira[it.id] : R[et.id].itens[it.id];
      const p = pontos(it.tipo, vale, c.op, it.tol);
      if (et.id === "a4") { acertos += p; total += 1; }
      const rot = textoCerto(it, c.op);
      return `<tr class="${p === 1 ? "certo" : "errado"}"><td>${n}</td><td><b>${esc(rot)}</b><br>${esc(c.nota)}</td></tr>`;
    })).join("");
    html += `<div class="gab"><h4>${esc(et.titulo)}</h4><table>${linhas}</table></div>`;
  });
  const nota = total ? (10 * acertos / total).toFixed(1).replace(".", ",") : "–";
  alvo.innerHTML = `<div class="aviso ok">Laboratório 4: <b>${nota}</b> de 10 (pelas respostas guardadas neste aparelho).</div>`
    + html + '<p class="nota">Verde: sua resposta coincide com o gabarito.</p>';
}

/* ── delegação dos botões de navegação ───────────────────────────────── */
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-ir]");
  if (b) ir(Number(b.dataset.ir));
});

/* ── início ───────────────────────────────────────────────────────────── */
montarCabecalho(); montarIdentificacao(); montarEtapas();
ir(0);
