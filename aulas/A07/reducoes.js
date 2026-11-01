/* GERADO por gerar_dados.py a partir de impasses_v2.py — não editar à mão. */
const REDUCOES = {
 "lab": {
  "titulo": "O laboratório: um scanner, uma impressora",
  "img": "A07v2_G_lab.png",
  "tipo": "grafo",
  "tipos": [
   "scanner",
   "impressora"
  ],
  "livre": [
   0,
   0
  ],
  "processos": [
   "P1",
   "P2"
  ],
  "tem": {
   "P1": [
    1,
    0
   ],
   "P2": [
    0,
    1
   ]
  },
  "precisa": {
   "P1": [
    0,
    1
   ],
   "P2": [
    1,
    0
   ]
  },
  "rot_precisa": "quer agora"
 },
 "dois": {
  "titulo": "O laboratório com duas impressoras",
  "img": "A07v2_G_2i.png",
  "tipo": "grafo",
  "tipos": [
   "scanner",
   "impressora"
  ],
  "livre": [
   0,
   0
  ],
  "processos": [
   "P1",
   "P2",
   "P3"
  ],
  "tem": {
   "P1": [
    1,
    0
   ],
   "P2": [
    0,
    1
   ],
   "P3": [
    0,
    1
   ]
  },
  "precisa": {
   "P1": [
    0,
    1
   ],
   "P2": [
    1,
    0
   ],
   "P3": [
    0,
    0
   ]
  },
  "rot_precisa": "quer agora"
 },
 "jogo": {
  "titulo": "O estado inicial do jogo é seguro?",
  "img": null,
  "tipo": "seguro",
  "tipos": [
   "impressoras",
   "scanners"
  ],
  "livre": [
   2,
   1
  ],
  "processos": [
   "P1",
   "P2",
   "P3",
   "P4"
  ],
  "tem": {
   "P1": [
    1,
    0
   ],
   "P2": [
    2,
    1
   ],
   "P3": [
    1,
    1
   ],
   "P4": [
    0,
    1
   ]
  },
  "precisa": {
   "P1": [
    3,
    2
   ],
   "P2": [
    1,
    1
   ],
   "P3": [
    2,
    2
   ],
   "P4": [
    2,
    1
   ]
  },
  "rot_precisa": "ainda pode pedir"
 },
 "det": {
  "titulo": "Uma tarde cheia: quem está travado?",
  "img": "A07v2_G_det.png",
  "tipo": "grafo",
  "tipos": [
   "impressoras",
   "scanner",
   "plotter"
  ],
  "livre": [
   0,
   0,
   0
  ],
  "processos": [
   "P1",
   "P2",
   "P3",
   "P4"
  ],
  "tem": {
   "P1": [
    1,
    0,
    0
   ],
   "P2": [
    0,
    1,
    0
   ],
   "P3": [
    0,
    0,
    1
   ],
   "P4": [
    1,
    0,
    0
   ]
  },
  "precisa": {
   "P1": [
    0,
    1,
    0
   ],
   "P2": [
    0,
    0,
    1
   ],
   "P3": [
    0,
    1,
    0
   ],
   "P4": [
    0,
    0,
    0
   ]
  },
  "rot_precisa": "quer agora"
 }
};
const VITIMAS = [{"id": "P1", "custo": 12}, {"id": "P2", "custo": 3}, {"id": "P3", "custo": 25}];
