import { useState, useEffect } from "react";

// ============================================================
// CONTRASEÑA DE LA JEFA — cámbiala aquí
// ============================================================
const CLAVE_JEFA = "farmacia2026";
const STORAGE_KEY = "rotacion-farmacia-plan-v3";
const SEMILLA_INICIAL = 20260907;

// contrato: "honorario" | "contrata" | "compra_servicios" | "das_chue"
// t1: asignación FIJA de Abril-Junio 2026, según tabla entregada por la jefa
const FUNCIONARIAS = [
  { nombre: "Kimberly Bravo González", condicion: null, contrato: "honorario", t1: "soporte", fijas: { 1: "cronico", 2: "cronico", 3: "cronico" }, fijaLabel: "Fija en Crónico hasta marzo 2027" },
  { nombre: "Mónica Chamblas Velasquez", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Macarena Villegas Flores", condicion: null, contrato: "contrata", t1: "domicilio" },
  { nombre: "Sarai Gazmuri", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Paola Cid Martínez", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Flor Martinez", condicion: null, contrato: "compra_servicios", t1: "domicilio" },
  { nombre: "Daniela Barra Escobar", condicion: null, contrato: "contrata", t1: "hospitalizados" },
  // Roxana: rota en todas las farmacias excepto PYXIS. Cumple 3 meses en Envasado a fin de junio → puede rotar desde julio
  { nombre: "Roxana Gutiérrez Quiñimil", condicion: null, contrato: "contrata", t1: "envasado" },
  { nombre: "Cinthya Pacheco Ibañez", condicion: null, contrato: "contrata", t1: "satelite", fijas: { 1: "satelite", 2: "satelite" }, fijaLabel: "Fija en Satélite hasta diciembre" },
  { nombre: "Jacqueline Medina Quijada", condicion: "fija_pyxis", contrato: "contrata", t1: "pyxis" },
  { nombre: "Yassier Lagos Bernal", condicion: null, contrato: "compra_servicios", t1: "domicilio" },
  { nombre: "Jocelyn Valdes Cartes", condicion: null, contrato: "compra_servicios", t1: "satelite" },
  { nombre: "Génesis Riveros Ramirez", condicion: null, contrato: "contrata", t1: "hospitalizados", fijas: { 1: "cronico", 2: "cronico" }, fijaLabel: "Fija en Crónico hasta diciembre" },
  { nombre: "Judith Aravena Peña", condicion: null, contrato: "honorario", t1: "cronico", fijas: { 1: "soporte", 2: "soporte" }, fijaLabel: "Fija en Soporte hasta diciembre" },
  { nombre: "Marcela Navarro", condicion: "fija_pyxis", contrato: "honorario", t1: "pyxis" },
  { nombre: "Yamilet Jara", condicion: null, contrato: "das_chue", t1: "cronico", fijas: { 1: "domicilio", 2: "domicilio" }, fijaLabel: "Fija en Domicilio de julio a diciembre" },
];

const AREAS = [
  { id: "soporte", nombre: "Soporte", cupos: [1, 1, 1, 1], color: "#5b5f97", pastel: "#eef0ff" },
  { id: "hospitalizados", nombre: "Farmacia Hospitalizados", cupos: [2, 2, 2, 2], color: "#2673a6", pastel: "#eaf6ff" },
  { id: "envasado", nombre: "Envasado", cupos: [1, 1, 1, 1], color: "#a96812", pastel: "#fff4da" },
  { id: "domicilio", nombre: "Farmacia Domicilio", cupos: [3, 4, 4, 3], color: "#267c68", pastel: "#e9f8f3" },
  { id: "pyxis", nombre: "PYXIS", cupos: [2, 2, 2, 2], color: "#7252a3", pastel: "#f3eeff", fija: true },
  { id: "cronico", nombre: "Farmacia Crónico", cupos: [5, 5, 5, 5], color: "#a94872", pastel: "#fdebf4" },
  { id: "satelite", nombre: "Farmacia Satélite", cupos: [2, 1, 1, 2], color: "#ad5b2c", pastel: "#fff0e7" },
];

const ROTACION_JULIO_DICIEMBRE = {
  "Judith Aravena Peña": "soporte",
  "Daniela Barra Escobar": "hospitalizados",
  "Sarai Gazmuri": "hospitalizados",
  "Mónica Chamblas Velasquez": "envasado",
  "Jocelyn Valdes Cartes": "domicilio",
  "Paola Cid Martínez": "domicilio",
  "Macarena Villegas Flores": "domicilio",
  "Yamilet Jara": "domicilio",
  "Jacqueline Medina Quijada": "pyxis",
  "Marcela Navarro": "pyxis",
  "Kimberly Bravo González": "cronico",
  "Flor Martinez": "cronico",
  "Génesis Riveros Ramirez": "cronico",
  "Yassier Lagos Bernal": "cronico",
  "Roxana Gutiérrez Quiñimil": "cronico",
  "Cinthya Pacheco Ibañez": "satelite",
};

const TRIMESTRES = [
  { label: "T1 · Abril–Junio 2026", corto: "Abr–Jun 2026", semestre: 1 },
  { label: "T2 · Julio–Septiembre 2026", corto: "Jul–Sep 2026", semestre: 1 },
  { label: "T3 · Octubre–Diciembre 2026", corto: "Oct–Dic 2026", semestre: 2 },
  { label: "T4 · Enero–Marzo 2027", corto: "Ene–Mar 2027", semestre: 2 },
];

function obtenerTrimestreActual(fecha = new Date()) {
  if (fecha < new Date(2026, 6, 1)) return 0;
  if (fecha < new Date(2026, 9, 1)) return 1;
  if (fecha < new Date(2027, 0, 1)) return 2;
  return 3;
}

const CONTRATO_LABEL = {
  honorario: "Honorario",
  contrata: "Contrata",
  compra_servicios: "Compra de Servicios",
  das_chue: "DAS Chue.",
};

function obtenerAsignacionFija(func, trimestreIdx) {
  if (func.condicion === "fija_pyxis") return "pyxis";
  return func.fijas?.[trimestreIdx] || null;
}

function obtenerCupoArea(area, trimestreIdx) {
  return area.cupos?.[trimestreIdx] ?? area.cupos?.[0] ?? 0;
}

function puedeIrASoporte(func) {
  return func.contrato === "honorario" || func.contrato === "compra_servicios";
}

function puedeRotar(func, areaId, historial) {
  if (func.condicion === "fija_pyxis") return areaId === "pyxis";
  if (areaId === "pyxis") return false;
  // Soporte: Honorarios y Compra de Servicios pueden realizar este turno.
  if (areaId === "soporte" && !puedeIrASoporte(func)) return false;
  const ultima = historial[historial.length - 1];
  if (ultima === "satelite" && areaId === "cronico") return false;
  if (ultima === "cronico" && areaId === "satelite") return false;
  return true;
}

function crearAleatorio(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado += 0x6D2B79F5;
    let valor = estado;
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

function generarRotacion(trimestreIdx, rotacionAnterior, aleatorio = Math.random) {
  const asignacion = {};
  const ocupadas = {};
  AREAS.forEach(a => { ocupadas[a.id] = []; });

  // T1 (Abril-Junio 2026) es FIJO según tabla entregada por la jefa
  if (trimestreIdx === 0) {
    FUNCIONARIAS.forEach(f => {
      ocupadas[f.t1].push(f.nombre);
      asignacion[f.nombre] = f.t1;
    });
    return asignacion;
  }

  // Distribución acordada con la jefatura para julio-diciembre de 2026.
  if (trimestreIdx === 1 || trimestreIdx === 2) {
    return { ...ROTACION_JULIO_DICIEMBRE };
  }

  // Aplicar posiciones fijas permanentes o definidas para este trimestre.
  FUNCIONARIAS.forEach(f => {
    const areaFija = obtenerAsignacionFija(f, trimestreIdx);
    if (areaFija) {
      ocupadas[areaFija].push(f.nombre);
      asignacion[f.nombre] = areaFija;
    }
  });

  const libres = FUNCIONARIAS.filter(f => !obtenerAsignacionFija(f, trimestreIdx));
  const areasRotables = AREAS.filter(a => !a.fija);

  const ordenadas = libres;

  ordenadas.forEach(func => {
    const historial = rotacionAnterior
      ? [rotacionAnterior[func.nombre]].filter(Boolean)
      : [];

    let candidatas = areasRotables.filter(a => {
      const llena = ocupadas[a.id].length >= obtenerCupoArea(a, trimestreIdx);
      const puede = puedeRotar(func, a.id, historial);
      const mismaQueAnterior = historial[historial.length - 1] === a.id;
      return !llena && puede && !mismaQueAnterior;
    });

    if (candidatas.length === 0) {
      candidatas = areasRotables.filter(a =>
        ocupadas[a.id].length < obtenerCupoArea(a, trimestreIdx) && puedeRotar(func, a.id, historial)
      );
    }

    if (candidatas.length > 0) {
      const elegida = candidatas[Math.floor(aleatorio() * candidatas.length)];
      ocupadas[elegida.id].push(func.nombre);
      asignacion[func.nombre] = elegida.id;
    }
  });

  return asignacion;
}

function generarPlanificacion(semilla = SEMILLA_INICIAL) {
  const aleatorio = crearAleatorio(semilla);
  const r0 = generarRotacion(0, null, aleatorio);
  const r1 = generarRotacion(1, r0, aleatorio);
  const r2 = generarRotacion(2, r1, aleatorio);
  const r3 = generarRotacion(3, r2, aleatorio);
  return [r0, r1, r2, r3];
}

function esPlanificacionValida(plan) {
  return plan && Number.isFinite(plan.semilla) && Array.isArray(plan.rotaciones) && plan.rotaciones.length === TRIMESTRES.length;
}

function obtenerPlanificacionInicial() {
  try {
    const guardada = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (esPlanificacionValida(guardada)) return guardada;
  } catch {
    // Si el navegador bloquea localStorage, se usa la planificación estable por defecto.
  }
  return { semilla: SEMILLA_INICIAL, rotaciones: generarPlanificacion(SEMILLA_INICIAL) };
}

function guardarPlanificacion(plan) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // La aplicación continúa funcionando aunque el navegador bloquee localStorage.
  }
}

