/* Conteúdo das atividades da Aula 3 — Estruturas do SO e chamadas de sistema.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito NÃO está aqui: fica em atividade.py e só é enviado ao aluno
   depois que o professor libera no painel. */

/* Aviso mostrado no topo da página. Com o switch dedicado a conexão é estável;
   o aviso continua útil porque as respostas ficam salvas no aparelho mesmo se
   a rede oscilar. Deixe "" para não mostrar. */
const AVISO_REDE =
  "Suas respostas ficam salvas neste aparelho enquanto você responde. " +
  "Se a rede cair, nada é perdido: reconecte e toque em Entregar.";

const AULA = {
  titulo: "Aula 3 — Estruturas do SO e chamadas de sistema",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

/* ── Atividade 1 — De que lado da fronteira? ───────────────────────────── */
const A1 = {
  titulo: "De que lado da fronteira?",
  tempo: "7 min individual · 3 min em dupla · 2 min coletivo",
  instrucao:
    "Para cada operação, escolha uma das três respostas. A terceira é a que separa quem " +
    "entendeu a aula: existem coisas que o programa não faz nem pedindo, porque são " +
    "instruções privilegiadas que só o núcleo executa.",
  opcoes: [
    { id: "usuario", curto: "Faz sozinho",
      longo: "O programa faz sozinho, em modo usuário" },
    { id: "chamada", curto: "Pede ao núcleo",
      longo: "Precisa de uma chamada de sistema" },
    { id: "nunca", curto: "Nunca faz",
      longo: "Não faz nem pedindo — instrução privilegiada do núcleo" },
  ],
  itens: [
    { id: "i1", texto: "Somar dois números que já estão na memória do próprio programa." },
    { id: "i2", texto: "Abrir um arquivo do disco para leitura." },
    { id: "i3", texto: "Escrever um valor direto no registrador do controlador do disco." },
    { id: "i4", texto: "Criar um novo processo para executar outro programa." },
    { id: "i5", texto: "Ordenar um vetor de dez mil números que o programa já carregou." },
    { id: "i6", texto: "Perguntar ao sistema que horas são, com precisão de milissegundo." },
    { id: "i7", texto: "Desligar as interrupções do processador por alguns instantes." },
    { id: "i8", texto: "Chamar uma função de raiz quadrada da biblioteca de matemática." },
    { id: "i9", texto: "Enviar um sinal para encerrar outro processo do mesmo usuário." },
    { id: "i10", texto: "Trocar a tabela de páginas para passar a executar outro processo." },
  ],
  fechamento:
    "Escolha um dos itens que você marcou como \"nunca faz\" e explique em uma frase por que " +
    "o núcleo não oferece aquilo como chamada de sistema.",
};

/* ── Atividade 2 — Laboratório 1: exploração do sistema ────────────────── */
const A2 = {
  titulo: "Laboratório 1 — exploração do sistema",
  tempo: "39 min em dupla · registro contínuo",
  instrucao:
    "Execute os comandos do roteiro na máquina e registre o que ela responde. Um número sem " +
    "unidade não conta. Se um comando não existir no seu caminho (A para Linux, B para " +
    "Windows), use o equivalente da outra coluna.",
  partes: [
    {
      id: "pa", titulo: "Parte A — inventário da máquina", tempo: "14 min",
      campos: [
        { id: "so", rot: "Sistema e versão do núcleo", dica: "uname -a  ·  systeminfo", tipo: "texto" },
        { id: "nucleos", rot: "Núcleos lógicos", dica: "nproc  ·  $env:NUMBER_OF_PROCESSORS", tipo: "numero" },
        { id: "mem_total", rot: "Memória total (GB)", dica: "free -h  ·  Get-ComputerInfo", tipo: "numero" },
        { id: "mem_livre", rot: "Memória livre agora (GB)", dica: "free -h", tipo: "numero" },
        { id: "processos", rot: "Processos em execução agora",
          dica: "ps -e --no-headers | wc -l  ·  (Get-Process).Count", tipo: "numero" },
        { id: "top_proc", rot: "Processo que mais consome memória (nome e PID)",
          dica: "ps -eo pid,comm,%mem --sort=-%mem | head -5", tipo: "texto" },
        { id: "uptime", rot: "Tempo ligada (horas)", dica: "uptime -p  ·  Get-Uptime", tipo: "numero" },
      ],
    },
    {
      id: "pb", titulo: "Parte B — ver as chamadas de sistema", tempo: "13 min",
      campos: [
        { id: "total_chamadas", rot: "Total de chamadas do comando ls",
          dica: "strace -c ls  ·  soma da coluna calls", tipo: "numero" },
        { id: "chamada_top", rot: "Chamada que apareceu mais vezes",
          dica: "primeira linha da tabela do strace -c", tipo: "texto" },
        { id: "chamada_top_n", rot: "Quantas vezes ela apareceu", dica: "", tipo: "numero" },
      ],
      nota: "Só Windows: registre o número de eventos de arquivo que o Process Monitor mostrou " +
            "ao abrir e salvar um arquivo no Bloco de Notas, e escreva \"procmon\" no campo da " +
            "chamada mais frequente.",
    },
    {
      id: "pc", titulo: "Parte C — medir o custo da chamada", tempo: "12 min",
      campos: [
        { id: "t_muitas", rot: "Tempo gravando 1 byte por vez (segundos)",
          dica: "dd bs=1 count=100000  →  100 000 chamadas", tipo: "numero" },
        { id: "t_poucas", rot: "Tempo gravando em blocos de 4 KB (segundos)",
          dica: "dd bs=4096 count=25  →  25 chamadas", tipo: "numero" },
      ],
    },
  ],
  objetivas: [
    { id: "mais_rapido", pergunta: "Qual das duas formas foi mais rápida?",
      opcoes: [
        { id: "poucas", texto: "Blocos de 4 KB — poucas chamadas" },
        { id: "muitas", texto: "Um byte por vez — muitas chamadas" },
        { id: "igual", texto: "Deu praticamente o mesmo tempo" },
      ] },
    { id: "causa", pergunta: "A diferença de tempo vem principalmente de:",
      opcoes: [
        { id: "chamadas", texto: "Quantidade de chamadas de sistema e trocas de modo" },
        { id: "disco", texto: "Velocidade de gravação do disco" },
        { id: "tamanho", texto: "Tamanho total do arquivo gravado" },
        { id: "cpu", texto: "Velocidade do processador" },
      ] },
  ],
  escritas: [
    { id: "obs_ls", rot: "Por que um comando tão simples como ls precisa de dezenas de chamadas " +
                         "antes de imprimir a primeira linha?" },
    { id: "obs_processos", rot: "O número de processos que você contou é muito maior que o de " +
                                "programas abertos na tela. O que isso diz sobre o sistema?" },
  ],
};

/* ── Atividade 3 — Que arquitetura para este produto? ─────────────────── */
const A3 = {
  titulo: "Que arquitetura para este produto?",
  tempo: "9 min em grupo · 4 min de apresentação",
  instrucao:
    "Para cada produto, escolha a arquitetura de núcleo mais adequada, justifique em uma frase " +
    "e diga qual risco você aceita ao escolher. Resposta sem o risco fica incompleta.",
  arquiteturas: ["Monolítico", "Monolítico com módulos", "Em camadas", "Micronúcleo", "Híbrido"],
  cenarios: [
    { id: "A", nome: "Marca-passo",
      texto: "Firmware certificado, gravado na fábrica, sem atualização remota. Não pode travar " +
             "em nenhuma circunstância, e o fabricante precisa demonstrar isso ao órgão de saúde." },
    { id: "B", nome: "Servidor de armazenamento",
      texto: "Vazão máxima de leitura e gravação em hardware homogêneo, escolhido e mantido pela " +
             "própria equipe de infraestrutura. Reiniciar de madrugada é aceitável." },
    { id: "C", nome: "Computador de mesa",
      texto: "Milhares de modelos de periférico, drivers de terceiros de qualidade desigual, " +
             "usuário instalando o que quiser — e ainda assim espera-se vídeo e jogo sem engasgo." },
    { id: "D", nome: "Sinalização ferroviária",
      texto: "Cada função precisa ser auditada e aprovada por órgão regulador, parte por parte, " +
             "antes de entrar em operação. Mudança pequena exige nova auditoria só do que mudou." },
  ],
};
