import { useState, useEffect } from 'react';
import { proyectosApi } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function ProyectosView() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectItems, setProjectItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ nombre: '', categoria: '', cantidad: 1, es_materia_prima: false });
  const addToast = useToast();

  useEffect(() => {
    loadProyectos();
  }, []);

  async function loadProyectos() {
    setLoading(true);
    try {
      const data = await proyectosApi.getAll();
      setProyectos(data);
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // 2. GET /api/proyectos/:id/items
  async function loadProjectItems(project) {
    setSelectedProject(project);
    setLoadingItems(true);
    try {
      const items = await proyectosApi.getItems(project.id);
      setProjectItems(items);
    } catch (error) {
      addToast(error.message, 'error');
      setProjectItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  // 4. POST /api/proyectos/:id/items
  async function handleAddItem(e) {
    e.preventDefault();
    try {
      await proyectosApi.addItem(selectedProject.id, {
        ...itemForm,
        cantidad: Number(itemForm.cantidad),
      });
      addToast('Ítem creado y asignado al proyecto');
      setShowAddItem(false);
      setItemForm({ nombre: '', categoria: '', cantidad: 1, es_materia_prima: false });
      loadProjectItems(selectedProject);
      loadProyectos();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  // 10. DELETE /api/proyectos/:id/items/:item_id
  async function handleRemoveItem(itemId) {
    try {
      await proyectosApi.removeItem(selectedProject.id, itemId);
      addToast('Ítem removido del proyecto');
      loadProjectItems(selectedProject);
      loadProyectos();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-enter">
      <div className="grid-2">
        {/* Proyectos List */}
        <div className="card">
          <div className="card-header">
            <h2>📁 Proyectos</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {proyectos.length} total
            </span>
          </div>
          <div className="card-body" style={{ padding: '12px' }}>
            {proyectos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>No hay proyectos registrados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {proyectos.map((p) => (
                  <div
                    key={p.id}
                    className="project-card"
                    style={{
                      borderColor: selectedProject?.id === p.id ? 'var(--accent)' : undefined,
                      background: selectedProject?.id === p.id ? 'var(--accent-glow)' : undefined,
                    }}
                    onClick={() => loadProjectItems(p)}
                  >
                    <div className="project-card-header">
                      <h3>{p.nombre_proyecto}</h3>
                      <span className={`badge badge-${p.estado?.replace(' ', '-')}`}>
                        {p.estado}
                      </span>
                    </div>
                    <div className="project-meta">
                      <span>👤 {p.usuario_id?.substring(0, 12)}...</span>
                      <span>🎯 {p.objetivos?.length || 0} objetivos</span>
                    </div>
                    {p.objetivos && p.objetivos.length > 0 && (
                      <div className="objectives-list">
                        {p.objetivos.slice(0, 4).map((obj, i) => (
                          <span key={i} className="objective-tag">
                            {obj.item_id} ×{obj.cantidad}
                          </span>
                        ))}
                        {p.objetivos.length > 4 && (
                          <span className="objective-tag" style={{ color: 'var(--accent)' }}>
                            +{p.objetivos.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Items Detail Panel */}
        <div className="card">
          <div className="card-header">
            <h2>🎯 Ítems del Proyecto</h2>
            {selectedProject && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddItem(true)}>
                + Agregar Ítem
              </button>
            )}
          </div>
          <div className="card-body">
            {!selectedProject ? (
              <div className="empty-state">
                <div className="empty-icon">👈</div>
                <p>Selecciona un proyecto para ver sus ítems</p>
              </div>
            ) : loadingItems ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : projectItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>Este proyecto no tiene ítems asignados</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Ítem</th>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Tipo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {item.nombre || item.item_id}
                          <div className="mono" style={{ marginTop: '2px' }}>{item.item_id}</div>
                        </td>
                        <td>{item.categoria || '—'}</td>
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontWeight: 600,
                            color: 'var(--accent)', fontSize: '0.9rem'
                          }}>
                            ×{item.cantidad}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.es_materia_prima ? 'badge-pendiente' : 'badge-en-progreso'}`}>
                            {item.es_materia_prima ? 'Materia Prima' : 'Crafteable'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon danger"
                            title="Desvincular del proyecto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item.item_id);
                            }}
                          >🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <Modal
          title="Crear y Asignar Ítem al Proyecto"
          onClose={() => setShowAddItem(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Cancelar</button>
              <button className="btn btn-primary" form="add-item-form">Crear y Asignar</button>
            </>
          }
        >
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Proyecto: <strong style={{ color: 'var(--text-primary)' }}>{selectedProject?.nombre_proyecto}</strong>
          </p>
          <form id="add-item-form" onSubmit={handleAddItem}>
            <div className="form-group">
              <label>Nombre del Ítem</label>
              <input
                className="form-control"
                placeholder="ej: Pico de Diamante"
                value={itemForm.nombre}
                onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input
                className="form-control"
                placeholder="ej: herramientas, materias_primas"
                value={itemForm.categoria}
                onChange={(e) => setItemForm({ ...itemForm, categoria: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={itemForm.cantidad}
                onChange={(e) => setItemForm({ ...itemForm, cantidad: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={itemForm.es_materia_prima}
                  onChange={(e) => setItemForm({ ...itemForm, es_materia_prima: e.target.checked })}
                />
                Es materia prima
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
