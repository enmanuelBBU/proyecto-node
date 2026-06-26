import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { ToastProvider } from './components/Toast';
import DashboardView from './pages/DashboardView';
import UsuariosView from './pages/UsuariosView';
import ProyectosView from './pages/ProyectosView';
import ItemsView from './pages/ItemsView';

export default function App() {
  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-wrapper">
          <TopBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/usuarios" element={<UsuariosView />} />
              <Route path="/proyectos" element={<ProyectosView />} />
              <Route path="/items" element={<ItemsView />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
