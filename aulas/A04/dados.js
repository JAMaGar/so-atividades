/* Conteúdo das atividades da Aula 4 — Processos e escalonamento.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito NÃO está aqui: fica em atividade.py e só é enviado ao aluno
   depois que o professor libera no painel. */

const AVISO_REDE =
  "Suas respostas ficam salvas neste aparelho enquanto você responde. " +
  "Se a rede cair, nada é perdido: reconecte e toque em Entregar.";

const AULA = {
  titulo: "Aula 4 — Processos e escalonamento",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

/* ── Atividade 1 — Que transição é esta? ──────────────────────────────── */
const A1 = {
  titulo: "Que transição é esta?",
  tempo: "7 min individual · 3 min de conferência",
  instrucao:
    "Para cada situação, escolha a transição de estado correspondente. Nas cinco " +
    "últimas, diga também quem provocou a transição.",
  transicoes: [
    { id: "novo_pronto", curto: "novo → pronto" },
    { id: "pronto_exec", curto: "pronto → executando" },
    { id: "exec_pronto", curto: "executando → pronto" },
    { id: "exec_bloq", curto: "executando → bloqueado" },
    { id: "bloq_pronto", curto: "bloqueado → pronto" },
    { id: "exec_term", curto: "executando → terminado" },
  ],
  autores: [
    { id: "processo", curto: "o próprio processo" },
    { id: "dispositivo", curto: "um dispositivo" },
    { id: "nucleo", curto: "o núcleo" },
  ],
  itens: [
    { id: "t1", texto: "O shell acabou de chamar fork e o núcleo terminou de montar o PCB do filho." },
    { id: "t2", texto: "O escalonador escolheu o processo e mandou restaurar o contexto dele." },
    { id: "t3", texto: "Seu editor de texto chamou read() para carregar um arquivo do disco." },
    { id: "t4", texto: "O disco terminou a leitura e avisou o núcleo por interrupção." },
    { id: "t5", texto: "O programa imprimiu a última linha e chamou exit(0)." },
    { id: "t6", texto: "O temporizador disparou: o processo usou toda a fatia de tempo dele.", quem: true },
    { id: "t7", texto: "O navegador chamou recv() e a resposta do servidor ainda não chegou.", quem: true },
    { id: "t8", texto: "A tecla foi pressionada e o processo que esperava por ela pode voltar à fila.", quem: true },
    { id: "t9", texto: "O processo tentou dividir por zero e o sistema o encerrou.", quem: true },
    { id: "t10", texto: "Havia dois processos prontos e a CPU ficou livre; um deles passou a executar.", quem: true },
  ],
  fechamento:
    "Um processo bloqueado não está esperando a CPU. Explique, em uma frase, por que " +
    "dar a CPU a ele não resolveria nada.",
};

/* ── Atividade 2 — Simulação em dupla ─────────────────────────────────── */
const A2 = {
  titulo: "Simulação em dupla — FCFS e SJF",
  tempo: "11 min em dupla · 3 min de correção",
  instrucao:
    "Monte a sequência de execução na fita abaixo e depois informe a espera de cada " +
    "processo. A fita desenha o que você montou — ela mostra a sua resposta, não a certa.",
  carga: [
    { pid: "P1", chegada: 0, duracao: 8, prioridade: 3 },
    { pid: "P2", chegada: 1, duracao: 4, prioridade: 4 },
    { pid: "P3", chegada: 2, duracao: 9, prioridade: 1 },
    { pid: "P4", chegada: 3, duracao: 5, prioridade: 2 },
  ],
  politicas: [
    { id: "fcfs", nome: "FCFS — ordem de chegada",
      dica: "Ninguém é interrompido: cada processo executa a duração inteira." },
    { id: "sjf", nome: "SJF não preemptivo — o mais curto primeiro",
      dica: "Quando a CPU fica livre, escolha o mais curto ENTRE OS QUE JÁ CHEGARAM." },
  ],
  pergunta_medias: "Espera média (uma casa decimal, use ponto ou vírgula)",
  fechamento:
    "As duas políticas terminam no mesmo instante 26. Em uma frase: se o trabalho total é " +
    "o mesmo, de onde vem a diferença de espera média?",
};

/* ── Atividade 3 — Que política para este sistema? ───────────────────── */
const A3 = {
  titulo: "Que política para este sistema?",
  tempo: "9 min em grupo · 3 min de apresentação",
  instrucao:
    "Para cada sistema, escolha a política, diga qual critério você está privilegiando " +
    "e o que aceita piorar. Sem a terceira parte a resposta fica incompleta.",
  politicas: ["FCFS", "SJF / SRTF", "Prioridade com envelhecimento",
              "Round Robin", "Filas multiníveis com realimentação"],
  criterios: ["tempo de espera", "tempo de resposta", "vazão", "previsibilidade"],
  cenarios: [
    { id: "A", nome: "Servidor de vídeo ao vivo",
      texto: "Milhares de fluxos simultâneos. Um engasgo de 200 ms na entrega é reclamação " +
             "de cliente; perder um quadro é pior que atrasar o lote inteiro." },
    { id: "B", nome: "Cluster de simulação científica",
      texto: "Trabalhos de várias horas, submetidos com duração estimada pelo pesquisador. " +
             "Ninguém acompanha a tela; o que importa é quantos trabalhos terminam por dia." },
    { id: "C", nome: "Caixa eletrônico",
      texto: "Uma pessoa por vez, poucas tarefas conhecidas, e a operação precisa responder " +
             "sempre no mesmo tempo — inclusive no pior caso." },
    { id: "D", nome: "Notebook de estudante",
      texto: "Navegador, editor, compilador e uma reunião por vídeo ao mesmo tempo. " +
             "O compilador pode demorar; o vídeo não pode travar." },
  ],
};

/* ── Atividade 4 — Lista prática 1 ───────────────────────────────────── */
const A4 = {
  titulo: "Lista prática 1 — escalonamento",
  tempo: "35 min individual · com consulta",
  instrucao:
    "Resolva no papel, desenhando o Gantt, e digite aqui os números que resultaram. " +
    "Prioridade menor = mais prioritário; empate resolve pela ordem de chegada.",
  carga: [
    { pid: "PA", chegada: 0, duracao: 6, prioridade: 2 },
    { pid: "PB", chegada: 2, duracao: 3, prioridade: 3 },
    { pid: "PC", chegada: 3, duracao: 8, prioridade: 1 },
    { pid: "PD", chegada: 5, duracao: 4, prioridade: 2 },
  ],
  questoes: [
    { id: "q1", nome: "Questão 1 — FCFS", pede_trocas: false,
      dica: "Primeiro que chega, primeiro atendido. Ninguém é interrompido." },
    { id: "q2", nome: "Questão 2 — SJF não preemptivo", pede_trocas: false,
      dica: "O mais curto entre os que já chegaram, sem preempção." },
    { id: "q3", nome: "Questão 3 — Round Robin, quantum 3", pede_trocas: true,
      dica: "Quem chega no mesmo instante em que alguém esgota o quantum entra na fila ANTES do preemptado." },
    { id: "q4", nome: "Questão 4 — Prioridade não preemptiva", pede_trocas: false,
      dica: "Sempre o pronto de menor número de prioridade." },
  ],
  escritas: [
    { id: "e2d", rot: "2d) Comparando SJF com FCFS: qual processo piorou, e por quê? " +
                      "A espera média caiu ou subiu?" },
    { id: "e3d", rot: "3d) O tempo de resposta médio do Round Robin é melhor ou pior que o do " +
                      "FCFS? O que isso significa para quem está na frente da tela?" },
    { id: "e4d", rot: "4d) Na prioridade, um processo esperou muito mais que nas outras " +
                      "políticas. Qual, por quê, e que mecanismo evitaria a inanição?" },
    { id: "e5", rot: "5) Se estes fossem quatro pedidos de um servidor web: que política você " +
                     "escolheria, que critério está privilegiando e o que aceita piorar?" },
  ],
};
