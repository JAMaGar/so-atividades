# -*- coding: utf-8 -*-
"""Laboratório 2, parte B — quanto custa criar uma thread e um processo.

Roda com o Python que já está instalado, sem instalar nada, no Linux e no
Windows. Imprime os dois números em microssegundos e a razão entre eles.

    python medir_criacao.py

Feche o navegador e os programas pesados antes de medir: máquina ocupada
mede errado, e é o erro mais comum deste laboratório.
"""

import multiprocessing as mp
import os
import platform
import statistics
import sys
import threading
import time

N_THREADS = 200
N_PROCESSOS = 30
REPETICOES = 5


def nada():
    pass


def criar_threads(n=N_THREADS):
    t0 = time.perf_counter()
    ts = [threading.Thread(target=nada) for _ in range(n)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return (time.perf_counter() - t0) / n * 1e6


def criar_processos(n=N_PROCESSOS):
    """fork no Linux e macOS; spawn no Windows — em cada sistema, o custo real."""
    if hasattr(os, "fork"):
        t0 = time.perf_counter()
        filhos = []
        for _ in range(n):
            pid = os.fork()
            if pid == 0:
                os._exit(0)
            filhos.append(pid)
        for pid in filhos:
            os.waitpid(pid, 0)
        return (time.perf_counter() - t0) / n * 1e6
    t0 = time.perf_counter()
    ps = [mp.Process(target=nada) for _ in range(n)]
    for p in ps:
        p.start()
    for p in ps:
        p.join()
    return (time.perf_counter() - t0) / n * 1e6


def main():
    print()
    print("=" * 62)
    print("  LABORATÓRIO 2 · PARTE B — custo de criar thread e processo")
    print("=" * 62)
    print(f"  máquina: {platform.system()} {platform.release()} · "
          f"{os.cpu_count()} núcleos · Python {platform.python_version()}")
    mecanismo = "fork" if hasattr(os, "fork") else "spawn (Windows)"
    print(f"  mecanismo de criação de processo: {mecanismo}")
    print()
    print(f"  medindo {REPETICOES} vezes, {N_THREADS} threads e "
          f"{N_PROCESSOS} processos por vez…")

    ts = sorted(criar_threads() for _ in range(REPETICOES))
    ps = sorted(criar_processos() for _ in range(REPETICOES))
    ut, up = statistics.median(ts), statistics.median(ps)

    print()
    print(f"  thread     {ut:9.1f} µs por criação     (menor {ts[0]:.1f} · maior {ts[-1]:.1f})")
    print(f"  processo   {up:9.1f} µs por criação     (menor {ps[0]:.1f} · maior {ps[-1]:.1f})")
    print()
    print(f"  razão      {up / ut:9.1f} vezes          <- criar processo custa isso a mais")
    print()
    print("  ANOTE NA PÁGINA: os três números acima — thread, processo e razão.")
    print()
    print("  Conta para a última pergunta do laboratório:")
    print(f"    5 000 conexões por segundo × {up:.0f} µs = "
          f"{5000 * up / 1e6:.2f} s de CPU só criando processos,")
    print(f"    contra {5000 * ut / 1e6:.2f} s criando threads. "
          f"Um segundo de CPU por segundo de relógio")
    print("    significa um núcleo inteiro gasto só em criação.")
    print("=" * 62)
    print()


if __name__ == "__main__":
    mp.freeze_support()
    main()
