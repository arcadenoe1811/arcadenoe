import { describe, it, expect } from 'vitest'
import {
  errorFechaRegistro,
  medidaEnDiseno,
  medidasDelDiseno,
  medidasNoDisponibles,
  normalizarTallaVenta,
  tallasSugeridas,
  totalesVenta,
  validarEstimacion,
  validarPrecioBase,
  validarProduccion,
  validarProduccionDirigida,
  validarVenta,
} from '../ventas/validaciones.js'
import { resumenVentas } from '../ventas/api.js'
import {
  OPCIONES_ESTADO_VENTA,
  estaEntregada,
  formatearEstadoVenta,
  pendienteDeEntregar,
  tonoEstadoVenta,
} from '../ventas/constantes.js'
import {
  calcularEstimacion,
  costoPromedioCono,
  formatearDuracion,
} from '../estimador/calculos.js'
import { puede } from '../usuarios/permisos.js'

const ID = '11111111-2222-4333-8444-555555555555'
const HOY = '2026-11-16'

describe('tallas', () => {
  it('normaliza a mayusculas sin espacios sobrantes', () => {
    expect(normalizarTallaVenta('  m ')).toBe('M')
    expect(normalizarTallaVenta('pg')).toBe('PG')
    expect(normalizarTallaVenta(null)).toBe('')
  })

  it('sugiere primero las medidas del diseño y luego el resto (10 a 20)', () => {
    const medidas = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
    expect(tallasSugeridas({ pieza: 'cuello', medidas: [18, 16] })).toEqual([
      '16',
      '18',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '17',
      '19',
      '20',
    ])
    expect(tallasSugeridas(null)).toEqual(medidas)
    expect(tallasSugeridas({ pieza: 'cuello', medidas: null })).toEqual(medidas)
  })

  it('un puño sugiere sus tallas primero y luego PP..PEX', () => {
    expect(tallasSugeridas({ pieza: 'puno', tallas: ['pg', 'pex'] })).toEqual([
      'PG',
      'PEX',
      'PP',
      'PEE',
    ])
    expect(tallasSugeridas({ pieza: 'puno', tallas: null })).toEqual([
      'PP',
      'PG',
      'PEE',
      'PEX',
    ])
  })
})

describe('medidas vinculadas al diseño', () => {
  const cuello = { pieza: 'cuello', codigo: 'atl03', medidas: [18, 17, 16] }
  const puno = { pieza: 'puno', codigo: 'maz4t5', tallas: ['pg', 'pee', 'pex'] }

  it('medidasDelDiseno: medidas del cuello o tallas del puño, normalizadas', () => {
    expect(medidasDelDiseno(cuello)).toEqual(['16', '17', '18'])
    expect(medidasDelDiseno(puno)).toEqual(['PG', 'PEE', 'PEX'])
    expect(medidasDelDiseno(null)).toEqual([])
  })

  it('medidaEnDiseno distingue las del diseño de las de bajo pedido', () => {
    expect(medidaEnDiseno(cuello, '17')).toBe(true)
    expect(medidaEnDiseno(cuello, '12')).toBe(false)
    expect(medidaEnDiseno(puno, 'pg')).toBe(true)
    expect(medidaEnDiseno(puno, 'pp')).toBe(false)
  })

  it('medidasNoDisponibles lista las que hay que tejer (dedupe), no las del diseño', () => {
    const disenos = new Map([
      ['c', cuello],
      ['p', puno],
    ])
    const fuera = medidasNoDisponibles(
      [
        { cuello_id: 'c', talla: '17' }, // del diseño -> no
        { cuello_id: 'c', talla: '12' }, // bajo pedido
        { cuello_id: 'c', talla: '12' }, // repetida -> una vez
        { cuello_id: 'p', talla: 'pp' }, // bajo pedido (puño)
        { cuello_id: 'c', talla: '' }, // sin medida -> no
        { cuello_id: '', talla: '15' }, // sin diseño -> no
      ],
      disenos,
    )
    expect(fuera).toEqual([
      { cuello_id: 'c', codigo: 'atl03', pieza: 'cuello', talla: '12' },
      { cuello_id: 'p', codigo: 'maz4t5', pieza: 'puno', talla: 'PP' },
    ])
  })
})

