/**
 * Deja solo digitos (enteros sin signo) en lo que se escribe o pega en un
 * campo numerico, recortado a `largo` caracteres si se indica.
 * @param {string} texto
 * @param {number} [largo]
 */
export function soloEnteros(texto, largo) {
  const digitos = String(texto ?? '').replace(/\D/g, '')
  return largo ? digitos.slice(0, largo) : digitos
}
