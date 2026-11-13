/**
 * Acceso desde JS a los tokens de diseno. Los valores viven en
 * estilos/variables.css (unica fuente); aqui solo se leen.
 */

/** Breakpoints en px (iguales a --bp-* y a las media queries). */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
}

/**
 * Lee un token CSS, p. ej. leerToken('color-primario') -> '#0c3b2e'.
 * @param {string} nombre sin el prefijo --
 */
export function leerToken(nombre) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim()
}
