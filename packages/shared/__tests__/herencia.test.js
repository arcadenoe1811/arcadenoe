import { describe, it, expect } from 'vitest'
import {
  calcularDisenosEfectivos,
  cambiarPareja,
  coloresSinPareja,
  conMapaColores,
  destinoColor,
  calcularOverrides,
  disenoHeredado,
  paletaDiseno,
  padresFaltantes,
  traducirColores,
  validarOverrides,
} from '../cuellos/herencia.js'
import {
  codigosMaquina,
  interpretarTallas,
  normalizarTalla,
  tallasDeMedidas,
} from '../cuellos/piezas.js'
import { validarCuello } from '../cuellos/validaciones.js'
import { aplicarFiltros } from '../cuellos/filtros.js'

const AZUL = '#1f4fa3'
const BLANCO = '#ffffff'
const ROJO = '#c62828'
const NEGRO = '#1a1a1a'
const VERDE = '#2e7d32'

const disenoPadre = {
  v: 1,
  texto: 'VENECIA',
  fondo: AZUL,
  color_texto: BLANCO,
  desplazamiento: 0,
  debajo: [{ tipo: 'tubular', pasadas: 12, color: ROJO }],
  arriba: [{ tipo: 'linea', pasadas: 4, color: ROJO }],
  medio: [],
}

const colores = (...hex) =>
  hex.map((h, i) => ({ zona: 'cuerpo', posicion: i + 1, orden: 1, hex: h }))

describe('paletaDiseno', () => {
  it('ordena por zona/posicion/orden y no repite tonos', () => {
    const paleta = paletaDiseno([
      { zona: 'cuerpo', posicion: 2, orden: 1, hex: '#FFFFFF' },
      { zona: 'tubular', posicion: null, orden: 1, hex: ROJO },
      { zona: 'cuerpo', posicion: 1, orden: 1, hex: AZUL },
      { zona: 'borde', posicion: null, orden: 1, hex: AZUL },
      { zona: 'otro', posicion: null, orden: 1, hex: null },
    ])
    expect(paleta).toEqual([ROJO, AZUL, BLANCO])
  })
})

describe('traducirColores', () => {
  it('cambia el color N del padre por el color N del hijo', () => {
    const r = traducirColores(disenoPadre, [AZUL, BLANCO, ROJO], [NEGRO, VERDE, BLANCO])
    expect(r.fondo).toBe(NEGRO)
    expect(r.color_texto).toBe(VERDE)
    expect(r.debajo[0].color).toBe(BLANCO)
    expect(r.texto).toBe('VENECIA')
  })
  it('deja igual lo que no tiene equivalente', () => {
    const r = traducirColores(disenoPadre, [AZUL, BLANCO, ROJO], [NEGRO])
    expect(r.fondo).toBe(NEGRO)
    expect(r.color_texto).toBe(BLANCO)
  })
})

describe('calcularOverrides', () => {
  it('solo guarda los campos que cambian', () => {
    const editado = { ...disenoPadre, texto: 'AURORA' }
    expect(calcularOverrides(disenoPadre, editado)).toEqual({ texto: 'AURORA' })
  })
  it('ignora diferencias de mayusculas en hex y orden de claves en lineas', () => {
    const editado = {
      ...disenoPadre,
      fondo: AZUL.toUpperCase(),
      debajo: [{ color: ROJO, pasadas: 12, tipo: 'tubular' }],
    }
    expect(calcularOverrides(disenoPadre, editado)).toEqual({})
  })
  it('una zona de lineas cambiada es un override completo', () => {
    const editado = { ...disenoPadre, arriba: [] }
    expect(calcularOverrides(disenoPadre, editado)).toEqual({ arriba: [] })
  })
})

describe('disenoHeredado', () => {
  it('padre traducido + overrides del hijo', () => {
    const { base, efectivo } = disenoHeredado({
      disenoPadre,
      paletaPadre: [AZUL, BLANCO, ROJO],
      paletaHijo: [NEGRO, VERDE, BLANCO],
      overrides: { texto: 'NAPOLES' },
    })
    expect(base.texto).toBe('VENECIA')
    expect(efectivo.texto).toBe('NAPOLES')
    expect(efectivo.fondo).toBe(NEGRO)
  })
  it('sin diseno del padre no hay diseno', () => {
    expect(
      disenoHeredado({ disenoPadre: null, paletaPadre: [], paletaHijo: [] }).efectivo,
    ).toBeNull()
  })
})

