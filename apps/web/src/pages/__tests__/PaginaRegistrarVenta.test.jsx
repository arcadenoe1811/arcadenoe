import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaRegistrarVenta from '../PaginaRegistrarVenta.jsx'

const ID = '11111111-2222-4333-8444-555555555555'
const api = vi.hoisted(() => ({
  disenos: [],
  rpc: vi.fn(),
}))

// Solo se simula el acceso a la base (cliente de Supabase y lecturas); las
// validaciones y los calculos son los reales.
vi.mock('../../../../../packages/shared/api/cliente.js', async (original) => ({
  ...(await original()),
  obtenerCliente: () => ({ rpc: api.rpc }),
}))
vi.mock('../../hooks/useDisenos.js', () => ({
  useDisenos: () => ({ disenos: api.disenos, cargando: false, error: null }),
}))

const montar = async () => {
  render(
    <MemoryRouter>
      <PaginaRegistrarVenta />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: 'Registrar venta' })
}

describe('PaginaRegistrarVenta', () => {
  beforeEach(() => {
    api.rpc.mockReset().mockResolvedValue({ data: 'venta-1', error: null })
    api.disenos = [
      {
        id: ID,
        pieza: 'cuello',
        codigo: 'maz4',
        nombre: null,
        medidas: [16],
        precio_base: 25.5,
      },
    ]
  })

  it('llena el precio del diseno, y calcula el total al escribir su código', async () => {
    await montar()
    fireEvent.change(screen.getByLabelText('Diseño'), { target: { value: 'maz4' } })
    expect(screen.getByLabelText('Precio unitario (Q.)')).toHaveValue('25.5')

    fireEvent.change(screen.getByLabelText('Medida'), { target: { value: '16' } })
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })

    expect(
      screen.getByRole('button', { name: /Registrar venta · Q\. 76[.,]50/ }),
    ).toBeInTheDocument()
  })

  it('registra la venta bajo pedido, sin verificar existencia', async () => {
    await montar()
    fireEvent.change(screen.getByLabelText('Diseño'), { target: { value: 'maz4' } })
    fireEvent.change(screen.getByLabelText('Medida'), { target: { value: '16' } })
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrar venta ·/ }))

    await waitFor(() => expect(api.rpc).toHaveBeenCalledTimes(1))
    const [funcion, parametros] = api.rpc.mock.calls[0]
    expect(funcion).toBe('fn_registrar_venta')
    expect(parametros.p_lineas).toEqual([
      { cuello_id: ID, talla: '16', cantidad: 3, precio_unitario: 25.5 },
    ])
    expect(await screen.findByText(/Venta registrada/)).toBeInTheDocument()
  })

  it('no envia nada si falta el diseno o la cantidad no es valida', async () => {
    await montar()
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrar venta ·/ }))

    expect(await screen.findByText('Elige el diseño.')).toBeInTheDocument()
    expect(screen.getByText('Escribe la cantidad.')).toBeInTheDocument()
    expect(api.rpc).not.toHaveBeenCalled()
  })
})
