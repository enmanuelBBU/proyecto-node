import { useEffect } from 'react';
import CrafteosPanel from './panel/CrafteosPanel';
import ConstruccionesPanel from './panel/ConstruccionesPanel';
import PerfilPanel from './panel/PerfilPanel';

const TITLES = {
  crafteos: { icon: '🪨', label: 'Crafteos' },
  construcciones: { icon: '🏗️', label: 'Construcciones' },
  perfil: { icon: '👤', label: 'Perfil' },
};

export default function Panel({ section, badge, onClose, onBadgeChange }) {
  useEffect(() => {
    if (!section) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [section, onClose]);

  if (!section) return null;
  const title = TITLES[section];

  return (
    <div id="panel-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="panel">
        <button id="panel-close" className="panel-close-btn" onClick={onClose}>X</button>
        <div id="panel-header">
          <h2 id="panel-title">{title.icon} {title.label}</h2>
          <span id="panel-badge">{badge}</span>
        </div>
        <div id="panel-content">
          {section === 'crafteos' && <CrafteosPanel onBadgeChange={onBadgeChange} />}
          {section === 'construcciones' && <ConstruccionesPanel onBadgeChange={onBadgeChange} />}
          {section === 'perfil' && <PerfilPanel />}
        </div>
      </div>
    </div>
  );
}
