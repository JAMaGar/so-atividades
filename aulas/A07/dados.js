/* Conteúdo das atividades da Aula 7 v2 — Deadlocks, passo a passo.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito das atividades 1, 2 e do quiz NÃO está aqui: fica em atividade.py
   e só é enviado ao aluno depois que o professor libera no painel.
   O jogo do banqueiro (atividade 3) dá a resposta na hora, de propósito: é um
   jogo de aprendizagem. A correção conta só a PRIMEIRA decisão de cada rodada. */

const AULA = {
  titulo: "Aula 7 — Deadlocks",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

const AVISO_REDE =
  "As respostas ficam salvas neste aparelho enquanto você responde. " +
  "A entrega é única: entregue só no fim.";

/* ── Atividade 1 — Reduzir o grafo, tocando ─────────────────────────────── */
/* Os números dos grafos estão em reducoes.js (gerado a partir de impasses_v2.py). */
const A1 = {
  titulo: "Reduza o grafo",
  tempo: "9 min em dupla · 4 min de conferência",
  instrucao:
    "Toque no processo que pode terminar agora: ele precisa caber no que está livre. " +
    "A página faz o processo terminar, devolve o que ele tinha e mostra o novo livre. " +
    "Repita. Quando ninguém mais couber, toque em \"Ninguém mais pode terminar\". " +
    "Cada toque errado conta.",
  legenda: [
    ["círculo", "processo"],
    ["quadrado", "recurso; cada ponto é uma unidade"],
    ["seta cheia R → P", "a unidade está com P"],
    ["seta tracejada P → R", "P quer uma unidade de R"],
  ],
  reducoes: ["lab", "dois"],
  fechamento:
    "Em uma frase: por que o laboratório com duas impressoras tem ciclo e mesmo assim " +
    "não trava?",
};

/* ── Atividade 2 — Quebrar uma condição, escolher uma estratégia ───────── */
const A2 = {
  titulo: "Quebrar uma condição, escolher uma estratégia",
  tempo: "18 min em dupla · 7 min de correção",
  instrucao:
    "Parte A: cada medida abaixo impede o impasse quebrando UMA das quatro condições. " +
    "Diga qual. Parte B: para cada sistema, escolha a estratégia mais adequada e " +
    "justifique em uma frase — e diga o que se perde com ela.",
  condicoes: [
    { id: "exclusao", texto: "Exclusão mútua", curto: "exclusão mútua" },
    { id: "posse", texto: "Posse e espera", curto: "posse e espera" },
    { id: "preempcao", texto: "Não preempção", curto: "não preempção" },
    { id: "circular", texto: "Espera circular", curto: "espera circular" },
  ],
  medidas: [
    { id: "m1", texto: "Toda thread do programa pega as travas sempre na mesma ordem: " +
                       "primeiro a da conta de menor número, depois a de maior." },
    { id: "m2", texto: "Um processo só começa a executar depois de receber, de uma vez, " +
                       "todos os recursos de que vai precisar." },
    { id: "m3", texto: "Ninguém usa a impressora diretamente: os documentos vão para uma " +
                       "fila (spool) e só o serviço de impressão fala com ela." },
    { id: "m4", texto: "Se um processo pede um recurso ocupado, o sistema tira dele tudo o " +
                       "que ele já tem; ele recomeça mais tarde pedindo tudo de novo." },
    { id: "m5", texto: "Antes de pedir qualquer recurso novo, o processo é obrigado a " +
                       "devolver todos os que tem." },
    { id: "m6", texto: "As tabelas do banco recebem um número; uma transação só pode " +
                       "travar uma tabela de número maior do que as que já travou." },
  ],
  estrategias: [
    { id: "prevenir", texto: "Prevenir — quebrar uma condição no projeto" },
    { id: "evitar", texto: "Evitar — conceder só se continuar seguro (banqueiro)" },
    { id: "detectar", texto: "Detectar e recuperar — deixar acontecer e desfazer" },
    { id: "ignorar", texto: "Ignorar — reiniciar quando acontecer" },
  ],
  casos: [
    { id: "A", nome: "Banco de dados",
      texto: "Milhares de transações por segundo travam linhas de tabelas em ordens que " +
             "dependem da consulta. Impasse acontece de vez em quando. Uma transação " +
             "pode ser desfeita e executada de novo sem prejuízo." },
    { id: "B", nome: "Computador pessoal",
      texto: "Impasse entre programas comuns é raríssimo, e quando acontece o usuário " +
             "fecha o programa travado. Qualquer verificação extra deixaria todo o sistema " +
             "mais lento, o tempo todo." },
    { id: "C", nome: "Biblioteca da equipe",
      texto: "Uma biblioteca escrita pela própria equipe usa três travas internas. Toda " +
             "a equipe pode ser obrigada a seguir uma regra de programação." },
    { id: "D", nome: "Robôs de uma linha de montagem",
      texto: "Cada robô declara antes de começar quantas ferramentas de cada tipo vai " +
             "usar no máximo. Ferramentas são poucas, não dá para reservar o máximo de " +
             "todos ao mesmo tempo, e a linha não pode travar nunca." },
  ],
};

/* ── Atividade 3 — Jogo do banqueiro ───────────────────────────────────── */
/* Os números do jogo vêm de impasses.py (JOGO_INICIO, JOGO_RODADAS) e são
   recalculados na página por banqueiro.js. Mudar aqui exige mudar lá. */
const A3 = {
  titulo: "Jogo do banqueiro",
  tempo: "Fase A 6 min · Fase B 14 min · em dupla",
  faseA:
    "Fase A — antes de jogar, confira se o estado inicial é seguro. É o teste do banco, " +
    "agora com dois tipos de recurso: um processo cabe quando o que ele ainda pode pedir " +
    "cabe no livre EM CADA COLUNA. Toque em quem pode terminar, um de cada vez.",
  faseB:
    "Fase B — os pedidos. A cada rodada, decida: conceder, esperar ou erro. A página " +
    "explica logo depois, com as quatro perguntas do banqueiro. Vale a primeira decisão.",
  instrucao:
    "Você é o sistema operacional. Há 6 impressoras e 4 scanners para quatro processos, " +
    "e cada um declarou o máximo que vai usar. A cada rodada chega um pedido: decida se " +
    "CONCEDE, se o processo ESPERA ou se o pedido é um ERRO. Só conceda se, depois, " +
    "ainda existir uma ordem em que todos conseguem terminar. Vale a primeira decisão.",
  tipos: ["impressoras", "scanners"],
  total: [6, 4],
  alocacao: { P1: [1, 0], P2: [2, 1], P3: [1, 1], P4: [0, 1] },
  maximo: { P1: [4, 2], P2: [3, 2], P3: [3, 3], P4: [2, 2] },
  rodadas: [
    { tipo: "pede", p: "P2", v: [1, 0] },
    { tipo: "pede", p: "P1", v: [2, 1] },
    { tipo: "pede", p: "P4", v: [1, 0] },
    { tipo: "pede", p: "P3", v: [1, 3] },
    { tipo: "fim", p: "P2" },
    { tipo: "pede", p: "P1", v: [1, 1] },
    { tipo: "pede", p: "P3", v: [2, 1] },
    { tipo: "pede", p: "P4", v: [1, 1] },
  ],
  decisoes: [
    { id: "conceder", texto: "Conceder" },
    { id: "esperar", texto: "Esperar" },
    { id: "erro", texto: "Erro" },
  ],
  escrita: { id: "r7", rot: "Depois de jogar: em uma das rodadas havia recursos livres " +
                             "suficientes e mesmo assim o processo teve de esperar. Qual foi, " +
                             "e por quê?" },
};

/* ── Atividade 4 — Quiz formativo 2 ────────────────────────────────────── */
const DET = {
  titulo: "Detectar e recuperar",
  tempo: "7 min em dupla",
  instrucao:
    "Ninguém usou o banqueiro e a tarde travou. Faça a detecção: é o mesmo procedimento, " +
    "com o pedido de AGORA. Depois escolha quem encerrar.",
  vitima: "Depois do slide da recuperação: quem você encerra para destravar, perdendo o " +
          "mínimo de trabalho?",
  custo_rot: "min de trabalho perdido",
};

const A4 = {
  titulo: "Quiz formativo 2",
  tempo: "15 min · individual · sem consulta",
  instrucao:
    "Dez questões sobre as aulas 4 a 7: escalonamento, threads, sincronização e impasses. " +
    "Responda sozinho. A nota é formativa: serve para você saber o que estudar para a P1.",
  questoes: [
    { id: "q1", pergunta: "Com quantum muito pequeno, o Round Robin…",
      opcoes: [
        { id: "a", texto: "vira FCFS" },
        { id: "b", texto: "gasta boa parte do tempo trocando de contexto" },
        { id: "c", texto: "provoca inanição dos processos curtos" },
        { id: "d", texto: "deixa de ser preemptivo" },
      ] },
    { id: "q2", pergunta: "Qual política minimiza o tempo médio de espera de um lote em " +
                          "que todos chegam juntos?",
      opcoes: [
        { id: "a", texto: "FCFS" },
        { id: "b", texto: "Round Robin com quantum 2" },
        { id: "c", texto: "Prioridade, com o mais antigo primeiro" },
        { id: "d", texto: "SJF — o mais curto primeiro" },
      ] },
    { id: "q3", pergunta: "Threads de um mesmo processo compartilham…",
      opcoes: [
        { id: "a", texto: "a pilha" },
        { id: "b", texto: "o contador de programa" },
        { id: "c", texto: "o heap, as variáveis globais e os arquivos abertos" },
        { id: "d", texto: "os registradores" },
      ] },
    { id: "q4", pergunta: "Para haver condição de corrida é preciso:",
      opcoes: [
        { id: "a", texto: "dado compartilhado, mais de um fluxo e pelo menos uma escrita" },
        { id: "b", texto: "mais de um núcleo de CPU" },
        { id: "c", texto: "dois processos lendo o mesmo arquivo" },
        { id: "d", texto: "um laço infinito em uma das threads" },
      ] },
    { id: "q5", pergunta: "Um semáforo vale 0 e T1 está dormindo nele. T2 faz signal. E agora?",
      opcoes: [
        { id: "a", texto: "S vai a 1 e T1 continua dormindo" },
        { id: "b", texto: "T1 acorda e S continua 0" },
        { id: "c", texto: "S vai a 1 e T1 acorda" },
        { id: "d", texto: "T2 dorme no lugar de T1" },
      ] },
    { id: "q6", pergunta: "Para limitar a 5 as conexões simultâneas a um banco de dados, usa-se:",
      opcoes: [
        { id: "a", texto: "um mutex" },
        { id: "b", texto: "um semáforo de sinalização começando em 0" },
        { id: "c", texto: "espera ocupada num contador" },
        { id: "d", texto: "um semáforo de contagem começando em 5" },
      ] },
    { id: "q7", pergunta: "Obrigar todas as threads a pegar as travas na mesma ordem elimina:",
      opcoes: [
        { id: "a", texto: "a espera circular" },
        { id: "b", texto: "a exclusão mútua" },
        { id: "c", texto: "a não preempção" },
        { id: "d", texto: "a condição de corrida" },
      ] },
    { id: "q8", pergunta: "Grafo de alocação com ciclo, e recursos com várias instâncias:",
      opcoes: [
        { id: "a", texto: "sempre há impasse" },
        { id: "b", texto: "nunca há impasse" },
        { id: "c", texto: "pode haver impasse ou não — é preciso reduzir o grafo" },
        { id: "d", texto: "só há impasse se houver mais de dois processos" },
      ] },
    { id: "q9", pergunta: "Um estado é inseguro quando…",
      opcoes: [
        { id: "a", texto: "já há processos em impasse" },
        { id: "b", texto: "não existe ordem garantida em que todos terminam; pode travar" },
        { id: "c", texto: "não há nenhum recurso livre" },
        { id: "d", texto: "algum processo pediu mais do que declarou" },
      ] },
    { id: "q10", pergunta: "Um banco de dados que desfaz uma transação para destravar as " +
                           "outras está usando:",
      opcoes: [
        { id: "a", texto: "prevenção" },
        { id: "b", texto: "evitação" },
        { id: "c", texto: "a estratégia do avestruz" },
        { id: "d", texto: "detecção e recuperação" },
      ] },
  ],
};
