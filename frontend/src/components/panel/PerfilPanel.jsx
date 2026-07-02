import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useSession } from '../../context/SessionContext';
import { useItems } from '../../context/ItemsContext';
import { useInventario } from '../../context/InventarioContext';
import { useToast } from '../Toast';
import { ResultBox, McIcon, MC_ICONS, InventoryGrid, SlotQuantityEditor, resolveEntries, iconFor } from './shared';

export default function PerfilPanel() {
  const { user, patchUser, logout } = useSession();
  const { items } = useItems();
  const { inventario, setCantidad, addCantidad } = useInventario();
  const showToast = useToast();
  const isAdmin = user && user.rol === 'admin';

  const [qty, setQty] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [editSlot, setEditSlot] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { ok, data } = await api('GET', '/usuarios/' + user.id);
        if (ok && data) patchUser({ nombre: data.nombre, email: data.email, rol: data.rol, fecha_registro: data.fecha_registro });
      } catch {
        // ignore
      }
    })();
  }, []);

  // Cambiar nombre
  const [pNombre, setPNombre] = useState('');
  const [rNombre, setRNombre] = useState(null);
  async function patchNombre() {
    if (!user) return showToast('Sin sesion', 'error');
    if (!pNombre.trim()) return showToast('Ingresa un nombre', 'error');
    try {
      const { ok, data } = await api('PATCH', '/usuarios/' + user.id, { nombre: pNombre.trim() });
      if (ok) { patchUser({ nombre: pNombre.trim() }); showToast('Nombre actualizado!', 'success'); }
      setRNombre({ type: ok ? 'success' : 'error', content: ok ? 'Nombre actualizado exitosamente!' : (data.error || 'Error') });
    } catch (e) {
      setRNombre({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Cambiar email
  const [pEmail, setPEmail] = useState('');
  const [rEmail, setREmail] = useState(null);
  async function patchEmail() {
    if (!user) return showToast('Sin sesion', 'error');
    if (!pEmail.trim()) return showToast('Ingresa un email', 'error');
    try {
      const { ok, data } = await api('PATCH', '/usuarios/' + user.id, { email: pEmail.trim() });
      if (ok) { patchUser({ email: pEmail.trim() }); showToast('Email actualizado!', 'success'); }
      setREmail({ type: ok ? 'success' : 'error', content: ok ? 'Email actualizado exitosamente!' : (data.error || 'Error') });
    } catch (e) {
      setREmail({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Cambiar password
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [rPassword, setRPassword] = useState(null);
  async function patchPassword() {
    if (!user) return showToast('Sin sesion', 'error');
    const actual = passActual.trim();
    const nueva = passNueva.trim();
    if (!actual || !nueva) return showToast('Ambos campos son obligatorios', 'error');
    if (nueva.length < 6) return showToast('La nueva contrasena debe tener al menos 6 caracteres', 'error');
    try {
      const { ok: okGet, data: current } = await api('GET', '/usuarios/' + user.id);
      if (!okGet) {
        setRPassword({ type: 'error', content: (current && current.error) || 'Error al verificar la contrasena actual' });
        return;
      }
      if (current.password !== actual) {
        setRPassword({ type: 'error', content: 'La contrasena actual no es correcta' });
        return;
      }
      const { ok, data } = await api('PATCH', '/usuarios/' + user.id, { password: nueva });
      setRPassword({ type: ok ? 'success' : 'error', content: ok ? 'Contrasena actualizada exitosamente!' : (data.error || 'Error') });
      if (ok) { showToast('Contrasena actualizada!', 'success'); setPassActual(''); setPassNueva(''); }
    } catch (e) {
      setRPassword({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Reemplazar perfil
  const [putNombre, setPutNombre] = useState('');
  const [putEmail, setPutEmail] = useState('');
  const [putFecha, setPutFecha] = useState('');
  const [rPut, setRPut] = useState(null);
  async function replaceUsuario() {
    if (!user) return showToast('Sin sesion', 'error');
    if (!putNombre.trim() || !putEmail.trim() || !putFecha) return showToast('Todos los campos son obligatorios', 'error');
    try {
      const { ok, data } = await api('PUT', '/usuarios/' + user.id, {
        nombre: putNombre.trim(), email: putEmail.trim(), fecha_registro: new Date(putFecha).toISOString(),
      });
      if (ok) { patchUser({ nombre: putNombre.trim(), email: putEmail.trim() }); showToast('Perfil reemplazado!', 'success'); }
      setRPut({ type: ok ? 'success' : 'error', content: ok ? data : (data.error || 'Error') });
    } catch (e) {
      setRPut({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  // Eliminar cuenta
  const [rDelete, setRDelete] = useState(null);
  async function deleteUsuario() {
    if (!user) return showToast('Sin sesion', 'error');
    if (!confirm('Eliminar tu cuenta y todos tus proyectos?')) return;
    try {
      const { ok, data } = await api('DELETE', '/usuarios/' + user.id);
      if (ok) { showToast('Cuenta eliminada', 'info'); logout(); return; }
      setRDelete({ type: 'error', content: data.error || 'Error' });
    } catch (e) {
      setRDelete({ type: 'error', content: 'Error: ' + e.message });
    }
  }

  function doLogout() {
    logout();
    showToast('Sesion cerrada', 'info');
  }

  // Admin
  const [adminUsers, setAdminUsers] = useState(null);
  async function loadAdminUsers() {
    if (!isAdmin) return showToast('Solo administradores', 'error');
    try {
      const { ok, data } = await api('GET', '/usuarios');
      setAdminUsers(ok && Array.isArray(data) ? data : []);
    } catch {
      setAdminUsers([]);
    }
  }
  async function adminDeleteUser(userId) {
    if (!isAdmin) return showToast('Solo administradores', 'error');
    if (!confirm('Eliminar este usuario y todos sus proyectos?')) return;
    try {
      const { ok, data } = await api('DELETE', '/usuarios/' + userId, { admin_id: user.id });
      if (ok) { showToast('Usuario eliminado!', 'success'); loadAdminUsers(); }
      else showToast(data.error || 'Error al eliminar', 'error');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  }

  const entries = resolveEntries(inventario, items);

  return (
    <>
      <div className="mc-card">
        <div className="mc-label">Mi Perfil</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0' }}>
          <div style={{ fontSize: '2.4rem' }}><McIcon id={MC_ICONS.perfil} fallback="👤" /></div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#FFF' }}>{user ? user.nombre : 'Invitado'}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--mc-text-muted)', marginTop: 4 }}>ID: {user ? user.id : '-'}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--mc-text-muted)' }}>Email: {user ? user.email : '-'}</div>
            {isAdmin && <div style={{ fontSize: '0.55rem', color: 'var(--mc-gold)' }}>Rol: ADMIN</div>}
          </div>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-label">Anadir Items</div>
        {!user ? (
          <div className="empty-state">Inicia sesion para gestionar tu inventario.</div>
        ) : (
          <>
            <div className="anadir-cols">
              <div>
                <h5>Tu Inventario</h5>
                <div
                  className={`inv-drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const itemId = e.dataTransfer.getData('text/plain');
                    const n = parseInt(qty);
                    if (!itemId) return;
                    if (!Number.isInteger(n) || n <= 0) { showToast('Ingresa una cantidad valida', 'error'); return; }
                    const ok = await addCantidad(itemId, n);
                    showToast(ok ? `+${n} agregado` : 'Error al agregar', ok ? 'success' : 'error');
                  }}
                >
                  <InventoryGrid entries={entries} onSlotClick={(id) => setEditSlot(id)} />
                </div>
              </div>
              <div>
                <h5>Catalogo ({items.length})</h5>
                <div className="jei-grid">
                  {items.map((it) => (
                    <div
                      className="jei-slot"
                      key={it.id}
                      draggable
                      title={it.nombre || it.id}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                    >
                      <span className="jei-icon"><McIcon id={iconFor({ full_id: it.full_id, es_materia_prima: it.es_materia_prima })} fallback={it.es_materia_prima ? '🪨' : '🔧'} /></span>
                      <span className="jei-name">{it.nombre || it.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mc-fld" style={{ marginTop: 10 }}>
              <label>Ingresar cantidad</label>
              <input className="mc-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            {editSlot && (
              <SlotQuantityEditor
                itemName={(entries.find((e) => e.item_id === editSlot) || {}).nombre || editSlot}
                cantidad={inventario[editSlot] || 0}
                onSave={async (n) => { await setCantidad(editSlot, n); setEditSlot(null); }}
                onCancel={() => setEditSlot(null)}
              />
            )}
          </>
        )}
      </div>

      <div className="mc-card">
        <div className="mc-label">Cambiar Nombre</div>
        <div className="mc-fld"><label>Nuevo Nombre</label>
          <input className="mc-input" placeholder={user ? user.nombre : ''} value={pNombre} onChange={(e) => setPNombre(e.target.value)} />
        </div>
        <button className="mc-btn gold wide" onClick={patchNombre}>Actualizar Nombre</button>
        <ResultBox result={rNombre} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Cambiar Email</div>
        <div className="mc-fld"><label>Nuevo Email</label>
          <input className="mc-input" placeholder={user ? user.email : ''} value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
        </div>
        <button className="mc-btn gold wide" onClick={patchEmail}>Actualizar Email</button>
        <ResultBox result={rEmail} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Cambiar Contrasena</div>
        <div className="mc-fld"><label>Contrasena Actual</label>
          <input className="mc-input" type="password" placeholder="******" value={passActual} onChange={(e) => setPassActual(e.target.value)} />
        </div>
        <div className="mc-fld"><label>Nueva Contrasena</label>
          <input className="mc-input" type="password" placeholder="Min. 6 caracteres" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
        </div>
        <button className="mc-btn gold wide" onClick={patchPassword}>Actualizar Contrasena</button>
        <ResultBox result={rPassword} />
      </div>

      <div className="mc-card">
        <div className="mc-label">Reemplazar Perfil Completo</div>
        <div className="mc-fld"><label>Nombre</label>
          <input className="mc-input" placeholder="Nuevo nombre" value={putNombre} onChange={(e) => setPutNombre(e.target.value)} />
        </div>
        <div className="mc-fld"><label>Email</label>
          <input className="mc-input" placeholder="nuevo@email.com" value={putEmail} onChange={(e) => setPutEmail(e.target.value)} />
        </div>
        <div className="mc-fld"><label>Fecha de Registro</label>
          <input className="mc-input" type="datetime-local" value={putFecha} onChange={(e) => setPutFecha(e.target.value)} />
        </div>
        <button className="mc-btn blue wide" onClick={replaceUsuario}>Reemplazar Todo</button>
        <ResultBox result={rPut} />
      </div>

      <div className="mc-card" style={{ borderColor: 'rgba(179,49,44,0.5)' }}>
        <div className="mc-label" style={{ color: 'var(--mc-red)' }}>Zona Peligrosa</div>
        <button className="mc-btn red wide" onClick={deleteUsuario}>Eliminar Mi Cuenta</button>
        <ResultBox result={rDelete} />
      </div>

      {isAdmin && (
        <div className="mc-card" style={{ borderColor: 'var(--mc-gold)' }}>
          <div className="mc-label" style={{ color: 'var(--mc-gold)' }}>Panel de Admin</div>
          {adminUsers && (
            adminUsers.length === 0
              ? <div className="empty-state">No hay usuarios</div>
              : (
                <>
                  <div style={{ marginBottom: 6, fontSize: '0.5rem', color: 'var(--mc-text-muted)' }}>Usuarios registrados:</div>
                  {adminUsers.map((u) => (
                    <div className="item-row" style={{ marginBottom: 4 }} key={u.id}>
                      <div className="item-icon"><McIcon id={MC_ICONS.perfil} fallback="👤" /></div>
                      <div className="item-detail" style={{ flex: 1 }}>
                        <div className="item-name">{u.nombre || '?'}</div>
                        <div className="item-meta">{u.id} | {u.email || ''}{u.rol === 'admin' ? ' | ADMIN' : ''}</div>
                      </div>
                      {u.id !== user.id && <button className="mc-btn red sm" onClick={() => adminDeleteUser(u.id)}>Eliminar</button>}
                    </div>
                  ))}
                </>
              )
          )}
          <button className="mc-btn gold wide" onClick={loadAdminUsers}>Cargar Usuarios</button>
        </div>
      )}

      <button className="mc-btn red wide" style={{ marginTop: 12 }} onClick={doLogout}>Cerrar Sesion</button>
    </>
  );
}
