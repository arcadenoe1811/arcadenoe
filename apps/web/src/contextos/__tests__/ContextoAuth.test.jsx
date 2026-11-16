import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import * as compartido from '@inventario/shared'
import { ProveedorAuth } from '../ContextoAuth.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import * as sesionLocal from '../../utils/sesionLocal.js'

vi.mock('@inventario/shared', async (importarOriginal) => ({
  ...(await importarOriginal()),
  obtenerCliente: vi.fn(() => ({})),
  obtenerSesion: vi.fn(),
  escucharCambiosSesion: vi.fn(() => () => {}),
  cerrarSesion: vi.fn(async () => ({ error: null })),
  iniciarSesion: vi.fn(),
  obtenerMiPerfil: vi.fn(),
}))

vi.mock('../../utils/sesionLocal.js', async (importarOriginal) => ({
  ...(await importarOriginal()),
  recargarEnLogin: vi.fn(),
}))

/**
 * Almacenamiento en memoria: el localStorage del entorno de pruebas no
 * siempre esta completo (depende de la version de Node y jsdom).
 */
function almacenEnMemoria() {
  const datos = new Map()
  return {
    getItem: (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItem: (clave, valor) => void datos.set(clave, String(valor)),
    removeItem: (clave) => void datos.delete(clave),
    clear: () => datos.clear(),
    key: (indice) => [...datos.keys()][indice] ?? null,
    get length() {
      return datos.size
    },
  }
}
for (const nombre of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(window, nombre, {
    value: almacenEnMemoria(),
    configurable: true,
  })
}

const CLAVE_ACTIVIDAD = 'inventario-ultima-actividad'
const HORA = 60 * 60 * 1000
const SESION = { access_token: 'token-1', user: { id: 'u1', email: 'ana@taller.com' } }
const PERFIL = {
  id: 'u1',
  nombre: 'Ana',
  rol: 'operador',
  activo: true,
  debe_cambiar_contrasena: false,
}

function Estado() {
  const { usuario, rol, cargando, puede } = useAuth()
  if (cargando) return <p>cargando</p>
  return (
    <p>
      {usuario ? `sesión de ${usuario.email} (${rol})` : 'sin sesión'}
      {puede('conos.eliminar') ? ' · elimina' : ' · no elimina'}
    </p>
  )
}

const montar = () =>
  render(
    <ProveedorAuth>
      <Estado />
    </ProveedorAuth>,
  )

/** Simula una sesion guardada en el navegador. */
function guardarSesion(ultimaActividad) {
  window.localStorage.setItem(compartido.CLAVE_SESION, JSON.stringify(SESION))
  if (ultimaActividad !== null)
    window.localStorage.setItem(CLAVE_ACTIVIDAD, String(ultimaActividad))
  compartido.obtenerSesion.mockResolvedValue({ sesion: SESION, error: null })
}

describe('ProveedorAuth', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.clearAllMocks()
    compartido.obtenerSesion.mockResolvedValue({ sesion: null, error: null })
    compartido.obtenerMiPerfil.mockResolvedValue(PERFIL)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sin sesión guardada no hay usuario ni permisos', async () => {
    montar()
    expect(await screen.findByText('sin sesión · no elimina')).toBeInTheDocument()
    expect(compartido.cerrarSesion).not.toHaveBeenCalled()
  })

  it('con sesión y actividad reciente carga el perfil y su rol', async () => {
    guardarSesion(Date.now() - 1 * HORA)
    montar()
    expect(
      await screen.findByText('sesión de ana@taller.com (operador) · no elimina'),
    ).toBeInTheDocument()
    expect(compartido.obtenerMiPerfil).toHaveBeenCalledWith('u1')
    expect(sesionLocal.recargarEnLogin).not.toHaveBeenCalled()
  })

  it('una sesión guardada sin actividad en 8 horas se cierra al abrir la app', async () => {
    guardarSesion(Date.now() - 9 * HORA)
    montar()
    await waitFor(() => expect(sesionLocal.recargarEnLogin).toHaveBeenCalled())
    expect(compartido.cerrarSesion).toHaveBeenCalled()
    expect(window.localStorage.getItem(compartido.CLAVE_SESION)).toBeNull()
    expect(window.localStorage.getItem(CLAVE_ACTIVIDAD)).toBeNull()
    expect(sesionLocal.leerAviso()).toMatch(/inactividad/)
    // Nunca llego a mostrarse como sesion iniciada.
    expect(screen.queryByText(/sesión de/)).not.toBeInTheDocument()
  })

  it('una sesión guardada sin registro de actividad tampoco se reutiliza', async () => {
    guardarSesion(null)
    montar()
    await waitFor(() => expect(sesionLocal.recargarEnLogin).toHaveBeenCalled())
    expect(compartido.cerrarSesion).toHaveBeenCalled()
  })

  it('con la app abierta, la sesión se cierra al pasar el límite de inactividad', async () => {
    guardarSesion(Date.now())
    montar()
    await screen.findByText(/sesión de ana@taller.com/)

    // Pasan 9 horas sin actividad (se simula moviendo el registro al pasado).
    window.localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now() - 9 * HORA))
    // Un clic despues del limite NO renueva la sesion: la cierra.
    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await waitFor(() => expect(sesionLocal.recargarEnLogin).toHaveBeenCalled())
    expect(compartido.cerrarSesion).toHaveBeenCalled()
    expect(sesionLocal.leerAviso()).toMatch(/inactividad/)
  })

  it('la actividad dentro del límite mantiene la sesión', async () => {
    const hace7h = Date.now() - 7 * HORA
    guardarSesion(hace7h)
    montar()
    await screen.findByText(/sesión de ana@taller.com/)
    await act(async () => {
      window.dispatchEvent(new Event('keydown'))
    })
    expect(Number(window.localStorage.getItem(CLAVE_ACTIVIDAD))).toBeGreaterThan(hace7h)
    expect(sesionLocal.recargarEnLogin).not.toHaveBeenCalled()
  })

  it('un usuario deshabilitado queda fuera aunque tenga sesión', async () => {
    guardarSesion(Date.now())
    compartido.obtenerMiPerfil.mockResolvedValue({ ...PERFIL, activo: false })
    montar()
    await waitFor(() => expect(sesionLocal.recargarEnLogin).toHaveBeenCalled())
    expect(compartido.cerrarSesion).toHaveBeenCalled()
    expect(sesionLocal.leerAviso()).toMatch(/no tiene acceso/)
    expect(screen.queryByText(/elimina$/)).not.toHaveTextContent('· elimina')
  })

  it('un usuario sin perfil queda fuera', async () => {
    guardarSesion(Date.now())
    compartido.obtenerMiPerfil.mockResolvedValue(null)
    montar()
    await waitFor(() => expect(sesionLocal.recargarEnLogin).toHaveBeenCalled())
  })

  it('el admin sí tiene el permiso de eliminar', async () => {
    guardarSesion(Date.now())
    compartido.obtenerMiPerfil.mockResolvedValue({ ...PERFIL, rol: 'admin' })
    montar()
    expect(
      await screen.findByText('sesión de ana@taller.com (admin) · elimina'),
    ).toBeInTheDocument()
  })
})
