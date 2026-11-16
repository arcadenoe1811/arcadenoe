import { OPCIONES_TIPO } from './campos.js'
import { LIMITES } from './constantes.js'
import { ETIQUETAS_PIEZA_PLURAL, PIEZAS, tallaPunoDeMedida } from './piezas.js'

/**
 * Filtros de la pantalla de busqueda (ademas del termino de texto).
 */
export const FILTROS_CUELLO = [
  {
    nombre: 'pieza',
    etiqueta: 'Pieza',
    tipo: 'seleccion',
    opciones: [
      { valor: '', etiqueta: 'Todas' },
      ...PIEZAS.map((valor) => ({ valor, etiqueta: ETIQUETAS_PIEZA_PLURAL[valor] })),
    ],
  },
  {
    nombre: 'tipo',
    etiqueta: 'Tipo',
    tipo: 'seleccion',
    opciones: [{ valor: '', etiqueta: 'Todos' }, ...OPCIONES_TIPO],
  },
  {
    nombre: 'medida',
    etiqueta: 'Medida',
    tipo: 'numero',
    placeholder: 'Ej: 16',
    minimo: LIMITES.medida.minimo,
    maximo: LIMITES.medida.maximo,
  },
]

/** @returns {import('../tipos/index.js').FiltrosCuellos} */
export function filtrosVacios() {
  return { termino: '', tipo: '', medida: '', pieza: '' }
}

/**
 * Limpia los filtros: quita vacios y convierte la medida en numero.
 * @param {import('../tipos/index.js').FiltrosCuellos} filtros
 */
export function normalizarFiltros(filtros = {}) {
  const termino = String(filtros.termino ?? '').trim()
  const tipo = filtros.tipo || null
  const medidaTexto = String(filtros.medida ?? '').trim()
  const medida = /^\d+$/.test(medidaTexto) ? Number(medidaTexto) : null
  const pieza = PIEZAS.includes(filtros.pieza) ? filtros.pieza : null
  return { termino, tipo, medida, pieza }
}

/**
 * Aplica pieza, tipo y medida sobre una consulta de supabase-js (tabla o
 * rpc). La medida tambien encuentra punos de la talla equivalente
 * (16 -> pg).
 * @template Q
 * @param {Q} consulta
 * @param {{ tipo: string|null, medida: number|null, pieza?: string|null }} filtros
 * @returns {Q}
 */
export function aplicarFiltros(consulta, { tipo, medida, pieza = null }) {
  /** @type {any} */
  let q = consulta
  if (pieza) q = q.eq('pieza', pieza)
  if (tipo) q = q.eq('tipo', tipo)
  // La medida se interpola en el filtro `or` de PostgREST: solo se acepta
  // un entero, nunca texto libre.
  if (Number.isInteger(medida) && medida >= 0) {
    const talla = tallaPunoDeMedida(medida)
    q = talla
      ? q.or(`medidas.cs.{${medida}},tallas.cs.{${talla}}`)
      : q.contains('medidas', [medida])
  }
  return q
}

/** Indica si hay algun filtro activo (para mostrar "limpiar filtros"). */
export function hayFiltrosActivos(filtros = {}) {
  const { termino, tipo, medida, pieza } = normalizarFiltros(filtros)
  return Boolean(termino || tipo || pieza || medida !== null)
}
