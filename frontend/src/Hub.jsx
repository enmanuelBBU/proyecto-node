import { useEffect, useRef, useState } from 'react';
import Scene3D from './components/Scene3D';
import TitleBanner from './components/TitleBanner';
import UserChip from './components/UserChip';
import LoginOverlay from './components/LoginOverlay';
import Panel from './components/Panel';
import { useSession } from './context/SessionContext';
import { useToast } from './components/Toast';

export default function Hub() {
  const { user } = useSession();
  const showToast = useToast();
  const [section, setSection] = useState(null);
  const [badge, setBadge] = useState(0);
  const welcomedRef = useRef(false);

  useEffect(() => {
    if (welcomedRef.current) return;
    welcomedRef.current = true;
    if (user) showToast('Bienvenido de vuelta, ' + user.nombre + '!', 'info');
  }, []);

  useEffect(() => {
    if (!user) setSection(null);
  }, [user]);

  function openPanel(blockId) {
    setBadge(0);
    setSection(blockId);
  }

  return (
    <>
      <Scene3D onBlockClick={openPanel} />
      <TitleBanner />
      <UserChip onOpenPerfil={() => openPanel('perfil')} />
      {!user && <LoginOverlay />}
      <Panel section={section} badge={badge} onClose={() => setSection(null)} onBadgeChange={setBadge} />
    </>
  );
}