function getAreaInfo(id) {
  return AREAS.find(a => a.id === id);
}

// ── Pantalla de login ──────────────────────────────────────
function LoginScreen({ onLogin, error }) {
  const [clave, setClave] = useState("");
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.94)",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: "40px 48px",
        width: 340,
        textAlign: "center",
        boxShadow: "0 24px 70px rgba(79,70,229,0.12)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase", marginBottom: 6 }}>
          Acceso Jefa de Farmacia
        </div>
        <h2 style={{ color: "#1e293b", margin: "0 0 28px", fontSize: 20, fontWeight: 700 }}>
          Ingresa tu clave
        </h2>
        <input
          type="password"
          value={clave}
          onChange={e => setClave(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onLogin(clave)}
          placeholder="Contraseña"
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#f8fafc",
            border: error ? "1px solid #ef4444" : "1px solid #cbd5e1",
            borderRadius: 10,
            color: "#1e293b",
            fontSize: 15,
            marginBottom: 8,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        {error && (
          <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>
            Contraseña incorrecta
          </div>
        )}
        <button
          onClick={() => onLogin(clave)}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg,#6366f1,#818cf8)",
            border: "none",
            borderRadius: 10,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Ingresar
        </button>
        <button
          onClick={() => onLogin("__public__")}
          style={{
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: 12,
            cursor: "pointer",
            marginTop: 12,
            textDecoration: "underline",
          }}
        >
          Soy TENS, ver rotación →
        </button>
      </div>
    </div>
  );
}

