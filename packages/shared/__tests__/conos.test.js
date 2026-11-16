import { describe, it, expect } from 'vitest'
import {
  leerDecimal,
  normalizarCodigoCono,
  validarCono,
  validarMovimiento,
} from '../conos/validaciones.js'
import {
  agruparConos,
  estadoCono,
  existenciaDeColor,
  filtrarConos,
  resumenInventario,
  valoresDistintos,
} from '../conos/inventario.js'
import { contrasteSobre, sugerirFamiliaColor } from '../conos/familias.js'
import { cantidadConSigno, formatearPeso } from '../conos/formato.js'

const ID = '11111111-1111-4111-8111-111111111111'

const cono = (datos) => ({
  id: datos.codigo,
  activo: true,
  stock_minimo: 0,
  costo_por_cono: null,
  peso_por_cono_g: null,
  ...datos,
})

describe('validarCono', () => {
  const base = { nombre_color: '  Azul   marino ', hex: '14213D', material: 'Acrílico ' }

  it('normaliza los textos y el hex', () => {
    const { valido, datos } = validarCono({ ...base, codigo: ' con-0001 ' })
    expect(valido).toBe(true)
    expect(datos).toMatchObject({
      codigo: 'CON-0001',
      nombre_color: 'Azul marino',
      hex: '#14213d',
      material: 'acrílico',
      familia_color: 'neutros',
      stock_minimo: 0,
    })
  })

  it('exige nombre, hex y material', () => {
    const { valido, errores } = validarCono({})
    expect(valido).toBe(false)
    expect(Object.keys(errores)).toEqual(
      expect.arrayContaining(['nombre_color', 'hex', 'material']),
    )
  })

  it('convierte el peso en kg a gramos', () => {
    const { datos } = validarCono({ ...base, peso_por_cono: '1,5', unidad_peso: 'kg' })
    expect(datos.peso_por_cono_g).toBe(1500)
  })

  it('calcula el costo por cono desde el costo por kilo', () => {
    const { datos } = validarCono({
      ...base,
      peso_por_cono: '900',
      costo: '100',
      modo_costo: 'kilo',
    })
    expect(datos.costo_por_cono).toBe(90)
  })

  it('calcula el costo por cono desde el costo por docena', () => {
    const { datos } = validarCono({ ...base, costo: '1080', modo_costo: 'docena' })
    expect(datos.costo_por_cono).toBe(90)
  })

  it('pide el peso si el costo es por kilo', () => {
    const { errores } = validarCono({ ...base, costo: '100', modo_costo: 'kilo' })
    expect(errores.costo).toBeDefined()
  })

  it('el stock inicial solo aplica al crear', () => {
    expect(validarCono({ ...base, stock_inicial: '12' }).stockInicial).toBe(12)
    expect(validarCono({ ...base, id: ID, stock_inicial: '12' }).stockInicial).toBe(0)
    expect(
      validarCono({ ...base, stock_inicial: '1.5' }).errores.stock_inicial,
    ).toBeDefined()
  })
})

describe('validarMovimiento', () => {
  it('acepta una entrada con lote y costo', () => {
    const { valido, datos } = validarMovimiento(
      {
        cono_id: ID,
        tipo: 'entrada',
        cantidad: '10',
        lote: 'L-1',
        costo_unitario: '85,5',
      },
      0,
    )
    expect(valido).toBe(true)
    expect(datos).toMatchObject({ cantidad: 10, lote: 'L-1', costo_unitario: 85.5 })
  })

  it('guarda por cono el costo de una entrada escrito por docena', () => {
    const { valido, datos } = validarMovimiento(
      {
        cono_id: ID,
        tipo: 'entrada',
        cantidad: '12',
        costo_unitario: '1000',
        modo_costo: 'docena',
      },
      0,
    )
    expect(valido).toBe(true)
    expect(datos.costo_unitario).toBe(83.33)
  })

  it('no deja sacar más conos de los que hay', () => {
    const { errores } = validarMovimiento(
      { cono_id: ID, tipo: 'salida', cantidad: '5' },
      3,
    )
    expect(errores.cantidad).toMatch(/Solo hay 3 conos/)
  })

  it('la salida no lleva datos de compra y sí la pieza', () => {
    const { datos } = validarMovimiento(
      { cono_id: ID, tipo: 'salida', cantidad: '2', lote: 'x', pieza_id: ID },
      5,
    )
    expect(datos).not.toHaveProperty('lote')
    expect(datos.pieza_id).toBe(ID)
  })

  it('el ajuste guarda la diferencia con el conteo físico', () => {
    expect(
      validarMovimiento({ cono_id: ID, tipo: 'ajuste', conteo: '7' }, 10).datos.cantidad,
    ).toBe(-3)
    expect(
      validarMovimiento({ cono_id: ID, tipo: 'ajuste', conteo: '10' }, 10).errores.conteo,
    ).toBeDefined()
  })
})

describe('utilidades de lectura', () => {
  it('leerDecimal acepta coma o punto', () => {
    expect(leerDecimal('1,5')).toBe(1.5)
    expect(leerDecimal('1,234.5')).toBe(1234.5)
    expect(leerDecimal('')).toBeNull()
    expect(leerDecimal('abc')).toBeUndefined()
  })

  it('normalizarCodigoCono', () => {
    expect(normalizarCodigoCono(' con- 7 ')).toBe('CON-7')
  })
})

