/* Passo a passo do produtor-consumidor — uma linha de código por passo.

   Diferente de simulador.js (que sorteia milhares de passos para medir), aqui
   cada versão tem um ROTEIRO FIXO de escalonamento, escolhido para que o
   fenômeno daquela versão aconteça à vista do aluno:

     sem        → dois produtores leem a mesma posição; um item é sobrescrito
     mutex      → o consumidor sem item solta a trava e testa de novo (gira)
     semaforos  → o consumidor sem item dorme e só acorda com signal
     trocada    → o produtor dorme segurando o mutex: impasse

   O motor executa de verdade cada linha; o roteiro só diz QUEM executa. Se o
   roteiro mandar executar uma thread que está dormindo, o motor recusa — é
   assim que os roteiros foram conferidos.
*/
(function (raiz) {
  "use strict";

  /* ───────────────────────────── linhas de código ─────────────────────── */
  const L = {
    espera_cheio: { op: "espera_cheio", txt: "enquanto ocupados == N: testa de novo" },
    espera_vazio: { op: "espera_vazio", txt: "enquanto ocupados == 0: testa de novo" },
    se_cheio:     { op: "se_cheio",     txt: "se ocupados == N: unlock(m); recomeça" },
    se_vazio:     { op: "se_vazio",     txt: "se ocupados == 0: unlock(m); recomeça" },
    ler_entra:    { op: "ler_entra",    txt: "i = entra" },
    gravar:       { op: "gravar",       txt: "buffer[i] = item" },
    av_entra:     { op: "av_entra",     txt: "entra = (i + 1) % N" },
    ler_sai:      { op: "ler_sai",      txt: "i = sai" },
    retirar:      { op: "retirar",      txt: "item = buffer[i]" },
    av_sai:       { op: "av_sai",       txt: "sai = (i + 1) % N" },
    inc:          { op: "inc",          txt: "ocupados = ocupados + 1" },
    dec:          { op: "dec",          txt: "ocupados = ocupados - 1" },
    lock:         { op: "wait", s: "m", txt: "lock(m)" },
    unlock:       { op: "signal", s: "m", txt: "unlock(m)" },
    w_m:          { op: "wait", s: "m", txt: "wait(m)" },
    s_m:          { op: "signal", s: "m", txt: "signal(m)" },
    w_vazio:      { op: "wait", s: "vazio", txt: "wait(vazio)" },
    s_vazio:      { op: "signal", s: "vazio", txt: "signal(vazio)" },
    w_cheio:      { op: "wait", s: "cheio", txt: "wait(cheio)" },
    s_cheio:      { op: "signal", s: "cheio", txt: "signal(cheio)" },
  };

  /* ───────────────────────────── os quatro roteiros ───────────────────── */
  const CENARIOS = {
    sem: {
      nome: "Sem sincronização",
      ideia: "Nada protege entra nem ocupados. Observe os passos 2 a 8: P1 lê a posição " +
             "livre, mas é interrompido antes de gravar.",
      N: 2, vars: ["entra", "sai", "ocupados"], sems: {},
      codigo: {
        P: [L.espera_cheio, L.ler_entra, L.gravar, L.av_entra, L.inc],
        C: [L.espera_vazio, L.ler_sai, L.retirar, L.av_sai, L.dec],
      },
      threads: [["P1", "P", ["A"]], ["P2", "P", ["B"]], ["C1", "C", 2]],
      roteiro: "P1 P1 P2 P2 P2 P2 P2 P1 P1 P1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1",
      notas: {
        2: "P1 sabe que vai gravar na posição 0, mas AINDA NÃO GRAVOU. É aqui que o " +
           "escalonador troca de thread — e nada impede.",
        4: "P2 lê o mesmo entra = 0. As duas threads vão usar a mesma posição.",
        7: "P2 terminou: B está na posição 0. Pergunta: P1 continua com i = 0 guardado. " +
           "O que acontece quando ele voltar?",
        8: "Nenhuma das duas threads percebeu: não houve erro nem aviso. O programa segue " +
           "como se estivesse tudo certo.",
        10: "ocupados diz 2, mas o buffer tem um item só. As variáveis já não descrevem a " +
            "memória.",
        18: "O consumidor confiou em ocupados e foi buscar um segundo item que não existe.",
      },
      fim: "Produzidos: A e B. Consumidos: A e uma posição vazia. B se perdeu no passo 8. " +
           "Bastou uma troca de thread entre ler entra e gravá-lo.",
    },

    mutex: {
      nome: "Só com mutex",
      ideia: "Tudo entre lock e unlock é região crítica: só uma thread por vez. Observe os " +
             "passos 1 a 4: o consumidor sem item solta a trava e testa de novo.",
      N: 2, vars: ["entra", "sai", "ocupados"], sems: { m: 1 },
      codigo: {
        P: [L.lock, L.se_cheio, L.ler_entra, L.gravar, L.av_entra, L.inc, L.unlock],
        C: [L.lock, L.se_vazio, L.ler_sai, L.retirar, L.av_sai, L.dec, L.unlock],
      },
      threads: [["P1", "P", ["A"]], ["P2", "P", ["B"]], ["C1", "C", 2]],
      roteiro: "C1 C1 C1 C1 P1 P1 P1 P2 C1 P1 P1 P1 P1 P2 P2 P2 P2 P2 P2 " +
               "C1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1",
      notas: {
        2: "C1 continua PRONTO: o escalonador lhe dá a CPU de novo só para ele testar outra " +
           "vez se já chegou item.",
        4: "Segunda volta inútil. Cada uma é um passo de CPU gasto sem trabalho: é a espera " +
           "ocupada.",
        7: "P1 está com o mutex e leu entra = 0 — o mesmo ponto em que a versão sem " +
           "sincronização deu errado.",
        8: "Compare com o passo 4 da versão sem sincronização: lá P2 leu entra junto com P1. " +
           "Aqui ele só lê depois que P1 terminar.",
        13: "Repare que m não voltou a 1: P2 não precisa disputar de novo, acorda já dentro " +
            "da região crítica.",
        16: "P2 lê entra = 1: a posição certa, porque P1 já tinha atualizado entra.",
        19: "P2 solta o mutex e acorda C1, que dormia na fila de m desde o passo 9.",
      },
      fim: "Nada se perdeu: C1 consumiu A e B. Mas C1 gastou dois passos girando nos passos " +
           "2 e 4, sem trabalho útil. Com 1.000 itens, essas voltas viram a CPU desperdiçada " +
           "que a tabela de baixo mede.",
    },

    semaforos: {
      nome: "Mutex + semáforos",
      ideia: "vazio conta as vagas, cheio conta os itens, m protege os índices. Observe o " +
             "passo 1: sem item, o consumidor dorme em vez de testar de novo.",
      N: 2, vars: ["entra", "sai"], sems: { m: 1, vazio: 2, cheio: 0 },
      codigo: {
        P: [L.w_vazio, L.w_m, L.ler_entra, L.gravar, L.av_entra, L.s_m, L.s_cheio],
        C: [L.w_cheio, L.w_m, L.ler_sai, L.retirar, L.av_sai, L.s_m, L.s_vazio],
      },
      threads: [["P1", "P", ["A"]], ["P2", "P", ["B"]], ["C1", "C", 2]],
      roteiro: "C1 P1 P1 P1 P2 P2 P1 P1 P1 P1 C1 P2 P2 P2 P2 P2 " +
               "C1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1 C1",
      notas: {
        1: "Não há item, e C1 não fica testando: sai da fila de prontos e não gasta CPU até " +
           "alguém fazer signal(cheio). Compare com o passo 2 da versão só mutex, em que ele girava.",
        2: "wait(vazio): havia 2 vagas, agora 1. P1 reservou a sua vaga antes de pegar o " +
           "mutex.",
        6: "P2 já reservou a vaga no passo 5, mas os índices estão com P1. Espera dormindo.",
        9: "m não volta a 1: a vez passa direto para quem esperava. É o detalhe do semáforo " +
           "que mais se erra.",
        10: "Há um item, e C1 é avisado. Enquanto esperava, desde o passo 1, não gastou " +
            "nenhum passo.",
        11: "C1 tem item garantido, mas ainda precisa da vez nos índices: dorme de novo, " +
            "agora em outra fila.",
        16: "Ninguém esperava em cheio: o contador sobe para 1 e guarda o aviso para depois.",
        22: "C1 volta para o segundo item: cheio = 1, passa direto, sem dormir.",
      },
      fim: "Nada se perdeu, e ninguém girou: toda espera foi dormindo numa fila. É a " +
           "diferença para a versão só mutex — e por isso esta versão fica em 0% de CPU " +
           "desperdiçada.",
    },

    trocada: {
      nome: "Ordem trocada",
      ideia: "O mesmo código da versão com semáforos, mas o produtor faz wait(m) ANTES de " +
             "wait(vazio). P1 tem dois itens; o buffer cabe dois.",
      N: 2, vars: ["entra", "sai"], sems: { m: 1, vazio: 2, cheio: 0 },
      codigo: {
        P: [L.w_m, L.w_vazio, L.ler_entra, L.gravar, L.av_entra, L.s_m, L.s_cheio],
        C: [L.w_cheio, L.w_m, L.ler_sai, L.retirar, L.av_sai, L.s_m, L.s_vazio],
      },
      threads: [["P1", "P", ["A", "C"]], ["P2", "P", ["B"]], ["C1", "C", 3]],
      roteiro: "P1 P1 P1 P1 P1 P1 P1 P2 P2 P2 P2 P2 P2 P2 P1 P1 C1 C1",
      notas: {
        7: "A está no buffer. P1 volta ao início para produzir C.",
        14: "B entrou: o buffer está cheio (vazio = 0).",
        15: "P1 pega o mutex para produzir C...",
        16: "Não há vaga — e P1 dorme SEGURANDO O MUTEX, que pegou no passo anterior.",
        17: "C1 tem item para retirar (cheio = 2) e poderia liberar uma vaga...",
        18: "...mas precisa do mutex, que está com P1 dormindo. C1 dorme também.",
      },
      fim: "P1 espera uma vaga que só C1 libera; C1 espera o mutex que só P1 solta. " +
           "Ninguém mais vai executar. Trocar a ordem de dois wait foi o bastante — é o " +
           "assunto da aula 7.",
    },
  };

  /* ──────────────────────────────────── motor ─────────────────────────── */
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function executar(chave) {
    const c = CENARIOS[chave];
    const E = {
      N: c.N, buffer: new Array(c.N).fill(null), entra: 0, sai: 0, ocupados: 0,
      sems: {}, threads: {}, girando: 0, consumidos: [], sobrescritos: [], vazios_lidos: 0,
      gravados: [],
    };
    Object.keys(c.sems).forEach((s) => { E.sems[s] = { v: c.sems[s], fila: [], com: null }; });
    const ordem = [];
    c.threads.forEach(([id, tipo, arg]) => {
      ordem.push(id);
      E.threads[id] = { id: id, tipo: tipo, pc: 0, i: null, item: null, estado: "pronta",
                        em: null, girou: 0,
                        itens: tipo === "P" ? arg.slice() : null, quer: tipo === "C" ? arg : 0,
                        feitos: 0 };
    });
    const fotos = [{ E: copia(E), quem: null, linha: null, efeito: "Estado inicial.",
                     nota: c.ideia }];
    const agenda = c.roteiro.trim().split(/\s+/);

    function proxItem(t) {               // terminou a última linha do laço
      t.feitos += 1;
      if (t.tipo === "P") {
        if (t.feitos < t.itens.length) { t.pc = 0; return ""; }
      } else if (t.feitos < t.quer) { t.pc = 0; return ""; }
      t.estado = "terminou"; return ` ${t.id} terminou.`;
    }
    function acorda(sem, nome) {
      const id = sem.fila.shift();
      const w = E.threads[id];
      w.estado = "pronta"; w.em = null; w.pc += 1;   // acorda já depois do wait
      if (nome === "m") sem.com = id;
      return id;
    }

    agenda.forEach((id, k) => {
      const t = E.threads[id];
      if (!t) throw new Error(`passo ${k + 1}: thread ${id} não existe`);
      if (t.estado !== "pronta")
        throw new Error(`${chave} passo ${k + 1}: ${id} está ${t.estado}`);
      const cod = c.codigo[t.tipo];
      const pcAntes = t.pc;
      const ln = cod[t.pc];
      if (t.tipo === "P" && t.item === null) t.item = t.itens[t.feitos];
      let ef = "", avanca = true;
      switch (ln.op) {
        case "espera_cheio":
          if (E.ocupados === E.N) { avanca = false; t.girou++; E.girando++;
            ef = `ocupados = ${E.ocupados}: cheio, ${id} testa de novo (girando).`; }
          else ef = `ocupados = ${E.ocupados}: há vaga, segue.`;
          break;
        case "espera_vazio":
          if (E.ocupados === 0) { avanca = false; t.girou++; E.girando++;
            ef = `ocupados = 0: vazio, ${id} testa de novo (girando).`; }
          else ef = `ocupados = ${E.ocupados}: há item, segue.`;
          break;
        case "se_cheio":
        case "se_vazio": {
          const cond = ln.op === "se_cheio" ? E.ocupados === E.N : E.ocupados === 0;
          if (cond) {
            const m = E.sems.m; m.com = null;
            let quem = "";
            if (m.fila.length) quem = ` (o mutex passa para ${acorda(m, "m")})`;
            else m.v += 1;
            t.pc = 0; avanca = false; t.girou++; E.girando++;
            ef = `ocupados = ${E.ocupados}: ${ln.op === "se_cheio" ? "cheio" : "vazio"}. ` +
                 `${id} solta o mutex${quem} e recomeça — uma volta sem trabalho.`;
          } else ef = `ocupados = ${E.ocupados}: ${ln.op === "se_cheio" ? "há vaga" : "há item"}, segue.`;
          break;
        }
        case "ler_entra": t.i = E.entra; ef = `i = entra → i = ${t.i}.`; break;
        case "gravar": {
          const antes = E.buffer[t.i];
          E.buffer[t.i] = t.item; E.gravados.push(t.item);
          ef = `buffer[${t.i}] = ${t.item}.`;
          if (antes !== null) { E.sobrescritos.push(antes);
            ef += ` A posição já tinha ${antes}: ${antes} foi apagado!`; }
          break;
        }
        case "av_entra": E.entra = (t.i + 1) % E.N; ef = `entra = ${E.entra}.`; break;
        case "ler_sai": t.i = E.sai; ef = `i = sai → i = ${t.i}.`; break;
        case "retirar": {
          const v = E.buffer[t.i]; E.buffer[t.i] = null;
          if (v === null) { E.vazios_lidos++; E.consumidos.push(null);
            ef = `buffer[${t.i}] está VAZIO: o consumidor leu lixo.`; }
          else { E.consumidos.push(v); ef = `item = buffer[${t.i}] → ${v}. A posição fica livre.`; }
          break;
        }
        case "av_sai": E.sai = (t.i + 1) % E.N; ef = `sai = ${E.sai}.`; break;
        case "inc": E.ocupados += 1; ef = `ocupados = ${E.ocupados}.`; break;
        case "dec": E.ocupados -= 1; ef = `ocupados = ${E.ocupados}.`; break;
        case "wait": {
          const s = E.sems[ln.s];
          if (s.v > 0) {
            s.v -= 1; if (ln.s === "m") s.com = id;
            ef = `${ln.s} era ${s.v + 1}, agora ${s.v}: ${id} segue.`;
          } else {
            s.fila.push(id); t.estado = "dormindo"; t.em = ln.s; avanca = false;
            ef = `${ln.s} = 0: ${id} DORME na fila de ${ln.s}` +
                 (ln.s === "m" && s.com ? ` (o mutex está com ${s.com}).` : ".");
          }
          break;
        }
        case "signal": {
          const s = E.sems[ln.s];
          if (ln.s === "m") s.com = null;
          if (s.fila.length) {
            const w = acorda(s, ln.s);
            ef = `${w} esperava em ${ln.s}: ${w} ACORDA` +
                 (ln.s === "m" ? " já com o mutex" : "") + ` (${ln.s} continua ${s.v}).`;
          } else { s.v += 1; ef = `ninguém esperava: ${ln.s} = ${s.v}.`; }
          break;
        }
      }
      if (avanca) {
        t.pc += 1;
        if (t.pc >= cod.length) {
          if (t.tipo === "P") t.item = null;
          ef += proxItem(t);
        }
      }
      fotos.push({ E: copia(E), quem: id, tipo: t.tipo, linha: pcAntes, txt: ln.txt,
                   efeito: ef, nota: c.notas[k + 1] || "" });
    });

    const vivos = ordem.filter((id) => E.threads[id].estado !== "terminou");
    const impasse = vivos.length > 0 && vivos.every((id) => E.threads[id].estado === "dormindo");
    const produzidos = [].concat(...ordem.filter((id) => E.threads[id].tipo === "P")
                                          .map((id) => E.threads[id].itens));
    const chegaram = E.consumidos.filter((x) => x !== null);
    return {
      chave: chave, cenario: c, ordem: ordem, fotos: fotos, impasse: impasse,
      resumo: {
        produzidos: produzidos, gravados: E.gravados, consumidos: E.consumidos,
        perdidos: produzidos.filter((x) => chegaram.indexOf(x) < 0 &&
                                           E.buffer.indexOf(x) < 0),
        girando: E.girando, passos: agenda.length, vazios_lidos: E.vazios_lidos,
      },
    };
  }

  const API = { CENARIOS: CENARIOS, executar: executar };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.PASSO = API;
})(typeof window !== "undefined" ? window : this);
