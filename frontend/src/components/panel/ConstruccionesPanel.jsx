import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useItems } from '../../context/ItemsContext';
import { useSession } from '../../context/SessionContext';
import { useToast } from '../Toast';
import { IngredientRows, ResultBox, McIcon, MC_ICONS } from './shared';

const ESTADO_CLASS = { pendiente: 'pendiente', 'en progreso': 'en-progreso', en_progreso: 'en-progreso', completado: 'completado' };

function ProyectoSelect({ value, onChange, proyectos }) {
  return (
    <select className="mc-input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Elegir...</option>
      {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre_proyecto || p.id}</option>)}
    </select>
  );
}

export default function ConstruccionesPanel({ onBadgeChange }) {
  const { items } = useItems();
  const { user } = useSession();
  const showToast = useToast();

  const [proyectos, setProyectos] = useState([]);

  async function reloadProyectos() {
    try {
      const { ok, data } = await api('GET', '/proyectos');
      const list = ok && Array.isArray(data) ? data : [];
      setProyectos(list);
      return list;
    } catch {
      setProyectos([]);
      return [];
    }
  }

  useEffect(() => { reloadProyectos(); }, []);

  // Mis Construcciones (list + materiales inline)
  const [showList, setShowList] = useState(false);
  const [openMateriales, setOpenMateriales] = useState({});

  async function toggleProyectos() {
    if (showList) { setShowList(false); return; }
    const list = await reloadProyectos();
    onBadgeChange(list.length);
    setShowList(true);
  }

  async function verMaterialesProyecto(proyectoId) {
    try {
      const { ok, data } = await api('GET', `/proyectos/${proyectoId}/items`);
      setOpenMateriales((prev) => ({ ...prev, [proyectoId]: ok && Array.isArray(data) ? data : [] }));
    } catch {
      setOpenMateriales((prev) => ({ ...prev, [proyectoId]: [] }));
    }
  }

  async function deleteProyecto(proyectoId) {
    if (!confirm('Eliminar este proyecto permanentemente?')) return;
    try {
      const { ok, data } = await api('DELETE', '/proyectos/' + proyectoId);
      if (ok) { showToast('Proyecto eliminado!', 'success'); await reloadProyectos(); }
      else showToast(data.error || 'Error', 'error');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  }

  // Nueva construccion
  const [pNombre, setPNombre] = useState('');
  const [pEstado, setPEstado] = useState('pendiente');
  const [objetivos, setObjetivos] = useState([]);
  const [rCreate, setRCreate] = useState(null);

  async function createProyecto() {
    if (!pNombre.trim()) return showToast('El nombre es obligatorio', 'error');
    if (!user) return showToast('Debes iniciar sesion', 'error');
    const objs = objetivos
      .filter((r) => r.itemId && parseInt(r.cantidad) > 0)
      .map((r) => ({ item_id: r.itemId, cantidad: parseInt(r.cantidad) }));
    const body = { nombre_proyecto: pNombre.trim(), usuario_id: user.id, estado: pEstado, objetivos: objs };
    try {
      const { ok, data } = await api('POST', '/proyectos', body);
      if (ok) {
        setRCreate({ type: 'success', content: data });
        showToast('Construccion iniciada!', 'success');
        setPNombre(''); setObjetivos([]);
        await reloadProyectos();
      } else {
        setRCreate({ type: 'error', content: data.error || 'Error' });
      }
    } catch (e) {
      setRCreate({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Gestionar proyecto
  const [gSel, setGSel] = useState('');
  const [gNombre, setGNombre] = useState('');
  const [gEstado, setGEstado] = useState('');
  const [rGestionar, setRGestionar] = useState(null);

  async function patchNombre() {
    if (!gSel) return showToast('Selecciona un proyecto', 'error');
    try {
      const { ok, data } = await api('PATCH', '/editar/nombre/' + gSel, { nombre_proyecto: gNombre });
      if (ok) { setRGestionar({ type: 'success', content: data }); showToast('Nombre cambiado!', 'success'); await reloadProyectos(); }
      else setRGestionar({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRGestionar({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  async function patchEstado() {
    if (!gSel || !gEstado) return showToast('Selecciona proyecto y estado', 'error');
    try {
      const { ok, data } = await api('PATCH', '/editar/estado/' + gSel, { estado: gEstado });
      if (ok) { setRGestionar({ type: 'success', content: data }); showToast('Estado cambiado!', 'success'); await reloadProyectos(); }
      else setRGestionar({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRGestionar({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  async function deleteProyectoFromGest() {
    if (!gSel) return showToast('Selecciona un proyecto', 'error');
    if (!confirm('Eliminar este proyecto permanentemente?')) return;
    try {
      const { ok, data } = await api('DELETE', '/proyectos/' + gSel);
      if (ok) { setRGestionar({ type: 'success', content: data }); showToast('Proyecto eliminado!', 'success'); setGSel(''); await reloadProyectos(); }
      else setRGestionar({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRGestionar({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Materiales del proyecto
  const [miSel, setMiSel] = useState('');
  const [miResult, setMiResult] = useState(null);

  async function getProyectoItems() {
    if (!miSel) return showToast('Selecciona un proyecto', 'error');
    try {
      const { ok, data } = await api('GET', `/proyectos/${miSel}/items`);
      if (ok && Array.isArray(data)) setMiResult({ ok: true, data });
      else setMiResult({ ok: false, error: (data && data.error) || 'Error' });
    } catch (e) {
      setMiResult({ ok: false, error: 'Error: ' + e.message });
    }
  }

  // Agregar material
  const [asSel, setAsSel] = useState('');
  const [asNombre, setAsNombre] = useState('');
  const [asCant, setAsCant] = useState(1);
  const [asPrima, setAsPrima] = useState('false');
  const [rAsignar, setRAsignar] = useState(null);

  async function crearAsignarItem() {
    if (!asSel || !asNombre.trim()) return showToast('Selecciona proyecto y escribe un nombre', 'error');
    const body = { nombre: asNombre.trim(), es_materia_prima: asPrima === 'true', cantidad: parseInt(asCant) || 1 };
    try {
      const { ok, data } = await api('POST', `/proyectos/${asSel}/items`, body);
      if (ok) { setRAsignar({ type: 'success', content: data }); showToast('Material agregado!', 'success'); }
      else setRAsignar({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRAsignar({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Quitar material
  const [reSel, setReSel] = useState('');
  const [reItemId, setReItemId] = useState('');
  const [rRemover, setRRemover] = useState(null);

  async function removerItemProyecto() {
    if (!reSel || !reItemId.trim()) return showToast('Selecciona proyecto y escribe el ID del item', 'error');
    try {
      const { ok, data } = await api('DELETE', `/proyectos/${reSel}/items/${reItemId.trim()}`);
      if (ok) { setRRemover({ type: 'success', content: data }); showToast('Material removido!', 'success'); }
      else setRRemover({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRRemover({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  return (
    <>
      <div className="mc-card">
        <div className="mc-label">Mis Construcciones</div>
        <button className="mc-btn green wide" onClick={toggleProyectos}>{showList ? 'Ocultar Proyectos' : 'Ver Proyectos'}</button>
        {showList && (
          proyectos.length === 0
            ? <div className="empty-state">No hay proyectos. Crea uno!</div>
            : (
              <>
                <div style={{ marginBottom: 6, fontSize: '0.55rem', color: 'var(--mc-text-muted)' }}>{proyectos.length} proyecto(s)</div>
                {proyectos.map((p) => (
                  <div className="item-row" style={{ flexWrap: 'wrap' }} key={p.id}>
                    <div className="item-icon"><McIcon id={MC_ICONS.construccion} fallback="🏗️" /></div>
                    <div className="item-detail" style={{ flex: 1, minWidth: 120 }}>
                      <div className="item-name">{p.nombre_proyecto || '?'}</div>
                      <div className="item-meta">
                        {p.id} | {p.usuario_id || '-'} <span className={`estado-tag ${ESTADO_CLASS[p.estado] || ''}`}>{p.estado || '-'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, width: '100%', marginTop: 4 }}>
                      <button className="mc-btn blue sm" style={{ flex: 1 }} onClick={() => verMaterialesProyecto(p.id)}>Materiales</button>
                      <button className="mc-btn red sm" style={{ flex: 1 }} onClick={() => deleteProyecto(p.id)}>Eliminar</button>
                    </div>
                    {openMateriales[p.id] && (
                      <div style={{ width: '100%', marginTop: 4 }}>
                        {openMateriales[p.id].length === 0
                          ? <div style={{ padding: 6, fontSize: '0.55rem', color: 'var(--mc-text-muted)' }}>Sin materiales asignados</div>
                          : openMateriales[p.id].map((item, i) => (
                            <div className="item-row" style={{ margin: '2px 0', padding: '4px 8px' }} key={i}>
                              <div className="item-icon"><McIcon id={MC_ICONS.material} fallback="📦" /></div>
                              <div className="item-detail">
                                <div className="item-name">{item.nombre || item.item_id || '?'}</div>
                                <div className="item-meta">Cant: {item.cantidad || '-'}{item.error ? <span className="tag warn">NO ENCONTRADO</span> : ''}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )
        )}
      </div>

      <div className="mc-card">
        <div className="mc-label">Nueva Construccion</div>
        <div className="mc-fld"><label>Nombre del Proyecto</label>
          <input className="mc-input" placeholder="Ej: Torre de Piedra" value={pNombre} onChange={(e) => setPNombre(e.target.value)} />
        </div>
        <div className="mc-fld-row">
          <div className="mc-fld"><label>Estado</label>
            <select className="mc-input" value={pEstado} onChange={(e) => setPEstado(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="en progreso">En Progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>
        <div className="mc-fld"><label>Materiales Necesarios</label></div>
        <IngredientRows rows={objetivos} setRows={setObjetivos} items={items} addLabel="+ Agregar Material" />
        <button className="mc-btn green wide" onClick={createProyecto}>Iniciar Construccion</button>
        <ResultBox result={rCreate} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Gestionar Proyecto</div>
        <div className="mc-fld"><label>Seleccionar Proyecto</label>
          <ProyectoSelect value={gSel} onChange={setGSel} proyectos={proyectos} />
        </div>
        <div className="mc-fld-row">
          <div className="mc-fld" style={{ flex: 1 }}><label>Nuevo Nombre</label>
            <input className="mc-input" placeholder="Nuevo nombre..." value={gNombre} onChange={(e) => setGNombre(e.target.value)} />
          </div>
          <div className="mc-fld" style={{ flex: 1 }}><label>Nuevo Estado</label>
            <select className="mc-input" value={gEstado} onChange={(e) => setGEstado(e.target.value)}>
              <option value="">Sin cambio</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>
        <div className="mc-fld-row">
          <button className="mc-btn gold sm" style={{ flex: 1 }} onClick={patchNombre}>Renombrar</button>
          <button className="mc-btn gold sm" style={{ flex: 1 }} onClick={patchEstado}>Cambiar Estado</button>
          <button className="mc-btn red sm" style={{ flex: 1 }} onClick={deleteProyectoFromGest}>Eliminar</button>
        </div>
        <ResultBox result={rGestionar} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Materiales del Proyecto</div>
        <div className="mc-fld"><label>Seleccionar Proyecto</label>
          <ProyectoSelect value={miSel} onChange={setMiSel} proyectos={proyectos} />
        </div>
        <button className="mc-btn blue wide" onClick={getProyectoItems}>Ver Materiales</button>
        {miResult && (
          <div className={`mc-result visible ${miResult.ok ? 'success' : 'error'}`}>
            {miResult.ok
              ? (miResult.data.length === 0
                ? <div className="empty-state">Sin materiales asignados</div>
                : miResult.data.map((item, i) => (
                  <div className="item-row" key={i}>
                    <div className="item-icon"><McIcon id={MC_ICONS.material} fallback="📦" /></div>
                    <div className="item-detail">
                      <div className="item-name">{item.nombre || item.item_id || '?'}</div>
                      <div className="item-meta">Cant: {item.cantidad || '-'} | {item.item_id || '-'}{item.error ? <span className="tag warn">NO ENCONTRADO</span> : ''}</div>
                    </div>
                  </div>
                ))
              )
              : miResult.error}
          </div>
        )}
      </div>

      <div className="mc-card">
        <div className="mc-label">Agregar Material a Proyecto</div>
        <div className="mc-fld"><label>Seleccionar Proyecto</label>
          <ProyectoSelect value={asSel} onChange={setAsSel} proyectos={proyectos} />
        </div>
        <div className="mc-fld"><label>Nombre del Item</label>
          <input className="mc-input" placeholder="Ej: Espada de Hierro" value={asNombre} onChange={(e) => setAsNombre(e.target.value)} />
        </div>
        <div className="mc-fld-row">
          <div className="mc-fld"><label>Cantidad</label>
            <input className="mc-input" type="number" min="1" value={asCant} onChange={(e) => setAsCant(e.target.value)} />
          </div>
          <div className="mc-fld"><label>Tipo</label>
            <select className="mc-input" value={asPrima} onChange={(e) => setAsPrima(e.target.value)}>
              <option value="false">Elaborado</option>
              <option value="true">Materia Prima</option>
            </select>
          </div>
        </div>
        <button className="mc-btn green wide" onClick={crearAsignarItem}>Agregar Material</button>
        <ResultBox result={rAsignar} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Quitar Material de Proyecto</div>
        <div className="mc-fld"><label>Seleccionar Proyecto</label>
          <ProyectoSelect value={reSel} onChange={setReSel} proyectos={proyectos} />
        </div>
        <div className="mc-fld"><label>ID del Item a Quitar</label>
          <input className="mc-input" placeholder="ej: espada_de_hierro" value={reItemId} onChange={(e) => setReItemId(e.target.value)} />
        </div>
        <button className="mc-btn red wide" onClick={removerItemProyecto}>Quitar Material</button>
        <ResultBox result={rRemover} />
      </div>
    </>
  );
}
