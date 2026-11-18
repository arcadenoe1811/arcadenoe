import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { puede } from '@inventario/shared'
import RutaProtegida, { RUTA_CAMBIAR_CONTRASENA } from '../RutaProtegida.jsx'
import { useAuth } from '../../hooks/useAuth.js'

vi.mock('../../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

/** Estado de autenticacion simulado. */
function conAuth({ rol = null, cargando = false, perfil, errorPerfil = null } = {}) {
  const perfilFinal =
    perfil === undefined
      ? rol && {
          id: 'u1',
          nombre: 'Ana',
          rol,
          activo: true,
          debe_cambiar_contrasena: false,
        }
      : perfil
  useAuth.mockReturnValue({
    usuario: rol || perfil ? { id: 'u1', email: 'ana@taller.com' } : null,
    perfil: perfilFinal,
    cargando,
    errorPerfil,
    recargarPerfil: vi.fn(),
    cerrarSesion: vi.fn(),
    puede: (permiso) => puede(perfilFinal?.activo ? perfilFinal.rol : null, permiso),
  })
}

function montar(rutaInicial) {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route path="/login" element={<p>pantalla de login</p>} />
        <Route
          path={RUTA_CAMBIAR_CONTRASENA}
          element={
            <RutaProtegida>
              <p>cambiar contraseña</p>
            </RutaProtegida>
          }
        />
        <Route element={<RutaProtegida />}>
          <Route path="/" element={<p>inicio</p>} />
          <Route path="/conos" element={<p>conos</p>} />
          <Route element={<RutaProtegida permiso="usuarios.gestionar" />}>
            <Route path="/usuarios" element={<p>gestión de usuarios</p>} />
          </Route>
          <Route element={<RutaProtegida permiso="cuellos.editar" />}>
            <Route path="/cuellos/nuevo" element={<p>nuevo cuello</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RutaProtegida', () => {
  beforeEach(() => useAuth.mockReset())

  it.each(['/', '/conos', '/usuarios', '/cuellos/nuevo', RUTA_CAMBIAR_CONTRASENA])(
    'sin sesión, %s redirige a /login',
    (ruta) => {
      conAuth()
      montar(ruta)
      expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    },
  )

  it('mientras verifica la sesión no muestra el contenido', () => {
    conAuth({ rol: 'admin', cargando: true })
    montar('/conos')
    expect(screen.queryByText('conos')).not.toBeInTheDocument()
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument()
  })

  it('el admin entra a todo', () => {
    conAuth({ rol: 'admin' })
    montar('/usuarios')
    expect(screen.getByText('gestión de usuarios')).toBeInTheDocument()
  })

  it('el operador entra a conos pero no a usuarios ni a crear cuellos', () => {
    conAuth({ rol: 'operador' })
    const conos = montar('/conos')
    expect(screen.getByText('conos')).toBeInTheDocument()
    conos.unmount()

    const usuarios = montar('/usuarios')
    expect(screen.queryByText('gestión de usuarios')).not.toBeInTheDocument()
    expect(screen.getByText(/No tienes permiso/)).toBeInTheDocument()
    usuarios.unmount()

    montar('/cuellos/nuevo')
    expect(screen.queryByText('nuevo cuello')).not.toBeInTheDocument()
    expect(screen.getByText(/No tienes permiso/)).toBeInTheDocument()
  })

  it('un usuario deshabilitado no ve nada', () => {
    conAuth({
      perfil: {
        id: 'u1',
        nombre: 'Ana',
        rol: 'admin',
        activo: false,
        debe_cambiar_contrasena: false,
      },
    })
    montar('/conos')
    expect(screen.queryByText('conos')).not.toBeInTheDocument()
  })

  it('con contraseña temporal solo puede ir a cambiarla', () => {
    conAuth({
      perfil: {
        id: 'u1',
        nombre: 'Ana',
        rol: 'operador',
        activo: true,
        debe_cambiar_contrasena: true,
      },
    })
    montar('/conos')
    expect(screen.queryByText('conos')).not.toBeInTheDocument()
    expect(screen.getByText('cambiar contraseña')).toBeInTheDocument()
  })

  it('si no se puede leer el perfil, muestra el error y no el contenido', () => {
    conAuth({ perfil: null, rol: null, errorPerfil: { mensaje: 'Sin conexión.' } })
    useAuth.mockReturnValue({
      ...useAuth(),
      usuario: { id: 'u1', email: 'ana@taller.com' },
    })
    montar('/conos')
    expect(screen.queryByText('conos')).not.toBeInTheDocument()
    expect(screen.getByText(/No se pudo verificar tu usuario/)).toBeInTheDocument()
  })
})
