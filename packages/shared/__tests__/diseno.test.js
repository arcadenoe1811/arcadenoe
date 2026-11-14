import { describe, it, expect } from 'vitest'
import {
  DISENO_COLUMNAS,
  DISENO_FILAS,
  FILAS_FUENTE,
  calcularDiseno,
  disenoPorDefecto,
  mapaTexto,
  normalizarTextoDiseno,
  validarDiseno,
} from '../cuellos/diseno.js'
import { validarCuello } from '../cuellos/validaciones.js'

const FONDO = '#000000'
const TEXTO = '#ffffff'
const LINEA = '#ff0000'

const diseno = (cambios = {}) => ({
  v: 1,
  texto: 'AB',
  fondo: FONDO,
  color_texto: TEXTO,
  desplazamiento: 0,
  debajo: [],
  arriba: [],
  medio: [],
  ...cambios,
})

/** Fila de la maquina (1 = abajo) -> indice de la grilla (0 = arriba). */
const fila = (n) => DISENO_FILAS - n

describe('normalizarTextoDiseno', () => {
  it('pasa a mayusculas, quita tildes y conserva la Ñ', () => {
    expect(normalizarTextoDiseno('Camión ñandú')).toBe('CAMION ÑANDU')
  })
  it('cambia caracteres sin letra en la fuente por espacios y recorta', () => {
    expect(normalizarTextoDiseno('a@b')).toBe('A B')
    expect(normalizarTextoDiseno('x'.repeat(30))).toHaveLength(18)
  })
})

describe('mapaTexto', () => {
  it('tiene 9 filas y una columna de separacion entre letras', () => {
    const mapa = mapaTexto('AB')
    expect(mapa).toHaveLength(FILAS_FUENTE)
    expect(mapa[0]).toHaveLength(7 + 1 + 6)
  })
  it('texto vacio no ocupa nada', () => {
    expect(mapaTexto('')).toEqual([])
  })
})

describe('calcularDiseno', () => {
  it('genera una grilla de 100x80', () => {
    const { celdas } = calcularDiseno(diseno())
    expect(celdas).toHaveLength(DISENO_FILAS)
    expect(celdas.every((f) => f.length === DISENO_COLUMNAS)).toBe(true)
  })

  it('pinta las lineas de abajo desde la fila 1', () => {
    const { celdas, anotaciones } = calcularDiseno(
      diseno({ texto: '', debajo: [{ tipo: 'tubular', pasadas: 3, color: LINEA }] }),
    )
    expect(celdas[fila(1)].every((c) => c === LINEA)).toBe(true)
    expect(celdas[fila(3)].every((c) => c === LINEA)).toBe(true)
    expect(celdas[fila(4)].every((c) => c === FONDO)).toBe(true)
    expect(anotaciones[fila(3)]).toBe('tubular (3p)')
  })

  it('las lineas del medio saltan el texto y el texto queda completo', () => {
    const d = diseno({
      medio: [{ tipo: 'linea', pasadas: 1, color: LINEA, desplazamiento: 0 }],
    })
    const { celdas, filaTexto } = calcularDiseno(d)
    const filaLinea = celdas[filaTexto + 4]
    const mapa = mapaTexto('AB')
    const inicio = Math.floor((DISENO_COLUMNAS - mapa[0].length) / 2)
    expect(filaLinea[0]).toBe(LINEA)
    expect(filaLinea[DISENO_COLUMNAS - 1]).toBe(LINEA)
    // dentro de la zona del texto (y su margen) no hay color de linea
    for (let c = inicio - 1; c <= inicio + mapa[0].length; c++) {
      expect(filaLinea[c]).not.toBe(LINEA)
    }
    // el texto esta entero
    mapa.forEach((f, i) =>
      f.forEach((punto, c) => {
        if (punto) expect(celdas[filaTexto + i][inicio + c]).toBe(TEXTO)
      }),
    )
  })

  it('las lineas del medio se mueven con el texto', () => {
    const medio = [{ tipo: 'linea', pasadas: 1, color: LINEA, desplazamiento: 0 }]
    const base = calcularDiseno(diseno({ medio }))
    const subido = calcularDiseno(diseno({ medio, desplazamiento: 3 }))
    expect(subido.filaTexto).toBe(base.filaTexto - 3)
    expect(subido.celdas[subido.filaTexto + 4][0]).toBe(LINEA)
  })

  it('las lineas de arriba dejan una fila libre sobre el texto', () => {
    const { celdas, filaTexto } = calcularDiseno(
      diseno({ arriba: [{ tipo: 'linea', pasadas: 2, color: LINEA }] }),
    )
    expect(celdas[filaTexto - 1][0]).toBe(FONDO)
    expect(celdas[filaTexto - 2][0]).toBe(LINEA)
    expect(celdas[filaTexto - 3][0]).toBe(LINEA)
    expect(celdas[filaTexto - 4][0]).toBe(FONDO)
  })
})

describe('validarDiseno', () => {
  it('null es "sin diseno"', () => {
    expect(validarDiseno(null)).toEqual({ valido: true, error: null, datos: null })
  })

  it('acepta el diseno por defecto y limpia claves desconocidas', () => {
    const { valido, datos } = validarDiseno({
      ...disenoPorDefecto({ texto: 'hola' }),
      x: 1,
    })
    expect(valido).toBe(true)
    expect(datos.texto).toBe('HOLA')
    expect(datos).not.toHaveProperty('x')
  })

  it('rechaza colores y pasadas invalidas', () => {
    const r = validarDiseno(
      diseno({ fondo: 'rojo', debajo: [{ tipo: 'linea', pasadas: 0, color: LINEA }] }),
    )
    expect(r.valido).toBe(false)
    expect(r.error).toMatch(/Color inválido/)
    expect(r.error).toMatch(/Pasadas/)
  })

  it('validarCuello incluye el diseno normalizado o el error', () => {
    const ok = validarCuello({ codigo: 'a1', tipo: 'liso', diseno: diseno() })
    expect(ok.datos.diseno.texto).toBe('AB')
    const mal = validarCuello({ codigo: 'a1', tipo: 'liso', diseno: 'x' })
    expect(mal.errores.diseno).toBeTruthy()
    const sin = validarCuello({ codigo: 'a1', tipo: 'liso' })
    expect(sin.datos.diseno).toBeNull()
  })

  it('un diseno tipico pesa menos de 1 KB', () => {
    expect(JSON.stringify(disenoPorDefecto({ texto: 'VENECIA' })).length).toBeLessThan(
      1024,
    )
  })
})
