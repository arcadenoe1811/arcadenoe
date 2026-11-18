import { aCSV, nombreArchivo } from '@inventario/shared'

/**
 * Descarga una tabla como archivo CSV (se abre en Excel).
 * @template T
 * @param {string} titulo  nombre del archivo (sin extension)
 * @param {{ titulo: string, valor: (fila: T) => unknown }[]} columnas
 * @param {T[]} filas
 */
export function descargarCSV(titulo, columnas, filas) {
  const blob = new Blob([aCSV(columnas, filas)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${nombreArchivo(titulo)}.csv`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
