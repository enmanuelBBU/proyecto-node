import { useState, useEffect } from 'react';
import { itemsApi } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function ItemsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCraftEditor, setShowCraftEditor] = useState(false);
  const [craftForm, setCraftForm] = useState({
    receta_matriz: [null, null, null, null, null, null, null, null, null],
    ingredientes_para_calculo: [],
  });
  const [stockEdit, setStockEdit] = useState({ id: null, value: 0 });
  const addToast = useToast();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await itemsApi.getAll();
      setItems(data);
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // 6. PUT /api/items/:id — Actualizar crafteo
  async function handleUpdateCraft(e) {
    e.preventDefault();
    try {
      await itemsApi.updateCrafteo(selectedItem.id, {
        receta_matriz: craftForm.receta_matriz,
        ingredientes_para_calculo: craftForm.ingredientes_para_calculo,
      });
      addToast('Crafteo actualizado exitosamente');
      setShowCraftEditor(false);
      loadItems();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  // 8. PATCH /api/items/:id/stock — Actualizar stock
  async function handleUpdateStock(id) {
    try {
      await itemsApi.updateStock(id, stockEdit.value);
      addToast('Stock actualizado');
      setStockEdit({ id: null, value: 0 });
      loadItems();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  function openCraftEditor(item) {
    setSelectedItem(item);
    setCraftForm({
      receta_matriz: item.receta_matriz && item.receta_matriz.length === 9
        ? [...item.receta_matriz]
        : [null, null, null, null, null, null, null, null, null],
      ingredientes_para_calculo: item.ingredientes_para_calculo
        ? item.ingredientes_para_calculo.map(i => ({ ...i }))
        : [],
    });
    setShowCraftEditor(true);
  }

  function updateMatrizSlot(index, value) {
    const newMatriz = [...craftForm.receta_matriz];
    newMatriz[index] = value.trim() === '' ? null : value.trim();
    setCraftForm({ ...craftForm, receta_matriz: newMatriz });
  }

  function addIngrediente() {
    setCraftForm({
      ...craftForm,
      ingredientes_para_calculo: [...craftForm.ingredientes_para_calculo, { item_id: '', cantidad: 1 }],
    });
  }

  function updateIngrediente(index, field, value) {
    const newIng = [...craftForm.ingredientes_para_calculo];
    newIng[index] = { ...newIng[index], [field]: field === 'cantidad' ? Number(value) : value };
    setCraftForm({ ...craftForm, ingredientes_para_calculo: newIng });
  }

  function removeIngrediente(index) {
    setCraftForm({
      ...craftForm,
      ingredientes_para_calculo: craftForm.ingredientes_para_calculo.filter((_, i) => i !== index),
    });
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-enter">
      <div className="card">
        <div className="card-header">
          <h2>🧊 Catálogo de Items</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {items.length} items
          </span>
        </div>
        <div className="card-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧊</div>
              <p>No hay ítems registrados</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Stock</th>
                    <th>Receta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><span className="mono">{item.id}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.nombre}</td>
                      <td>{item.categoria || '—'}</td>
                      <td>
                        <span className={`badge ${item.es_materia_prima ? 'badge-pendiente' : 'badge-en-progreso'}`}>
                          {item.es_materia_prima ? 'Materia Prima' : 'Crafteable'}
                        </span>
                      </td>
                      <td>
                        {stockEdit.id === item.id ? (
                          <div className="stock-control">
                            <input
                              type="number"
                              min="0"
                              value={stockEdit.value}
                              onChange={(e) => setStockEdit({ ...stockEdit, value: parseInt(e.target.value) || 0 })}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(item.id)}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStock(item.id)}>✓</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStockEdit({ id: null, value: 0 })}>✕</button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)', cursor: 'pointer',
                              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-primary)', border: '1px solid var(--border)',
                            }}
                            onClick={() => setStockEdit({ id: item.id, value: item.stock || 0 })}
                            title="Click para editar stock"
                          >
                            {item.stock !== undefined ? item.stock : '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.receta_matriz && item.receta_matriz.length === 9 ? (
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 18px)',
                            gap: '1px', width: 'fit-content'
                          }}>
                            {item.receta_matriz.map((slot, i) => (
                              <div key={i} style={{
                                width: '18px', height: '18px',
                                background: slot ? 'var(--accent-glow)' : 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '2px',
                                borderColor: slot ? 'var(--border-accent)' : 'var(--border)',
                              }} title={slot || 'vacío'} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-bar">
                          <button
                            className="btn-icon"
                            title="Editar crafteo (PUT)"
                            onClick={() => openCraftEditor(item)}
                          >🔧</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Crafting Editor Modal */}
      {showCraftEditor && (
        <Modal
          title={`Editar Crafteo — ${selectedItem?.nombre}`}
          onClose={() => setShowCraftEditor(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCraftEditor(false)}>Cancelar</button>
              <button className="btn btn-primary" form="craft-form">Guardar Crafteo</button>
            </>
          }
        >
          <form id="craft-form" onSubmit={handleUpdateCraft}>
            {/* 3x3 Grid */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Receta Matriz (3×3)
              </label>
              <div className="crafting-grid">
                {craftForm.receta_matriz.map((slot, i) => (
                  <input
                    key={i}
                    className={`crafting-slot ${slot ? 'filled' : ''}`}
                    value={slot || ''}
                    onChange={(e) => updateMatrizSlot(i, e.target.value)}
                    placeholder="—"
                    style={{ textAlign: 'center', border: '2px solid var(--border)', outline: 'none' }}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Posiciones: [0-2] fila superior, [3-5] central, [6-8] inferior
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Ingredientes para Cálculo
                </label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addIngrediente}>
                  + Agregar
                </button>
              </div>
              {craftForm.ingredientes_para_calculo.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sin ingredientes definidos</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {craftForm.ingredientes_para_calculo.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="form-control"
                        placeholder="item_id"
                        value={ing.item_id}
                        onChange={(e) => updateIngrediente(i, 'item_id', e.target.value)}
                        style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={ing.cantidad}
                        onChange={(e) => updateIngrediente(i, 'cantidad', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className="btn-icon danger" onClick={() => removeIngrediente(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
