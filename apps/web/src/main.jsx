import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configurarCliente } from '@inventario/shared';
import { aplicarTema } from './theme.js';
import App from './App.jsx';
import PantallaErrorConfiguracion from './components/PantallaErrorConfiguracion.jsx';
import './estilos.css';

aplicarTema();

const raiz = createRoot(document.getElementById('raiz'));

try {
  configurarCliente({
    url: import.meta.env.VITE_SUPABASE_URL,
    llaveAnonima: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
  console.log(`Inventario de cuellos iniciado (${import.meta.env.MODE}) contra ${import.meta.env.VITE_SUPABASE_URL}`);
  raiz.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
} catch (error) {
  raiz.render(<PantallaErrorConfiguracion error={error} />);
}
