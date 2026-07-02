import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from './SessionContext';

const InventarioContext = createContext(null);

export function InventarioProvider({ children }) {
  const { user } = useSession();
  const [inventario, setInventario] = useState({});
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) { setInventario({}); return {}; }
    setLoading(true);
    try {
      const { ok, data } = await api('GET', '/usuarios/' + user.id);
      const inv = ok && data && data.inventario ? data.inventario : {};
      setInventario(inv);
      return inv;
    } catch {
      setInventario({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const setCantidad = useCallback(async (item_id, cantidad) => {
    if (!user) return false;
    const prev = inventario[item_id];
    setInventario((cur) => ({ ...cur, [item_id]: cantidad }));
    const revert = () => setInventario((cur) => {
      const next = { ...cur };
      if (prev === undefined) delete next[item_id]; else next[item_id] = prev;
      return next;
    });
    try {
      const { ok } = await api('PATCH', `/usuarios/${user.id}/inventario`, { item_id, cantidad });
      if (!ok) revert();
      return ok;
    } catch {
      revert();
      return false;
    }
  }, [user, inventario]);

  const addCantidad = useCallback(async (item_id, n) => {
    const current = inventario[item_id] || 0;
    return setCantidad(item_id, current + n);
  }, [inventario, setCantidad]);

  return (
    <InventarioContext.Provider value={{ inventario, reload, setCantidad, addCantidad, loading }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario() {
  return useContext(InventarioContext);
}
