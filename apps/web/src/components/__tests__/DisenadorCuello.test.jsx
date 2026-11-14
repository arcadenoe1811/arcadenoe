import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { disenoPorDefecto } from '@inventario/shared'
import DisenadorCuello from '../DisenadorCuello.jsx'
import { hexAHsl, hslAHex } from '../SelectorColorHex.jsx'

describe('conversion hex <-> hsl', () => {
  it('ida y vuelta conserva el color', () => {
    for (const hex of [
      '#662b67',
      '#1a1a2e',
      '#f1c40f',
      '#000000',
      '#ffffff',
      '#c8a415',
    ]) {
      expect(hslAHex(hexAHsl(hex))).toBe(hex)
    }
  })
})

/** Colores de "Colores por zona" disponibles para el diseno. */
const COLORES = [
  { hex: '#1a1a2e', nombre: 'azul marino', detalle: 'Color 1' },
  { hex: '#00ff00', nombre: 'verde', detalle: 'Color 2' },
]

describe('DisenadorCuello', () => {
  it('agrega una linea en medio del texto con un color del cuello', () => {
    const alCambiar = vi.fn()
    render(
      <DisenadorCuello
        valor={disenoPorDefecto({ texto: 'X' })}
        colores={COLORES}
        alCambiar={alCambiar}
      />,
    )
    const agregar = screen.getAllByRole('button', { name: '+ Agregar' })
    fireEvent.click(agregar[2])
    expect(alCambiar.mock.calls[0][0].medio).toEqual([
      { tipo: 'linea', pasadas: 4, color: '#1a1a2e', desplazamiento: 0 },
    ])
  })

  it('el selector de color solo ofrece los colores del cuello', () => {
    const alCambiar = vi.fn()
    render(
      <DisenadorCuello
        valor={disenoPorDefecto()}
        colores={COLORES}
        alCambiar={alCambiar}
      />,
    )
    fireEvent.click(screen.getByTitle('Color de fondo: azul marino'))
    const lista = within(screen.getByRole('listbox', { name: 'Color de fondo' }))
    expect(lista.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'azul marinoColor 1',
      'verdeColor 2',
    ])
    fireEvent.click(lista.getByRole('option', { name: /verde/ }))
    expect(alCambiar.mock.calls[0][0].fondo).toBe('#00ff00')
  })

  it('marca los colores que no están en "Colores por zona"', () => {
    render(
      <DisenadorCuello
        valor={disenoPorDefecto()}
        colores={COLORES}
        alCambiar={vi.fn()}
      />,
    )
    // Las letras por defecto (#f1c40f) no estan en la lista.
    expect(screen.getByTitle('Color del texto: fuera de Colores por zona')).toBeTruthy()
  })

  it('subir el texto aumenta el desplazamiento', () => {
    const alCambiar = vi.fn()
    render(<DisenadorCuello valor={disenoPorDefecto()} alCambiar={alCambiar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Subir el texto' }))
    expect(alCambiar.mock.calls[0][0].desplazamiento).toBe(1)
  })
})
