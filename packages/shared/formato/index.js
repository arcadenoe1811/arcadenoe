import { ETIQUETAS_TIPO, ETIQUETAS_ZONA } from '../cuellos/constantes.js'

/**
 * Etiqueta visible de un tipo: la conocida o el nombre con mayuscula inicial
 * (los tipos agregados por el usuario no tienen etiqueta fija).
 * @param {string|null|undefined} tipo
 */
export function formatearTipo(tipo) {
  if (!tipo) return '—'
  return ETIQUETAS_TIPO[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

/** @param {string|null|undefined} zona */
export function formatearZona(zona) {
  return (zona && ETIQUETAS_ZONA[zona]) || '—'
}

/** @param {number[]|null|undefined} medidas */
export function formatearMedidas(medidas) {
  return medidas && medidas.length ? medidas.join(' · ') : '—'
}

/**
 * Une cada posicion del cuerpo con su color de "Colores por zona"
 * (la fila con zona cuerpo y posicion = numero del color, 1..N).
 * @param {import('../tipos/index.js').PosicionCuerpo[]|null|undefined} posiciones
 * @param {Array<{ zona?: string, posicion?: number|null, color?: string|null, hex?: string|null }>} [colores]
 * @returns {{ numero: number, posicion: number|null, letra: boolean, color: string|null, hex: string|null }[]}
 */
export function posicionesConColor(posiciones, colores = []) {
  return (posiciones ?? []).map((p, i) => {
    const fila = colores.find((c) => c.zona === 'cuerpo' && c.posicion === i + 1)
    return {
      numero: i + 1,
      posicion: p.posicion ?? null,
      letra: Boolean(p.letra),
      color: fila?.color || null,
      hex: fila?.hex || null,
    }
  })
}

/**
 * "4 = rojo · 3 = blanco (letra) · 2". Sin color asignado se muestra solo
 * la posicion; las posiciones vacias se muestran con "?".
 * @param {import('../tipos/index.js').PosicionCuerpo[]|null|undefined} posiciones
 * @param {Parameters<typeof posicionesConColor>[1]} [colores]
 */
export function formatearPosicionesCuerpo(posiciones, colores = []) {
  if (!posiciones || !posiciones.length) return '—'
  return posicionesConColor(posiciones, colores)
    .map(
      (p) =>
        `${p.posicion ?? '?'}${p.color ? ` = ${p.color}` : ''}${p.letra ? ' (letra)' : ''}`,
    )
    .join(' · ')
}

/** @param {string|null|undefined} fecha */
export function formatearFecha(fecha) {
  if (!fecha) return '—'
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha))
}

/**
 * Convierte enlaces compartidos de Google Drive en un enlace directo de
 * imagen. Las demas URLs se devuelven sin cambios.
 * @param {string|null|undefined} url
 * @param {number} [ancho] ancho deseado (solo Google Drive)
 */
export function normalizarUrlImagen(url, ancho = 1000) {
  if (!url) return null
  const drive =
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) ||
    url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&#]+)/)
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w${ancho}`
  return url
}