// ── App principal ──────────────────────────────────────────
export default function App() {
  const [planInicial] = useState(obtenerPlanificacionInicial);
  const [modo, setModo] = useState(null); // null | "jefa" | "tens"
  const [loginError, setLoginError] = useState(false);
  const [trimestre, setTrimestre] = useState(obtenerTrimestreActual);
  const [semilla, setSemilla] = useState(planInicial.semilla);
  const [rotaciones, setRotaciones] = useState(planInicial.rotaciones);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState("area");
  const [editando, setEditando] = useState(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    guardarPlanificacion({ semilla, rotaciones });
  }, [semilla, rotaciones]);

  useEffect(() => {
    function sincronizarEntreVentanas(evento) {
      if (evento.key !== STORAGE_KEY || !evento.newValue) return;
      try {
        const plan = JSON.parse(evento.newValue);
        if (!esPlanificacionValida(plan)) return;
        setSemilla(plan.semilla);
        setRotaciones(plan.rotaciones);
      } catch {
        // Ignorar valores incompletos escritos por otras pestañas.
      }
    }

    window.addEventListener("storage", sincronizarEntreVentanas);
    return () => window.removeEventListener("storage", sincronizarEntreVentanas);
  }, []);

  function handleLogin(clave) {
    if (clave === "__public__") {
      setModo("tens");
      setLoginError(false);
      setTrimestre(obtenerTrimestreActual());
      return;
    }
    if (clave === CLAVE_JEFA) { setModo("jefa"); setLoginError(false); return; }
    setLoginError(true);
  }

  function regenerar() {
    setLoading(true);
    setTimeout(() => {
      const nuevaSemilla = Date.now() % 4294967296;
      setSemilla(nuevaSemilla);
      setRotaciones(generarPlanificacion(nuevaSemilla));
      setLoading(false);
      mostrarGuardado();
    }, 400);
  }

  function mostrarGuardado() {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  function cambiarArea(nombre, trimestreIdx, nuevaArea) {
    setRotaciones(prev => {
      const copia = prev.map(r => ({ ...r }));
      copia[trimestreIdx] = { ...copia[trimestreIdx], [nombre]: nuevaArea };
      return copia;
    });
    setEditando(null);
    mostrarGuardado();
  }

  if (!modo) return <LoginScreen onLogin={handleLogin} error={loginError} />;

  const esJefa = modo === "jefa";

  // Las TENS solo ven el semestre del trimestre seleccionado, no el año completo.
  const semestreActual = TRIMESTRES[trimestre]?.semestre || 1;
  const trimestresVisibles = esJefa
    ? TRIMESTRES.map((t, i) => i)
    : TRIMESTRES.map((t, i) => i).filter(i => TRIMESTRES[i].semestre === semestreActual);

  const rotacionActual = rotaciones[trimestre] || {};
  const agrupadaPorArea = AREAS.map(area => ({
    ...area,
    cupo: obtenerCupoArea(area, trimestre),
    funcionarias: FUNCIONARIAS.filter(f => rotacionActual[f.nombre] === area.id),
  }));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#f8fafc 0%,#f3f6fb 100%)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      color: "#1e293b",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.96)",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 8px rgba(15,23,42,0.04)",
        padding: "20px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#6366f1", textTransform: "uppercase", marginBottom: 4 }}>
            Hospital · Equipo Farmacia
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Rotación TENS 2026</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            background: esJefa ? "#eef2ff" : "#ecfdf5",
            border: `1px solid ${esJefa ? "#c7d2fe" : "#a7f3d0"}`,
            color: esJefa ? "#4f46e5" : "#047857",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            {esJefa ? "🔐 Jefa de Farmacia" : "👁 TENS — Solo lectura"}
          </span>

          {guardado && (
            <span style={{ color: "#059669", fontSize: 12, fontWeight: 600 }}>✓ Cambios guardados</span>
          )}

          <button
            onClick={() => setVista(v => v === "area" ? "funcionaria" : "area")}
            style={{
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              color: "#4f46e5",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {vista === "area" ? "👤 Ver por funcionaria" : "🏥 Ver por área"}
          </button>

          {/* Solo la jefa puede generar nuevas rotaciones */}
          {esJefa && (
            <button
              onClick={regenerar}
              disabled={loading}
              style={{
                background: loading ? "#c7d2fe" : "#6366f1",
                border: "none",
                color: "white",
                borderRadius: 8,
                padding: "7px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {loading ? "⏳ Generando..." : "🔀 Nueva rotación"}
            </button>
          )}

          <button
            onClick={() => setModo(null)}
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              color: "#64748b",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Selector trimestres — TENS solo ve su semestre actual */}
      <div style={{ display: "flex", gap: 8, padding: "18px 28px 0", overflowX: "auto" }}>
        {trimestresVisibles.map(i => (
          <button
            key={i}
            onClick={() => setTrimestre(i)}
            style={{
              background: trimestre === i
                ? "linear-gradient(135deg,#6366f1,#818cf8)"
                : "#ffffff",
              border: trimestre === i ? "none" : "1px solid #dbe3ee",
              color: trimestre === i ? "white" : "#64748b",
              borderRadius: 10,
              padding: "9px 16px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: trimestre === i ? "0 4px 15px rgba(99,102,241,0.24)" : "0 1px 3px rgba(15,23,42,0.04)",
            }}
          >
            {TRIMESTRES[i].label}
          </button>
        ))}
      </div>

      <div style={{ padding: "22px 28px" }}>
        {vista === "area" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
            {agrupadaPorArea.map(area => (
              <div key={area.id} style={{
                background: "#ffffff",
                border: `1px solid ${area.color}30`,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
              }}>
                <div style={{
                  background: area.pastel,
                  borderBottom: `1px solid ${area.color}24`,
                  padding: "13px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: area.color }}>{area.nombre}</div>
                    {area.fija && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Posición fija</div>}
                  </div>
                  <span style={{
                    background: "rgba(255,255,255,0.7)",
                    border: `1px solid ${area.color}40`,
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                    color: area.color,
                    fontWeight: 700,
                  }}>
                    {area.funcionarias.length}/{area.cupo}
                  </span>
                </div>
                <div style={{ padding: 12 }}>
                  {area.funcionarias.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>
                      Sin asignar
                    </div>
                  ) : area.funcionarias.map(f => (
                    <div key={f.nombre} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "7px 9px",
                      background: "#f8fafc",
                      border: "1px solid #eef2f7",
                      borderRadius: 8,
                      marginBottom: 5,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: area.pastel, border: `1px solid ${area.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: area.color, flexShrink: 0,
                      }}>
                        {f.nombre.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{f.nombre}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>
                          {esJefa && CONTRATO_LABEL[f.contrato]}
                          {esJefa && obtenerAsignacionFija(f, trimestre) && f.condicion !== "fija_pyxis" &&
                            ` · 📌 ${f.fijaLabel || `Fija en ${getAreaInfo(obtenerAsignacionFija(f, trimestre))?.nombre}`}`}
                        </div>
                      </div>
                      {esJefa && !f.condicion && !obtenerAsignacionFija(f, trimestre) && trimestre !== 0 && (
                        <button
                          onClick={() => setEditando({ nombre: f.nombre, trimestreIdx: trimestre })}
                          title="Cambiar área"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #dbe3ee",
                            color: "#94a3b8",
                            borderRadius: 6,
                            padding: "3px 7px",
                            cursor: "pointer",
                            fontSize: 11,
                          }}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 14px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    Funcionaria
                  </th>
                  {trimestresVisibles.map(i => (
                    <th key={i} style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      color: i === trimestre ? "#4f46e5" : "#64748b",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}>
                      {TRIMESTRES[i].corto}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNCIONARIAS.map(f => (
                  <tr key={f.nombre}>
                    <td style={{
                      padding: "9px 14px",
                      background: "#ffffff",
                      borderTop: "1px solid #eef2f7",
                      borderBottom: "1px solid #eef2f7",
                      borderRadius: "10px 0 0 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                    }}>
                      {f.nombre}
                    </td>
                    {trimestresVisibles.map(i => {
                      const rot = rotaciones[i] || {};
                      const areaId = rot[f.nombre];
                      const area = getAreaInfo(areaId);
                      const esActual = i === trimestre;
                      return (
                        <td key={i} style={{
                          padding: "9px 8px",
                          background: esActual ? "#eef2ff" : "#ffffff",
                          borderLeft: "1px solid #eef2f7",
                          borderRadius: i === trimestresVisibles[trimestresVisibles.length - 1] ? "0 10px 10px 0" : 0,
                          textAlign: "center",
                        }}>
                          {area && (
                            <span style={{
                              display: "inline-block",
                              background: area.pastel,
                              border: `1px solid ${area.color}35`,
                              color: area.color,
                              borderRadius: 6,
                              padding: "3px 7px",
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}>
                              {area.nombre.replace("Farmacia ", "")}
                            </span>
                          )}
                          {esJefa && !f.condicion && !obtenerAsignacionFija(f, i) && esActual && i !== 0 && (
                            <button
                              onClick={() => setEditando({ nombre: f.nombre, trimestreIdx: i })}
                              style={{
                                display: "block",
                                margin: "4px auto 0",
                                background: "transparent",
                                border: "none",
                                color: "#475569",
                                cursor: "pointer",
                                fontSize: 10,
                              }}
                            >
                              ✏️
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda — solo visible para la jefa */}
        {esJefa && (
        <div style={{
          marginTop: 20,
          padding: "14px 18px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>Reglas</span>
          {[
            "⏱ Mín. 3 meses – Máx. 6 meses por área",
            "🚫 No consecutivo Satélite ↔ Crónico",
            "🔒 PYXIS fija (Jacqueline & Marcela)",
            "📌 Kimberly: Crónico desde julio 2026 hasta marzo 2027",
            "📌 Jul–Dic: Génesis en Crónico",
            "📌 Jul–Dic: Cinthya en Satélite y Yamilet en Domicilio",
            "🔒 Judith fija en Soporte hasta diciembre 2026",
          ].map((r, i) => (
            <span key={i} style={{ fontSize: 11, color: "#94a3b8" }}>{r}</span>
          ))}
          {[
            "💼 Honorarios y Compra de Servicios pueden ir a Soporte",
          ].map((r, i) => (
            <span key={"jefa" + i} style={{ fontSize: 11, color: "#818cf8" }}>{r}</span>
          ))}
        </div>
        )}
      </div>

      {/* Modal de edición manual — solo jefa, no aplica a T1 (fijo) */}
      {editando && esJefa && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100,
        }}
          onClick={() => setEditando(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 28,
              width: 340,
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#1e293b" }}>
              Cambiar área
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 12, color: "#94a3b8" }}>
              {editando.nombre} · {TRIMESTRES[editando.trimestreIdx].corto}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {AREAS.filter(a => {
                if (a.fija) return false;
                const func = FUNCIONARIAS.find(f => f.nombre === editando.nombre);
                if (a.id === "soporte" && !puedeIrASoporte(func)) return false;
                return true;
              }).map(area => (
                <button
                  key={area.id}
                  onClick={() => cambiarArea(editando.nombre, editando.trimestreIdx, area.id)}
                  style={{
                    background: rotaciones[editando.trimestreIdx]?.[editando.nombre] === area.id
                      ? `${area.color}33`
                      : "#f8fafc",
                    border: `1px solid ${area.color}44`,
                    color: area.color,
                    borderRadius: 9,
                    padding: "10px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {area.nombre}
                  {rotaciones[editando.trimestreIdx]?.[editando.nombre] === area.id && " ✓"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditando(null)}
              style={{
                marginTop: 14,
                width: "100%",
                background: "transparent",
                border: "1px solid #cbd5e1",
                color: "#64748b",
                borderRadius: 9,
                padding: "8px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
