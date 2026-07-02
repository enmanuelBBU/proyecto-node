import { useSession } from '../context/SessionContext';

export default function UserChip({ onOpenPerfil }) {
  const { user } = useSession();
  if (!user) return null;

  return (
    <div id="user-chip" style={{ display: 'flex' }} onClick={onOpenPerfil}>
      <span className="chip-avatar">👤</span>
      <span className="chip-name">{user.nombre || user.id}</span>
    </div>
  );
}
