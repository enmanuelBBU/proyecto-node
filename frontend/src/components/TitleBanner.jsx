import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function TitleBanner() {
  const [status, setStatus] = useState('ok');

  useEffect(() => {
    async function checkServer() {
      try {
        const { data } = await api('GET', '/datos');
        setStatus(data.estado === 'OK' ? 'ok' : 'err');
      } catch {
        setStatus('err');
      }
    }
    checkServer();
    const id = setInterval(checkServer, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div id="title-banner">
      <h1>CraftBuild</h1>
      <span id="hud-status" className={`hud-dot ${status}`}></span>
    </div>
  );
}
