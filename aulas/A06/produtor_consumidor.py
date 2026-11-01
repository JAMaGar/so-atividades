# -*- coding: utf-8 -*-
"""Aula 6, prática guiada — o problema produtor-consumidor de verdade.

Dois produtores colocam itens numerados num buffer de 5 posições; dois
consumidores retiram. O programa roda três versões e confere, item por item,
se tudo o que foi produzido foi consumido exatamente uma vez.

    python produtor_consumidor.py              as três versões
    python produtor_consumidor.py sem          só a versão sem sincronização
    python produtor_consumidor.py mutex        só com mutex
    python produtor_consumidor.py semaforos    só com mutex + semáforos

Roda com o Python que já está instalado, no Linux e no Windows.

Sobre o time.sleep(0) no meio da atualização do buffer: ele faz a thread
ceder o processador exatamente no pior momento — entre ler o índice e
gravá-lo de volta. É o que o escalonador faria por conta própria, só que de
vez em quando; aqui ele faz sempre, para que o erro apareça em segundos e não
em semanas. A corrida não é criada pelo sleep: ela já está no código. O sleep
só a torna visível.
"""

import sys
import threading
import time

CAPACIDADE = 5
POR_PRODUTOR = 2000
PRODUTORES = 2
CONSUMIDORES = 2
TOTAL = POR_PRODUTOR * PRODUTORES
LIMITE_S = 6.0                 # tempo máximo de cada versão


class Buffer:
    def __init__(self):
        self.itens = [None] * CAPACIDADE
        self.entra = 0          # próxima posição para gravar
        self.sai = 0            # próxima posição para ler
        self.ocupados = 0


# ─────────────────────────────────────────── versão 1: sem nada ──────────
def colocar_sem(b, item):
    while b.ocupados >= CAPACIDADE:          # espera ocupada: gira até ter vaga
        time.sleep(0)
    i = b.entra                              # ler
    time.sleep(0)                            #   <- o escalonador troca aqui
    b.itens[i] = item
    b.entra = (i + 1) % CAPACIDADE           # escrever
    b.ocupados += 1


def retirar_sem(b, fim):
    while b.ocupados <= 0:
        if fim.is_set():
            return None
        time.sleep(0)
    i = b.sai
    time.sleep(0)
    item = b.itens[i]
    b.itens[i] = None
    b.sai = (i + 1) % CAPACIDADE
    b.ocupados -= 1
    return item


# ─────────────────────────────────────── versão 2: só um mutex ───────────
TRAVA = threading.Lock()


def colocar_mutex(b, item):
    while True:
        with TRAVA:
            if b.ocupados < CAPACIDADE:
                i = b.entra
                time.sleep(0)
                b.itens[i] = item
                b.entra = (i + 1) % CAPACIDADE
                b.ocupados += 1
                return
        time.sleep(0)                        # buffer cheio: solta e tenta de novo


def retirar_mutex(b, fim):
    while True:
        with TRAVA:
            if b.ocupados > 0:
                i = b.sai
                time.sleep(0)
                item = b.itens[i]
                b.itens[i] = None
                b.sai = (i + 1) % CAPACIDADE
                b.ocupados -= 1
                return item
        if fim.is_set():
            return None
        time.sleep(0)


# ──────────────────────────── versão 3: mutex + dois semáforos ───────────
VAZIO = threading.Semaphore(CAPACIDADE)      # quantas vagas existem
CHEIO = threading.Semaphore(0)               # quantos itens existem
MUTEX = threading.Lock()                     # quem mexe nos índices


def colocar_sem_aforos(b, item):
    VAZIO.acquire()                          # wait(vazio): dorme se não há vaga
    with MUTEX:
        i = b.entra
        time.sleep(0)
        b.itens[i] = item
        b.entra = (i + 1) % CAPACIDADE
        b.ocupados += 1
    CHEIO.release()                          # signal(cheio): acorda um consumidor


def retirar_sem_aforos(b, fim):
    while not CHEIO.acquire(timeout=0.05):   # wait(cheio): dorme se não há item
        if fim.is_set():
            return None
    with MUTEX:
        i = b.sai
        time.sleep(0)
        item = b.itens[i]
        b.itens[i] = None
        b.sai = (i + 1) % CAPACIDADE
        b.ocupados -= 1
    VAZIO.release()                          # signal(vazio): acorda um produtor
    return item


