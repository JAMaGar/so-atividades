# -*- coding: utf-8 -*-
"""Laboratório 4 — investigação do sistema de arquivos (plano B do projetor).

Faz, numa pasta temporária, os mesmos seis passos do roteiro Linux e mostra o
que o sistema de arquivos respondeu: número do inode, contador de links, o que
acontece com o hard link e o link simbólico depois do rm, tamanho × espaço
ocupado de um arquivo esparso e o modo de permissão.

Só usa a biblioteca padrão. Funciona no Linux (inclusive WSL) e no Windows; no
Windows, alguns passos se comportam de outro jeito, e o programa diz qual e por quê.

    python lab04.py           roda os seis passos, pausando entre eles
    python lab04.py --direto  roda sem pausas

Nada fora da pasta temporária é tocado, e ela é apagada no fim.
"""
import os
import shutil
import stat
import subprocess
import sys
import tempfile

WIN = os.name == "nt"
PAUSA = "--direto" not in sys.argv


def titulo(n, txt, cmd):
    print()
    print("=" * 72)
    print(f" Passo {n} · {txt}")
    print(f"   no Linux: {cmd}")
    print("=" * 72)


def pausa():
    if PAUSA:
        try:
            input("   (Enter para continuar) ")
        except EOFError:
            pass


def info(nome):
    """Uma linha parecida com ls -li: inode, modo, links, tamanho, nome."""
    try:
        st = os.lstat(nome)
    except FileNotFoundError:
        return f"   {nome}: não existe"
    alvo = ""
    if stat.S_ISLNK(st.st_mode):
        alvo = " -> " + os.readlink(nome)
    return (f"   inode {st.st_ino:<20} {stat.filemode(st.st_mode)}  links {st.st_nlink}  "
            f"{st.st_size:>12,} bytes  {nome}{alvo}").replace(",", ".")


def ocupado(nome):
    """Espaço realmente alocado no disco, em bytes (o que o du mostra)."""
    if not WIN:
        return os.stat(nome).st_blocks * 512
    import ctypes
    from ctypes import wintypes
    f = ctypes.windll.kernel32.GetCompressedFileSizeW
    f.argtypes = [wintypes.LPCWSTR, ctypes.POINTER(wintypes.DWORD)]
    f.restype = wintypes.DWORD
    alto = wintypes.DWORD(0)
    baixo = f(os.path.abspath(nome), ctypes.byref(alto))
    return (alto.value << 32) + baixo


def mb(x):
    return f"{x / 2**20:,.1f} MB".replace(",", "X").replace(".", ",").replace("X", ".")


