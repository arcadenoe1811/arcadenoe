/**
 * Exportacion de tablas a CSV (se abre en Excel). Sin dependencias.
 *
 * Seguridad: una celda que empieza por = + - @ (o tabulador / retorno) la
 * interpreta Excel como formula. Como hay texto libre (cliente, notas), a
 * esas celdas se les antepone un apostrofo ("inyeccion de formulas en CSV").
 */

/** Marca de orden de bytes: con ella Excel lee el archivo como UTF-8. */
export const BOM = String.fromCharCode(0xfeff)

const PELIGROSO = /^[=+\-@\t\r]/

/** @param {unknown} valor */
export function celdaCSV(valor) {
  if (valor === null || valor === undefined) return ''
  // Los numeros van tal cual (un negativo no es una formula).
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : ''
  let texto = String(valor)
  if (PELIGROSO.test(texto)) texto = `'${texto}`
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/**
 * @template T
 * @param {{ titulo: string, valor: (fila: T) => unknown }[]} columnas
 * @param {T[]} filas
 * @returns {string} CSV con BOM (para que Excel lea los acentos) y CRLF
 */
export function aCSV(columnas, filas) {
  const lineas = [
    columnas.map((c) => celdaCSV(c.titulo)).join(','),
    ...filas.map((fila) => columnas.map((c) => celdaCSV(c.valor(fila))).join(',')),
  ]
  return `${BOM}${lineas.join('\r\n')}\r\n`
}

/** Nombre de archivo seguro: "Ventas por diseño" -> "ventas-por-diseno". */
export function nombreArchivo(texto) {
  return (
    String(texto ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'reporte'
  )
}
