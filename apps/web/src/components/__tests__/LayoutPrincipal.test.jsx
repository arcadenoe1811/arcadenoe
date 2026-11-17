import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { puede } from '@inventario/shared'
import LayoutPrincipal from '../LayoutPrincipal.jsx'
import { useAuth } from '../../hooks/useAuth.js'

vi.mock('../../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

function montar(rol, ruta = '/') {
  const cerrarSesion = vi.fn()
  useAuth.mockReturnValue({
    usuario: { id: 'u1', email: 'ana@taller.com' },
    perfil: { id: 'u1', nombre: 'Ana López', rol, activo: true },
    rol,
    puede: (permiso) => puede(rol, permiso),
    cerrarSesion,
  })
  const { container } = render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<LayoutPrincipal />}>
          <Route path="*" element={<p>contenido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return { cerrarSesion, container }
}
const enlace = (nombre) => screen.queryByRole('link', { name: nombre })

describe('LayoutPrincipal (menu lateral)', () => {
  it('el admin ve todas las secciones, incluida Usuarios', () => {
    montar('admin')
    for (const nombre of [
      'Dashboard',
      'Muestrario de colores',
      'Conos',
      'Registrar entrada',
      'Registrar salida',
      'Colores',
      'Catálogo de cuellos',
      'Diseños',
      'Producción',
      'Registrar venta',
      'Historial de ventas',
      'Estimador de costos',
      'Usuarios',
      'Reportes',
    ])
      expect(enlace(nombre)).toBeInTheDocument()
  })

  it('el operador no ve Usuarios, pero si ventas, estimador y reportes', () => {
    montar('operador')
    expect(enlace('Usuarios')).not.toBeInTheDocument()
    expect(enlace('Registrar venta')).toBeInTheDocument()
    expect(enlace('Estimador de costos')).toBeInTheDocument()
    expect(enlace('Reportes')).toBeInTheDocument()
  })

  it('muestra el nombre y el rol del usuario', () => {
    montar('operador')
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('Operador')).toBeInTheDocument()
  })

  it('marca solo el item de la ruta actual', () => {
    montar('admin', '/ventas/nueva')
    expect(enlace('Registrar venta')).toHaveAttribute('aria-current', 'page')
    expect(enlace('Historial de ventas')).not.toHaveAttribute('aria-current')
    expect(enlace('Dashboard')).not.toHaveAttribute('aria-current')
  })

  it('la ficha de un cono marca "Conos" y no "Registrar entrada"', () => {
    montar('admin', '/conos/abc')
    expect(enlace('Conos')).toHaveAttribute('aria-current', 'page')
    expect(enlace('Registrar entrada')).not.toHaveAttribute('aria-current')
  })

  it('el boton de hamburguesa abre y cierra el menu en movil', () => {
    montar('admin')
    const boton = screen.getByRole('button', { name: 'Abrir menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(boton)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument()
  })

  it('en escritorio el menu se oculta y se vuelve a mostrar', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    try {
      const { container } = montar('admin')
      const layout = container.querySelector('.layout')
      expect(layout).not.toHaveClass('layout-menu-oculto')

      fireEvent.click(screen.getByRole('button', { name: 'Ocultar menú' }))
      expect(layout).toHaveClass('layout-menu-oculto')

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
      expect(layout).not.toHaveClass('layout-menu-oculto')
    } finally {
      delete window.matchMedia
    }
  })

  it('cerrar sesion llama al cierre del contexto', () => {
    const { cerrarSesion } = montar('admin')
    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
  })
})
