/* Conteúdo das atividades da Aula 5 — Threads e comunicação entre processos.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito NÃO está aqui: fica em atividade.py e só é enviado ao aluno
   depois que o professor libera no painel. */

const AULA = {
  titulo: "Aula 5 — Threads e comunicação entre processos",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

const AVISO_REDE =
  "As respostas ficam salvas neste aparelho enquanto você responde. " +
  "A entrega é única: entregue só no fim.";

/* ── Atividade 1 — De quem é este recurso? ───────────────────────────── */
const A1 = {
  titulo: "De quem é este recurso?",
  tempo: "6 min individual · 3 min de conferência",
  instrucao:
    "Para cada item, diga se ele pertence ao PROCESSO (e portanto é compartilhado por " +
    "todas as threads) ou à THREAD (privado de cada uma). Nos três últimos, escreva " +
    "também o que dá errado quando alguém confunde.",
  opcoes: [
    { id: "processo", curto: "Do processo", texto: "Do processo — compartilhado" },
    { id: "thread", curto: "Da thread", texto: "Da thread — privado" },
  ],
  itens: [
    { id: "i1", texto: "O código do programa que está sendo executado" },
    { id: "i2", texto: "O contador de programa (onde a execução está agora)" },
    { id: "i3", texto: "Uma variável declarada dentro de uma função" },
    { id: "i4", texto: "Uma variável global do programa" },
    { id: "i5", texto: "O conjunto de registradores do processador" },
    { id: "i6", texto: "A lista de arquivos e sockets abertos" },
    { id: "i7", texto: "O PID — identificador do processo" },
    { id: "i8", texto: "A memória alocada dinamicamente (heap)", escrita:
        "Se cada thread grava num ponteiro guardado em variável global, o que pode acontecer?" },
    { id: "i9", texto: "A pilha de chamadas de função", escrita:
        "Por que é seguro cada thread usar variáveis locais sem combinar nada com as outras?" },
    { id: "i10", texto: "A prioridade de escalonamento", escrita:
        "Se a prioridade fosse do processo e não da thread, o que o sistema perderia?" },
  ],
  fechamento:
    "Em uma frase: por que criar uma thread é tão mais barato que criar um processo?",
};

/* ── Atividade 2 — Que mecanismo para este caso? ─────────────────────── */
const A2 = {
  titulo: "Que mecanismo de comunicação para este caso?",
  tempo: "7 min em dupla · 3 min de correção comentada",
  instrucao:
    "Para cada situação, escolha o mecanismo, justifique em uma frase e diga o que você " +
    "aceita piorar com a escolha. Resposta sem o que piora fica incompleta — toda escolha " +
    "de engenharia tem um custo.",
  mecanismos: [
    { id: "pipe", texto: "Pipe" },
    { id: "memoria", texto: "Memória compartilhada" },
    { id: "sinal", texto: "Sinal" },
    { id: "socket", texto: "Socket" },
  ],
  casos: [
    { id: "A", nome: "Filtro em cadeia",
      texto: "Um comando produz linhas de texto e outro, escrito por outra pessoa e " +
             "compilado separadamente, consome essas linhas na ordem em que saem. " +
             "Os dois rodam na mesma máquina e são iniciados juntos." },
    { id: "B", nome: "Coleta de alta frequência",
      texto: "Dois serviços na mesma máquina trocam 2 milhões de medições por segundo. " +
             "Cada medição tem 16 bytes. O tempo gasto na troca já é maior que o tempo " +
             "gasto processando." },
    { id: "C", nome: "Recarregar configuração",
      texto: "O administrador editou o arquivo de configuração de um servidor que está " +
             "no ar. Ele precisa avisar o processo para reler o arquivo, sem derrubar " +
             "as conexões abertas e sem enviar nenhum dado." },
    { id: "D", nome: "Dois servidores",
      texto: "A aplicação roda em uma máquina e o banco de dados em outra, no mesmo " +
             "rack. Hoje estão separados; amanhã podem estar em data centers diferentes." },
  ],
};

/* ── Atividade 3 — Laboratório 2 ─────────────────────────────────────── */
const A3 = {
  titulo: "Laboratório 2 — processos e threads na sua máquina",
  tempo: "44 min em dupla",
  instrucao:
    "Os dois da dupla executam os comandos; cada um entrega o seu registro com o próprio " +
    "nome. Anote os números da SUA máquina — eles vão variar entre as duplas, e é isso " +
    "que torna a correção interessante.",
  partes: [
    {
      id: "pa", titulo: "Parte A — contar", tempo: "12 min",
      campos: [
        { id: "n_processos", rot: "Quantos processos estão em execução",
          dica: "ps -e --no-headers | wc -l   ·   (Get-Process).Count", tipo: "numero" },
        { id: "n_threads", rot: "Quantas threads estão em execução",
          dica: "ps -eLf --no-headers | wc -l   ·   (Get-Process | Measure-Object Threads -Sum).Sum",
          tipo: "numero" },
        { id: "campeao", rot: "Nome do processo com mais threads",
          dica: "ps -eo nlwp,pid,comm --sort=-nlwp | head -5", tipo: "texto" },
        { id: "campeao_n", rot: "Quantas threads ele tem", dica: "", tipo: "numero" },
      ],
    },
    {
      id: "pb", titulo: "Parte B — medir o custo de criar", tempo: "14 min",
      campos: [
        { id: "us_thread", rot: "Microssegundos para criar uma thread",
          dica: "python medir_criacao.py  →  linha 'thread'", tipo: "numero" },
        { id: "us_processo", rot: "Microssegundos para criar um processo",
          dica: "python medir_criacao.py  →  linha 'processo'", tipo: "numero" },
        { id: "razao", rot: "Quantas vezes o processo custou mais",
          dica: "divida o segundo pelo primeiro; uma casa decimal basta", tipo: "numero" },
      ],
      nota: "Feche o navegador antes de medir: máquina ocupada mede errado.",
    },
    {
      id: "pc", titulo: "Parte C — o pipe que bloqueia", tempo: "10 min",
      campos: [
        { id: "pipe_saida", rot: "O que apareceu na tela com  seq 1 1000000 | head -3",
          dica: "no PowerShell: 1..1000000 | Select -First 3", tipo: "texto" },
        { id: "pipe_tempo", rot: "O comando terminou na hora ou demorou?",
          dica: "responda 'na hora' ou 'demorou'", tipo: "texto" },
      ],
    },
    {
      id: "pd", titulo: "Parte D — dois sinais", tempo: "8 min",
      campos: [
        { id: "sig_term", rot: "O que aconteceu com  kill -TERM  (ou Stop-Process)",
          dica: "uma frase", tipo: "texto" },
        { id: "sig_kill", rot: "O que aconteceu com  kill -9  (ou Stop-Process -Force)",
          dica: "uma frase", tipo: "texto" },
      ],
    },
  ],
  objetivas: [
    { id: "razao_tp", pergunta: "Na sua máquina, a relação entre threads e processos foi:",
      opcoes: [
        { id: "maior", texto: "Bem mais threads que processos" },
        { id: "igual", texto: "Praticamente o mesmo número" },
        { id: "menor", texto: "Menos threads que processos" },
      ] },
    { id: "custo", pergunta: "Criar um processo, comparado a criar uma thread, custou:",
      opcoes: [
        { id: "muito_mais", texto: "Várias vezes mais" },
        { id: "pouco_mais", texto: "Um pouco mais, quase igual" },
        { id: "menos", texto: "Menos" },
      ] },
    { id: "bloqueio", pergunta: "Por que o comando com pipe terminou antes de gerar o milhão de linhas?",
      opcoes: [
        { id: "sigpipe", texto: "O head fechou a ponta de leitura e o seq foi encerrado pelo núcleo" },
        { id: "rapido", texto: "O computador é rápido o bastante para gerar tudo nesse tempo" },
        { id: "buffer", texto: "O pipe guardou todas as linhas de uma vez" },
      ] },
    { id: "sinais", pergunta: "A diferença entre SIGTERM e SIGKILL é que:",
      opcoes: [
        { id: "tratavel", texto: "SIGTERM pode ser tratado pelo programa; SIGKILL não" },
        { id: "rapidez", texto: "SIGKILL é mais rápido, mas os dois podem ser tratados" },
        { id: "permissao", texto: "SIGKILL exige ser administrador e SIGTERM não" },
      ] },
  ],
  escritas: [
    { id: "obs_razao", rot: "Sua máquina tem muito mais threads que processos. O que isso " +
                            "diz sobre como os programas de hoje são escritos?" },
    { id: "obs_custo", rot: "Um servidor web recebe 5 000 conexões por segundo. Com o número " +
                            "que você mediu, por que criar um processo por conexão seria " +
                            "inviável? Faça a conta." },
  ],
};

/* ── Atividade 4 — Checkpoint 1 do projeto integrador ────────────────── */
const A4 = {
  titulo: "Checkpoint 1 do projeto integrador",
  tempo: "20 min em trio · entrega no fim do bloco",
  instrucao:
    "Etapa 1 de 6 do projeto: planejamento. Preencha em trio; cada integrante entrega " +
    "uma cópia com o próprio nome e o nome dos três no campo de grupo.",
  oQueE:
    "No fim do semestre vocês terão uma máquina virtual Linux que sobe, funciona e pode " +
    "ser refeita do zero por qualquer integrante seguindo a documentação que vocês mesmos " +
    "escreveram — com um serviço em container, usuários separados, um volume que preserva " +
    "os dados, um script que automatiza alguma tarefa e um relatório que explica as " +
    "escolhas. Não é trabalho de programação: a aplicação pode ser pronta. O que se avalia " +
    "é o ambiente.",
  exemplo: {
    titulo: 'Exemplo completo — projeto fictício "Mural do Laboratório"',
    aviso: "Use como régua, não como molde. Este tema está reservado como exemplo: " +
           "escolham outro.",
    itens: [
      { rot: "Escopo",
        txt: "Vamos administrar uma máquina virtual Ubuntu Server que hospeda um mural de " +
             "avisos do laboratório de informática. Hoje os avisos ficam em papel na porta " +
             "e somem; o monitor precisa de um lugar onde publicar e os alunos, de um " +
             "endereço para consultar pelo celular. A aplicação e o banco rodam em " +
             "containers; o Nginx fica no sistema, recebendo a porta 80. O mural é " +
             "acessível só pela rede do laboratório.",
        nota: "Responde às três perguntas: que ambiente, que serviço, que problema." },
      { rot: "Arquitetura simplificada",
        txt: "Alunos, monitor e professor acessam pela rede do laboratório. Na VM " +
             "(Ubuntu Server 24.04, 2 vCPU, 2 GB, 20 GB): Nginx no sistema recebendo a " +
             "porta 80 e repassando para o Docker; no Compose, mural-web na 8080 e " +
             "mural-db (PostgreSQL) na 5432; volume dados-mural guardando o banco. " +
             "Fora da VM, backup.sh rodando por cron às 3h e guardando 7 dias. " +
             "Usuários: prof (sudo), monitor (grupo mural), deploy (sem shell).",
        nota: "Uma caixa por componente, uma seta por relação, e onde cada uma escuta. " +
              "Desenho à mão fotografado vale tanto quanto." },
      { rot: "Cinco requisitos verificáveis",
        txt: "1. A página abre em menos de 2 s para 30 celulares ao mesmo tempo " +
             "(cronômetro, com a turma conectada).\n" +
             "2. O banco sobrevive a reiniciar o container e a VM " +
             "(docker compose down && up; conferir os avisos).\n" +
             "3. Só quem está no grupo mural consegue publicar " +
             "(tentar com a conta de aluno e falhar).\n" +
             "4. O backup roda sozinho às 3h e guarda os 7 últimos dias " +
             "(ls do diretório depois de uma semana).\n" +
             "5. A VM pode ser refeita do zero em menos de 40 min pela documentação " +
             "(um integrante refaz sem ajuda).",
        nota: "O teste de um requisito é uma pergunta só: como vocês vão verificar isso?" },
      { rot: "Responsabilidades",
        txt: "Ana — VM, usuários, grupos e permissões — até a aula 12.\n" +
             "Bruno — Compose, volume e rede dos containers — até a aula 16.\n" +
             "Carla — script de backup e documentação de reinstalação — até a aula 17.",
        nota: "O trio responde pelo conjunto, mas cada parte tem um responsável." },
    ],
  },
  naoAprova: [
    ["\u201cVamos instalar o Linux e configurar.\u201d",
     "\u201cVM Ubuntu Server hospedando o mural de avisos do laboratório.\u201d"],
    ["\u201cNossa arquitetura é um servidor.\u201d",
     "Caixas nomeadas, portas escritas, setas entre elas."],
    ["\u201cO sistema tem que ser rápido e seguro.\u201d",
     "\u201cAbre em menos de 2 s para 30 celulares.\u201d"],
    ["\u201cTodos fazem tudo juntos.\u201d",
     "\u201cAna: VM e permissões, até a aula 12.\u201d"],
  ],
  campos: [
    { id: "escopo", rot: "Escopo — que ambiente Linux vocês vão administrar, que serviço " +
                         "vão subir e que problema real isso resolve",
      dica: "três a cinco linhas; um serviço concreto, não 'vamos instalar o Linux'",
      linhas: 4 },
    { id: "arquitetura", rot: "Arquitetura simplificada — componentes, portas e quem " +
                              "acessa o quê",
      dica: "descreva em texto o desenho que vocês fizeram; pode trazer a foto do quadro na aula",
      linhas: 4 },
    { id: "requisitos", rot: "Cinco requisitos verificáveis, um por linha",
      dica: "'responder em menos de 1 s com 10 usuários' é requisito; 'ser rápido' não é",
      linhas: 5 },
    { id: "responsabilidades", rot: "Quem faz o quê, com data",
      dica: "nome · parte · data; 'todos fazem tudo' não conta",
      linhas: 3 },
  ],
};
