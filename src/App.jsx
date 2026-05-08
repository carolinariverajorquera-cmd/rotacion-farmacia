import { useState, useEffect } from "react";

// --- CONFIGURACIÓN DE USUARIOS ---
const USUARIOS = {
  jefa: { pin: "1234", rol: "admin" }, // Cambia el PIN por uno seguro
  tens: { pin: "0000", rol: "visor" }
};

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

// Lógica de rotación (Mantenida igual)
function puedeRotar(func, areaId, historial) {
  if (func.condicion === "fija_pyxis") return areaId === "pyxis";
  if (func.condicion === "solo_satelite_cronico") return areaId === "satelite" || areaId === "cronico";
  if (func.condicion === "soporte_6meses") return areaId === "soporte";
  if (areaId === "pyxis") return false;
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

  FUNCIONARIAS.forEach(f => {
    if (f.condicion === "fija_pyxis") {
      ocupadas["pyxis"].push(f.nombre);
      asignacion[f.nombre] = "pyxis";
    }
  });

  ocupadas["soporte"].push("Kimberly Bravo González");
  asignacion["Kimberly Bravo González"] = "soporte";

  const libres = FUNCIONARIAS.filter(f =>
    f.condicion !== "fija_pyxis" && f.condicion !== "soporte_6meses"
  );

  const areasRotables = AREAS.filter(a => !a.fija && a.id !== "soporte");
  const yamilet = libres.find(f => f.condicion === "solo_satelite_cronico");
  const resto = libres.filter(f => f.condicion !== "solo_satelite_cronico");
  const ordenadas = yamilet ? [yamilet, ...resto] : resto;

  ordenadas.forEach(func => {
    const historial = rotacionAnterior ? [rotacionAnterior[func.nombre]].filter(Boolean) : [];
    let elegida = null;
    const candidatas = areasRotables.filter(a => {
      const llena = ocupadas[a.id].length >= a.cupo;
      const puede = puedeRotar(func, a.id, historial);
      const mismaque_anterior = historial[historial.length - 1] === a.id;
      return !llena && puede && !mismaque_anterior;
    });

    if (candidatas.length > 0) {
      elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
    } else {
      const fallback = areasRotables.filter(a => ocupadas[a.id].length < a.cupo && puedeRotar(func, a.id, historial));
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
  // Estados de Login
  const [user, setUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");

  // Estados de la App
  const [trimestre, setTrimestre] = useState(0);
  const [rotaciones, setRotaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState("tabla");

  useEffect(() => {
    const r0 = generarRotacion(0, null);
    const r1 = generarRotacion(1, r0);
    const r2 = generarRotacion(2, r1);
    const r3 = generarRotacion(3, r2);
    setRotaciones([r0, r1, r2, r3]);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === USUARIOS.jefa.pin) {
      setUser(USUARIOS.jefa);
    } else if (pinInput === USUARIOS.tens.pin) {
      setUser(USUARIOS.tens);
    } else {
      setError("PIN Incorrecto");
      setTimeout(() => setError(""), 2000);
    }
  };

  if (!user) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        fontFamily: "sans-serif"
      }}>
        <form onSubmit={handleLogin} style={{
          background: "rgba(255,255,255,0.05)",
          padding: 40,
          borderRadius: 20,
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          width: 300
        }}>
          <h2 style={{ color: "white", marginBottom: 20 }}>Acceso Farmacia</h2>
          <input
            type="password"
            placeholder="Ingrese su PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              marginBottom: 15,
              fontSize: 18,
              textAlign: "center"
            }}
          />
          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            background: "#6366f1",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}>Entrar</button>
          {error && <p style={{ color: "#ef4444", marginTop: 15 }}>{error}</p>}
        </form>
      </div>
    );
  }

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
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(10px)",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase" }}>
            Sesión: {user.rol === "admin" ? "Jefa de Farmacia" : "TENS (Solo Vista)"}
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Rotación TENS 2026</h1>
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setVista(vista === "tabla" ? "funcionaria" : "tabla")}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
            {vista === "tabla" ? "👤 Ver por Funcionaria" : "🏥 Ver por Área"}
          </button>
          
          {/* BOTÓN RESTRINGIDO A JEFA */}
          {user.rol === "admin" && (
            <button onClick={regenerar} disabled={loading}
              style={{ background: "#6366f1", border: "none", color: "white", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "⏳..." : "🔀 Nueva Rotación"}
            </button>
          )}

          <button onClick={() => setUser(null)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
            Salir
          </button>
        </div>
      </div>

      {/* Selector trimestres (Mantenido igual) */}
      <div style={{ display: "flex", gap: 8, padding: "20px 32px 0" }}>
        {TRIMESTRES.map((t, i) => (
          <button key={i} onClick={() => setTrimestre(i)}
            style={{
              background: trimestre === i ? "#6366f1" : "rgba(255,255,255,0.05)",
              border: "none", color: "white", borderRadius: 10, padding: "10px 18px", cursor: "pointer"
            }}>
            T{i + 1} · {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>
        {vista === "tabla" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {agrupadaPorArea.map(area => (
              <div key={area.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${area.color}33`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: `${area.color}22`, padding: "14px 18px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: area.color }}>{area.nombre}</span>
                  <span style={{ fontSize: 12 }}>{area.funcionarias.length}/{area.cupo}</span>
                </div>
                <div style={{ padding: 14 }}>
                  {area.funcionarias.map(f => (
                    <div key={f.nombre} style={{ padding: "8px", background: "rgba(255,255,255,0.02)", marginBottom: 4, borderRadius: 6, fontSize: 13 }}>
                      {f.nombre}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 20 }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: 10 }}>Funcionaria</th>
                  {TRIMESTRES.map((_, i) => <th key={i}>T{i+1}</th>)}
                </tr>
              </thead>
              <tbody>
                {FUNCIONARIAS.map(f => (
                  <tr key={f.nombre} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 10 }}>{f.nombre}</td>
                    {rotaciones.map((rot, i) => {
                      const area = getAreaInfo(rot[f.nombre]);
                      return <td key={i} style={{ color: area?.color }}>{area?.nombre.split(" ")[1] || area?.nombre}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}