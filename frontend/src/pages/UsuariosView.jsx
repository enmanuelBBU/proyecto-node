import { useState, useEffect } from 'react';
import { usuariosApi } from '../services/api';
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
  const addToast = useToast();

  useEffect(() => {
    loadUsuarios();
  }, []);

  // No hay endpoint GET /api/usuarios (lista), así que cargamos desde proyectos o dejamos vacío
  // Usaremos búsqueda individual por ID
  async function loadUsuarios() {
    setLoading(false);
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
    </div>
  );
}