describe('estados de venta', () => {
  it('etiqueta y tono (color) de cada estado', () => {
    expect(formatearEstadoVenta('pendiente')).toBe('Pendiente')
    expect(formatearEstadoVenta('en_produccion')).toBe('En producción')
    expect(formatearEstadoVenta('listo')).toBe('Listo')
    expect(formatearEstadoVenta('entregado')).toBe('Entregado')
    expect(formatearEstadoVenta('entregado_parcial')).toBe('Entregado parcial')
    expect(formatearEstadoVenta('x')).toBe('—')
    expect(tonoEstadoVenta('pendiente')).toBe('rojo')
    expect(tonoEstadoVenta('en_produccion')).toBe('ambar')
    expect(tonoEstadoVenta('listo')).toBe('verde')
    expect(tonoEstadoVenta('entregado')).toBe('gris')
  })

  it('entregada vs pendiente de entregar', () => {
    expect(estaEntregada('entregado')).toBe(true)
    expect(estaEntregada('entregado_parcial')).toBe(true)
    expect(estaEntregada('listo')).toBe(false)
    // "Pendiente de entregar" = todo lo que no es entrega total.
    expect(pendienteDeEntregar('pendiente')).toBe(true)
    expect(pendienteDeEntregar('en_produccion')).toBe(true)
    expect(pendienteDeEntregar('listo')).toBe(true)
    expect(pendienteDeEntregar('entregado_parcial')).toBe(true)
    expect(pendienteDeEntregar('entregado')).toBe(false)
  })

  it('el filtro incluye "Todos" y los cinco estados', () => {
    expect(OPCIONES_ESTADO_VENTA.map((o) => o.valor)).toEqual([
      '',
      'pendiente',
      'en_produccion',
      'listo',
      'entregado_parcial',
      'entregado',
    ])
  })
})

describe('errorFechaRegistro', () => {
  it('acepta hoy y fechas pasadas', () => {
    expect(errorFechaRegistro(HOY, HOY)).toBeNull()
    expect(errorFechaRegistro('2026-01-31', HOY)).toBeNull()
  })
  it('rechaza futuras, inexistentes y vacias', () => {
    expect(errorFechaRegistro('2026-11-17', HOY)).toMatch(/futura/)
    expect(errorFechaRegistro('2026-02-30', HOY)).toMatch(/no existe/)
    expect(errorFechaRegistro('', HOY)).toBeTruthy()
    expect(errorFechaRegistro("2026-11-16'; drop table ventas;--", HOY)).toBeTruthy()
  })
})

describe('validarVenta', () => {
  const venta = { fecha: HOY, cliente: '  Ana  ', metodo_pago: 'efectivo', notas: '' }
  const linea = { cuello_id: ID, talla: 'm', cantidad: '3', precio_unitario: '25,50' }

  it('convierte un formulario valido', () => {
    const r = validarVenta(venta, [linea], HOY)
    expect(r.valido).toBe(true)
    expect(r.datos.venta).toEqual({
      fecha: HOY,
      cliente: 'Ana',
      metodo_pago: 'efectivo',
      notas: null,
    })
    expect(r.datos.lineas).toEqual([
      { cuello_id: ID, talla: 'M', cantidad: 3, precio_unitario: 25.5 },
    ])
  })

  it('exige al menos una linea', () => {
    expect(validarVenta(venta, [], HOY).errores.lineas).toBeTruthy()
  })

  it('rechaza cantidades y precios negativos, cero o no numericos', () => {
    const r = validarVenta(
      venta,
      [
        { ...linea, cantidad: '0' },
        { ...linea, cantidad: '-2' },
        { ...linea, cantidad: '1.5' },
        { ...linea, precio_unitario: '-1' },
        { ...linea, precio_unitario: 'abc' },
        { ...linea, cuello_id: '', talla: '' },
      ],
      HOY,
    )
    expect(r.valido).toBe(false)
    expect(r.errores['lineas.0.cantidad']).toBeTruthy()
    expect(r.errores['lineas.1.cantidad']).toBeTruthy()
    expect(r.errores['lineas.2.cantidad']).toBeTruthy()
    expect(r.errores['lineas.3.precio_unitario']).toBeTruthy()
    expect(r.errores['lineas.4.precio_unitario']).toBeTruthy()
    expect(r.errores['lineas.5.cuello_id']).toBeTruthy()
    expect(r.errores['lineas.5.talla']).toBeTruthy()
  })

  it('acepta precio 0 (regalo) y rechaza metodo de pago desconocido', () => {
    expect(validarVenta(venta, [{ ...linea, precio_unitario: '0' }], HOY).valido).toBe(
      true,
    )
    expect(
      validarVenta({ ...venta, metodo_pago: 'bitcoin' }, [linea], HOY).errores
        .metodo_pago,
    ).toBeTruthy()
  })

  it('limita el largo del cliente y de las notas', () => {
    const r = validarVenta(
      { ...venta, cliente: 'x'.repeat(121), notas: 'y'.repeat(1001) },
      [linea],
      HOY,
    )
    expect(r.errores.cliente).toBeTruthy()
    expect(r.errores.notas).toBeTruthy()
  })
})

