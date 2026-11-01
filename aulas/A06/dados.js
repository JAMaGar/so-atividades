/* Conteúdo das atividades da Aula 6 — Sincronização e concorrência.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito NÃO está aqui: fica em atividade.py e só é enviado ao aluno
   depois que o professor libera no painel. */

const AULA = {
  titulo: "Aula 6 — Sincronização e concorrência",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

const AVISO_REDE =
  "As respostas ficam salvas neste aparelho enquanto você responde. " +
  "A entrega é única: entregue só no fim.";

/* ── Onde a prática guiada é feita ─────────────────────────────────────
   "celular"     → tudo no celular: a parte B usa o simulador da página.
   "computador"  → sala com computadores: a parte B roda produtor_consumidor.py.
   Os campos e a correção são os mesmos nos dois modos; só muda o roteiro. */
const MODO_PRATICA = "celular";

/* ── Atividade 1 — Precisa sincronizar? ─────────────────────────────── */
const A1 = {
  titulo: "Precisa sincronizar?",
  tempo: "6 min individual · 4 min de conferência",
  instrucao:
    "Para cada situação, diga se ela PRECISA de sincronização para dar sempre o resultado " +
    "certo, ou se NÃO PRECISA. Nas três marcadas, escreva também o que pode dar errado " +
    "se ninguém sincronizar.",
  opcoes: [
    { id: "precisa", curto: "Precisa", texto: "Precisa sincronizar" },
    { id: "nao", curto: "Não precisa", texto: "Não precisa" },
  ],
  itens: [
    { id: "i1", texto: "Duas threads de um servidor somam 1 no mesmo contador de visitas" },
    { id: "i2", texto: "Cada thread soma os números da sua própria metade de um vetor, " +
                       "numa variável local, e devolve o resultado no fim" },
    { id: "i3", texto: "Oito threads consultam a mesma tabela de preços, que ninguém " +
                       "altera enquanto o programa roda" },
    { id: "i4", texto: "Dois caixas eletrônicos debitam da mesma conta no mesmo instante",
      escrita: "O que pode dar errado?" },
    { id: "i5", texto: "Depois de um fork, o processo filho altera uma variável global; " +
                       "o pai lê essa mesma variável" },
    { id: "i6", texto: "Várias threads de um servidor web gravam linhas no mesmo arquivo " +
                       "de log, no mesmo trecho de memória de buffer" },
    { id: "i7", texto: "Uma thread coloca pedidos numa fila e outra os retira",
      escrita: "O que pode dar errado?" },
    { id: "i8", texto: "Duas threads chamam ao mesmo tempo uma função que só usa os " +
                       "próprios parâmetros e variáveis locais" },
    { id: "i9", texto: "Quatro processos somam 1 na mesma posição de memória compartilhada " +
                       "— o experimento da aula 5" },
    { id: "i10", texto: "Dois aplicativos vendem, no mesmo segundo, o último assento do " +
                        "mesmo voo",
      escrita: "O que pode dar errado?" },
  ],
  fechamento:
    "Em uma frase: o que uma situação precisa ter para exigir sincronização?",
};

/* ── Atividade 2 — Estudo de caso 1 ───────────────────────────────────── */
const A2 = {
  titulo: "Estudo de caso 1 — que mecanismo de sincronização?",
  tempo: "10 min em dupla · 5 min de correção comentada",
  instrucao:
    "Para cada sistema, escolha o mecanismo, justifique em uma frase e diga o que você " +
    "aceita piorar com a escolha. Se escolher semáforo, diga também com que valor ele " +
    "começa — está na justificativa. Um caso pode precisar de mais de um mecanismo: " +
    "marque o principal e cite o outro na justificativa.",
  mecanismos: [
    { id: "mutex", texto: "Mutex" },
    { id: "contagem", texto: "Semáforo de contagem" },
    { id: "sinalizacao", texto: "Semáforo de sinalização" },
  ],
  casos: [
    { id: "A", nome: "Placar de votação ao vivo",
      texto: "Um programa de TV recebe votos por aplicativo. Vinte threads recebem os votos " +
             "e cada uma soma 1 no total do candidato escolhido. O total aparece na tela e " +
             "não pode perder nenhum voto." },
    { id: "B", nome: "Conexões com o banco de dados",
      texto: "A aplicação mantém 10 conexões abertas com o banco. Em horário de pico, 50 " +
             "threads querem consultar ao mesmo tempo. Até 10 podem usar o banco juntas; a " +
             "décima primeira tem de esperar alguém devolver uma conexão." },
    { id: "C", nome: "Tela só depois da configuração",
      texto: "Ao abrir o programa, uma thread lê o arquivo de configuração do disco. A " +
             "thread da interface não pode desenhar a tela antes de a configuração estar " +
             "carregada — mas também não deve ficar girando num laço perguntando se já acabou." },
    { id: "D", nome: "Fila de impressão do laboratório",
      texto: "Os computadores entregam trabalhos numa fila de 20 posições; a impressora " +
             "retira um por vez. Quem entrega espera se a fila estiver cheia; a impressora " +
             "espera se estiver vazia. Dois computadores não podem gravar na mesma " +
             "posição da fila." },
  ],
};

/* ── Atividade 3 — Prática guiada: produtor-consumidor ───────────────── */
const A3 = {
  titulo: "Prática guiada — semáforos e produtor-consumidor",
  tempo: "40 min em dupla",
  instrucao:
    "A parte A é no papel: resolva o traço do semáforo como no exemplo do slide. A parte " +
    "B é no computador: rode o programa e anote o que ele mostrar. Os dois da dupla " +
    "executam; cada um entrega com o próprio nome.",
  download: { arquivo: "produtor_consumidor.py",
              rot: "Baixar o programa da parte B (produtor_consumidor.py)" },
  partes: [
    {
      id: "pa", titulo: "Parte A — o traço do semáforo", tempo: "10 min · no papel",
      campos: [
        { id: "s1", rot: "Depois do passo 1 (T1 wait), S vale", dica: "", tipo: "numero" },
        { id: "s2", rot: "Depois do passo 2 (T2 wait), S vale", dica: "", tipo: "numero" },
        { id: "s3", rot: "Depois do passo 3 (T3 wait), S vale", dica: "", tipo: "numero" },
        { id: "s4", rot: "Depois do passo 4 (T4 wait), S vale", dica: "", tipo: "numero" },
        { id: "s5", rot: "Depois do passo 5 (T5 wait), S vale", dica: "", tipo: "numero" },
        { id: "s6", rot: "Depois do passo 6 (T1 signal), S vale", dica: "", tipo: "numero" },
        { id: "s7", rot: "Depois do passo 7 (T2 signal), S vale", dica: "", tipo: "numero" },
        { id: "s8", rot: "Depois do passo 8 (T3 signal), S vale", dica: "", tipo: "numero" },
        { id: "bloqueadas", rot: "Quais threads ficaram bloqueadas em algum momento?",
          dica: "escreva os nomes separados por vírgula, ex.: T2, T3", tipo: "texto" },
      ],
      nota: "Três impressoras: o semáforo S começa em 3. Cinco trabalhos, T1 a T5, fazem " +
            "wait(S) nessa ordem; depois T1, T2 e T3 terminam e fazem signal(S). Lembre: " +
            "signal com alguém na fila não aumenta S — acorda o primeiro da fila.",
    },
    {
      id: "pb", titulo: "Parte B — o problema de verdade", tempo: "22 min · no computador",
      campos: [
        { id: "perd_sem", rot: "Sem sincronização — itens PERDIDOS",
          dica: "python produtor_consumidor.py", tipo: "numero" },
        { id: "cpu_sem", rot: "Sem sincronização — CPU gasta (%)", dica: "", tipo: "numero" },
        { id: "perd_mutex", rot: "Só com mutex — itens PERDIDOS", dica: "", tipo: "numero" },
        { id: "cpu_mutex", rot: "Só com mutex — CPU gasta (%)", dica: "", tipo: "numero" },
        { id: "perd_semaf", rot: "Mutex + semáforos — itens PERDIDOS", dica: "", tipo: "numero" },
        { id: "cpu_semaf", rot: "Mutex + semáforos — CPU gasta (%)", dica: "", tipo: "numero" },
      ],
      nota: "Feche o navegador e os programas pesados antes de rodar. Rode duas vezes: o " +
            "número de perdidos muda entre as execuções da primeira versão — e só dela.",
    },
  ],
  /* Parte B e textos usados quando MODO_PRATICA = "celular". Mesmos ids. */
  celular: {
    instrucao:
      "A parte A é no papel: resolva o traço do semáforo como no exemplo do slide. A parte " +
      "B é aqui mesmo, no celular, em duas etapas: primeiro o passo a passo, que mostra " +
      "linha por linha o que cada versão faz (cerca de 8 min); depois o simulador em " +
      "escala, que mede o resultado com 1.000 itens. Faça em dupla; cada um entrega com o " +
      "próprio nome.",
    parteB: {
      id: "pb", titulo: "Parte B — o problema de verdade, no simulador",
      tempo: "15 min · no celular",
      campos: [
        { id: "perd_sem", rot: "Sem sincronização — itens PERDIDOS", dica: "", tipo: "numero" },
        { id: "cpu_sem", rot: "Sem sincronização — CPU desperdiçada (%)", dica: "", tipo: "numero" },
        { id: "perd_mutex", rot: "Só com mutex — itens PERDIDOS", dica: "", tipo: "numero" },
        { id: "cpu_mutex", rot: "Só com mutex — CPU desperdiçada (%)", dica: "", tipo: "numero" },
        { id: "perd_semaf", rot: "Mutex + semáforos — itens PERDIDOS", dica: "", tipo: "numero" },
        { id: "cpu_semaf", rot: "Mutex + semáforos — CPU desperdiçada (%)", dica: "", tipo: "numero" },
      ],
      nota: "Números da etapa 2 (em escala). Rode duas vezes e anote a segunda. Repare que " +
            "o número de perdidos muda entre as execuções da primeira versão — e só dela.",
    },
    obs_cpu: "Mutex e semáforos não perdem nada, mas um desperdiça CPU e o outro quase " +
             "não. Onde está a diferença no código? E por que isso importa num servidor?",
  },
  objetivas: [
    { id: "causa", pergunta: "Por que a versão sem sincronização perde itens?",
      opcoes: [
        { id: "indice", texto: "Dois produtores leem o mesmo índice e gravam na mesma posição" },
        { id: "pequeno", texto: "O buffer de 5 posições é pequeno demais" },
        { id: "lento", texto: "O Python é lento demais para quatro threads" },
        { id: "rapido", texto: "Os consumidores são mais rápidos que os produtores" },
      ] },
    { id: "diferenca", pergunta: "Mutex sozinho e mutex com semáforos acertam. A diferença " +
                                 "entre eles está em:",
      opcoes: [
        { id: "espera", texto: "Como esperam: um gira testando, o outro dorme" },
        { id: "perdas", texto: "Quantos itens cada um perde" },
        { id: "buffer", texto: "O tamanho de buffer que cada um aceita" },
        { id: "threads", texto: "Quantas threads cada um consegue usar" },
      ] },
    { id: "ordem", pergunta: "No produtor, trocamos a ordem: wait(mutex) ANTES de " +
                             "wait(vazio). Com o buffer cheio, o que acontece?",
      opcoes: [
        { id: "impasse", texto: "O produtor dorme segurando o mutex e ninguém mais entra" },
        { id: "igual", texto: "Nada muda: a ordem dos wait não importa" },
        { id: "perde", texto: "O programa volta a perder itens" },
        { id: "rapido", texto: "Fica mais rápido, porque trava menos vezes" },
      ] },
    { id: "sleep", pergunta: "A troca forçada no meio da atualização do buffer " +
                             "(o time.sleep(0) do programa, o \"pior momento\" do simulador):",
      opcoes: [
        { id: "revela", texto: "Torna visível uma corrida que já existe no código" },
        { id: "cria", texto: "Cria a corrida — sem ele o programa estaria certo" },
        { id: "protege", texto: "Protege a região crítica" },
        { id: "precisa", texto: "É necessário para o programa funcionar" },
      ] },
  ],
  escritas: [
    { id: "obs_cpu", rot: "A versão com semáforos demora um pouco mais no relógio, mas gasta " +
                          "menos CPU. Por quê? E por que isso importa num servidor?" },
    { id: "obs_real", rot: "Dê um exemplo de sistema que você usa em que aparece o problema " +
                           "produtor-consumidor. Quem produz, quem consome, o que é o buffer?" },
  ],
};

/* ── Atividade 4 — Checkpoint 1 do projeto integrador ────────────────── */
const A4 = {
  titulo: "Checkpoint 1 do projeto integrador — agora com o exemplo",
  tempo: "18 min em trio · entrega no fim do bloco",
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
