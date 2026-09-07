export const DEFAULT_DATA = {
  version: 1,
  personas: [
    { id: "kimberly-bravo", nombre: "Kimberly Bravo González", contrato: "honorario", nota: "Fija en Crónico hasta marzo 2027" },
    { id: "monica-chamblas", nombre: "Mónica Chamblas Velasquez", contrato: "contrata", nota: "" },
    { id: "macarena-villegas", nombre: "Macarena Villegas Flores", contrato: "contrata", nota: "" },
    { id: "sarai-gazmuri", nombre: "Sarai Gazmuri", contrato: "contrata", nota: "" },
    { id: "paola-cid", nombre: "Paola Cid Martínez", contrato: "contrata", nota: "" },
    { id: "flor-martinez", nombre: "Flor Martinez", contrato: "compra_servicios", nota: "" },
    { id: "daniela-barra", nombre: "Daniela Barra Escobar", contrato: "contrata", nota: "" },
    { id: "roxana-gutierrez", nombre: "Roxana Gutiérrez Quiñimil", contrato: "contrata", nota: "" },
    { id: "cinthya-pacheco", nombre: "Cinthya Pacheco Ibañez", contrato: "contrata", nota: "Fija en Satélite hasta diciembre" },
    { id: "jacqueline-medina", nombre: "Jacqueline Medina Quijada", contrato: "contrata", nota: "Posición fija en PYXIS" },
    { id: "yassier-lagos", nombre: "Yassier Lagos Bernal", contrato: "compra_servicios", nota: "" },
    { id: "jocelyn-valdes", nombre: "Jocelyn Valdes Cartes", contrato: "compra_servicios", nota: "" },
    { id: "genesis-riveros", nombre: "Génesis Riveros Ramirez", contrato: "contrata", nota: "Fija en Crónico hasta diciembre" },
    { id: "judith-aravena", nombre: "Judith Aravena Peña", contrato: "honorario", nota: "Fija en Soporte hasta diciembre" },
    { id: "marcela-navarro", nombre: "Marcela Navarro", contrato: "honorario", nota: "Posición fija en PYXIS" },
    { id: "yamilet-jara", nombre: "Yamilet Jara", contrato: "das_chue", nota: "Fija en Domicilio de julio a diciembre" },
  ],
  areas: [
    { id: "soporte", nombre: "Soporte", color: "#5b5f97", pastel: "#eef0ff", cupos: { t1: 1, t2: 1, t3: 1, t4: 1 } },
    { id: "hospitalizados", nombre: "Farmacia Hospitalizados", color: "#2673a6", pastel: "#eaf6ff", cupos: { t1: 2, t2: 2, t3: 2, t4: 2 } },
    { id: "envasado", nombre: "Envasado", color: "#a96812", pastel: "#fff4da", cupos: { t1: 1, t2: 1, t3: 1, t4: 1 } },
    { id: "domicilio", nombre: "Farmacia Domicilio", color: "#267c68", pastel: "#e9f8f3", cupos: { t1: 3, t2: 4, t3: 4, t4: 3 } },
    { id: "pyxis", nombre: "PYXIS", color: "#7252a3", pastel: "#f3eeff", cupos: { t1: 2, t2: 2, t3: 2, t4: 2 } },
    { id: "cronico", nombre: "Farmacia Crónico", color: "#a94872", pastel: "#fdebf4", cupos: { t1: 5, t2: 5, t3: 5, t4: 5 } },
    { id: "satelite", nombre: "Farmacia Satélite", color: "#ad5b2c", pastel: "#fff0e7", cupos: { t1: 2, t2: 1, t3: 1, t4: 2 } },
  ],
  periodos: [
    { id: "t1", label: "T1 · Abril–Junio 2026", corto: "Abr–Jun 2026", semestre: 1 },
    { id: "t2", label: "T2 · Julio–Septiembre 2026", corto: "Jul–Sep 2026", semestre: 1 },
    { id: "t3", label: "T3 · Octubre–Diciembre 2026", corto: "Oct–Dic 2026", semestre: 2 },
    { id: "t4", label: "T4 · Enero–Marzo 2027", corto: "Ene–Mar 2027", semestre: 2 },
  ],
  asignaciones: {
    t1: {
      "kimberly-bravo": "soporte", "monica-chamblas": "cronico", "macarena-villegas": "domicilio",
      "sarai-gazmuri": "cronico", "paola-cid": "cronico", "flor-martinez": "domicilio",
      "daniela-barra": "hospitalizados", "roxana-gutierrez": "envasado", "cinthya-pacheco": "satelite",
      "jacqueline-medina": "pyxis", "yassier-lagos": "domicilio", "jocelyn-valdes": "satelite",
      "genesis-riveros": "hospitalizados", "judith-aravena": "cronico", "marcela-navarro": "pyxis",
      "yamilet-jara": "cronico"
    },
    t2: {
      "judith-aravena": "soporte", "daniela-barra": "hospitalizados", "sarai-gazmuri": "hospitalizados",
      "monica-chamblas": "envasado", "jocelyn-valdes": "domicilio", "paola-cid": "domicilio",
      "macarena-villegas": "domicilio", "yamilet-jara": "domicilio", "jacqueline-medina": "pyxis",
      "marcela-navarro": "pyxis", "kimberly-bravo": "cronico", "flor-martinez": "cronico",
      "genesis-riveros": "cronico", "yassier-lagos": "cronico", "roxana-gutierrez": "cronico",
      "cinthya-pacheco": "satelite"
    },
    t3: {
      "judith-aravena": "soporte", "daniela-barra": "hospitalizados", "sarai-gazmuri": "hospitalizados",
      "monica-chamblas": "envasado", "jocelyn-valdes": "domicilio", "paola-cid": "domicilio",
      "macarena-villegas": "domicilio", "yamilet-jara": "domicilio", "jacqueline-medina": "pyxis",
      "marcela-navarro": "pyxis", "kimberly-bravo": "cronico", "flor-martinez": "cronico",
      "genesis-riveros": "cronico", "yassier-lagos": "cronico", "roxana-gutierrez": "cronico",
      "cinthya-pacheco": "satelite"
    },
    t4: {}
  },
  reglas: [
    "Mín. 3 meses – Máx. 6 meses por área",
    "No consecutivo Satélite ↔ Crónico",
    "PYXIS fija (Jacqueline & Marcela)",
    "Kimberly: Crónico desde julio 2026 hasta marzo 2027",
    "Jul–Dic: Génesis en Crónico",
    "Jul–Dic: Cinthya en Satélite y Yamilet en Domicilio",
    "Judith fija en Soporte hasta diciembre 2026",
    "Honorarios y Compra de Servicios pueden ir a Soporte"
  ]
};

export const CONTRATOS = {
  honorario: "Honorario",
  contrata: "Contrata",
  compra_servicios: "Compra de Servicios",
  das_chue: "DAS Chue."
};