describe('calcularDisenosEfectivos', () => {
  const padre = { id: 'a', diseno: disenoPadre, colores: colores(AZUL, BLANCO, ROJO) }

  it('resuelve una cadena abuelo -> padre -> hijo', () => {
    const hijo = {
      id: 'b',
      padre_id: 'a',
      overrides: { texto: 'HIJO' },
      colores: colores(AZUL, BLANCO, ROJO),
    }
    const nieto = {
      id: 'c',
      padre_id: 'b',
      overrides: {},
      colores: colores(NEGRO, VERDE, BLANCO),
    }
    const r = calcularDisenosEfectivos([nieto, hijo, padre])
    expect(r.get('b').texto).toBe('HIJO')
    expect(r.get('c').texto).toBe('HIJO')
    expect(r.get('c').fondo).toBe(NEGRO)
  })

  it('si el padre cambia, el hijo lo refleja salvo sus overrides', () => {
    const hijo = { id: 'b', padre_id: 'a', overrides: { texto: 'HIJO' }, colores: [] }
    const padreCambiado = { ...padre, diseno: { ...disenoPadre, desplazamiento: 3 } }
    const r = calcularDisenosEfectivos([padreCambiado, hijo])
    expect(r.get('b').desplazamiento).toBe(3)
    expect(r.get('b').texto).toBe('HIJO')
  })

  it('un ciclo no se cuelga', () => {
    const x = { id: 'x', padre_id: 'y', overrides: {}, colores: [] }
    const y = { id: 'y', padre_id: 'x', overrides: {}, colores: [] }
    const r = calcularDisenosEfectivos([x, y])
    expect(r.get('x')).toBeNull()
  })

  it('padresFaltantes lista los ancestros que no estan cargados', () => {
    expect(
      padresFaltantes([
        { id: 'b', padre_id: 'a' },
        { id: 'c', padre_id: 'b' },
      ]),
    ).toEqual(['a'])
  })
})

describe('validarOverrides', () => {
  it('solo conserva campos heredables', () => {
    const r = validarOverrides({ texto: 'abc', otro: 1 })
    expect(r.valido).toBe(true)
    expect(r.datos).toEqual({ texto: 'ABC' })
  })
  it('detecta colores invalidos', () => {
    expect(validarOverrides({ fondo: 'rojo' }).valido).toBe(false)
  })
})

describe('tallas de puno', () => {
  it('pe es alias de pee', () => {
    expect(normalizarTalla('PE')).toBe('pee')
  })
  it('ordena de menor a mayor y marca las invalidas', () => {
    expect(interpretarTallas('pex, pg, pp, xx')).toEqual({
      tallas: ['pp', 'pg', 'pex'],
      invalidas: ['xx'],
    })
  })
  it('equivalencia con medidas de cuello', () => {
    expect(tallasDeMedidas([18, 16, 15, 13])).toEqual(['pp', 'pg', 'pex'])
  })
  it('codigos de maquina', () => {
    expect(
      codigosMaquina({ pieza: 'cuello', codigo: 'maz4t5', medidas: [17, 16] }),
    ).toEqual(['16maz4t5', '17maz4t5'])
    expect(codigosMaquina({ pieza: 'puno', codigo: 'maz4t5', tallas: ['pg'] })).toEqual([
      'pgmaz4t5',
    ])
  })
})

describe('validarCuello con piezas y herencia', () => {
  const base = { codigo: 'maz4t5', tipo: 'liso' }
  const PADRE = '11111111-2222-3333-4444-555555555555'

  it('un puno guarda tallas y no medidas', () => {
    const r = validarCuello({
      ...base,
      pieza: 'puno',
      tallas: ['pg', 'pe'],
      medidas: [16],
    })
    expect(r.valido).toBe(true)
    expect(r.datos.pieza).toBe('puno')
    expect(r.datos.tallas).toEqual(['pg', 'pee'])
    expect(r.datos.medidas).toBeNull()
  })

  it('un hijo guarda padre y overrides, sin diseno propio', () => {
    const r = validarCuello({
      ...base,
      padre_id: PADRE,
      overrides: { texto: 'otro' },
      diseno: disenoPadre,
    })
    expect(r.valido).toBe(true)
    expect(r.datos.padre_id).toBe(PADRE)
    expect(r.datos.overrides).toEqual({ texto: 'OTRO' })
    expect(r.datos.diseno).toBeNull()
  })

  it('no puede heredar de si mismo', () => {
    const r = validarCuello({ ...base, id: PADRE, padre_id: PADRE })
    expect(r.errores.padre_id).toBeTruthy()
  })

  it('una pieza independiente no guarda overrides', () => {
    const r = validarCuello({ ...base, overrides: { texto: 'X' } })
    expect(r.datos.padre_id).toBeNull()
    expect(r.datos.overrides).toEqual({})
  })
})

