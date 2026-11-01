/* Redução passo a passo — a mesma lógica de atividade.py (repetir()).

   Serve para três coisas da página: reduzir um grafo de alocação, fazer o teste
   de segurança do banqueiro e detectar deadlock. Em todas: há recursos livres;
   cada processo segura `tem` e precisa de `precisa`; quem cabe termina e
   devolve o que tinha. O aluno escolhe a cada passo; a página confere.

   `toques` é a lista do que o aluno tocou, na ordem: nomes de processo ou
   "ninguem" (= "ninguém mais pode terminar"). Ela é o que vai na entrega; o
   servidor refaz a conta a partir dela, sem confiar no celular. */
(function (raiz) {
  "use strict";
  const le = (a, b) => a.every((x, i) => x <= b[i]);
  const soma = (a, b) => a.map((x, i) => x + b[i]);

  function repetir(red, toques) {
    let livre = red.livre.slice();
    const feitos = [], log = [];
    let erros = 0, fim = false;
    const restantes = () => red.processos.filter((p) => feitos.indexOf(p) < 0);
    const cabe = (p) => le(red.precisa[p], livre);
    for (const t of toques) {
      if (fim) break;
      if (t === "ninguem") {
        const ainda = restantes().filter(cabe);
        if (ainda.length) { erros++; log.push({ t, ok: false, livre: livre.slice() }); }
        else { fim = true; log.push({ t, ok: true, livre: livre.slice() }); }
        continue;
      }
      if (feitos.indexOf(t) >= 0 || red.processos.indexOf(t) < 0) continue;
      if (cabe(t)) {
        const antes = livre.slice();
        livre = soma(livre, red.tem[t]);
        feitos.push(t);
        log.push({ t, ok: true, antes, livre: livre.slice() });
        if (!restantes().length) fim = true;
      } else {
        erros++;
        log.push({ t, ok: false, livre: livre.slice() });
      }
    }
    const sobraram = restantes();
    return { livre, feitos, sobraram, erros, fim, log,
             correto: fim && erros === 0 };
  }

  const API = { repetir, le };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.REDUCAO = API;
})(typeof window !== "undefined" ? window : this);
