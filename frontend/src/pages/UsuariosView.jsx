import { useState, useEffect } from 'react';
import { usuariosApi, itemsApi } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(null); // null | 'put' | 'patch'
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', fecha_registro: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  
  // Estados para Inventario
  const [items, setItems] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedUserInventory, setSelectedUserInventory] = useState(null);
  const [inventoryForm, setInventoryForm] = useState({});
  const [savingInventory, setSavingInventory] = useState(false);
  
  const addToast = useToast();

  useEffect(() => {
    loadUsuarios();
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await itemsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error al cargar items del catálogo:', error);
    }
  }

  // GET /api/usuarios
  async function loadUsuarios() {
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (error) {
      addToast('Error al cargar usuarios: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // 1. GET /api/usuarios/:id
  async function searchUser() {
    if (!searchId.trim()) return;
    try {
      const user = await usuariosApi.getById(searchId.trim());
      setSearchedUser(user);
      // Agregar a la lista si no existe
      setUsuarios(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev.map(u => u.id === user.id ? user : u);
        return [...prev, user];
      });
      addToast('Usuario encontrado');
    } catch (error) {
      addToast(error.message, 'error');
      setSearchedUser(null);
    }
  }

  // 3. POST /api/usuarios
  async function handleCreate(e) {
    e.preventDefault();
    try {
      const result = await usuariosApi.create(formData);
      setUsuarios(prev => [...prev, { id: result.id, ...result.data }]);
      addToast('Usuario registrado exitosamente');
      closeForm();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  // 5. PUT /api/usuarios/:id
  async function handleReplace(e) {
    e.preventDefault();
    try {
      const result = await usuariosApi.replace(currentUser.id, formData);
      setUsuarios(prev => prev.map(u => u.id === currentUser.id ? { id: currentUser.id, ...result.data } : u));
      addToast('Perfil reemplazado completamente');
      closeForm();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  // 7. PATCH /api/usuarios/:id
  async function handlePatch(e) {
    e.preventDefault();
    const updates = {};
    if (formData.nombre) updates.nombre = formData.nombre;
    if (formData.email) updates.email = formData.email;

    try {
      const result = await usuariosApi.update(currentUser.id, updates);
      setUsuarios(prev => prev.map(u => u.id === currentUser.id ? { id: currentUser.id, ...result.data } : u));
      addToast('Usuario actualizado parcialmente');
      closeForm();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  // 9. DELETE /api/usuarios/:id
  async function handleDelete(id) {
    try {
      const result = await usuariosApi.remove(id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      addToast(`${result.mensaje} (${result.proyectos_eliminados} proyectos eliminados)`);
      setDeleteConfirm(null);
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  function openInventory(user) {
    setSelectedUserInventory(user);
    setInventoryForm(user.inventario || {});
    setShowInventory(true);
  }

  function handleInventoryQtyChange(itemId, qty) {
    setInventoryForm(prev => ({
      ...prev,
      [itemId]: parseInt(qty) || 0
    }));
  }

  async function handleSaveInventory(e) {
    e.preventDefault();
    setSavingInventory(true);
    try {
      const userId = selectedUserInventory.id;
      const originalInv = selectedUserInventory.inventario || {};
      const updates = [];

      for (const item of items) {
        const originalQty = originalInv[item.id] || 0;
        const newQty = inventoryForm[item.id] || 0;
        if (originalQty !== newQty) {
          updates.push(usuariosApi.updateInventory(userId, item.id, newQty));
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      addToast('Inventario actualizado exitosamente');
      setShowInventory(false);
      setSelectedUserInventory(null);
      loadUsuarios();
    } catch (error) {
      addToast('Error al actualizar inventario: ' + error.message, 'error');
    } finally {
      setSavingInventory(false);
    }
  }

  function openCreate() {
    setFormData({ nombre: '', email: '', fecha_registro: '' });
    setEditMode(null);
    setCurrentUser(null);
    setShowForm(true);
  }

  function openEdit(user, mode) {
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
      fecha_registro: user.fecha_registro || '',
    });
    setEditMode(mode);
    setCurrentUser(user);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditMode(null);
    setCurrentUser(null);
    setFormData({ nombre: '', email: '', fecha_registro: '' });
  }

  function handleSubmit(e) {
    if (editMode === 'put') return handleReplace(e);
    if (editMode === 'patch') return handlePatch(e);
    return handleCreate(e);
  }

  const modalTitle = editMode === 'put' ? 'Reemplazar Usuario (PUT)' :
    editMode === 'patch' ? 'Editar Usuario (PATCH)' : 'Nuevo Usuario';

  return (
    <div className="page-enter">
      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Buscar Usuario por ID</label>
            <input
              className="form-control"
              placeholder="ej: bSn6YR8C3uw7gQCmcIYF"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>
          <button className="btn btn-primary" onClick={searchUser} style={{ marginBottom: 0 }}>
            🔍 Buscar
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="card">
        <div className="card-header">
          <h2>👥 Usuarios</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            + Nuevo Usuario
          </button>
        </div>
        <div className="card-body">
          {usuarios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>Busca un usuario por su ID para empezar</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id}>
                      <td><span className="mono">{user.id}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td style={{ fontSize: '0.8rem' }}>{user.fecha_registro}</td>
                      <td>
                        <div className="action-bar">
                          <button
                            className="btn-icon"
                            title="Ver Inventario (🎒)"
                            onClick={() => openInventory(user)}
                          >🎒</button>
                          <button
                            className="btn-icon"
                            title="Editar parcial (PATCH)"
                            onClick={() => openEdit(user, 'patch')}
                          >✏️</button>
                          <button
                            className="btn-icon"
                            title="Reemplazar completo (PUT)"
                            onClick={() => openEdit(user, 'put')}
                          >🔄</button>
                          <button
                            className="btn-icon danger"
                            title="Eliminar (DELETE)"
                            onClick={() => setDeleteConfirm(user)}
                          >🗑️</button>
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

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal
          title={modalTitle}
          onClose={closeForm}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
              <button className="btn btn-primary" form="user-form">
                {editMode ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </>
          }
        >
          <form id="user-form" onSubmit={handleSubmit}>
            {editMode === 'patch' && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                💡 Solo se enviarán los campos que modifiques.
              </p>
            )}
            <div className="form-group">
              <label>Nombre</label>
              <input
                className="form-control"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required={editMode !== 'patch'}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={editMode !== 'patch'}
              />
            </div>
            {editMode === 'put' && (
              <div className="form-group">
                <label>Fecha de Registro</label>
                <input
                  className="form-control"
                  placeholder="2026-06-25T12:00:00Z"
                  value={formData.fecha_registro}
                  onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                  required
                />
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal
          title="⚠️ Confirmar Eliminación"
          onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>
                Eliminar Usuario
              </button>
            </>
          }
        >
          <p style={{ marginBottom: '12px' }}>
            ¿Estás seguro de eliminar a <strong>{deleteConfirm.nombre}</strong>?
          </p>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.82rem', color: 'var(--danger)'
          }}>
            ⚠️ Se eliminarán en cascada todos los proyectos asociados a este usuario.
          </div>
        </Modal>
      )}

      {/* Inventory Modal */}
      {showInventory && selectedUserInventory && (
        <Modal
          title={`🎒 Inventario de ${selectedUserInventory.nombre}`}
          onClose={() => {
            setShowInventory(false);
            setSelectedUserInventory(null);
          }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => {
                setShowInventory(false);
                setSelectedUserInventory(null);
              }} disabled={savingInventory}>
                Cancelar
              </button>
              <button className="btn btn-primary" form="inventory-form" disabled={savingInventory}>
                {savingInventory ? 'Guardando...' : 'Guardar Inventario'}
              </button>
            </>
          }
        >
          <form id="inventory-form" onSubmit={handleSaveInventory}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ajusta las cantidades de los ítems en el inventario del usuario.
            </p>
            {items.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay ítems en el catálogo para asignar.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {items.map((item) => {
                  const qty = inventoryForm[item.id] || 0;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id} | {item.categoria || 'Sin categoría'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          style={{ width: '80px', textAlign: 'center', padding: '4px 8px', marginBottom: 0 }}
                          value={qty}
                          onChange={(e) => handleInventoryQtyChange(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
