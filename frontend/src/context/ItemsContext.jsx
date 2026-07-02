import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

const ItemsContext = createContext(null);

export function ItemsProvider({ children }) {
  const [items, setItems] = useState([]);

  const reload = useCallback(async () => {
    try {
      const { ok, data } = await api('GET', '/items');
      const list = ok && Array.isArray(data) ? data : [];
      setItems(list);
      return list;
    } catch {
      setItems([]);
      return [];
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <ItemsContext.Provider value={{ items, reload }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  return useContext(ItemsContext);
}
