import { useEffect, useMemo, useState } from "react";
import { CONTRATOS, DEFAULT_DATA } from "./defaultData";
import "./App.css";

const STORAGE_KEY = "rotacion-farmacia-admin-v1";
const copiar = value => JSON.parse(JSON.stringify(value));
const crearId = texto => `${texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;

async function api(action, options = {}) {
  const response = await fetch(`./api/index.php?action=${encodeURIComponent(action)}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Contraseña incorrecta" : `Error del servidor (${response.status})`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "No fue posible completar la operación");
  return result;
}

function periodoInicial(periodos) {
  const fecha = new Date();
  if (fecha < new Date(2026, 6, 1)) return periodos[0]?.id;
  if (fecha < new Date(2026, 9, 1)) return periodos[1]?.id;
  if (fecha < new Date(2027, 0, 1)) return periodos[2]?.id;
  return periodos[3]?.id || periodos.at(-1)?.id;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal-card"><header><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></header>{children}</section>
  </div>;
}

function Login({ onLogin, onPublico, error, waiting, servidor }) {
  const [clave, setClave] = useState("");
  return <main className="login-shell"><section className="login-card">
    <div className="login-icon">🔐</div><p className="eyebrow">Acceso Jefa de Farmacia</p><h1>Administración de rotaciones</h1>
    <p>{servidor ? "Los cambios quedarán disponibles para toda la red del hospital." : "Modo local de respaldo."}</p>
    <input type="password" placeholder="Contraseña" value={clave} onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && onLogin(clave)} />
    {error && <span className="error-text">{error}</span>}
    <button className="primary wide" disabled={waiting} onClick={() => onLogin(clave)}>{waiting ? "Ingresando…" : "Ingresar"}</button>
    <button className="link-button" onClick={onPublico}>Soy TENS, ver rotación →</button>
  </section></main>;
}