VERSOES = {
    "sem": ("SEM SINCRONIZAÇÃO", colocar_sem, retirar_sem),
    "mutex": ("SÓ COM MUTEX (espera ocupada)", colocar_mutex, retirar_mutex),
    "semaforos": ("MUTEX + SEMÁFOROS vazio/cheio", colocar_sem_aforos, retirar_sem_aforos),
}


def rodar(chave):
    nome, colocar, retirar = VERSOES[chave]
    b = Buffer()
    recebidos = []
    rec_lock = threading.Lock()              # só para o placar, não para o buffer
    fim = threading.Event()
    prazo = time.perf_counter() + LIMITE_S

    def produtor(k):
        for j in range(POR_PRODUTOR):
            if time.perf_counter() > prazo:
                return
            colocar(b, k * POR_PRODUTOR + j + 1)

    def consumidor():
        while time.perf_counter() < prazo:
            item = retirar(b, fim)
            if item is None and fim.is_set():
                return
            with rec_lock:
                recebidos.append(item)
            time.sleep(0.0005)               # o consumidor "processa" o item

    t0 = time.perf_counter()
    c0 = time.process_time()
    ps = [threading.Thread(target=produtor, args=(k,), daemon=True) for k in range(PRODUTORES)]
    cs = [threading.Thread(target=consumidor, daemon=True) for _ in range(CONSUMIDORES)]
    for t in ps + cs:
        t.start()
    for t in ps:
        t.join(max(0.0, prazo - time.perf_counter()))
    # dá tempo de os consumidores esvaziarem o buffer, e então avisa o fim
    limite_dreno = time.perf_counter() + 1.0
    while b.ocupados > 0 and time.perf_counter() < limite_dreno:
        time.sleep(0.01)
    fim.set()
    for t in cs:
        t.join(max(0.0, prazo + 1.0 - time.perf_counter()))
    dt = time.perf_counter() - t0
    cpu = time.process_time() - c0
    travou = any(t.is_alive() for t in ps + cs) or dt > LIMITE_S

    validos = [x for x in recebidos if x is not None]
    vistos = set(validos)
    perdidos = TOTAL - len(vistos)
    duplicados = len(validos) - len(vistos)
    vazios = len(recebidos) - len(validos)
    ok = (perdidos == 0 and duplicados == 0 and vazios == 0 and not travou)
    return {"versao": chave, "nome": nome, "produzidos": TOTAL,
            "perdidos": perdidos, "duplicados": duplicados, "lidos_vazios": vazios,
            "segundos": round(dt, 2), "cpu_s": round(cpu, 2),
            "cpu_pct": round(100 * cpu / dt) if dt else 0,
            "travou": travou, "correto": ok}


def imprimir(r):
    print(f"  {r['nome']}")
    print(f"    itens produzidos ......... {r['produzidos']}")
    print(f"    PERDIDOS (nunca lidos) ... {r['perdidos']}")
    print(f"    DUPLICADOS (lidos 2x) .... {r['duplicados']}")
    print(f"    posições vazias lidas .... {r['lidos_vazios']}")
    print(f"    tempo .................... {r['segundos']} s"
          + ("   (estourou o limite: TRAVOU)" if r["travou"] else ""))
    print(f"    CPU gasta ................ {r['cpu_s']} s  ({r['cpu_pct']}% do tempo)")
    print(f"    resultado ................ {'CORRETO' if r['correto'] else 'ERRADO'}")
    print()


def main():
    quais = sys.argv[1:] or list(VERSOES)
    print()
    print("=" * 64)
    print("  AULA 6 · PRODUTOR-CONSUMIDOR — %d produtores, %d consumidores, buffer de %d"
          % (PRODUTORES, CONSUMIDORES, CAPACIDADE))
    print("=" * 64)
    print()
    res = []
    for q in quais:
        if q not in VERSOES:
            print("  versão desconhecida:", q, "— use sem, mutex ou semaforos")
            continue
        r = rodar(q)
        imprimir(r)
        res.append(r)
    print("  ANOTE NA PÁGINA: perdidos, duplicados, tempo e CPU de cada versão.")
    print("  Repare: as duas últimas acertam, mas não gastam a mesma CPU para isso.")
    print("=" * 64)
    print()
    return res


if __name__ == "__main__":
    main()
