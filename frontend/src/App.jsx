import { SessionProvider } from './context/SessionContext';
import { ItemsProvider } from './context/ItemsContext';
import { InventarioProvider } from './context/InventarioContext';
import { ToastProvider } from './components/Toast';
import Hub from './Hub';

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <ItemsProvider>
          <InventarioProvider>
            <Hub />
          </InventarioProvider>
        </ItemsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
