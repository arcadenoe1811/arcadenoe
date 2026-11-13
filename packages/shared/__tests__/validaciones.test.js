import { describe, it, expect } from 'vitest'
import {
  interpretarMedidas,
  validarColoresCuello,
  validarCuello,
  validarPosicionesCuerpo,
} from '../cuellos/validaciones.js'
import { formatearTipo } from '../formato/index.js'
import { LIMITES } from '../cuellos/constantes.js'

describe('interpretarMedidas', () => {
  it('acepta texto separado por comas o espacios y ordena de mayor a menor', () => {
    expect(interpretarMedidas('16, 18 17')).toEqual({
      medidas: [18, 17, 16],
      invalidas: [],
    })
  })

  it('elimina duplicados', () => {
    expect(interpretarMedidas([18, '18', 17]).medidas).toEqual([18, 17])
  })

  it('devuelve null si no hay medidas', () => {
    expect(interpretarMedidas('')).toEqual({ medidas: null, invalidas: [] })
  })

  it('reporta las partes inválidas o fuera de rango', () => {
    const fueraDeRango = String(LIMITES.medida.maximo + 1)
    const resultado = interpretarMedidas(`18 abc ${fueraDeRango}`)
    expect(resultado.medidas).toEqual([18])
    expect(resultado.invalidas).toEqual(['abc', fueraDeRango])
  })
})

describe('validarPosicionesCuerpo', () => {
  it('convierte las posiciones y conserva la marca de letra', () => {
    const resultado = validarPosicionesCuerpo([
      { posicion: '12', letra: false },
      { posicion: '', letra: true },
    ])
    expect(resultado.valido).toBe(true)
    expect(resultado.datos).toEqual([
      { posicion: 12, letra: false },
      { posicion: null, letra: true },
    ])
  })

  it('marca la fila con posicion invalida', () => {
    const resultado = validarPosicionesCuerpo([{ posicion: 'x' }, { posicion: '-1' }])
    expect(resultado.errores).toHaveProperty('posiciones_cuerpo.0')
    expect(resultado.errores).toHaveProperty('posiciones_cuerpo.1')
  })
})

describe('validarCuello (tipo)', () => {
  it('acepta tipos agregados por el usuario y los normaliza', () => {
    const { errores, datos } = validarCuello({ codigo: 'abc', tipo: '  Doble  Tubular ' })
    expect(errores.tipo).toBeUndefined()
    expect(datos.tipo).toBe('doble tubular')
  })

  it('exige un tipo', () => {
    expect(validarCuello({ codigo: 'abc', tipo: '' }).errores.tipo).toBeDefined()
  })
})

describe('formatearTipo', () => {
  it('usa la etiqueta conocida o capitaliza el nombre', () => {
    expect(formatearTipo('liso')).toBe('Liso')
    expect(formatearTipo('doble tubular')).toBe('Doble tubular')
  })
})

describe('validarColoresCuello', () => {
  it('lee la posicion del cuerpo, quita el # y calcula el orden por zona', () => {
    const { valido, datos } = validarColoresCuello(
      [
        {
          zona: 'cuerpo@1',
          color: 'azul',
          codigo: '#34',
          cantidad_hilos: '',
          hilos_auto: true,
        },
        {
          zona: 'cuerpo@1',
          color: 'rojo',
          codigo: '',
          cantidad_hilos: '2',
          hilos_auto: false,
        },
        {
          zona: 'tubular',
          color: 'blanco',
          codigo: '',
          cantidad_hilos: '',
          hilos_auto: true,
        },
      ],
      { hilosPorDefecto: '3', cantidadPosiciones: 2 },
    )
    expect(valido).toBe(true)
    expect(datos).toEqual([
      {
        zona: 'cuerpo',
        posicion: 1,
        color: 'azul',
        codigo: '34',
        hex: null,
        cantidad_hilos: 3,
        orden: 1,
      },
      {
        zona: 'cuerpo',
        posicion: 1,
        color: 'rojo',
        codigo: null,
        hex: null,
        cantidad_hilos: 2,
        orden: 2,
      },
      {
        zona: 'tubular',
        posicion: null,
        color: 'blanco',
        codigo: null,
        hex: null,
        cantidad_hilos: 3,
        orden: 1,
      },
    ])
  })

  it('descarta filas vacias aunque sigan los hilos por defecto', () => {
    const { datos } = validarColoresCuello(
      [{ zona: 'cuerpo', color: '', codigo: '', cantidad_hilos: '', hilos_auto: true }],
      { hilosPorDefecto: '3' },
    )
    expect(datos).toEqual([])
  })

  it('avisa si el color del cuerpo ya no existe', () => {
    const { errores } = validarColoresCuello(
      [{ zona: 'cuerpo@3', color: 'azul', hilos_auto: true }],
      { cantidadPosiciones: 2 },
    )
    expect(errores['0.zona']).toBeDefined()
  })
})
