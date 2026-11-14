import {
  ETIQUETAS_TIPO,
  ETIQUETAS_ZONA,
  LIMITES,
  TIPOS_CUELLO,
  ZONAS_COLOR,
} from './constantes.js'

/**
 * Descriptores de formulario. La UI los recorre para pintar los campos;
 * asi el formulario no repite etiquetas, limites ni opciones.
 *
 * tipo: 'texto' | 'numero' | 'seleccion' | 'area_texto' | 'url' | 'lista_numeros'
 * Tipos compuestos (la UI les da un control propio): 'tipo_cuello'
 * (selector + alta de tipos), 'posiciones_cuerpo' (una fila por color) y
 * 'medidas' (casillas).
 *
 * @typedef {Object} DescriptorCampo
 * @property {string} nombre
 * @property {string} etiqueta
 * @property {'texto'|'numero'|'seleccion'|'area_texto'|'url'|'lista_numeros'|'tipo_cuello'|'posiciones_cuerpo'|'medidas'} tipo
 * @property {boolean} [requerido]
 * @property {string} [placeholder]
 * @property {string} [ayuda]
 * @property {number} [minimo]
 * @property {number} [maximo]
 * @property {number} [filas]
 * @property {string} [grupo]
 * @property {{ valor: string, etiqueta: string }[]} [opciones]
 */

export const OPCIONES_TIPO = TIPOS_CUELLO.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_TIPO[valor],
}))
export const OPCIONES_ZONA = ZONAS_COLOR.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_ZONA[valor],
}))

/** Grupos visuales del formulario, en orden. */
export const GRUPOS_CUELLO = [
  { clave: 'identificacion', titulo: 'Identificación' },
  { clave: 'tecnico', titulo: 'Datos técnicos' },
  { clave: 'detalle', titulo: 'Detalle e imagen' },
]

/** @type {DescriptorCampo[]} */
export const CAMPOS_CUELLO = [
  {
    nombre: 'codigo',
    etiqueta: 'Código',
    tipo: 'texto',
    requerido: true,
    placeholder: 'maz4t5',
    ayuda: 'Tal como lo usa la empresa. Se guarda en minúsculas.',
    grupo: 'identificacion',
  },
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    tipo: 'texto',
    placeholder: 'Opcional',
    grupo: 'identificacion',
  },
  {
    nombre: 'tipo',
    etiqueta: 'Tipo',
    tipo: 'tipo_cuello',
    requerido: true,
    opciones: OPCIONES_TIPO,
    grupo: 'identificacion',
  },
  {
    nombre: 'cantidad_hilos',
    etiqueta: 'Cantidad de hilos',
    tipo: 'numero',
    ...rango('cantidad_hilos'),
    grupo: 'tecnico',
  },
  {
    nombre: 'posiciones_cuerpo',
    etiqueta: 'Posiciones del cuerpo',
    tipo: 'posiciones_cuerpo',
    ayuda: 'Una posición por color del cuerpo. Marca "Letra" si ese color forma letras.',
    ...rango('colores_cuerpo'),
    grupo: 'tecnico',
  },
  {
    nombre: 'medidas',
    etiqueta: 'Medidas compatibles',
    tipo: 'medidas',
    ...rango('medida'),
    grupo: 'tecnico',
  },
  {
    nombre: 'imagen_url',
    etiqueta: 'URL de la imagen (opcional)',
    tipo: 'url',
    placeholder: 'https://i.ibb.co/...',
    ayuda: 'Solo si no usas el diseño de arriba: si hay diseño, se muestra el diseño.',
    grupo: 'detalle',
  },
  {
    nombre: 'notas',
    etiqueta: 'Notas',
    tipo: 'area_texto',
    filas: 8,
    placeholder:
      'tubular blanco(4) azul(4) conusec. Cuerpo gaspeado: 1 negro, 1 celeste #34',
    ayuda:
      'Todo lo que no cabe en los campos: colores, combinaciones, detalles del gaspeado...',
    grupo: 'detalle',
  },
]

/**
 * Descriptores de cada fila del editor de colores. Las opciones de zona
 * dependen de las posiciones del cuerpo: ver opcionesZonaColor().
 * El orden no se escribe: lo da la posicion de la fila en la lista.
 * @type {DescriptorCampo[]}
 */
export const CAMPOS_COLOR = [
  {
    nombre: 'zona',
    etiqueta: 'Zona',
    tipo: 'seleccion',
    requerido: true,
    opciones: OPCIONES_ZONA,
  },
  {
    nombre: 'color',
    etiqueta: 'Color',
    tipo: 'texto',
    requerido: true,
    placeholder: 'celeste',
  },
  {
    nombre: 'hex',
    etiqueta: 'Tono',
    tipo: 'tono',
    ayuda: 'Tono de referencia del color.',
  },
  {
    nombre: 'codigo',
    etiqueta: '#',
    tipo: 'texto',
    placeholder: '34',
    ayuda: 'Código del color según el cono.',
  },
  {
    nombre: 'cantidad_hilos',
    etiqueta: 'Hilos',
    tipo: 'numero',
    ...rango('cantidad_hilos'),
  },
]

