import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useItems } from '../../context/ItemsContext';
import { useInventario } from '../../context/InventarioContext';
import { useToast } from '../Toast';
import { ItemSelect, IngredientRows, CraftGrid, ResultBox, McIcon, MC_ICONS, InventoryGrid, SlotQuantityEditor, resolveEntries } from './shared';

const emptySlots = () => Array(9).fill(null);

export default function CrafteosPanel({ onBadgeChange }) {
  const { items, reload } = useItems();
  const { inventario, reload: reloadInv, setCantidad } = useInventario();
  const showToast = useToast();

  // Acordeon
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (name) => setOpenSection((cur) => (cur === name ? null : name));

  // Inventario
  const [invOpen, setInvOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null);

  async function openInventario() {
    const inv = await reloadInv();
    onBadgeChange(Object.keys(inv).length);
    setInvOpen(true);
  }

  useEffect(() => {
    if (!invOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setInvOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [invOpen]);

  // Nueva
  const [nNombre, setNNombre] = useState('');
  const [nPrima, setNPrima] = useState('false');
  const [nFullId, setNFullId] = useState('');
  const [nIngredientes, setNIngredientes] = useState([]);
  const [nSlots, setNSlots] = useState(emptySlots());
  const [rCreate, setRCreate] = useState(null);

  async function createItem() {
    if (!nNombre.trim()) return showToast('El nombre es obligatorio', 'error');
    const ingredientes = nIngredientes
      .filter((r) => r.itemId && parseInt(r.cantidad) > 0)
      .map((r) => ({ item_id: r.itemId, cantidad: parseInt(r.cantidad) }));
    const hasRecipe = nSlots.some((s) => s !== null);
    const body = {
      nombre: nNombre.trim(),
      es_materia_prima: nPrima === 'true',
      ingredientes_para_calculo: ingredientes,
    };
    if (nFullId.trim()) body.full_id = nFullId.trim();
    if (hasRecipe) body.receta_matriz = nSlots;
    try {
      const { ok, data } = await api('POST', '/items', body);
      if (ok) {
        setRCreate({ type: 'success', content: data });
        showToast('Crafteo creado!', 'success');
        await reload();
        setNNombre(''); setNFullId(''); setNIngredientes([]); setNSlots(emptySlots());
      } else {
        setRCreate({ type: 'error', content: data.error || 'Error' });
      }
    } catch (e) {
      setRCreate({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Calculadora
  const [matItem, setMatItem] = useState('');
  const [matResult, setMatResult] = useState(null);

  async function getMateriales() {
    if (!matItem) return showToast('Selecciona un item', 'error');
    try {
      const { ok, data } = await api('GET', '/items/' + matItem + '/materiales');
      if (ok) setMatResult({ ok: true, data });
      else setMatResult({ ok: false, error: 'Item no encontrado' });
    } catch (e) {
      setMatResult({ ok: false, error: 'Error: ' + e.message });
    }
  }

  // Editar
  const [uItemSel, setUItemSel] = useState('');
  const [uPrima, setUPrima] = useState('');
  const [uNombre, setUNombre] = useState('');
  const [uFullId, setUFullId] = useState('');
  const [uIngredientes, setUIngredientes] = useState([]);
  const [uSlots, setUSlots] = useState(emptySlots());
  const [rUpdate, setRUpdate] = useState(null);

  async function updateItem() {
    if (!uItemSel) return showToast('Selecciona un item', 'error');
    const body = {};
    if (uPrima) body.es_materia_prima = uPrima === 'true';
    if (uNombre.trim()) body.nombre = uNombre.trim();
    if (uFullId.trim()) body.full_id = uFullId.trim();
    const ingredientes = uIngredientes
      .filter((r) => r.itemId && parseInt(r.cantidad) > 0)
      .map((r) => ({ item_id: r.itemId, cantidad: parseInt(r.cantidad) }));
    if (ingredientes.length > 0) body.ingredientes_para_calculo = ingredientes;
    const hasRecipe = uSlots.some((s) => s !== null);
    if (hasRecipe) body.receta_matriz = uSlots;
    if (Object.keys(body).length === 0) return showToast('Selecciona al menos un cambio', 'error');
    try {
      const { ok, data } = await api('PUT', '/items/' + uItemSel, body);
      if (ok) {
        setRUpdate({ type: 'success', content: data });
        showToast('Crafteo actualizado!', 'success');
        await reload();
      } else {
        setRUpdate({ type: 'error', content: data.error || 'Error' });
      }
    } catch (e) {
      setRUpdate({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Eliminar
  const [dSel, setDSel] = useState('');
  const [rDelete, setRDelete] = useState(null);

  async function deleteItem() {
    if (!dSel) return showToast('Selecciona un item', 'error');
    if (!confirm('Eliminar este crafteo permanentemente?')) return;
    try {
      const { ok, data } = await api('DELETE', '/items/' + dSel);
      if (ok) { setRDelete({ type: 'success', content: data }); showToast('Crafteo eliminado!', 'success'); await reload(); setDSel(''); }
      else setRDelete({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRDelete({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  const entries = resolveEntries(inventario, items);

  return (
    <>
      <div className="mc-card">
        <div className="mc-label">Inventario</div>
        <button className="mc-btn green wide" onClick={openInventario}>Abrir Inventario</button>
      </div>

      {invOpen && (
        <div className="inv-modal-overlay" onClick={() => setInvOpen(false)}>
          <div className="inv-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h2>Inventario</h2>
              <button className="inv-modal-close" onClick={() => setInvOpen(false)}>X</button>
            </div>
            <div className="inv-modal-body">
              {entries.length === 0 ? (
                <div className="empty-state">Inventario vacio. Agrega items desde Perfil &gt; Anadir Items.</div>
              ) : (
                <InventoryGrid entries={entries} onSlotClick={(id) => setEditSlot(id)} />
              )}
              {editSlot && (
                <SlotQuantityEditor
                  itemName={(entries.find((e) => e.item_id === editSlot) || {}).nombre || editSlot}
                  cantidad={inventario[editSlot] || 0}
                  onSave={async (n) => { await setCantidad(editSlot, n); setEditSlot(null); }}
                  onCancel={() => setEditSlot(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mc-card">
        <div className={`mc-label mc-collapsible-header${openSection === 'crear' ? ' open' : ''}`} onClick={() => toggleSection('crear')}>
          <span>Nuevo Crafteo</span><span className="mc-arrow">▶</span>
        </div>
        {openSection === 'crear' && (
          <>
            <div className="mc-fld"><label>Nombre del Item</label>
              <input className="mc-input" placeholder="Ej: Pico de Piedra" value={nNombre} onChange={(e) => setNNombre(e.target.value)} />
            </div>
            <div className="mc-fld-row" style={{ marginBottom: 8 }}>
              <div className="mc-fld"><label>Tipo</label>
                <select className="mc-input" value={nPrima} onChange={(e) => setNPrima(e.target.value)}>
                  <option value="false">Elaborado</option>
                  <option value="true">Materia Prima</option>
                </select>
              </div>
              <div className="mc-fld"><label>ID Minecraft (icono, opcional)</label>
                <input className="mc-input" placeholder="minecraft:diamond_sword" value={nFullId} onChange={(e) => setNFullId(e.target.value)} />
              </div>
            </div>
            <div className="mc-fld"><label>Ingredientes</label></div>
            <IngredientRows rows={nIngredientes} setRows={setNIngredientes} items={items} />
            <div className="mc-fld"><label>Receta (Grid 3x3)</label></div>
            <CraftGrid slots={nSlots} setSlots={setNSlots} items={items} idPrefix="new" />
            <button className="mc-btn green wide" onClick={createItem}>Craftear</button>
            <ResultBox result={rCreate} />
          </>
        )}
      </div>

      <div className="mc-card">
        <div className={`mc-label mc-collapsible-header${openSection === 'calc' ? ' open' : ''}`} onClick={() => toggleSection('calc')}>
          <span>Calculadora de Materiales</span><span className="mc-arrow">▶</span>
        </div>
        {openSection === 'calc' && (
          <>
            <div className="mc-fld"><label>Seleccionar Item</label>
              <ItemSelect value={matItem} onChange={setMatItem} items={items} placeholder="Elegir un crafteo..." />
            </div>
            <button className="mc-btn blue wide" onClick={getMateriales}>Calcular Materiales</button>
            {matResult && (
              <div className={`mc-result visible ${matResult.ok ? 'success' : 'error'}`}>
                {matResult.ok ? (
                  <>
                    <div style={{ fontSize: '0.7rem', color: '#FFF', marginBottom: 6 }}>Materiales para: {matResult.data.item || matItem}</div>
                    {matResult.data.es_materia_prima && <div className="tag prima">ES MATERIA PRIMA - No requiere materiales</div>}
                    {!matResult.data.es_materia_prima && matResult.data.materiales && (
                      Array.isArray(matResult.data.materiales)
                        ? matResult.data.materiales.map((m, i) => (
                          <div className="item-row" key={i}>
                            <div className="item-icon"><McIcon id={MC_ICONS.material} fallback="📦" /></div>
                            <div className="item-detail"><div className="item-name">{m.item_id || '?'}</div><div className="item-meta">Cantidad: {m.cantidad || '?'}</div></div>
                          </div>
                        ))
                        : Object.entries(matResult.data.materiales).map(([k, v]) => (
                          <div className="item-row" key={k}>
                            <div className="item-icon"><McIcon id={MC_ICONS.material} fallback="📦" /></div>
                            <div className="item-detail"><div className="item-name">{k}</div><div className="item-meta">Cantidad: {v}</div></div>
                          </div>
                        ))
                    )}
                    {matResult.data.receta_matriz && (
                      <>
                        <div style={{ marginTop: 8, fontSize: '0.55rem', color: 'var(--mc-text-muted)' }}>Receta:</div>
                        <div className="craft-grid" style={{ marginTop: 4 }}>
                          {matResult.data.receta_matriz.map((s, i) => (
                            <div className="craft-slot" style={{ width: 36, height: 36, fontSize: '0.4rem' }} key={i}>{s || ''}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : matResult.error}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mc-card">
        <div className={`mc-label mc-collapsible-header${openSection === 'editar' ? ' open' : ''}`} onClick={() => toggleSection('editar')}>
          <span>Editar Crafteo</span><span className="mc-arrow">▶</span>
        </div>
        {openSection === 'editar' && (
          <>
            <div className="mc-fld"><label>Seleccionar Item</label>
              <ItemSelect value={uItemSel} onChange={setUItemSel} items={items} placeholder="Elegir..." />
            </div>
            <div className="mc-fld"><label>Tipo</label>
              <select className="mc-input" value={uPrima} onChange={(e) => setUPrima(e.target.value)}>
                <option value="">Sin cambio</option>
                <option value="true">Materia Prima</option>
                <option value="false">Elaborado</option>
              </select>
            </div>
            <div className="mc-fld"><label>Nuevo Nombre</label>
              <input className="mc-input" placeholder="Dejar vacio para no cambiar" value={uNombre} onChange={(e) => setUNombre(e.target.value)} />
            </div>
            <div className="mc-fld"><label>ID Minecraft (icono, opcional)</label>
              <input className="mc-input" placeholder="Dejar vacio para no cambiar" value={uFullId} onChange={(e) => setUFullId(e.target.value)} />
            </div>
            <div className="mc-fld"><label>Ingredientes</label></div>
            <IngredientRows rows={uIngredientes} setRows={setUIngredientes} items={items} />
            <div className="mc-fld"><label>Receta (Grid 3x3)</label></div>
            <CraftGrid slots={uSlots} setSlots={setUSlots} items={items} idPrefix="upd" />
            <button className="mc-btn gold wide" onClick={updateItem}>Actualizar</button>
            <ResultBox result={rUpdate} />
          </>
        )}
      </div>

      <div className="mc-card">
        <div className={`mc-label mc-collapsible-header${openSection === 'eliminar' ? ' open' : ''}`} onClick={() => toggleSection('eliminar')}>
          <span>Eliminar Crafteo</span><span className="mc-arrow">▶</span>
        </div>
        {openSection === 'eliminar' && (
          <>
            <div className="mc-fld"><label>Seleccionar Item</label>
              <ItemSelect value={dSel} onChange={setDSel} items={items} placeholder="Elegir..." />
            </div>
            <button className="mc-btn red wide" onClick={deleteItem}>Eliminar Permanentemente</button>
            <ResultBox result={rDelete} />
          </>
        )}
      </div>
    </>
  );
}
