// Estilos base primero: los .css de cada componente (importados despues) los refinan.
import './estilos/variables.css'
import './estilos/global.css'
import './estilos/inventario.css'
import './estilos/conos.css'
import './estilos/modulos.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { configurarCliente } from '@inventario/shared'
import { ProveedorAuth } from './contextos/ContextoAuth.jsx'
import App from './App.jsx'
import PantallaErrorConfiguracion from './components/PantallaErrorConfiguracion.jsx'

const raiz = createRoot(document.getElementById('raiz'))

try {
  configurarCliente({
    url: import.meta.env.VITE_SUPABASE_URL,
    llaveAnonima: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })
  console.log(
    `Inventario de cuellos iniciado (${import.meta.env.MODE}) contra ${import.meta.env.VITE_SUPABASE_URL}`,
  )
  raiz.render(
    <StrictMode>
      <BrowserRouter>
        <ProveedorAuth>
          <App />
        </ProveedorAuth>
      </BrowserRouter>
    </StrictMode>,
  )
} catch (error) {
  raiz.render(<PantallaErrorConfiguracion error={error} />)
}