function PersonaModal({ persona, onClose, onSave }) {
  const [form, setForm] = useState({ id: persona.id || "", nombre: persona.nombre || "", contrato: persona.contrato || "contrata", nota: persona.nota || "" });
  return <Modal title={form.id ? "Editar funcionaria" : "Agregar funcionaria"} onClose={onClose}><div className="form-grid">
    <label>Nombre completo<input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></label>
    <label>Tipo de contrato<select value={form.contrato} onChange={e => setForm({ ...form, contrato: e.target.value })}>{Object.entries(CONTRATOS).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
    <label>Nota o condición especial<textarea value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Ej.: Fija en Crónico hasta diciembre" /></label>
    <button className="primary" disabled={!form.nombre.trim()} onClick={() => onSave({ ...form, nombre: form.nombre.trim() })}>Guardar funcionaria</button>
  </div></Modal>;
}

function AdminPanel({ datos, acciones, servidor }) {
  const [tab, setTab] = useState("personal");
  return <main className="admin-content">
    <div className="admin-intro"><div><p className="eyebrow">Panel de administración</p><h2>Gestión completa del sistema</h2><p>{servidor ? "Los cambios quedan disponibles para toda la red." : "Modo local: los cambios quedan solo en este navegador."}</p></div><button className="secondary" onClick={acciones.password}>🔑 Cambiar contraseña</button></div>
    <nav className="admin-tabs">{[["personal","Personal"],["areas","Áreas y cupos"],["periodos","Períodos"],["reglas","Reglas"]].map(([id,nombre]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{nombre}</button>)}</nav>

    {tab === "personal" && <section className="admin-section"><div className="section-title"><h3>Funcionarias</h3><button className="primary" onClick={() => acciones.persona({})}>+ Agregar funcionaria</button></div><div className="admin-list">{datos.personas.map(p => <article key={p.id}><div><strong>{p.nombre}</strong><small>{CONTRATOS[p.contrato]}{p.nota && ` · ${p.nota}`}</small></div><div><button className="secondary" onClick={() => acciones.persona(p)}>Editar</button><button className="danger" onClick={() => acciones.eliminarPersona(p.id)}>Eliminar</button></div></article>)}</div></section>}

    {tab === "areas" && <section className="admin-section"><div className="section-title"><h3>Farmacias, áreas y cupos</h3><button className="primary" onClick={acciones.agregarArea}>+ Agregar área</button></div><div className="area-admin-grid">{datos.areas.map(a => <article key={a.id} style={{ "--accent": a.color, "--pastel": a.pastel }}>
      <label>Nombre<input defaultValue={a.nombre} onBlur={e => e.target.value !== a.nombre && acciones.actualizarArea(a.id, { nombre: e.target.value })} /></label>
      <div className="color-line"><label>Color<input type="color" value={a.color} onChange={e => acciones.actualizarArea(a.id, { color: e.target.value })} /></label><label>Fondo<input type="color" value={a.pastel} onChange={e => acciones.actualizarArea(a.id, { pastel: e.target.value })} /></label></div>
      <div className="quota-grid">{datos.periodos.map(p => <label key={p.id}>{p.corto}<input type="number" min="0" value={a.cupos?.[p.id] ?? 0} onChange={e => acciones.actualizarArea(a.id, { cupos: { ...a.cupos, [p.id]: Number(e.target.value) } })} /></label>)}</div>
      <button className="danger" onClick={() => acciones.eliminarArea(a.id)}>Eliminar área</button>
    </article>)}</div></section>}

    {tab === "periodos" && <section className="admin-section"><div className="section-title"><h3>Períodos de rotación</h3><button className="primary" onClick={acciones.agregarPeriodo}>+ Agregar período</button></div><div className="admin-list">{datos.periodos.map(p => <article key={p.id}><div className="inline-fields"><input value={p.label} onChange={e => acciones.actualizarPeriodo(p.id, { label: e.target.value })} /><input value={p.corto} onChange={e => acciones.actualizarPeriodo(p.id, { corto: e.target.value })} /><select value={p.semestre} onChange={e => acciones.actualizarPeriodo(p.id, { semestre: Number(e.target.value) })}><option value="1">Semestre 1</option><option value="2">Semestre 2</option></select></div><button className="danger" onClick={() => acciones.eliminarPeriodo(p.id)}>Eliminar</button></article>)}</div></section>}

    {tab === "reglas" && <section className="admin-section"><div className="section-title"><h3>Reglas visibles</h3><button className="primary" onClick={acciones.agregarRegla}>+ Agregar regla</button></div><div className="admin-list">{datos.reglas.map((r,i) => <article key={i}><input defaultValue={r} onBlur={e => e.target.value !== r && acciones.actualizarRegla(i, e.target.value)} /><button className="danger" onClick={() => acciones.eliminarRegla(i)}>Eliminar</button></article>)}</div></section>}
  </main>;
}

export default function App() {
  const [datos, setDatos] = useState(copiar(DEFAULT_DATA));
  const [servidor, setServidor] = useState(false);
  const [modo, setModo] = useState(null);
  const [esperando, setEsperando] = useState(true);
  const [error, setError] = useState("");
  const [periodoId, setPeriodoId] = useState("t2");
  const [seccion, setSeccion] = useState("rotacion");
  const [vista, setVista] = useState("area");
  const [estado, setEstado] = useState("");
  const [moviendo, setMoviendo] = useState(null);
  const [personaForm, setPersonaForm] = useState(null);
  const [claveForm, setClaveForm] = useState(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const result = await api("data");
        if (!activo) return;
        const inicial = result.data || copiar(DEFAULT_DATA);
        setDatos(inicial); setServidor(true); setPeriodoId(periodoInicial(inicial.periodos));
        if (result.authenticated) setModo("jefa");
      } catch {
        if (!activo) return;
        try { const local = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (local?.personas) setDatos(local); } catch { /* respaldo inicial */ }
        setPeriodoId(periodoInicial(DEFAULT_DATA.periodos));
      } finally { if (activo) setEsperando(false); }
    })();
    return () => { activo = false; };
  }, []);

  async function login(clave) {
    setError(""); setEsperando(true);
    try {
      if (!servidor) throw new Error("La administración está disponible únicamente en el servidor del hospital");
      await api("login", { method: "POST", body: JSON.stringify({ password: clave }) });
      setModo("jefa");
    }
    catch (e) { setError(e.message); } finally { setEsperando(false); }
  }

  async function logout() {
    if (servidor) try { await api("logout", { method: "POST", body: "{}" }); } catch { /* salida visual */ }
    setModo(null); setSeccion("rotacion");
  }

  async function guardar(nuevos, mensaje = "Cambios guardados") {
    setDatos(nuevos); setEstado("Guardando…");
    try { if (servidor) await api("save", { method: "POST", body: JSON.stringify({ data: nuevos }) }); else localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos)); setEstado(`✓ ${mensaje}`); }
    catch (e) { setEstado(`⚠ ${e.message}`); }
    window.setTimeout(() => setEstado(""), 2600);
  }

  const esJefa = modo === "jefa";
  const actualId = periodoInicial(datos.periodos);
  const semestre = datos.periodos.find(p => p.id === actualId)?.semestre;
  const periodosVisibles = esJefa ? datos.periodos : datos.periodos.filter(p => p.semestre === semestre);
  const periodo = datos.periodos.find(p => p.id === periodoId) || periodosVisibles[0] || datos.periodos[0];
  const asignaciones = useMemo(
    () => datos.asignaciones[periodo?.id] || {},
    [datos.asignaciones, periodo?.id],
  );
  const agrupadas = useMemo(() => datos.areas.map(a => ({ ...a, personas: datos.personas.filter(p => asignaciones[p.id] === a.id) })), [datos.areas, datos.personas, asignaciones]);

  if (esperando && !modo) return <main className="loading">Cargando rotaciones…</main>;
  if (!modo) return <Login onLogin={login} onPublico={() => setModo("tens")} error={error} waiting={esperando} servidor={servidor} />;

  const acciones = {
    persona: setPersonaForm,
    eliminarPersona(id) { if (!window.confirm("¿Eliminar esta persona y todas sus asignaciones?")) return; const n = copiar(datos); n.personas = n.personas.filter(p => p.id !== id); Object.values(n.asignaciones).forEach(m => delete m[id]); guardar(n, "Persona eliminada"); },
    agregarArea() { const nombre = window.prompt("Nombre de la nueva farmacia o área:"); if (!nombre?.trim()) return; const n = copiar(datos); n.areas.push({ id: crearId(nombre), nombre: nombre.trim(), color: "#3b718a", pastel: "#eaf7fb", cupos: Object.fromEntries(n.periodos.map(p => [p.id, 1])) }); guardar(n, "Área agregada"); },
    actualizarArea(id, cambios) { const n = copiar(datos); n.areas = n.areas.map(a => a.id === id ? { ...a, ...cambios } : a); guardar(n, "Área actualizada"); },
    eliminarArea(id) { if (!window.confirm("¿Eliminar esta área? Las personas asignadas quedarán sin área.")) return; const n = copiar(datos); n.areas = n.areas.filter(a => a.id !== id); Object.values(n.asignaciones).forEach(m => Object.keys(m).forEach(pid => { if (m[pid] === id) delete m[pid]; })); guardar(n, "Área eliminada"); },
    agregarPeriodo() { const label = window.prompt("Nombre del período (ej.: T5 · Abril–Junio 2027):"); if (!label?.trim()) return; const n = copiar(datos); const id = crearId(label); n.periodos.push({ id, label: label.trim(), corto: label.replace(/^T\d+\s*·?\s*/, ""), semestre: 1 }); n.asignaciones[id] = {}; n.areas.forEach(a => { a.cupos[id] = 1; }); guardar(n, "Período agregado"); setPeriodoId(id); },
    actualizarPeriodo(id, cambios) { const n = copiar(datos); n.periodos = n.periodos.map(p => p.id === id ? { ...p, ...cambios } : p); guardar(n, "Período actualizado"); },
    eliminarPeriodo(id) { if (datos.periodos.length === 1 || !window.confirm("¿Eliminar este período y su rotación?")) return; const n = copiar(datos); n.periodos = n.periodos.filter(p => p.id !== id); delete n.asignaciones[id]; n.areas.forEach(a => delete a.cupos[id]); guardar(n, "Período eliminado"); setPeriodoId(n.periodos[0].id); },
    agregarRegla() { const n = copiar(datos); n.reglas.push("Nueva regla"); guardar(n, "Regla agregada"); },
    actualizarRegla(i, value) { const n = copiar(datos); n.reglas[i] = value; guardar(n, "Regla actualizada"); },
    eliminarRegla(i) { const n = copiar(datos); n.reglas.splice(i,1); guardar(n, "Regla eliminada"); },
    password: () => setClaveForm({ currentPassword: "", newPassword: "", confirmPassword: "" }),
  };

  function guardarPersona(form) { const n = copiar(datos); if (form.id) n.personas = n.personas.map(p => p.id === form.id ? { ...p, ...form } : p); else n.personas.push({ ...form, id: crearId(form.nombre) }); guardar(n, "Personal actualizado"); setPersonaForm(null); }
  function mover(personaId, areaId) { const n = copiar(datos); n.asignaciones[periodo.id] ||= {}; if (areaId) n.asignaciones[periodo.id][personaId] = areaId; else delete n.asignaciones[periodo.id][personaId]; guardar(n, "Rotación actualizada"); setMoviendo(null); }
  async function cambiarClave() { setEstado("Guardando contraseña…"); try { if (!servidor) throw new Error("Disponible solo en el servidor"); await api("change-password", { method: "POST", body: JSON.stringify(claveForm) }); setClaveForm(null); setEstado("✓ Contraseña actualizada"); } catch (e) { setEstado(`⚠ ${e.message}`); } }

  return <div className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Hospital · Equipo Farmacia</p><h1>Rotación TENS 2026</h1></div><div className="header-actions"><span className={`badge ${esJefa ? "admin" : "reader"}`}>{esJefa ? "🔐 Jefa de Farmacia" : "👁 TENS — Solo lectura"}</span>{estado && <span className="status">{estado}</span>}{esJefa && <button className={seccion === "administracion" ? "primary" : "secondary"} onClick={() => setSeccion(s => s === "rotacion" ? "administracion" : "rotacion")}>{seccion === "rotacion" ? "⚙ Administrar" : "← Ver rotación"}</button>}{seccion === "rotacion" && <button className="secondary" onClick={() => setVista(v => v === "area" ? "persona" : "area")}>{vista === "area" ? "👤 Ver por funcionaria" : "🏥 Ver por área"}</button>}<button className="secondary" onClick={logout}>Salir</button></div></header>

    {seccion === "administracion" ? <AdminPanel datos={datos} acciones={acciones} servidor={servidor} /> : <><nav className="period-tabs">{periodosVisibles.map(p => <button key={p.id} className={p.id === periodo.id ? "active" : ""} onClick={() => setPeriodoId(p.id)}>{p.label}</button>)}</nav><main className="content">
      {vista === "area" ? <div className="area-grid">{agrupadas.map(a => <section className="area-card" key={a.id} style={{ "--accent": a.color, "--pastel": a.pastel }}><div className="area-header"><div><strong>{a.nombre}</strong>{a.id === "pyxis" && <small>Posición fija</small>}</div><span>{a.personas.length}/{Number(a.cupos?.[periodo.id] || 0)}</span></div><div className="people-list">{!a.personas.length && <p className="empty">Sin asignar</p>}{a.personas.map(p => <article className="person-row" key={p.id}><i>{p.nombre.charAt(0)}</i><div><strong>{p.nombre}</strong>{esJefa && <small>{CONTRATOS[p.contrato]}{p.nota && ` · 📌 ${p.nota}`}</small>}</div>{esJefa && <button className="icon-button" onClick={() => setMoviendo(p)}>✏️</button>}</article>)}</div></section>)}</div> : <div className="table-wrap"><table><thead><tr><th>Funcionaria</th>{periodosVisibles.map(p => <th key={p.id}>{p.corto}</th>)}</tr></thead><tbody>{datos.personas.map(persona => <tr key={persona.id}><td>{persona.nombre}</td>{periodosVisibles.map(p => { const a = datos.areas.find(x => x.id === datos.asignaciones[p.id]?.[persona.id]); return <td key={p.id}><span className="area-pill" style={{ "--accent": a?.color || "#64748b", "--pastel": a?.pastel || "#f1f5f9" }}>{a?.nombre.replace("Farmacia ", "") || "Sin asignar"}</span></td>; })}</tr>)}</tbody></table></div>}
      <section className="rules"><strong>REGLAS</strong>{datos.reglas.map((r,i) => <span key={i}>📌 {r}</span>)}</section>
    </main></>}

    {moviendo && <Modal title={`Mover a ${moviendo.nombre}`} onClose={() => setMoviendo(null)}><div className="choice-list"><button onClick={() => mover(moviendo.id, "")}>Sin asignar</button>{datos.areas.map(a => <button key={a.id} className={asignaciones[moviendo.id] === a.id ? "selected" : ""} style={{ "--accent": a.color, "--pastel": a.pastel }} onClick={() => mover(moviendo.id, a.id)}>{a.nombre}{asignaciones[moviendo.id] === a.id && " ✓"}</button>)}</div></Modal>}
    {personaForm && <PersonaModal persona={personaForm} onClose={() => setPersonaForm(null)} onSave={guardarPersona} />}
    {claveForm && <Modal title="Cambiar contraseña" onClose={() => setClaveForm(null)}><div className="form-grid"><label>Contraseña actual<input type="password" value={claveForm.currentPassword} onChange={e => setClaveForm({ ...claveForm, currentPassword: e.target.value })} /></label><label>Nueva contraseña<input type="password" value={claveForm.newPassword} onChange={e => setClaveForm({ ...claveForm, newPassword: e.target.value })} /></label><label>Repetir contraseña<input type="password" value={claveForm.confirmPassword} onChange={e => setClaveForm({ ...claveForm, confirmPassword: e.target.value })} /></label><button className="primary" disabled={!claveForm.newPassword || claveForm.newPassword !== claveForm.confirmPassword} onClick={cambiarClave}>Guardar contraseña</button></div></Modal>}
  </div>;
}
