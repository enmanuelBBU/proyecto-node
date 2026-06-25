import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/usuarios': 'Gestión de Usuarios',
  '/proyectos': 'Gestión de Proyectos',
  '/items': 'Items & Crafteo',
};

export default function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CraftBuild Manager';

  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-actions">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          🟢 Conectado
        </div>
      </div>
    </header>
  );
}
