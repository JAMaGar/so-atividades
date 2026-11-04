# -*- coding: utf-8 -*-
"""Aula 10 — o tamanho de página da sua máquina e um endereço lógico de verdade.

    python paginas.py

Mostra o tamanho de página que o sistema operacional usa, pega o endereço
(lógico) de uma variável deste programa e pede que você divida em página e
deslocamento. Depois confere. Só biblioteca padrão; Windows, Linux ou macOS.
"""
import ctypes
import os
import sys


def tamanho_pagina():
    if sys.platform.startswith("win"):
        class INFO(ctypes.Structure):
            _fields_ = [("a", ctypes.c_ushort), ("b", ctypes.c_ushort), ("pag", ctypes.c_ulong),
                        ("min", ctypes.c_void_p), ("max", ctypes.c_void_p), ("masc", ctypes.c_void_p),
                        ("n", ctypes.c_ulong), ("tipo", ctypes.c_ulong), ("gran", ctypes.c_ulong),
                        ("nivel", ctypes.c_ushort), ("rev", ctypes.c_ushort)]
        i = INFO()
        ctypes.windll.kernel32.GetSystemInfo(ctypes.byref(i))
        return i.pag
    return os.sysconf("SC_PAGE_SIZE")


def numero(txt):
    try:
        return int(txt.strip().replace(".", ""))
    except ValueError:
        return None


def main():
    tam = tamanho_pagina()
    bits = tam.bit_length() - 1
    dado = ctypes.c_int(42)
    end = ctypes.addressof(dado)
    print()
    print(f"  Tamanho de página nesta máquina: {tam} bytes  (2^{bits}: {bits} bits de deslocamento)")
    print(f"  Endereço lógico de uma variável deste programa: {end}")
    print(f"    em hexadecimal: {end:#x}   (os {bits // 4} dígitos hexa da direita são o deslocamento)")
    print()
    print("  Agora você: divida o endereço pelo tamanho de página.")
    p = numero(input("    Número da página: "))
    d = numero(input("    Deslocamento:     "))
    pc, dc = divmod(end, tam)
    print()
    print(f"  Página {pc}, deslocamento {dc}.  " +
          ("Você acertou as duas." if (p, d) == (pc, dc) else "Confira a conta: página = parte inteira, deslocamento = resto."))
    print(f"  Em bits: o endereço sem os {bits} bits de baixo é a página; os {bits} bits de baixo, o deslocamento.")
    print("  Este endereço é LÓGICO: o programa nunca vê o físico. Quem sabe o quadro é a tabela de páginas do SO.")
    print()


if __name__ == "__main__":
    main()
