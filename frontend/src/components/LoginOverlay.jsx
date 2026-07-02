import { useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../context/SessionContext';
import { useToast } from './Toast';

export default function LoginOverlay() {
  const { login, register } = useSession();
  const showToast = useToast();
  const [tab, setTab] = useState('existing');
  const [loginError, setLoginError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  function switchTab(next) {
    setLoginError('');
    setTab(next);
  }

  async function doLogin() {
    const email = loginEmail.trim();
    const password = loginPassword.trim();
    if (!email || !password) { setLoginError('Email y contrasena son obligatorios'); return; }
    try {
      const { ok, data } = await api('POST', '/login', { email, password });
      if (ok && data.data) {
        login(data.data);
        showToast('Bienvenido, ' + data.data.nombre + '!', 'success');
      } else {
        setLoginError(data.error || 'Credenciales invalidas');
      }
    } catch {
      setLoginError('Error de conexion');
    }
  }

  async function doRegister() {
    const nombre = regNombre.trim();
    const email = regEmail.trim();
    const password = regPassword.trim();
    if (!nombre || !email || !password) return showToast('Nombre, email y contrasena son obligatorios', 'error');
    if (password.length < 6) return showToast('La contrasena debe tener al menos 6 caracteres', 'error');
    try {
      const { ok, data } = await api('POST', '/usuarios', { nombre, email, password });
      if (ok && data.data) {
        register(data.id, data.data);
        showToast('Registrado! Bienvenido, ' + data.data.nombre + '!', 'success');
      } else {
        showToast(data.error || 'Error al registrar', 'error');
      }
    } catch {
      showToast('Error al conectar', 'error');
    }
  }

  return (
    <div id="login-overlay">
      <div className="login-card">
        <h2>CraftBuild</h2>
        <p className="login-sub">Selecciona como quieres ingresar</p>

        <div className="login-options">
          <button className={`login-opt-btn ${tab === 'existing' ? 'active' : ''}`} onClick={() => switchTab('existing')}>Usuario Registrado</button>
          <button className={`login-opt-btn ${tab === 'new' ? 'active' : ''}`} onClick={() => switchTab('new')}>Usuario Nuevo</button>
        </div>

        <div className={`login-section ${tab === 'existing' ? 'active' : ''}`}>
          <div className="mc-fld"><label>Email o Nombre</label>
            <input className="mc-input" placeholder="steve@craftbuild.mc o Steve" type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </div>
          <div className="mc-fld"><label>Contrasena</label>
            <input className="mc-input" placeholder="******" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          </div>
          <button className="mc-btn green wide" style={{ marginTop: 6 }} onClick={doLogin}>Iniciar Sesion</button>
          {loginError && <div className="mc-result visible error" style={{ marginTop: 4 }}>{loginError}</div>}
        </div>

        <div className={`login-section ${tab === 'new' ? 'active' : ''}`}>
          <div className="mc-fld"><label>Nombre</label>
            <input className="mc-input" placeholder="Steve" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} />
          </div>
          <div className="mc-fld"><label>Email</label>
            <input className="mc-input" placeholder="steve@craftbuild.mc" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          </div>
          <div className="mc-fld"><label>Contrasena</label>
            <input className="mc-input" placeholder="Min. 6 caracteres" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
          </div>
          <button className="mc-btn green wide" style={{ marginTop: 6 }} onClick={doRegister}>Registrarse</button>
        </div>
      </div>
    </div>
  );
}
