import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/usuarios', icon: '👥', label: 'Usuarios' },
    { to: '/proyectos', icon: '📁', label: 'Proyectos' },
    { to: '/items', icon: '🧊', label: 'Items & Crafteo' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⛏️</div>
        <h1>CraftBuild</h1>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
