import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), message, type });
    timeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast ${toast ? toast.type : ''} ${toast ? '' : 'hidden'}`}>
        {toast ? toast.message : ''}
      </div>
    </ToastContext.Provider>
  );
}
