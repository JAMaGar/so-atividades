/* Atividades da Aula 10 — lógica da página do aluno.
   Renderizador das quatro etapas de ETAPAS_DADOS (dados.js). Tipos de item:
     "end"    — endereço físico (número) ou trap
     "numero" — número inteiro
     "opcao"  — botões de escolha
     "texto"  — resposta escrita
     "alocar" — o aluno toca, pedido a pedido, no buraco que a política escolhe
   Etapas formativas (1 a 3): botão Conferir com o passo a passo; a PRIMEIRA
   resposta conferida fica registrada e é a que vale. Etapa 4: sem retorno.
   Sem dependências externas: precisa rodar sem internet, no celular. */

const CHAVE = "so_a10_respostas_v1";
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const COR = { red: "#A6192E", blue: "#1F4E78", green: "#548235", gold: "#BF9000",
              purple: "#7B4FA6", teal: "#1B6E6E", navy: "#08192D" };
const COR_PROC = { SO: "#08192D", A: "#9BB0C6", B: "#B3C7A5", C: "#C4AED6", D: "#E3CC8C", E: "#98BEBD",
                   P1: "#E9B8BE", P2: "#F2CC9A", P3: "#B5D3EE", P4: "#D7C4E8" };
const ULTIMA = ETAPAS_DADOS.length;
const POL = { first: "first fit", best: "best fit", worst: "worst fit" };

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
function pontos(tipo, resp, certo) {
  if (resp == null || String(resp).trim() === "") return 0;
  if (tipo === "alocar") {
    const a = String(resp).split(";"), c = String(certo).split(";");
    return c.filter((x, i) => a[i] === x).length / c.length;
  }
  if (tipo === "opcao") return String(resp) === String(certo) ? 1 : 0;
  const r = String(resp).trim().toLowerCase();
  if (tipo === "end" && (String(certo) === "trap" || r === "trap")) return r === String(certo) ? 1 : 0;
  const v = numero(resp);
  return v !== null && Math.abs(v - Number(certo)) < 0.011 ? 1 : 0;
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

/* Memória desenhada na vertical: endereço 0 em cima. Buracos podem ser botões. */
function memoriaHTML(mapa, clicavel, destaque) {
  const total = mapa.reduce((s, b) => s + b.tam, 0);
  return '<div class="mem">' + mapa.map((b) => {
    const h = Math.max(30, Math.round(260 * b.tam / total));
    const livre = b.dono === null;
    const cls = "blk" + (livre ? " livre" : "") + (destaque === b.ini ? " dest" : "");
    const txt = livre ? `livre · ${b.tam} KB` : `${b.dono} · ${b.tam} KB`;
    const cor = livre ? "" : ` style="background:${COR_PROC[b.dono] || "#9BB0C6"};height:${h}px` +
      (b.dono === "SO" ? ";color:#fff" : "") + '"';
    const end = `<span class="ini">${b.ini}</span>`;
    if (livre && clicavel) return `<button type="button" class="${cls}" style="height:${h}px" data-bur="${b.ini}">${end}${txt}</button>`;
    return livre ? `<div class="${cls}" style="height:${h}px">${end}${txt}</div>` : `<div class="${cls}"${cor}>${end}${txt}</div>`;
  }).join("") + "</div>";
}

function caixaRetorno(it, valor) {
  const p = pontos(it.tipo, valor, it.resp);
  const certo = it.tipo === "opcao" ? ((it.opcoes.find((o) => o.id === it.resp) || {}).texto || it.resp)
    : fmt(it.resp);
  const cab = p === 1 ? '<b class="ok-txt">Certo.</b>'
    : `<b class="erro-txt">Não.</b> Resposta: <b>${esc(certo)}</b>.`;
  return `<div class="retorno ${p === 1 ? "certo" : "errado"}">${cab}<ol>` +
    it.passos.map((x) => `<li>${esc(x)}</li>`).join("") + "</ol></div>";
}

function montarAlocar(et, it, box) {
  const prim = R[et.id].primeira, resp = R[et.id].itens;
  const alvo = document.createElement("div");
  box.appendChild(alvo);
  const escolhas = () => (resp[it.id] ? String(resp[it.id]).split(";") : []);
  const certo = String(it.resp).split(";");
  function desenhar() {
    const esc_ = escolhas(), k = esc_.length, n = it.pedidos.length;
    let h = "";
    if (k > 0) {
      const ult = it.passos_aloc[k - 1], ok = esc_[k - 1] === certo[k - 1];
      h += `<div class="retorno ${ok ? "certo" : "errado"}"><b class="${ok ? "ok-txt" : "erro-txt"}">` +
        `${ok ? "Certo." : "Não."}</b> ${esc(ult.motivo)}</div>`;
    }
    const mapa = k === 0 ? it.mapa : it.passos_aloc[k - 1].depois;
    if (k < n) {
      const [nome, tam] = it.pedidos[k];
      h += `<p class="pedido">Pedido ${k + 1} de ${n}: <b>${esc(nome)} quer ${tam} KB</b>. Com o ${POL[it.politica]}, qual buraco?</p>`;
      h += memoriaHTML(mapa, true, null);
      h += '<button type="button" class="opc-btn largo" data-bur="nenhum">Nenhum buraco serve: o pedido espera</button>';
    } else {
      h += memoriaHTML(mapa, false, null);
      const p = pontos("alocar", resp[it.id], it.resp);
      h += `<div class="retorno ${p === 1 ? "certo" : "errado"}"><b>${Math.round(p * n)} de ${n} escolhas certas.</b> ` +
        `${esc(it.passos.join(" "))}</div>`;
      if (prim[it.id] !== undefined) {
        const pp = pontos("alocar", prim[it.id], it.resp);
        h += `<p class="nota">Vale a primeira rodada: ${Math.round(pp * n)} de ${n}.</p>`;
      }
      h += '<button type="button" class="btn leve" data-recomecar="1">Recomeçar para treinar</button>';
    }
    alvo.innerHTML = h;
    alvo.querySelectorAll("[data-bur]").forEach((b) => {
      b.onclick = () => {
        const v = escolhas(); v.push(b.dataset.bur); resp[it.id] = v.join(";");
        if (v.length === n && prim[it.id] === undefined) prim[it.id] = resp[it.id];
        box.classList.add("respondida"); salvar(); atualizarProgresso(); desenhar();
      };
    });
    const rc = alvo.querySelector("[data-recomecar]");
    if (rc) rc.onclick = () => { resp[it.id] = ""; salvar(); desenhar(); };
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
  if (it.tipo === "alocar") { montarAlocar(et, it, box); return box; }
  const ret = document.createElement("div");
  const limpar = () => { ret.innerHTML = ""; };
  if (it.tipo === "opcao") {
    box.appendChild(botoesOpcao(it.opcoes, resp[it.id], it.coluna,
      (v) => { resp[it.id] = v; marcar(v); limpar(); }));
  } else if (it.tipo === "numero" || it.tipo === "end") {
    const linha = document.createElement("div"); linha.className = "linha-end";
    const i = document.createElement("input");
    i.type = "text"; i.inputMode = "numeric"; i.placeholder = it.tipo === "end" ? "endereço físico" : "número";
    i.value = resp[it.id] && resp[it.id] !== "trap" ? resp[it.id] : "";
    linha.appendChild(i);
    let tb = null;
    if (it.tipo === "end") {
      tb = document.createElement("button"); tb.type = "button";
      tb.className = "opc-btn trap" + (resp[it.id] === "trap" ? " sel" : ""); tb.textContent = "trap";
      tb.onclick = () => {
        const v = resp[it.id] === "trap" ? "" : "trap";
        resp[it.id] = v; tb.classList.toggle("sel", v === "trap"); if (v) i.value = "";
        marcar(v); limpar(); salvar(); atualizarProgresso();
      };
      linha.appendChild(tb);
    }
    i.addEventListener("input", () => {
      resp[it.id] = i.value; if (tb) tb.classList.remove("sel");
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
      if (v == null || String(v).trim() === "") { ret.innerHTML = '<p class="nota">Responda antes de conferir.</p>'; return; }
      if (prim[it.id] === undefined) prim[it.id] = v;
      salvar();
      let h = caixaRetorno(it, v);
      if (String(prim[it.id]) !== String(v)) {
        const pp = pontos(it.tipo, prim[it.id], it.resp);
        h += `<p class="nota">Vale a primeira resposta conferida (${esc(fmt(prim[it.id]))}): ${pp === 1 ? "certa" : "errada"}.</p>`;
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
    if (et.download) {
      const a = document.createElement("a");
      a.className = "btn"; a.href = et.download.arquivo; a.download = et.download.arquivo;
      a.textContent = et.download.rot; sec.appendChild(a);
    }
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
  if (it.tipo === "alocar") return v.split(";").filter(Boolean).length === it.pedidos.length || R[et.id].primeira[it.id] !== undefined;
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
      <div><span class="n">✓</span><span class="r">Lista prática 2 recebida</span></div>
    </div>
    <p class="nota">A nota da Lista prática 2 e a correção comentada aparecem quando o professor
      liberar o gabarito.</p>`;
}

/* ── baixar cópia ────────────────────────────────────────────────────── */
$("#baixar").onclick = () => {
  const b = new Blob([JSON.stringify(R, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = `A10_${(R.aluno || "aluno").replace(/[^\wÀ-ÿ]+/g, "_")}.json`;
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
      const p = pontos(it.tipo, vale, c.op);
      if (et.id === "a4") { acertos += p; total += 1; }
      const rot = it.tipo === "opcao" ? ((it.opcoes || []).find((o) => o.id === String(c.op)) || {}).texto || c.op
        : it.tipo === "alocar" ? String(c.op).split(";").join(" · ") : fmt(c.op);
      return `<tr class="${p === 1 ? "certo" : "errado"}"><td>${n}</td><td><b>${esc(rot)}</b><br>${esc(c.nota)}</td></tr>`;
    })).join("");
    html += `<div class="gab"><h4>${esc(et.titulo)}</h4><table>${linhas}</table></div>`;
  });
  const nota = total ? (10 * acertos / total).toFixed(1).replace(".", ",") : "–";
  alvo.innerHTML = `<div class="aviso ok">Lista prática 2: <b>${nota}</b> de 10 (pelas respostas guardadas neste aparelho).</div>`
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
