import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const listarColores = vi.fn()
const guardarColor = vi.fn()
vi.mock('@inventario/shared', async (original) => ({
  ...(await original()),
  listarColores: (...a) => listarColores(...a),
  guardarColor: (...a) => guardarColor(...a),
}))

const { default: SelectorColorHex } = await import('../SelectorColorHex.jsx')
const { default: SelectorTono } = await import('../SelectorTono.jsx')

beforeEach(() => {
  listarColores.mockReset().mockResolvedValue([
    { id: '1', nombre: 'dorado', hex: '#c8a415' },
    { id: '2', nombre: 'sin tono', hex: null },
  ])
  guardarColor.mockReset().mockResolvedValue({ id: '3', nombre: 'menta', hex: '#3eb489' })
})

describe('SelectorColorHex', () => {
  it('muestra el codigo hex junto a la muestra', () => {
    render(<SelectorColorHex valor="#1a1a2e" etiqueta="Fondo" alCambiar={() => {}} />)
    expect(screen.getByText('#1a1a2e')).toBeInTheDocument()
  })

  it('elegir un color guardado y aceptar lo aplica', async () => {
    const alCambiar = vi.fn()
    render(<SelectorColorHex valor="#000000" etiqueta="Fondo" alCambiar={alCambiar} />)
    fireEvent.click(screen.getByTitle('Fondo: #000000'))
    fireEvent.click(await screen.findByRole('button', { name: 'dorado #c8a415' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))
    expect(alCambiar).toHaveBeenCalledWith('#c8a415')
  })

  it('guarda el color elegido en el catalogo con un nombre', async () => {
    render(<SelectorColorHex valor="#000000" etiqueta="Fondo" alCambiar={() => {}} />)
    fireEvent.click(screen.getByTitle('Fondo: #000000'))
    fireEvent.change(screen.getByRole('textbox', { name: /Hex/ }), {
      target: { value: '#3eb489' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar color #3eb489' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del color' }), {
      target: { value: 'menta' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(guardarColor).toHaveBeenCalledWith({ nombre: 'menta', hex: '#3eb489' }),
    )
    expect(await screen.findByText('Color guardado.')).toBeInTheDocument()
  })
})

describe('SelectorTono', () => {
  it('sin tono se ve vacio y al aceptar asigna el hex', () => {
    const alCambiar = vi.fn()
    render(<SelectorTono valor="" alCambiar={alCambiar} />)
    fireEvent.click(screen.getByTitle('Tono: sin color'))
    fireEvent.change(screen.getByRole('textbox', { name: /Hex/ }), {
      target: { value: '7ec8e3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))
    expect(alCambiar).toHaveBeenCalledWith('#7ec8e3')
  })
})
