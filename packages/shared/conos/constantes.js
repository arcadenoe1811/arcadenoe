/**
 * Constantes del inventario de conos. Deben coincidir con las reglas de
 * supabase/migrations/00010_inventario_conos.sql.
 */

/** Simbolo de moneda (quetzales) para costos y valor del inventario. */
export const MONEDA = 'Q.'

/** Materiales sugeridos (se puede escribir otro). Se guardan en minusculas. */
export const MATERIALES = ['acrílico', 'algodón', 'poliéster', 'mezcla', 'lurex', 'nylon']

/** Titulos / calibres de hilo sugeridos. */
export const TITULOS_HILO = ['2/28', '2/32', '1/15', '2/30', '2/48']

/**
 * Familias de color, en el orden del muestrario. `hex` es la muestra que
 * representa a la familia en filtros y encabezados.
 */
export const FAMILIAS_COLOR = [
  { valor: 'rojos', etiqueta: 'Rojos', hex: '#c62828' },
  { valor: 'naranjas', etiqueta: 'Naranjas', hex: '#ef6c00' },
  { valor: 'amarillos', etiqueta: 'Amarillos', hex: '#f9c80e' },
  { valor: 'verdes', etiqueta: 'Verdes', hex: '#2e7d32' },
  { valor: 'azules', etiqueta: 'Azules', hex: '#1f4fa3' },
  { valor: 'morados', etiqueta: 'Morados', hex: '#6a1b9a' },
  { valor: 'rosas', etiqueta: 'Rosas', hex: '#e91e63' },
  { valor: 'marrones', etiqueta: 'Marrones', hex: '#6d4c41' },
  { valor: 'neutros', etiqueta: 'Neutros', hex: '#9e9e9e' },
  { valor: 'metalicos', etiqueta: 'Metálicos', hex: '#b8860b' },
]

export const ETIQUETAS_FAMILIA = Object.fromEntries(
  FAMILIAS_COLOR.map((f) => [f.valor, f.etiqueta]),
)

/** Estado del stock (columna generada `estado`). */
export const ESTADOS_CONO = [
  { valor: 'disponible', etiqueta: 'Disponible' },
  { valor: 'bajo', etiqueta: 'Stock bajo' },
  { valor: 'agotado', etiqueta: 'Agotado' },
]

export const ETIQUETAS_ESTADO_CONO = Object.fromEntries(
  ESTADOS_CONO.map((e) => [e.valor, e.etiqueta]),
)

export const TIPOS_MOVIMIENTO = {
  entrada: { etiqueta: 'Entrada', verbo: 'Registrar entrada' },
  salida: { etiqueta: 'Salida', verbo: 'Registrar salida' },
  ajuste: { etiqueta: 'Ajuste', verbo: 'Ajustar stock' },
}

/** Referencias sugeridas por tipo de movimiento. */
export const REFERENCIAS_MOVIMIENTO = {
  entrada: ['Compra', 'Devolución de producción'],
  salida: ['Producción', 'Muestra', 'Merma / dañado'],
  ajuste: ['Conteo físico', 'Corrección'],
}

/** Criterios para agrupar el muestrario. */
export const AGRUPACIONES_CONO = [
  { valor: 'familia_color', etiqueta: 'Familia de color' },
  { valor: 'material', etiqueta: 'Material' },
  { valor: 'proveedor', etiqueta: 'Proveedor' },
  { valor: 'estado', etiqueta: 'Estado' },
  { valor: '', etiqueta: 'Sin agrupar' },
]

export const LIMITES_CONO = {
  codigo: 20,
  nombre_color: 60,
  codigo_color: 20,
  material: 40,
  titulo_hilo: 20,
  proveedor: 80,
  peso: 99999,
  costo: 9999999,
  stock: 99999,
  notas: 2000,
  referencia: 120,
  lote: 60,
  notas_movimiento: 1000,
}