def main():
    base = tempfile.mkdtemp(prefix="lab04_")
    os.chdir(base)
    print(f"Pasta temporária: {base}")
    print("Sistema:", "Windows (NTFS)" if WIN else "Linux / WSL")
    try:
        # 1
        titulo(1, "criar um arquivo e ver o inode", 'echo "sistemas operacionais" > a.txt ; ls -li a.txt')
        with open("a.txt", "w", encoding="utf-8") as f:
            f.write("sistemas operacionais\n")
        print(info("a.txt"))
        print("   O número do inode identifica o arquivo. O nome a.txt está no diretório, não no inode.")
        pausa()

        # 2
        titulo(2, "hard link", "ln a.txt b.txt ; ls -li a.txt b.txt")
        os.link("a.txt", "b.txt")
        print(info("a.txt")); print(info("b.txt"))
        ia, ib = os.stat("a.txt").st_ino, os.stat("b.txt").st_ino
        print(f"   Mesmo inode? {'sim' if ia == ib else 'não'}. Contador de links: {os.stat('a.txt').st_nlink}.")
        pausa()

        # 3
        titulo(3, "link simbólico", "ln -s a.txt c.txt ; ls -li")
        tem_link = True
        try:
            os.symlink("a.txt", "c.txt")
        except (OSError, NotImplementedError) as e:
            tem_link = False
            print(f"   O Windows recusou o link simbólico ({e.__class__.__name__}).")
            print("   No Windows, criar link simbólico exige o Modo de Desenvolvedor ou administrador.")
            print("   No Linux este passo sempre funciona; o resultado esperado está no roteiro.")
        if tem_link:
            for n in ("a.txt", "b.txt", "c.txt"):
                print(info(n))
            print(f"   c.txt tem inode próprio ({os.lstat('c.txt').st_ino}); o conteúdo dele é só o texto 'a.txt'.")
        pausa()

        # 4
        titulo(4, "apagar o nome original", "rm a.txt ; cat b.txt ; cat c.txt ; ls -li")
        os.remove("a.txt")
        with open("b.txt", encoding="utf-8") as f:
            print("   cat b.txt →", f.read().strip())
        if tem_link:
            try:
                with open("c.txt", encoding="utf-8") as f:
                    print("   cat c.txt →", f.read().strip())
            except FileNotFoundError:
                print("   cat c.txt → No such file or directory (link quebrado)")
        print(info("b.txt"))
        if tem_link:
            print(info("c.txt"))
        print(f"   O inode continua com {os.stat('b.txt').st_nlink} link: o conteúdo só some quando o contador chega a 0.")
        pausa()

        # 5
        titulo(5, "arquivo esparso", "truncate -s 1G esparso.img ; ls -lh esparso.img ; du -h esparso.img")
        tam = 64 * 2**20 if WIN else 2**30      # no Windows, 64 MB: o NTFS pode reservar o espaço
        open("esparso.img", "wb").close()
        if WIN:
            subprocess.run(["fsutil", "sparse", "setflag", "esparso.img"], capture_output=True, text=True)
        with open("esparso.img", "r+b") as f:
            f.truncate(tam)
        t, o = os.stat("esparso.img").st_size, ocupado("esparso.img")
        print(f"   tamanho (ls): {mb(t)}")
        print(f"   ocupado (du): {mb(o)}")
        if o < t / 2:
            print("   Nenhum bloco foi escrito, então nenhum foi alocado: o tamanho é só um número no inode.")
        else:
            print("   Aqui o espaço foi reservado: este sistema de arquivos (ou esta pasta) não criou o arquivo")
            print("   esparso. No ext4 do Linux/WSL o du mostra 0: nenhum bloco escrito, nenhum alocado.")
        pausa()

        # 6
        titulo(6, "permissões", "chmod 640 b.txt ; ls -l b.txt")
        os.chmod("b.txt", 0o640)
        print(info("b.txt"))
        if WIN:
            print("   No Windows o os.chmod só liga ou desliga 'somente leitura'. As permissões de verdade")
            print("   ficam nas ACLs do NTFS (icacls b.txt). No Linux aparece -rw-r----- (640).")
        else:
            print(f"   Modo em octal: {stat.S_IMODE(os.stat('b.txt').st_mode):03o}.")
        pausa()

        # 7 (sem pergunta na página)
        titulo(7, "onde esta pasta está montada", "df -h . ; mount | grep ' / '")
        u = shutil.disk_usage(".")
        print(f"   disco desta pasta: {mb(u.total)} no total, {mb(u.free)} livres")
        if not WIN and os.path.exists("/proc/mounts"):
            melhor = ("", "", "")
            alvo = os.path.realpath(".")
            with open("/proc/mounts", encoding="utf-8") as f:
                for l in f:
                    dev, mp, tipo = l.split()[:3]
                    if (alvo == mp or alvo.startswith(mp.rstrip("/") + "/")) and len(mp) > len(melhor[1]):
                        melhor = (dev, mp, tipo)
            print(f"   ponto de montagem: {melhor[1]} · dispositivo {melhor[0]} · tipo {melhor[2]}")
    finally:
        os.chdir(tempfile.gettempdir())
        shutil.rmtree(base, ignore_errors=True)
        print()
        print("Pasta temporária apagada. Fim.")


if __name__ == "__main__":
    main()