/** Separador entre zona y posicion en el valor del selector ("cuerpo@2"). */
const SEPARADOR_POSICION = '@'

/**
 * Valor del selector de zona: la zona sola o "cuerpo@N" si apunta a un
 * color de "Posiciones del cuerpo" (N empieza en 1).
 * @param {string} zona
 * @param {number|null|undefined} [posicion]
 */
export function valorZonaColor(zona, posicion) {
  return posicion ? `${zona}${SEPARADOR_POSICION}${posicion}` : zona
}

/** Inversa de valorZonaColor. @param {string} valor */
export function leerZonaColor(valor) {
  const [zona, posicion] = String(valor ?? '').split(SEPARADOR_POSICION)
  return { zona, posicion: posicion ? Number(posicion) : null }
}

/**
 * Opciones de zona para una fila de color.
 * - Sin posiciones del cuerpo: las zonas normales (tubular, cuerpo, ...).
 * - Con posiciones: SOLO los colores del cuerpo definidos arriba, en orden.
 *   Si la fila ya tenia otra zona (cuello antiguo), se agrega al final
 *   para no perder el dato.
 * @param {{ posicion: string|number|null, letra: boolean }[]} [posiciones]
 * @param {string} [actual] valor de zona que tiene la fila
 */
export function opcionesZonaColor(posiciones = [], actual) {
  if (!posiciones.length) return OPCIONES_ZONA
  const opciones = posiciones.map((p, i) => {
    const detalle = [
      p.posicion !== '' && p.posicion !== null ? `pos. ${p.posicion}` : null,
      p.letra ? 'letra' : null,
    ]
      .filter(Boolean)
      .join(', ')
    return {
      valor: valorZonaColor('cuerpo', i + 1),
      etiqueta: `Color ${i + 1}${detalle ? ` (${detalle})` : ''}`,
    }
  })
  if (actual && !opciones.some((o) => o.valor === actual)) {
    const { zona, posicion } = leerZonaColor(actual)
    const base = OPCIONES_ZONA.find((o) => o.valor === zona)?.etiqueta ?? zona
    opciones.push({
      valor: actual,
      etiqueta: posicion ? `${base} · Color ${posicion} (ya no existe)` : base,
    })
  }
  return opciones
}

/** @param {keyof typeof LIMITES} clave */
function rango(clave) {
  return { minimo: LIMITES[clave].minimo, maximo: LIMITES[clave].maximo }
}

/** @param {unknown} valor */
const aTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor))

/**
 * Valores iniciales del formulario (todo como string) a partir de un
 * cuello existente o vacio para un alta.
 * @param {Partial<import('../tipos/index.js').Cuello>} [cuello]
 */
export function valoresInicialesCuello(cuello = {}) {
  return {
    id: cuello.id ?? '',
    codigo: aTexto(cuello.codigo),
    nombre: aTexto(cuello.nombre),
    tipo: cuello.tipo ?? 'liso',
    cantidad_hilos: aTexto(cuello.cantidad_hilos),
    posiciones_cuerpo: (cuello.posiciones_cuerpo ?? []).map((p) =>
      valoresInicialesPosicion(p),
    ),
    medidas: [...(cuello.medidas ?? [])].sort((a, b) => a - b),
    imagen_url: aTexto(cuello.imagen_url),
    diseno: cuello.diseno ?? null,
    notas: aTexto(cuello.notas),
  }
}

/**
 * Posicion de un color del cuerpo en el formulario (posicion como string).
 * @param {Partial<import('../tipos/index.js').PosicionCuerpo>} [posicion]
 */
export function valoresInicialesPosicion(posicion = {}) {
  return { posicion: aTexto(posicion.posicion), letra: Boolean(posicion.letra) }
}

/**
 * Fila vacia (o a partir de un color existente) para el editor de colores.
 * `hilos_auto` indica que los hilos siguen la "Cantidad de hilos" del
 * cuello hasta que el usuario escriba otro valor.
 * @param {Partial<import('../tipos/index.js').ColorCuello>} [color]
 * @param {{ hilosPorDefecto?: number|string|null }} [opciones]
 */
export function valoresInicialesColor(color = {}, { hilosPorDefecto = null } = {}) {
  const hilos = color.cantidad_hilos ?? null
  return {
    zona: valorZonaColor(color.zona ?? 'cuerpo', color.posicion),
    color: aTexto(color.color),
    codigo: aTexto(color.codigo),
    hex: aTexto(color.hex),
    // Si ya tiene tono guardado, no se pisa al cambiar el nombre del color.
    hex_manual: Boolean(color.hex),
    cantidad_hilos: aTexto(hilos),
    hilos_auto: hilos === null || String(hilos) === aTexto(hilosPorDefecto),
  }
}
