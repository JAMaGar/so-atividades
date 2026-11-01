/* Conteúdo das atividades da Aula 2 — Fundamentos e evolução dos sistemas operacionais.
   Editar este arquivo muda as atividades sem mexer na lógica da página.
   O gabarito NÃO está aqui: fica em servidor.py e só é enviado ao aluno
   depois que o professor libera no painel. */

const AULA = {
  titulo: "Aula 2 — Fundamentos e evolução dos sistemas operacionais",
  disciplina: "Sistemas Operacionais · CST em Análise e Desenvolvimento de Sistemas",
  instituicao: "Fatec São Paulo",
  professor: "Prof. Me. José Augusto Martins Garcia",
};

/* ── Atividade 1 — Do recurso à abstração ─────────────────────────────── */
const A1 = {
  titulo: "Do recurso à abstração",
  tempo: "4 min individual · 5 min em dupla · 4 min coletivo",
  instrucao:
    "Escolha ao menos três linhas e preencha as duas colunas. Na coluna da direita, " +
    "cite um detalhe concreto do hardware — setor, endereço, registrador, interrupção, protocolo. " +
    'Responder "seria mais difícil" não conta.',
  minimo: 3,
  linhas: [
    { id: "cpu",         recurso: "Processador e seus núcleos" },
    { id: "ram",         recurso: "Memória RAM física" },
    { id: "disco",       recurso: "Disco (trilhas e setores)" },
    { id: "rede",        recurso: "Placa de rede (quadros)" },
    { id: "teclado",     recurso: "Teclado e tela" },
    { id: "impressora",  recurso: "Impressora" },
  ],
  fechamento:
    "Qual das seis abstrações você acha que custa mais trabalho ao sistema operacional, e por quê?",
};

/* ── Atividade 2 — Linha do tempo ──────────────────────────────────────── */
const A2 = {
  titulo: "Linha do tempo dos sistemas operacionais",
  tempo: "8 min ordenar · 6 min parear · 3 min fechar",
  instrucao:
    "Coloque os dez marcos em ordem cronológica, do mais antigo para o mais recente. " +
    "Depois associe cada gargalo ao marco que o resolveu. Dois marcos ficam sem par — decida quais.",
  marcos: [
    { id: "M1",  texto: "Painéis de conexão e cartões perfurados" },
    { id: "M2",  texto: "Monitor residente e processamento em lote" },
    { id: "M3",  texto: "CTSS — o primeiro sistema de tempo compartilhado" },
    { id: "M4",  texto: "IBM System/360 e o OS/360" },
    { id: "M5",  texto: "Multiprogramação com partições de memória" },
    { id: "M6",  texto: "UNIX" },
    { id: "M7",  texto: "MS-DOS no IBM PC" },
    { id: "M8",  texto: "Macintosh com interface gráfica" },
    { id: "M9",  texto: "Virtualização em servidores x86" },
    { id: "M10", texto: "Docker e containers" },
  ],
  gargalos: [
    { id: "G1", texto: "O programador preparava a máquina na mão entre um programa e o seguinte" },
    { id: "G2", texto: "O processador ficava parado esperando leitura de cartões e impressão" },
    { id: "G3", texto: "O resultado só voltava horas depois de entregar o programa" },
    { id: "G4", texto: "Trocar de modelo de computador obrigava a reescrever todo o software" },
    { id: "G5", texto: "Uma máquina por pessoa era economicamente impossível" },
    { id: "G6", texto: "Só quem sabia programar conseguia usar o computador" },
    { id: "G7", texto: "Cada serviço exigia um servidor físico próprio, quase sempre ocioso" },
    { id: "G8", texto: "O programa funcionava na máquina do autor e falhava na de produção" },
  ],
  fechamento: "Escolha um dos avanços acima: que novo problema ele criou?",
};

/* ── Atividade 3 — Estudo de caso ──────────────────────────────────────── */
const TIPOS = [
  "Lote",
  "Tempo compartilhado",
  "Tempo real crítico",
  "Tempo real brando",
  "Distribuído",
  "Embarcado",
];

const A3 = {
  titulo: "Estudo de caso — classifique o cenário",
  tempo: "12 min de discussão · 2 min de apresentação por grupo",
  instrucao:
    "Para cada cenário, responda três coisas: o tipo de sistema operacional adequado, " +
    "a métrica de sucesso e o que daria errado se fosse escolhido o tipo vizinho.",
  cenarios: [
    { id: "A", nome: "Banco",
      texto: "O fechamento diário processa 12 milhões de lançamentos entre 23h e 5h. " +
             "Nenhum operador acompanha a execução. O relatório precisa estar pronto às 6h, " +
             "quando as agências abrem os sistemas de atendimento." },
    { id: "B", nome: "Veículo",
      texto: "A unidade eletrônica lê os sensores de impacto e precisa acionar o airbag em até " +
             "20 milissegundos após a colisão. Não há exceção aceitável: nem uma vez em um milhão." },
    { id: "C", nome: "Laboratório da faculdade",
      texto: "Quarenta alunos editam, compilam e testam código ao mesmo tempo, todos conectados " +
             "ao mesmo servidor da instituição, cada um na sua sessão." },
    { id: "D", nome: "Plataforma de streaming",
      texto: "O catálogo é servido por milhares de servidores distribuídos geograficamente. " +
             "A queda de alguns deles não pode interromper a transmissão de nenhum assinante." },
  ],
};
