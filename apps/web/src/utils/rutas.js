import { RUTAS_PIEZA, normalizarPieza } from '@inventario/shared'

/**
 * Ruta de una pieza: /cuellos/:id o /punos/:id (con /editar opcional).
 * Sin id: la ruta de alta (/cuellos/nuevo, /punos/nuevo).
 * @param {string|null|undefined} pieza
 * @param {string} [id]
 * @param {'editar'} [accion]
 */
export function rutaPieza(pieza, id, accion) {
  const base = `/${RUTAS_PIEZA[normalizarPieza(pieza)]}`
  if (!id) return `${base}/nuevo`
  return accion ? `${base}/${id}/${accion}` : `${base}/${id}`
}
