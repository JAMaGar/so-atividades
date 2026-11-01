/* Simulador do produtor-consumidor — roda no celular, sem Python.

   O mesmo problema de produtor_consumidor.py: dois produtores, dois
   consumidores, buffer de 5 posições, três versões. Aqui as "threads" são
   funções geradoras (function*) e um escalonador sorteia, a cada passo, qual
   thread pronta executa o próximo pedaço. Cada `yield` é um ponto em que o
   escalonador pode trocar de thread.

   Como no programa em Python, a troca é forçada entre LER o índice e GRAVÁ-LO
   de volta (o yield marcado "pior momento"). A corrida já está no código; o
   yield só a torna visível.

   Métrica de custo: "CPU desperdiçada" é a fração dos passos do escalonador
   gasta por threads que só testaram uma condição e voltaram a girar. Thread
   bloqueada num semáforo não recebe passo nenhum: dormir não gasta CPU.
*/

(function (raiz) {
  "use strict";

  const CAPACIDADE = 5;
  const PRODUTORES = 2;
  const CONSUMIDORES = 2;
  const POR_PRODUTOR = 500;
  const TOTAL = PRODUTORES * POR_PRODUTOR;
  const LIMITE_PASSOS = 400000;
  const PROCESSAR = 4;          // passos de trabalho útil por item consumido

  /* gerador pseudoaleatório com semente: a mesma semente repete a execução */
  function sorteador(semente) {
    let s = (semente >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* semáforo de contagem com fila FIFO, como nos livros */
  function Semaforo(valor, sim) {
    this.valor = valor; this.fila = []; this.sim = sim;
  }
  Semaforo.prototype.wait = function (t) {        // devolve true se a thread dormiu
    if (this.valor > 0) { this.valor -= 1; return false; }
    this.fila.push(t); t.dormindo = true; return true;
  };
  Semaforo.prototype.signal = function () {
    if (this.fila.length) { const t = this.fila.shift(); t.dormindo = false; return; }
    this.valor += 1;
  };

  /* ───────────────────────────────── as quatro versões ───────────────── */
  // Cada versão define colocar(b, item, t) e retirar(b, t) como geradores.
  // retirar devolve {item} ou {fim: true}.

  const VERSOES = {
    sem: {
      nome: "Sem sincronização",
      montar: function () { return {}; },
      colocar: function* (b, item, t, x) {
        while (b.ocupados >= CAPACIDADE) { b.desperdicio++; yield; }
        const i = b.entra;                  // ler
        yield;                              // <- pior momento: o escalonador troca aqui
        b.itens[i] = item;
        b.entra = (i + 1) % CAPACIDADE;     // escrever
        b.ocupados += 1;
      },
      retirar: function* (b, t, x) {
        while (b.ocupados <= 0) {
          if (b.produtoresFim === PRODUTORES) return { fim: true };
          b.desperdicio++; yield;
        }
        const i = b.sai;
        yield;                              // <- pior momento
        const item = b.itens[i];
        b.itens[i] = null;
        b.sai = (i + 1) % CAPACIDADE;
        b.ocupados -= 1;
        return { item: item };
      },
    },

    mutex: {
      nome: "Só com mutex (espera ocupada)",
      montar: function (sim) { return { m: new Semaforo(1, sim) }; },
      colocar: function* (b, item, t, x) {
        for (;;) {
          if (x.m.wait(t)) yield;           // dormiu esperando o mutex
          if (b.ocupados < CAPACIDADE) {
            const i = b.entra;
            yield;
            b.itens[i] = item;
            b.entra = (i + 1) % CAPACIDADE;
            b.ocupados += 1;
            x.m.signal();
            return;
          }
          x.m.signal();                     // cheio: solta e tenta de novo
          b.desperdicio++; yield;
        }
      },
      retirar: function* (b, t, x) {
        for (;;) {
          if (x.m.wait(t)) yield;
          if (b.ocupados > 0) {
            const i = b.sai;
            yield;
            const item = b.itens[i];
            b.itens[i] = null;
            b.sai = (i + 1) % CAPACIDADE;
            b.ocupados -= 1;
            x.m.signal();
            return { item: item };
          }
          x.m.signal();
          if (b.produtoresFim === PRODUTORES) return { fim: true };
          b.desperdicio++; yield;
        }
      },
    },

    semaforos: {
      nome: "Mutex + semáforos vazio/cheio",
      montar: function (sim) {
        return { m: new Semaforo(1, sim), vazio: new Semaforo(CAPACIDADE, sim),
                 cheio: new Semaforo(0, sim) };
      },
      colocar: function* (b, item, t, x) {
        if (x.vazio.wait(t)) yield;         // wait(vazio): dorme se não há vaga
        if (x.m.wait(t)) yield;             // wait(mutex)
        const i = b.entra;
        yield;
        b.itens[i] = item;
        b.entra = (i + 1) % CAPACIDADE;
        b.ocupados += 1;
        x.m.signal();
        x.cheio.signal();                   // acorda um consumidor
      },
      retirar: function* (b, t, x) {
        if (x.cheio.wait(t)) yield;         // wait(cheio): dorme se não há item
        if (b.encerrar) return { fim: true };
        if (x.m.wait(t)) yield;
        const i = b.sai;
        yield;
        const item = b.itens[i];
        b.itens[i] = null;
        b.sai = (i + 1) % CAPACIDADE;
        b.ocupados -= 1;
        x.m.signal();
        x.vazio.signal();                   // acorda um produtor
        return { item: item };
      },
    },

    trocada: {
      nome: "Semáforos com a ORDEM TROCADA no produtor",
      montar: function (sim) {
        return { m: new Semaforo(1, sim), vazio: new Semaforo(CAPACIDADE, sim),
                 cheio: new Semaforo(0, sim) };
      },
      colocar: function* (b, item, t, x) {
        if (x.m.wait(t)) yield;             // wait(mutex) PRIMEIRO — o erro
        if (x.vazio.wait(t)) yield;         // buffer cheio: dorme segurando o mutex
        const i = b.entra;
        yield;
        b.itens[i] = item;
        b.entra = (i + 1) % CAPACIDADE;
        b.ocupados += 1;
        x.m.signal();
        x.cheio.signal();
      },
      retirar: function* (b, t, x) { return yield* VERSOES.semaforos.retirar(b, t, x); },
    },
  };

  /* ─────────────────────────────────────────────── uma execução ──────── */
  function rodar(chave, semente) {
    const v = VERSOES[chave];
    const aleatorio = sorteador(semente || (Date.now() ^ (Math.random() * 1e9)));
    const b = { itens: new Array(CAPACIDADE).fill(null), entra: 0, sai: 0, ocupados: 0,
                desperdicio: 0, produtoresFim: 0, encerrar: false };
    const x = v.montar();
    const recebidos = [];
    const threads = [];

    function* produtor(k, t) {
      for (let j = 0; j < POR_PRODUTOR; j++) {
        yield* v.colocar(b, k * POR_PRODUTOR + j + 1, t, x);
        yield;
      }
      b.produtoresFim += 1;
    }
    function* consumidor(t) {
      for (;;) {
        const r = yield* v.retirar(b, t, x);
        if (r.fim) return;
        recebidos.push(r.item);
        // o consumidor "processa" o item: trabalho útil, mais lento que produzir
        for (let k = 0; k < PROCESSAR; k++) yield;
      }
    }
    for (let k = 0; k < PRODUTORES; k++) {
      const t = { nome: "P" + (k + 1), dormindo: false, acabou: false };
      t.g = produtor(k, t); threads.push(t);
    }
    for (let k = 0; k < CONSUMIDORES; k++) {
      const t = { nome: "C" + (k + 1), dormindo: false, acabou: false };
      t.g = consumidor(t); threads.push(t);
    }

    let passos = 0, impasse = false, estourou = false;
    for (;;) {
      const prontas = threads.filter((t) => !t.dormindo && !t.acabou);
      if (!prontas.length) {
        const prodAcabaram = threads.slice(0, PRODUTORES).every((t) => t.acabou);
        if (prodAcabaram && x.cheio && b.ocupados === 0 && !b.encerrar) {
          // tudo produzido e consumido: libera os consumidores que dormem em cheio
          b.encerrar = true;
          for (let k = 0; k < CONSUMIDORES; k++) x.cheio.signal();
          continue;
        }
        if (!threads.every((t) => t.acabou)) impasse = true;
        break;
      }
      if (passos >= LIMITE_PASSOS) { estourou = true; break; }
      const t = prontas[Math.floor(aleatorio() * prontas.length)];
      passos++;
      if (t.g.next().done) t.acabou = true;
    }

    const validos = recebidos.filter((i) => i !== null && i !== undefined);
    const vistos = new Set(validos);
    const perdidos = TOTAL - vistos.size;
    const duplicados = validos.length - vistos.size;
    const vazios = recebidos.length - validos.length;
    return {
      versao: chave, nome: v.nome, produzidos: TOTAL,
      perdidos: perdidos, duplicados: duplicados, lidos_vazios: vazios,
      passos: passos, desperdicio: b.desperdicio,
      cpu_pct: passos ? Math.round(100 * b.desperdicio / passos) : 0,
      impasse: impasse, estourou: estourou,
      dormindo: threads.filter((t) => t.dormindo).map((t) => t.nome),
      correto: perdidos === 0 && duplicados === 0 && vazios === 0 && !impasse && !estourou,
    };
  }

  const API = { rodar: rodar, VERSOES: VERSOES, TOTAL: TOTAL, CAPACIDADE: CAPACIDADE };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.SIMULADOR = API;
})(typeof window !== "undefined" ? window : this);
