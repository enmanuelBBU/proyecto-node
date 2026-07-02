import { createContext, useContext, useCallback, useState } from 'react';

const SessionContext = createContext(null);

function loadStoredUser() {
  const raw = localStorage.getItem('craftbuild_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  const persist = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem('craftbuild_user', JSON.stringify(u));
    else localStorage.removeItem('craftbuild_user');
  }, []);

  const login = useCallback((data) => {
    persist({ id: data.id, nombre: data.nombre, email: data.email, rol: data.rol });
  }, [persist]);

  const register = useCallback((id, data) => {
    persist({ id, nombre: data.nombre, email: data.email, rol: data.rol });
  }, [persist]);

  const patchUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem('craftbuild_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => persist(null), [persist]);

  return (
    <SessionContext.Provider value={{ user, login, register, patchUser, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
