import { useState, useEffect } from "react";

const FUNCIONARIAS = [
  { nombre: "Kimberly Bravo González", condicion: "soporte_6meses" },
  { nombre: "Mónica Chamblas Velasquez", condicion: null },
  { nombre: "Macarena Villegas Flores", condicion: null },
  { nombre: "Sarai Gazmuri", condicion: null },
  { nombre: "Paola Cid Martínez", condicion: null },
  { nombre: "Flor Martinez", condicion: null },
  { nombre: "Daniela Barra Escobar", condicion: null },
  { nombre: "Roxana Gutiérrez Quiñimil", condicion: null },
  { nombre: "Cinthya Pacheco Ibañez", condicion: null },
  { nombre: "Jacqueline Medina Quijada", condicion: "fija_pyxis" },
  { nombre: "Yassier Lagos Bernal", condicion: null },
  { nombre: "Jocelyn Valdes Cartes", condicion: null },
  { nombre: "Génesis Riveros Ramirez", condicion: null },
  { nombre: "Judith Aravena Peña", condicion: null },
  { nombre: "Marcela Navarro", condicion: "fija_pyxis" },
  { nombre: "Yamilet Jara", condicion: "solo_satelite_cronico" },
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
  "Abril–Junio 2026",
  "Julio–Septiembre 2026",
  "Octubre–Diciembre 2026",
  "Enero–Marzo 2027",
];

function puedeRotar(func, areaId, historial) {
  if (func.condicion === "fija_pyxis") return areaId === "pyxis";
  if (func.condicion === "solo_satelite_cronico") return areaId === "satelite" || areaId === "cronico";
  if (func.condicion === "soporte_6meses") return areaId === "soporte";
  if (areaId === "pyxis") return false;
  
  // No rotar consecutivamente entre satelite y cronico
  const ultima = historial[historial.length - 1];
  if (ultima) {
    if (ultima === "satelite" && areaId === "cronico") return false;
    if (ultima === "cronico" && areaId === "satelite") return false;
  }
  return true;
}

function generarRotacion(trimestreIdx, rotacionAnterior) {
  const asignacion = {};
  const ocupadas = {};
  AREAS.forEach(a => { ocupadas[a.id] = []; });

  // Primero fijar las que no rotan
  FUNCIONARIAS.forEach(f => {
    if (f.condicion === "fija_pyxis") {
      ocupadas["pyxis"].push(f.nombre);
      asignacion[f.nombre] = "pyxis";
    }
  });

  // Funcionaria de soporte (cada 6 meses = 2 trimestres)
  const kimArea = trimestreIdx % 2 === 0 ? "soporte" : "soporte";
  ocupadas["soporte"].push("Kimberly Bravo González");
  asignacion["Kimberly Bravo González"] = "soporte";

  // Resto de funcionarias
  const libres = FUNCIONARIAS.filter(f =>
    f.condicion !== "fija_pyxis" && f.condicion !== "soporte_6meses"
  );

  const areasRotables = AREAS.filter(a => !a.fija && a.id !== "soporte");

  // Ordenar para respetar restricciones - primero Yamilet
  const yamilet = libres.find(f => f.condicion === "solo_satelite_cronico");
  const resto = libres.filter(f => f.condicion !== "solo_satelite_cronico");
  const ordenadas = yamilet ? [yamilet, ...resto] : resto;

  ordenadas.forEach(func => {
    const historial = rotacionAnterior
      ? [rotacionAnterior[func.nombre]].filter(Boolean)
      : [];

    // Buscar área con cupo disponible donde pueda ir
    let elegida = null;
    
    // Priorizar áreas donde estuvo menos tiempo (no la misma que la anterior)
    const candidatas = areasRotables.filter(a => {
      const llena = ocupadas[a.id].length >= a.cupo;
      const puede = puedeRotar(func, a.id, historial);
      const mismaque_anterior = historial[historial.length - 1] === a.id;
      return !llena && puede && !mismaque_anterior;
    });

    if (candidatas.length > 0) {
      elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
    } else {
      // Si no hay candidatas sin la restricción de "misma", relajar esa condición
      const fallback = areasRotables.filter(a => {
        return ocupadas[a.id].length < a.cupo && puedeRotar(func, a.id, historial);
      });
      if (fallback.length > 0) elegida = fallback[0];
    }

    if (elegida) {
      ocupadas[elegida.id].push(func.nombre);
      asignacion[func.nombre] = elegida.id;
    }
  });

  return asignacion;
}

function getAreaInfo(id) {
  return AREAS.find(a => a.id === id);
}

