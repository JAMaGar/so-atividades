# -*- coding: utf-8 -*-
"""Aula 11 — compara FIFO, LRU, relógio e ótimo numa cadeia de referências.

    python substituicao.py                      a cadeia da etapa 3 da atividade
    python substituicao.py 1 2 3 4 1 2 5 1 2 3 4 5   uma cadeia sua
    python substituicao.py --passo lru 3 1 2 3 2 5   o passo a passo de um algoritmo

Mostra quantas faltas cada algoritmo faz com 1 a 7 quadros e avisa quando
acontece a anomalia de Belady (mais quadros, MAIS faltas). Sem argumentos, no
fim pede outras cadeias para você testar. Só usa a biblioteca padrão.

Convenções (as da aula): quadros vazios são preenchidos de cima para baixo; no
ótimo, entre páginas que não serão mais usadas, sai a que chegou primeiro; no
relógio, a página que entra e a que é usada ficam com bit 1.
"""
import sys

NOMES = {"fifo": "FIFO", "lru": "LRU", "relogio": "Relógio", "otimo": "Ótimo"}
PADRAO = [1, 2, 1, 5, 2, 3, 1, 3, 2, 5, 4, 2, 4, 5, 1, 5, 1, 5, 6, 5]


def simular(cadeia, n, politica):
    """Devolve (faltas, linhas), uma linha por referência: (página, quadros depois, falta?, vítima)."""
    q, cheg, uso, bit = [None] * n, [0] * n, [0] * n, [0] * n
    ptr, faltas, linhas = 0, 0, []
    for t, pg in enumerate(cadeia):
        vit = None
        if pg in q:
            i = q.index(pg)
            uso[i], bit[i] = t, 1
            linhas.append((pg, list(q), False, None))
            continue
        faltas += 1
        if None in q:
            i = q.index(None)
        elif politica == "fifo":
            i = min(range(n), key=lambda k: cheg[k])
        elif politica == "lru":
            i = min(range(n), key=lambda k: uso[k])
        elif politica == "otimo":
            def prox(k):
                for u in range(t + 1, len(cadeia)):
                    if cadeia[u] == q[k]:
                        return u
                return None
            p = [prox(k) for k in range(n)]
            nunca = [k for k in range(n) if p[k] is None]
            i = min(nunca, key=lambda k: cheg[k]) if nunca else max(range(n), key=lambda k: p[k])
        else:
            while bit[ptr] == 1:
                bit[ptr] = 0
                ptr = (ptr + 1) % n
            i = ptr
        if q[i] is not None:
            vit = q[i]
        q[i], cheg[i], uso[i], bit[i] = pg, t, t, 1
        if politica == "relogio":
            ptr = (i + 1) % n
        linhas.append((pg, list(q), True, vit))
    return faltas, linhas


def tabela(cadeia, quadros=range(1, 8)):
    quadros = [n for n in quadros if n <= max(1, len(set(cadeia)))] or [1]
    print(f"\nCadeia ({len(cadeia)} referências, {len(set(cadeia))} páginas diferentes):")
    print("  " + " ".join(map(str, cadeia)))
    print("\nFaltas de página por número de quadros")
    print("  " + "quadros".ljust(10) + "".join(f"{n:>5}" for n in quadros))
    avisos = []
    for pol in ("fifo", "lru", "relogio", "otimo"):
        f = [simular(cadeia, n, pol)[0] for n in quadros]
        print("  " + NOMES[pol].ljust(10) + "".join(f"{x:>5}" for x in f))
        for a, b, fa, fb in zip(quadros, quadros[1:], f, f[1:]):
            if fb > fa:
                avisos.append(f"{NOMES[pol]}: {fa} faltas com {a} quadros e {fb} com {b}")
    print("\n  Anomalia de Belady: " + ("; ".join(avisos) if avisos else "não aconteceu nesta cadeia."))
    print(f"  Mínimo possível (só as faltas da primeira vez): {len(set(cadeia))}.")


def passo(pol, n, cadeia):
    f, linhas = simular(cadeia, n, pol)
    print(f"\n{NOMES[pol]} com {n} quadros")
    for t, (pg, q, falta, vit) in enumerate(linhas, 1):
        qs = " ".join("." if x is None else str(x) for x in q)
        info = ("FALTA" + (f", sai a {vit}" if vit is not None else "")) if falta else "acerto"
        print(f"  ref {t:>2}: página {pg}  →  [{qs}]  {info}")
    print(f"  total: {f} faltas")


def ler_cadeia(txt):
    return [int(x) for x in txt.replace(",", " ").split()]


def main(args):
    if args[:1] == ["--passo"]:
        pol, n, cad = args[1], int(args[2]), ler_cadeia(" ".join(args[3:]))
        return passo(pol, n, cad)
    if args:
        return tabela(ler_cadeia(" ".join(args)))
    tabela(PADRAO)
    while True:
        try:
            txt = input("\nDigite outra cadeia (números separados por espaço) ou Enter para sair: ")
        except EOFError:
            break
        if not txt.strip():
            break
        try:
            tabela(ler_cadeia(txt))
        except ValueError:
            print("  Use só números inteiros separados por espaço.")


if __name__ == "__main__":
    main(sys.argv[1:])