describe('totalesVenta', () => {
  it('suma subtotales e ignora lineas incompletas', () => {
    const r = totalesVenta([
      { cantidad: '2', precio_unitario: '10.10' },
      { cantidad: '3', precio_unitario: '5' },
      { cantidad: '', precio_unitario: '5' },
      { cantidad: '2', precio_unitario: 'x' },
    ])
    expect(r.subtotales).toEqual([20.2, 15, 0, 0])
    expect(r.unidades).toBe(5)
    expect(r.total).toBe(35.2)
  })
})

describe('validarProduccion y validarPrecioBase', () => {
  it('produccion valida', () => {
    const r = validarProduccion(
      { fecha: HOY, cuello_id: ID, talla: 's', cantidad: '12' },
      HOY,
    )
    expect(r.valido).toBe(true)
    expect(r.datos).toEqual({
      fecha: HOY,
      cuello_id: ID,
      talla: 'S',
      cantidad: 12,
      notas: null,
    })
  })
  it('produccion sin diseno ni cantidad', () => {
    const r = validarProduccion(
      { fecha: HOY, cuello_id: '', talla: '', cantidad: '' },
      HOY,
    )
    expect(Object.keys(r.errores).sort()).toEqual(['cantidad', 'cuello_id', 'talla'])
  })
  it('precio base: vacio = sin precio; negativo invalido', () => {
    expect(validarPrecioBase('').datos).toBeNull()
    expect(validarPrecioBase('45,5').datos).toBe(45.5)
    expect(validarPrecioBase('-1').valido).toBe(false)
  })

  it('producción dirigida: válida con línea de venta; falla sin línea o cantidad', () => {
    const ok = validarProduccionDirigida(
      { venta_linea_id: ID, fecha: HOY, cantidad: '3', notas: ' hechos ' },
      HOY,
    )
    expect(ok.valido).toBe(true)
    expect(ok.datos).toEqual({
      venta_linea_id: ID,
      fecha: HOY,
      cantidad: 3,
      notas: 'hechos',
    })
    const mal = validarProduccionDirigida(
      { venta_linea_id: 'x', fecha: HOY, cantidad: '0' },
      HOY,
    )
    expect(mal.errores.venta_linea_id).toBeTruthy()
    expect(mal.errores.cantidad).toBeTruthy()
  })
})

