# -*- coding: utf-8 -*-
"""Aula 11 — conta faltas de página de verdade, na sua máquina.

    python faltas.py          reserva 64 MB
    python faltas.py 256      reserva 256 MB

O programa pede ao SO uma região de memória e depois toca nela uma página por
vez, duas vezes, contando as faltas de página do próprio processo (contador do
Windows, ou do Linux e do macOS). Na primeira passada as páginas ainda não
existem na RAM: o SO só as entrega quando são tocadas — é a paginação por
demanda. Na segunda passada elas já estão lá.
Só usa a biblioteca padrão.
"""
import mmap
import sys
import time


def contador_de_faltas():
    if sys.platform == "win32":
        import ctypes
        from ctypes import wintypes

        class PMC(ctypes.Structure):
            _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD),
                        ("PeakWorkingSetSize", ctypes.c_size_t), ("WorkingSetSize", ctypes.c_size_t),
                        ("QuotaPeakPagedPoolUsage", ctypes.c_size_t), ("QuotaPagedPoolUsage", ctypes.c_size_t),
                        ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                        ("PagefileUsage", ctypes.c_size_t), ("PeakPagefileUsage", ctypes.c_size_t)]
        k32 = ctypes.WinDLL("kernel32", use_last_error=True)
        k32.GetCurrentProcess.restype = wintypes.HANDLE
        try:
            f = k32.K32GetProcessMemoryInfo
        except AttributeError:
            f = ctypes.WinDLL("psapi").GetProcessMemoryInfo
        f.argtypes = [wintypes.HANDLE, ctypes.POINTER(PMC), wintypes.DWORD]
        f.restype = wintypes.BOOL

        def ler():
            c = PMC()
            c.cb = ctypes.sizeof(PMC)
            if not f(k32.GetCurrentProcess(), ctypes.byref(c), c.cb):
                raise OSError("GetProcessMemoryInfo falhou")
            return c.PageFaultCount, c.WorkingSetSize
        return ler
    import resource

    def ler():
        r = resource.getrusage(resource.RUSAGE_SELF)
        return r.ru_minflt + r.ru_majflt, None
    return ler


def passada(m, tam, pag, ler):
    f0, _ = ler()
    t0 = time.perf_counter()
    for i in range(0, tam, pag):
        m[i] = 1                        # escreve um byte em cada página
    dt = time.perf_counter() - t0
    f1, ws = ler()
    return f1 - f0, dt, ws


def br(n):
    return f"{n:,}".replace(",", ".")


def main():
    mb = int(sys.argv[1]) if len(sys.argv) > 1 else 64
    pag = mmap.PAGESIZE
    tam = mb * 1024 * 1024
    ler = contador_de_faltas()
    n = tam // pag
    print(f"Tamanho de página desta máquina: {br(pag)} bytes")
    print(f"Região reservada: {mb} MB = {br(n)} páginas\n")
    m = mmap.mmap(-1, tam)              # memória anônima: o SO ainda não entregou nenhum quadro
    f1, t1, ws1 = passada(m, tam, pag, ler)
    f2, t2, ws2 = passada(m, tam, pag, ler)
    ms = lambda t: f"{t * 1000:7.1f}".replace(".", ",")
    print(f"1ª passada: {br(f1):>8} faltas de página  ({ms(t1)} ms)")
    print(f"2ª passada: {br(f2):>8} faltas de página  ({ms(t2)} ms)")
    if f1:
        por_pag = f"{f1 / n:.2f}".replace(".", ",")
        custo = f"{1e6 * (t1 - t2) / max(f1, 1):.1f}".replace(".", ",")
        print(f"\nNa 1ª passada, cerca de {por_pag} falta por página tocada, "
              f"e cada falta custou uns {custo} µs a mais.")
    print("Essas faltas são \"menores\": o SO só arrumou um quadro zerado, sem ler o disco.")
    print("Uma falta que precisa ler do disco custa milhares de vezes mais.")
    if ws2:
        print(f"Working set do processo agora: {br(ws2 // 1024)} KB")
    m.close()
    if sys.platform == "win32" and len(sys.argv) == 1:
        input("\nEnter para fechar.")


if __name__ == "__main__":
    main()
