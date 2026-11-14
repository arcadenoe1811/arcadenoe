import { describe, it, expect } from 'vitest'
import {
  coloresFueraDeLista,
  disenoConColores,
  mapearColoresDiseno,
} from '../cuellos/diseno.js'
import { formatearPosicionesCuerpo, posicionesConColor } from '../formato/index.js'

const ROJO = '#cc0000'
const BLANCO = '#ffffff'
const AZUL = '#000066'

describe('colores del diseño vs "Colores por zona"', () => {
  it('crea el diseño solo con los colores del cuello', () => {
    const d = disenoConColores({ colores: [AZUL, BLANCO, ROJO], indiceLetra: 1 })
    expect(d.fondo).toBe(AZUL)
    expect(d.color_texto).toBe(BLANCO)
    expect(coloresFueraDeLista(d, [AZUL, BLANCO, ROJO])).toEqual([])
  })

  it('detecta colores que no están en la lista', () => {
    const d = disenoConColores({ colores: [AZUL, BLANCO] })
    expect(coloresFueraDeLista({ ...d, fondo: '#123456' }, [AZUL, BLANCO])).toEqual([
      '#123456',
    ])
  })

  it('reemplaza un tono en todo el diseño', () => {
    const d = disenoConColores({ colores: [AZUL, BLANCO, ROJO] })
    const nuevo = mapearColoresDiseno(d, (hex) => (hex === ROJO ? '#ee0000' : hex))
    expect(coloresFueraDeLista(nuevo, [AZUL, BLANCO, '#ee0000'])).toEqual([])
  })
})

describe('posiciones del cuerpo con su color', () => {
  const posiciones = [
    { posicion: 4, letra: false },
    { posicion: 3, letra: true },
    { posicion: 2, letra: false },
  ]
  const colores = [
    { zona: 'cuerpo', posicion: 1, color: 'rojo', hex: ROJO },
    { zona: 'cuerpo', posicion: 2, color: 'blanco', hex: BLANCO },
  ]

  it('une cada posición con su color', () => {
    const resultado = posicionesConColor(posiciones, colores)
    expect(resultado[0]).toMatchObject({ posicion: 4, color: 'rojo', hex: ROJO })
    expect(resultado[2].color).toBeNull()
  })

  it('formatea "posición = color"', () => {
    expect(formatearPosicionesCuerpo(posiciones, colores)).toBe(
      '4 = rojo · 3 = blanco (letra) · 2',
    )
  })
})
