import { useState, useEffect } from 'react';
import { proyectosApi, itemsApi, datosApi } from '../services/api';

export default function DashboardView() {
  const [stats, setStats] = useState({
    proyectos: 0,
    items: 0,
    conexion: false,
  });
  const [proyectos, setProyectos] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [proyectosData, itemsData, conexion] = await Promise.all([
        proyectosApi.getAll(),
        itemsApi.getAll(),
        datosApi.checkConnection().then(() => true).catch(() => false),
      ]);

      setProyectos(proyectosData);
      setItems(itemsData);
      setStats({
        proyectos: proyectosData.length,
        items: itemsData.length,
        conexion,
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const pendientes = proyectos.filter(p => p.estado === 'pendiente').length;
  const enProgreso = proyectos.filter(p => p.estado === 'en progreso').length;
  const completados = proyectos.filter(p => p.estado === 'completado').length;

  return (
    <div className="page-enter">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent)' }}>
            🔗
          </div>
          <div className="stat-value" style={{ color: stats.conexion ? 'var(--accent)' : 'var(--danger)' }}>
            {stats.conexion ? 'Online' : 'Offline'}
          </div>
          <div className="stat-label">Estado de la API</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--info)' }}>
            📁
          </div>
          <div className="stat-value">{stats.proyectos}</div>
          <div className="stat-label">Proyectos Totales</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }}>
            🧊
          </div>
          <div className="stat-value">{stats.items}</div>
          <div className="stat-label">Items Registrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent)' }}>
            ✅
          </div>
          <div className="stat-value">{completados}</div>
          <div className="stat-label">Proyectos Completados</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>📁 Proyectos Recientes</h2>
          </div>
          <div className="card-body">
            {proyectos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>No hay proyectos registrados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {proyectos.slice(0, 5).map((p) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.nombre_proyecto}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.objetivos?.length || 0} objetivos
                      </div>
                    </div>
                    <span className={`badge badge-${p.estado?.replace(' ', '-')}`}>
                      {p.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🧊 Items del Catálogo</h2>
          </div>
          <div className="card-body">
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧊</div>
                <p>No hay ítems registrados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.slice(0, 15).map((item) => (
                  <span key={item.id} className="objective-tag">
                    {item.nombre}
                  </span>
                ))}
                {items.length > 15 && (
                  <span className="objective-tag" style={{ color: 'var(--accent)' }}>
                    +{items.length - 15} más
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>📊 Resumen por Estado</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '16px', background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--warning)' }}>{pendientes}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pendientes</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '16px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--info)' }}>{enProgreso}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>En Progreso</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>{completados}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Completados</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