export default function App() {
  const [trimestre, setTrimestre] = useState(0);
  const [historial, setHistorial] = useState({});
  const [rotaciones, setRotaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState("tabla"); // tabla | funcionaria

  useEffect(() => {
    const inicial = generarRotacion(0, null);
    const segunda = generarRotacion(1, inicial);
    const tercera = generarRotacion(2, segunda);
    const cuarta = generarRotacion(3, tercera);
    setRotaciones([inicial, segunda, tercera, cuarta]);
  }, []);

  const rotacionActual = rotaciones[trimestre] || {};

  const agrupadaPorArea = AREAS.map(area => ({
    ...area,
    funcionarias: FUNCIONARIAS.filter(f => rotacionActual[f.nombre] === area.id),
  }));

  const regenerar = () => {
    setLoading(true);
    setTimeout(() => {
      const r0 = generarRotacion(0, null);
      const r1 = generarRotacion(1, r0);
      const r2 = generarRotacion(2, r1);
      const r3 = generarRotacion(3, r2);
      setRotaciones([r0, r1, r2, r3]);
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#f1f5f9",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(10px)",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase", marginBottom: 6 }}>
            Hospital · Equipo Farmacia
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#f8fafc" }}>
            Rotación TENS 2026
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setVista(vista === "tabla" ? "funcionaria" : "tabla")}
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.4)",
              color: "#818cf8",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {vista === "tabla" ? "👤 Ver por Funcionaria" : "🏥 Ver por Área"}
          </button>
          <button
            onClick={regenerar}
            disabled={loading}
            style={{
              background: loading ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.9)",
              border: "none",
              color: "white",
              borderRadius: 8,
              padding: "8px 18px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ Generando..." : "🔀 Nueva Rotación"}
          </button>
        </div>
      </div>

      {/* Selector trimestres */}
      <div style={{ display: "flex", gap: 8, padding: "20px 32px 0", overflowX: "auto" }}>
        {TRIMESTRES.map((t, i) => (
          <button
            key={i}
            onClick={() => setTrimestre(i)}
            style={{
              background: trimestre === i
                ? "linear-gradient(135deg, #6366f1, #818cf8)"
                : "rgba(255,255,255,0.05)",
              border: trimestre === i ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: trimestre === i ? "white" : "#94a3b8",
              borderRadius: 10,
              padding: "10px 18px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              boxShadow: trimestre === i ? "0 4px 15px rgba(99,102,241,0.4)" : "none",
            }}
          >
            T{i + 1} · {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>
        {vista === "tabla" ? (
          // Vista por área
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {agrupadaPorArea.map(area => (
              <div key={area.id} style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${area.color}33`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "transform 0.2s",
              }}>
                <div style={{
                  background: `linear-gradient(135deg, ${area.color}22, ${area.color}11)`,
                  borderBottom: `1px solid ${area.color}33`,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: area.color }}>{area.nombre}</div>
                    {area.fija && (
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Posición fija</div>
                    )}
                  </div>
                  <div style={{
                    background: area.funcionarias.length >= area.cupo ? `${area.color}33` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${area.color}44`,
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    color: area.color,
                    fontWeight: 700,
                  }}>
                    {area.funcionarias.length}/{area.cupo}
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  {area.funcionarias.length === 0 ? (
                    <div style={{ color: "#475569", fontSize: 12, fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                      Sin asignar
                    </div>
                  ) : (
                    area.funcionarias.map(f => (
                      <div key={f.nombre} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `${area.color}22`,
                          border: `1px solid ${area.color}44`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: area.color,
                          flexShrink: 0,
                        }}>
                          {f.nombre.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{f.nombre}</div>
                          {f.condicion && (
                            <div style={{ fontSize: 10, color: "#64748b" }}>
                              {f.condicion === "fija_pyxis" ? "🔒 Fija" :
                               f.condicion === "solo_satelite_cronico" ? "⚠️ Solo sat./crónico" :
                               f.condicion === "soporte_6meses" ? "🔄 Cada 6 meses" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vista por funcionaria - historial de todos los trimestres
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 16px", color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    Funcionaria
                  </th>
                  {TRIMESTRES.map((t, i) => (
                    <th key={i} style={{
                      textAlign: "center",
                      padding: "10px 16px",
                      color: i === trimestre ? "#818cf8" : "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}>
                      T{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNCIONARIAS.map(f => (
                  <tr key={f.nombre}>
                    <td style={{
                      padding: "10px 16px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "10px 0 0 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#e2e8f0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{f.nombre}</span>
                        {f.condicion === "fija_pyxis" && <span style={{ fontSize: 10, color: "#8b5cf6" }}>🔒</span>}
                        {f.condicion === "solo_satelite_cronico" && <span style={{ fontSize: 10, color: "#f59e0b" }}>⚠️</span>}
                      </div>
                    </td>
                    {rotaciones.map((rot, i) => {
                      const areaId = rot[f.nombre];
                      const area = getAreaInfo(areaId);
                      return (
                        <td key={i} style={{
                          padding: "10px 8px",
                          background: i === trimestre ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                          borderLeft: "1px solid rgba(255,255,255,0.03)",
                          borderRight: i === TRIMESTRES.length - 1 ? "none" : "none",
                          borderRadius: i === TRIMESTRES.length - 1 ? "0 10px 10px 0" : 0,
                          textAlign: "center",
                        }}>
                          {area && (
                            <span style={{
                              display: "inline-block",
                              background: `${area.color}22`,
                              border: `1px solid ${area.color}44`,
                              color: area.color,
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}>
                              {area.nombre.replace("Farmacia ", "").replace("PYXIS", "PYXIS")}
                            </span>
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

        {/* Leyenda de condiciones */}
        <div style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>Reglas</span>
          {[
            { icon: "⏱", text: "Mín. 3 meses – Máx. 6 meses por área" },
            { icon: "🚫", text: "No consecutivo Satélite ↔ Crónico" },
            { icon: "🔒", text: "PYXIS: posición fija (Jacqueline & Marcela)" },
            { icon: "⚠️", text: "Yamilet: solo Satélite y Crónico" },
            { icon: "🔄", text: "Kimberly: Soporte cada 6 meses" },
          ].map((r, i) => (
            <span key={i} style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{r.icon}</span> {r.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
