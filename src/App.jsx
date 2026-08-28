import { useState, useEffect } from "react";

// ============================================================
// CONTRASEÑA DE LA JEFA — cámbiala aquí
// ============================================================
const CLAVE_JEFA = "farmacia2026";

// contrato: "honorario" | "contrata" | "compra_servicios" | "das_chue"
// t1: asignación FIJA de Abril-Junio 2026, según tabla entregada por la jefa
const FUNCIONARIAS = [
  { nombre: "Kimberly Bravo González", condicion: null, contrato: "honorario", t1: "soporte", fijas: { 1: "cronico", 2: "cronico" } },
  { nombre: "Mónica Chamblas Velasquez", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Macarena Villegas Flores", condicion: null, contrato: "contrata", t1: "domicilio" },
  { nombre: "Sarai Gazmuri", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Paola Cid Martínez", condicion: null, contrato: "contrata", t1: "cronico" },
  { nombre: "Flor Martinez", condicion: null, contrato: "compra_servicios", t1: "domicilio" },
  { nombre: "Daniela Barra Escobar", condicion: null, contrato: "contrata", t1: "hospitalizados" },
  // Roxana: rota en todas las farmacias excepto PYXIS. Cumple 3 meses en Envasado a fin de junio → puede rotar desde julio
  { nombre: "Roxana Gutiérrez Quiñimil", condicion: null, contrato: "contrata", t1: "envasado" },
  { nombre: "Cinthya Pacheco Ibañez", condicion: null, contrato: "contrata", t1: "satelite", fijas: { 1: "satelite", 2: "satelite" } },
  { nombre: "Jacqueline Medina Quijada", condicion: "fija_pyxis", contrato: "contrata", t1: "pyxis" },
  { nombre: "Yassier Lagos Bernal", condicion: null, contrato: "compra_servicios", t1: "domicilio" },
  { nombre: "Jocelyn Valdes Cartes", condicion: null, contrato: "compra_servicios", t1: "satelite", fijas: { 1: "domicilio", 2: "domicilio" } },
  { nombre: "Génesis Riveros Ramirez", condicion: null, contrato: "contrata", t1: "hospitalizados", fijas: { 1: "cronico", 2: "cronico" } },
  { nombre: "Judith Aravena Peña", condicion: null, contrato: "honorario", t1: "cronico", fijas: { 1: "soporte", 2: "soporte" } },
  { nombre: "Marcela Navarro", condicion: "fija_pyxis", contrato: "honorario", t1: "pyxis" },
  { nombre: "Yamilet Jara", condicion: "solo_satelite_cronico", contrato: "das_chue", t1: "cronico" },
];

const AREAS = [
  { id: "soporte", nombre: "Soporte", cupo: 1, color: "#6366f1" },
  { id: "hospitalizados", nombre: "Farmacia Hospitalizados", cupo: 2, color: "#0ea5e9" },
  { id: "envasado", nombre: "Envasado", cupo: 1, color: "#f59e0b" },
  { id: "domicilio", nombre: "Farmacia Domicilio", cupo: 3, color: "#10b981" },
  { id: "pyxis", nombre: "PYXIS", cupo: 2, color: "#8b5cf6", fija: true },
  { id: "cronico", nombre: "Farmacia Crónico", cupo: 4, color: "#ec4899" },
  { id: "satelite", nombre: "Farmacia Satélite", cupo: 2, color: "#f97316" },
];

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

function puedeIrASoporte(func) {
  return func.contrato === "honorario" || func.contrato === "compra_servicios";
}

function puedeRotar(func, areaId, historial) {
  if (func.condicion === "fija_pyxis") return areaId === "pyxis";
  if (func.condicion === "solo_satelite_cronico") return areaId === "satelite" || areaId === "cronico";
  if (areaId === "pyxis") return false;
  // Soporte: Honorarios y Compra de Servicios pueden realizar este turno.
  if (areaId === "soporte" && !puedeIrASoporte(func)) return false;
  const ultima = historial[historial.length - 1];
  if (ultima === "satelite" && areaId === "cronico") return false;
  if (ultima === "cronico" && areaId === "satelite") return false;
  return true;
}

function generarRotacion(trimestreIdx, rotacionAnterior) {
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

  const yamilet = libres.find(f => f.condicion === "solo_satelite_cronico");
  const resto = libres.filter(f => f.condicion !== "solo_satelite_cronico");
  const ordenadas = yamilet ? [yamilet, ...resto] : resto;

  ordenadas.forEach(func => {
    const historial = rotacionAnterior
      ? [rotacionAnterior[func.nombre]].filter(Boolean)
      : [];

    let candidatas = areasRotables.filter(a => {
      const llena = ocupadas[a.id].length >= a.cupo;
      const puede = puedeRotar(func, a.id, historial);
      const mismaQueAnterior = historial[historial.length - 1] === a.id;
      return !llena && puede && !mismaQueAnterior;
    });

    if (candidatas.length === 0) {
      candidatas = areasRotables.filter(a =>
        ocupadas[a.id].length < a.cupo && puedeRotar(func, a.id, historial)
      );
    }

    if (candidatas.length > 0) {
      const elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
      ocupadas[elegida.id].push(func.nombre);
      asignacion[func.nombre] = elegida.id;
    }
  });

  return asignacion;
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
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "40px 48px",
        width: 340,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase", marginBottom: 6 }}>
          Acceso Jefa de Farmacia
        </div>
        <h2 style={{ color: "#f1f5f9", margin: "0 0 28px", fontSize: 20, fontWeight: 700 }}>
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
            background: "rgba(255,255,255,0.07)",
            border: error ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            color: "#f1f5f9",
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
  const [modo, setModo] = useState(null); // null | "jefa" | "tens"
  const [loginError, setLoginError] = useState(false);
  const [trimestre, setTrimestre] = useState(obtenerTrimestreActual);
  const [rotaciones, setRotaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState("area");
  const [editando, setEditando] = useState(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const r0 = generarRotacion(0, null);
    const r1 = generarRotacion(1, r0);
    const r2 = generarRotacion(2, r1);
    const r3 = generarRotacion(3, r2);
    setRotaciones([r0, r1, r2, r3]);
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
      const r0 = generarRotacion(0, null);
      const r1 = generarRotacion(1, r0);
      const r2 = generarRotacion(2, r1);
      const r3 = generarRotacion(3, r2);
      setRotaciones([r0, r1, r2, r3]);
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
    funcionarias: FUNCIONARIAS.filter(f => rotacionActual[f.nombre] === area.id),
  }));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      color: "#f1f5f9",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase", marginBottom: 4 }}>
            Hospital · Equipo Farmacia
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Rotación TENS 2026</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            background: esJefa ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.15)",
            border: `1px solid ${esJefa ? "rgba(99,102,241,0.4)" : "rgba(16,185,129,0.3)"}`,
            color: esJefa ? "#818cf8" : "#34d399",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            {esJefa ? "🔐 Jefa de Farmacia" : "👁 TENS — Solo lectura"}
          </span>

          {guardado && (
            <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>✓ Cambios guardados</span>
          )}

          <button
            onClick={() => setVista(v => v === "area" ? "funcionaria" : "area")}
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
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
                background: loading ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.9)",
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
              border: "1px solid rgba(255,255,255,0.1)",
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
                : "rgba(255,255,255,0.05)",
              border: trimestre === i ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: trimestre === i ? "white" : "#94a3b8",
              borderRadius: 10,
              padding: "9px 16px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: trimestre === i ? "0 4px 15px rgba(99,102,241,0.4)" : "none",
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
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${area.color}33`,
                borderRadius: 14,
                overflow: "hidden",
              }}>
                <div style={{
                  background: `linear-gradient(135deg,${area.color}22,${area.color}11)`,
                  borderBottom: `1px solid ${area.color}33`,
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
                    background: `${area.color}22`,
                    border: `1px solid ${area.color}44`,
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
                    <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>
                      Sin asignar
                    </div>
                  ) : area.funcionarias.map(f => (
                    <div key={f.nombre} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "7px 9px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8,
                      marginBottom: 5,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: `${area.color}22`, border: `1px solid ${area.color}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: area.color, flexShrink: 0,
                      }}>
                        {f.nombre.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{f.nombre}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>
                          {esJefa && CONTRATO_LABEL[f.contrato]}
                          {esJefa && obtenerAsignacionFija(f, trimestre) && f.condicion !== "fija_pyxis" &&
                            ` · 📌 Fija en ${getAreaInfo(obtenerAsignacionFija(f, trimestre))?.nombre} hasta diciembre`}
                        </div>
                      </div>
                      {esJefa && !f.condicion && !obtenerAsignacionFija(f, trimestre) && trimestre !== 0 && (
                        <button
                          onClick={() => setEditando({ nombre: f.nombre, trimestreIdx: trimestre })}
                          title="Cambiar área"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
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
                      color: i === trimestre ? "#818cf8" : "#64748b",
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
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "10px 0 0 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#e2e8f0",
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
                          background: esActual ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.02)",
                          borderLeft: "1px solid rgba(255,255,255,0.03)",
                          borderRadius: i === trimestresVisibles[trimestresVisibles.length - 1] ? "0 10px 10px 0" : 0,
                          textAlign: "center",
                        }}>
                          {area && (
                            <span style={{
                              display: "inline-block",
                              background: `${area.color}22`,
                              border: `1px solid ${area.color}44`,
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
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
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
            "⚠️ Yamilet: solo Satélite y Crónico",
            "📌 Jul–Dic: Kimberly y Génesis en Crónico",
            "📌 Jul–Dic: Cinthya en Satélite y Jocelyn en Domicilio",
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
              background: "#1e1b4b",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: 28,
              width: 340,
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#f1f5f9" }}>
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
                      : "rgba(255,255,255,0.05)",
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
                border: "1px solid rgba(255,255,255,0.1)",
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
