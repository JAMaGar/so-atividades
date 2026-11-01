/* Algoritmo do banqueiro — a mesma lógica de impasses.py, para o jogo da página.

   Convenção de varredura igual à do motor em Python: procura, em ordem circular
   a partir de quem terminou por último, um processo cuja necessidade caiba nos
   recursos livres. Assim a sequência mostrada no celular é a mesma dos slides.
   O teste automatizado compara as duas implementações rodada a rodada. */
(function (raiz) {
  "use strict";

  const le = (a, b) => a.every((x, i) => x <= b[i]);
  const soma = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);

  function necessidade(maximo, alocacao) {
    const n = {};
    Object.keys(maximo).forEach((p) => { n[p] = sub(maximo[p], alocacao[p]); });
    return n;
  }

  function seguro(disponivel, alocacao, maximo) {
    const ordem = Object.keys(maximo);
    const nec = necessidade(maximo, alocacao);
    let work = disponivel.slice();
    const fim = {}; ordem.forEach((p) => { fim[p] = false; });
    const seq = [], passos = [];
    let i = 0, semAvanco = 0;
    while (semAvanco < ordem.length) {
      const p = ordem[i % ordem.length];
      if (!fim[p] && le(nec[p], work)) {
        const antes = work;
        work = soma(work, alocacao[p]);
        fim[p] = true; seq.push(p); passos.push([p, antes, work]);
        semAvanco = 0;
      } else semAvanco++;
      i++;
    }
    const travados = ordem.filter((p) => !fim[p]);
    return { seguro: travados.length === 0, ordem: seq, travados: travados, passos: passos };
  }

  function avaliar(disponivel, alocacao, maximo, p, v) {
    const nec = necessidade(maximo, alocacao);
    if (!le(v, nec[p])) return { decisao: "erro", nec: nec[p] };
    if (!le(v, disponivel)) return { decisao: "esperar", nec: nec[p] };
    const disp2 = sub(disponivel, v);
    const aloc2 = Object.assign({}, alocacao); aloc2[p] = soma(alocacao[p], v);
    const t = seguro(disp2, aloc2, maximo);
    return { decisao: t.seguro ? "conceder" : "negar", nec: nec[p], teste: t, disp2: disp2 };
  }

  const livres = (total, aloc) =>
    total.map((t, i) => t - Object.values(aloc).reduce((s, v) => s + v[i], 0));

  /* Executa o jogo inteiro seguindo sempre a decisão correta. */
  function jogar(J) {
    let aloc = {}; Object.keys(J.alocacao).forEach((p) => { aloc[p] = J.alocacao[p].slice(); });
    let maximo = {}; Object.keys(J.maximo).forEach((p) => { maximo[p] = J.maximo[p].slice(); });
    const out = [];
    J.rodadas.forEach((r, k) => {
      const disp = livres(J.total, aloc);
      const antes = { disp: disp, aloc: JSON.parse(JSON.stringify(aloc)),
                      maximo: JSON.parse(JSON.stringify(maximo)),
                      nec: necessidade(maximo, aloc) };
      if (r.tipo === "fim") {
        const devolve = aloc[r.p];
        delete aloc[r.p]; delete maximo[r.p];
        out.push({ n: k + 1, tipo: "fim", p: r.p, devolve: devolve, antes: antes,
                   depois: livres(J.total, aloc) });
        return;
      }
      const a = avaliar(disp, aloc, maximo, r.p, r.v);
      if (a.decisao === "conceder") aloc[r.p] = soma(aloc[r.p], r.v);
      out.push({ n: k + 1, tipo: "pede", p: r.p, v: r.v, antes: antes, decisao: a.decisao,
                 certa: a.decisao === "negar" ? "esperar" : a.decisao, info: a,
                 depois: livres(J.total, aloc) });
    });
    return out;
  }

  const API = { seguro: seguro, avaliar: avaliar, jogar: jogar, necessidade: necessidade };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.BANQUEIRO = API;
})(typeof window !== "undefined" ? window : this);
