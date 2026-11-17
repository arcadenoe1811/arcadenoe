/**
 * Constantes de ventas, produccion y tallas. Deben coincidir con las reglas
 * de supabase/migrations/00012_ventas_estimador_reportes.sql.
 */

export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'otro', etiqueta: 'Otro' },
]

export const ETIQUETAS_METODO_PAGO = Object.fromEntries(
  METODOS_PAGO.map((m) => [m.valor, m.etiqueta]),
)

/** Medidas de cuello que se venden y producen: de la 10 a la 20. */
export const MEDIDAS_VENTA = [
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
]

export const LIMITES_VENTA = {
  lineas: 50,
  talla: 12,
  cantidad: 99999,
  precio: 9999999,
  cliente: 120,
  notas: 1000,
  nombre: 120,
  conos_por_unidad: 999,
  minutos_por_unidad: 9999,
  tarifa_hora: 99999,
}

/** @param {string|null|undefined} metodo */
export function formatearMetodoPago(metodo) {
  return (metodo && ETIQUETAS_METODO_PAGO[metodo]) || '—'
}

/**
 * Estados de una venta. Los tres primeros se calculan solos según la
 * producción; la entrega la marca el usuario. `tono` es la clase de color
 * del badge (ver estilos/modulos.css); el texto siempre acompaña al color.
 * @typedef {'pendiente'|'en_produccion'|'listo'|'entregado'|'entregado_parcial'} EstadoVenta
 */
export const ESTADOS_VENTA = [
  { valor: 'pendiente', etiqueta: 'Pendiente', tono: 'rojo' },
  { valor: 'en_produccion', etiqueta: 'En producción', tono: 'ambar' },
  { valor: 'listo', etiqueta: 'Listo', tono: 'verde' },
  { valor: 'entregado_parcial', etiqueta: 'Entregado parcial', tono: 'gris' },
  { valor: 'entregado', etiqueta: 'Entregado', tono: 'gris' },
]

export const ETIQUETAS_ESTADO_VENTA = Object.fromEntries(
  ESTADOS_VENTA.map((e) => [e.valor, e.etiqueta]),
)
const TONOS_ESTADO_VENTA = Object.fromEntries(ESTADOS_VENTA.map((e) => [e.valor, e.tono]))

/** Opciones del filtro de estado (incluye "Todos"). */
export const OPCIONES_ESTADO_VENTA = [
  { valor: '', etiqueta: 'Todos' },
  ...ESTADOS_VENTA.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta })),
]

/** @param {string|null|undefined} estado */
export function formatearEstadoVenta(estado) {
  return (estado && ETIQUETAS_ESTADO_VENTA[estado]) || '—'
}

/** @param {string|null|undefined} estado */
export function tonoEstadoVenta(estado) {
  return (estado && TONOS_ESTADO_VENTA[estado]) || 'gris'
}

/** true si la venta ya se entregó (total o parcialmente): es un estado final. */
export function estaEntregada(estado) {
  return estado === 'entregado' || estado === 'entregado_parcial'
}

/** true si la venta sigue abierta (no entregada del todo): cuenta como pendiente de entregar. */
export function pendienteDeEntregar(estado) {
  return estado !== 'entregado'
}
