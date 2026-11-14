const PATRON_HEX = /^#[0-9a-f]{6}$/i

/** Normaliza el nombre de un color del catalogo (minusculas, espacios simples). */
export function normalizarNombreColor(nombre) {
  return String(nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/**
 * @param {{ nombre?: unknown, hex?: unknown }} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: { nombre: string, hex: string|null } }}
 */
export function validarColorCatalogo(formulario) {
  /** @type {Record<string, string>} */
  const errores = {}
  const nombre = normalizarNombreColor(formulario.nombre)
  let hex = String(formulario.hex ?? '').trim()
  if (hex && !hex.startsWith('#')) hex = `#${hex}`

  if (!nombre) errores.nombre = 'Escribe el nombre del color.'
  else if (nombre.length > 60) errores.nombre = 'Máximo 60 caracteres.'
  if (hex && !PATRON_HEX.test(hex)) errores.hex = 'Usa el formato #RRGGBB.'

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { nombre, hex: hex ? hex.toLowerCase() : null },
  }
}