describe('aplicarFiltros', () => {
  const consultaFalsa = () => {
    const llamadas = []
    const q = new Proxy(
      {},
      {
        get:
          (_, metodo) =>
          (...args) => {
            llamadas.push([metodo, ...args])
            return q
          },
      },
    )
    return { q, llamadas }
  }

  it('la medida tambien busca punos de la talla equivalente', () => {
    const { q, llamadas } = consultaFalsa()
    aplicarFiltros(q, { tipo: null, medida: 16, pieza: 'puno' })
    expect(llamadas).toEqual([
      ['eq', 'pieza', 'puno'],
      ['or', 'medidas.cs.{16},tallas.cs.{pg}'],
    ])
  })
})

describe('mapa de colores (padre e hijo con distinta cantidad)', () => {
  const paletaPadre = [AZUL, BLANCO, ROJO]

  it('padre 3 -> hijo 2: el color 3 no tiene pareja hasta elegirla', () => {
    const datos = { disenoPadre, paletaPadre, paletaHijo: [NEGRO, VERDE] }
    expect(coloresSinPareja(datos)).toEqual([3])
    const mapa = cambiarPareja({}, 3, 2)
    expect(coloresSinPareja({ ...datos, mapa })).toEqual([])
    const { efectivo } = disenoHeredado({ ...datos, overrides: { mapa_colores: mapa } })
    expect(efectivo.fondo).toBe(NEGRO)
    expect(efectivo.color_texto).toBe(VERDE)
    expect(efectivo.debajo[0].color).toBe(VERDE)
  })

  it('padre 3 -> hijo 4: por posicion, el cuarto queda libre', () => {
    const datos = { disenoPadre, paletaPadre, paletaHijo: [NEGRO, VERDE, BLANCO, ROJO] }
    expect(coloresSinPareja(datos)).toEqual([])
    expect(disenoHeredado(datos).efectivo.debajo[0].color).toBe(BLANCO)
  })

  it('se pueden cruzar colores', () => {
    const { efectivo } = disenoHeredado({
      disenoPadre,
      paletaPadre,
      paletaHijo: [NEGRO, VERDE, BLANCO],
      overrides: { mapa_colores: { 1: 2, 2: 1 } },
    })
    expect(efectivo.fondo).toBe(VERDE)
    expect(efectivo.color_texto).toBe(NEGRO)
  })

  it('una pareja que ya no existe queda sin pareja', () => {
    expect(destinoColor(1, { 1: 4 }, 3)).toBeNull()
  })

  it('elegir la misma posicion borra la entrada', () => {
    expect(cambiarPareja({ 3: 2 }, 3, 3)).toEqual({})
  })

  it('validarOverrides conserva el mapa y quita parejas iguales', () => {
    const r = validarOverrides({ mapa_colores: { 1: 1, 3: 2 } })
    expect(r.valido).toBe(true)
    expect(r.datos).toEqual({ mapa_colores: { 3: 2 } })
    expect(validarOverrides({ mapa_colores: { x: 2 } }).valido).toBe(false)
  })

  it('conMapaColores agrega o quita el mapa', () => {
    expect(conMapaColores({ texto: 'A' }, { 3: 2 })).toEqual({
      texto: 'A',
      mapa_colores: { 3: 2 },
    })
    expect(conMapaColores({ texto: 'A', mapa_colores: { 3: 2 } }, {})).toEqual({
      texto: 'A',
    })
  })
})

describe('piezaPadrePermitida', () => {
  it('la herencia siempre cruza de pieza', async () => {
    const { piezaPadrePermitida } = await import('../cuellos/piezas.js')
    expect(piezaPadrePermitida('puno')).toBe('cuello')
    expect(piezaPadrePermitida('cuello')).toBe('puno')
  })
})