describe('familias y contraste', () => {
  it.each([
    ['#c62828', null, 'rojos'],
    ['#1f4fa3', null, 'azules'],
    ['#2e7d32', null, 'verdes'],
    ['#9e9e9e', null, 'neutros'],
    ['#ffffff', null, 'neutros'],
    ['#6d4c41', null, 'marrones'],
    ['#b8860b', 'lurex', 'metalicos'],
  ])('%s (%s) -> %s', (hex, material, familia) => {
    expect(sugerirFamiliaColor(hex, material)).toBe(familia)
  })

  it('texto claro sobre colores oscuros', () => {
    expect(contrasteSobre('#14213d')).toBe('claro')
    expect(contrasteSobre('#ffffff')).toBe('oscuro')
  })
})

describe('inventario', () => {
  const conos = [
    cono({
      codigo: 'CON-1',
      nombre_color: 'Rojo',
      hex: '#c62828',
      familia_color: 'rojos',
      material: 'acrílico',
      proveedor: 'Norte',
      stock_actual: 10,
      stock_minimo: 4,
      costo_por_cono: 90,
      peso_por_cono_g: 1000,
      codigo_color: '20',
    }),
    cono({
      codigo: 'CON-2',
      nombre_color: 'Celeste',
      hex: '#7ec8e3',
      familia_color: 'azules',
      material: 'algodón',
      proveedor: 'Andinos',
      stock_actual: 2,
      stock_minimo: 4,
      costo_por_cono: 110,
      codigo_color: '34',
    }),
    cono({
      codigo: 'CON-3',
      nombre_color: 'Azul marino',
      hex: '#14213d',
      familia_color: 'azules',
      material: 'acrilico',
      stock_actual: 0,
      stock_minimo: 4,
    }),
    cono({
      codigo: 'CON-4',
      nombre_color: 'Viejo',
      hex: '#000000',
      familia_color: 'neutros',
      material: 'lurex',
      stock_actual: 50,
      activo: false,
    }),
  ]

  it('estadoCono', () => {
    expect(conos.map(estadoCono)).toEqual(['disponible', 'bajo', 'agotado', 'disponible'])
  })

  it('filtra por texto sin acentos, familia y estado; oculta inactivos', () => {
    expect(filtrarConos(conos, {}).map((c) => c.codigo)).toEqual([
      'CON-1',
      'CON-2',
      'CON-3',
    ])
    expect(filtrarConos(conos, { termino: 'AZUL' }).map((c) => c.codigo)).toEqual([
      'CON-3',
    ])
    expect(filtrarConos(conos, { termino: '34' }).map((c) => c.codigo)).toEqual(['CON-2'])
    expect(filtrarConos(conos, { familia: 'azules', estado: 'bajo' })).toHaveLength(1)
    expect(filtrarConos(conos, { material: 'acrilico' })).toHaveLength(2)
    expect(filtrarConos(conos, { inactivos: true })).toHaveLength(4)
  })

  it('agrupa por familia en el orden del muestrario', () => {
    const grupos = agruparConos(filtrarConos(conos), 'familia_color')
    expect(grupos.map((g) => g.etiqueta)).toEqual(['Rojos', 'Azules'])
    expect(grupos[1].conos.map((c) => c.codigo)).toEqual(['CON-3', 'CON-2'])
  })

  it('agrupa por proveedor con "sin especificar" al final', () => {
    const grupos = agruparConos(filtrarConos(conos), 'proveedor')
    expect(grupos.map((g) => g.etiqueta)).toEqual(['Andinos', 'Norte', 'Sin especificar'])
  })

  it('agrupa por estado empezando por lo urgente', () => {
    expect(agruparConos(conos, 'estado').map((g) => g.clave)).toEqual([
      'agotado',
      'bajo',
      'disponible',
    ])
  })

  it('valoresDistintos ignora mayúsculas y acentos', () => {
    expect(valoresDistintos(conos, 'material')).toEqual(['acrílico', 'algodón', 'lurex'])
  })

  it('resumen: totales, valor y alertas (solo activos)', () => {
    const r = resumenInventario(conos)
    expect(r.tipos).toBe(3)
    expect(r.totalConos).toBe(12)
    expect(r.valorTotal).toBe(10 * 90 + 2 * 110)
    expect(r.pesoTotalG).toBe(10000)
    expect(r.bajo.map((c) => c.codigo)).toEqual(['CON-2'])
    expect(r.agotados.map((c) => c.codigo)).toEqual(['CON-3'])
  })

  it('existenciaDeColor busca por número de color, luego hex y nombre', () => {
    expect(existenciaDeColor(conos, { codigo: '34' })).toMatchObject({
      stock: 2,
      estado: 'bajo',
    })
    expect(existenciaDeColor(conos, { hex: '#C62828' }).estado).toBe('disponible')
    expect(existenciaDeColor(conos, { nombre: 'azul marino' }).estado).toBe('agotado')
    expect(existenciaDeColor(conos, { codigo: '99' }).estado).toBe('sin_cono')
    // Los inactivos no cuentan
    expect(existenciaDeColor(conos, { hex: '#000000' }).estado).toBe('sin_cono')
  })
})

describe('formato', () => {
  it('formatearPeso', () => {
    expect(formatearPeso(850)).toBe('850 g')
    expect(formatearPeso(1500)).toBe('1,5 kg')
    expect(formatearPeso(null)).toBe('—')
  })

  it('cantidadConSigno', () => {
    expect(cantidadConSigno({ tipo: 'entrada', cantidad: 5 })).toBe('+5')
    expect(cantidadConSigno({ tipo: 'salida', cantidad: 3 })).toBe('−3')
    expect(cantidadConSigno({ tipo: 'ajuste', cantidad: -2 })).toBe('−2')
  })
})