describe('estimador', () => {
  // Ejemplo del requerimiento: A-S 10 x 0.5 x 25; A-M 15 x 0.7 x 30; B-L 5 x 1.0 x 40
  const lineas = [
    {
      cuello_id: ID,
      talla: 'S',
      cantidad: '10',
      conos_por_unidad: '0.5',
      minutos_por_unidad: '25',
    },
    {
      cuello_id: ID,
      talla: 'M',
      cantidad: '15',
      conos_por_unidad: '0,7',
      minutos_por_unidad: '30',
    },
    {
      cuello_id: ID,
      talla: 'L',
      cantidad: '5',
      conos_por_unidad: '1',
      minutos_por_unidad: '40',
    },
  ]

  it('calcula conos, tiempo y costos', () => {
    const r = calcularEstimacion(lineas, { costoCono: '40', tarifaHora: '30' })
    expect(r.unidades).toBe(30)
    expect(r.conos).toBe(20.5)
    expect(r.minutos).toBe(900)
    expect(r.costoMaterial).toBe(820)
    expect(r.costoManoObra).toBe(450)
    expect(r.costoTotal).toBe(1270)
    expect(r.costoPorUnidad).toBe(42.33)
  })

  it('sin lineas o con datos incompletos da ceros (no NaN)', () => {
    const r = calcularEstimacion([{ cantidad: '', conos_por_unidad: 'x' }], {
      costoCono: '',
      tarifaHora: null,
    })
    expect(r).toMatchObject({ unidades: 0, conos: 0, costoTotal: 0, costoPorUnidad: 0 })
  })

  it('costo promedio ponderado por existencias, solo conos activos con costo', () => {
    expect(
      costoPromedioCono([
        { stock_actual: 10, costo_por_cono: 30 },
        { stock_actual: 30, costo_por_cono: 50 },
        { stock_actual: 99, costo_por_cono: null },
        { stock_actual: 99, costo_por_cono: 1, activo: false },
      ]),
    ).toBe(45)
    expect(
      costoPromedioCono([
        { stock_actual: 0, costo_por_cono: 20 },
        { stock_actual: 0, costo_por_cono: 30 },
      ]),
    ).toBe(25)
    expect(costoPromedioCono([])).toBe(0)
  })

  it('formatea la duracion en horas y minutos', () => {
    expect(formatearDuracion(900)).toBe('15 h')
    expect(formatearDuracion(250)).toBe('4 h 10 min')
    expect(formatearDuracion(45)).toBe('45 min')
    expect(formatearDuracion(-5)).toBe('0 min')
  })

  it('valida la estimacion', () => {
    const ok = validarEstimacion(
      { tarifa_hora: '30', costo_cono: '40', nombre: ' Pedido ' },
      lineas,
    )
    expect(ok.valido).toBe(true)
    expect(ok.datos.estimacion).toEqual({
      nombre: 'Pedido',
      notas: null,
      tarifa_hora: 30,
      costo_cono: 40,
    })
    expect(ok.datos.lineas[1].conos_por_unidad).toBe(0.7)

    const mal = validarEstimacion({ tarifa_hora: '-1', costo_cono: '' }, [
      { ...lineas[0], minutos_por_unidad: '-3' },
    ])
    expect(mal.errores.tarifa_hora).toBeTruthy()
    expect(mal.errores.costo_cono).toBeTruthy()
    expect(mal.errores['lineas.0.minutos_por_unidad']).toBeTruthy()
  })
})

describe('resumenVentas', () => {
  it('total, unidades y ticket promedio', () => {
    expect(
      resumenVentas([
        { total: '100.50', total_unidades: 4 },
        { total: 50, total_unidades: 1 },
      ]),
    ).toEqual({ ventas: 2, unidades: 5, total: 150.5, ticketPromedio: 75.25 })
    expect(resumenVentas([]).ticketPromedio).toBe(0)
  })
})

describe('permisos de los modulos nuevos', () => {
  it('el operador registra ventas, estima, produce y ve reportes', () => {
    for (const p of [
      'dashboard.ver',
      'reportes.ver',
      'ventas.ver',
      'ventas.registrar',
      'estimador.usar',
      'produccion.registrar',
    ])
      expect(puede('operador', p)).toBe(true)
  })
  it('el operador no elimina ni cambia precios o configuracion', () => {
    for (const p of [
      'ventas.eliminar',
      'estimaciones.eliminar',
      'produccion.eliminar',
      'precios.editar',
      'configuracion.editar',
      'usuarios.gestionar',
    ]) {
      expect(puede('operador', p)).toBe(false)
      expect(puede('admin', p)).toBe(true)
    }
  })
})
