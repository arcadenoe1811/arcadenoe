import { ETIQUETAS_TIPO, ETIQUETAS_ZONA } from '../cuellos/constantes.js';

/** @param {string|null|undefined} tipo */
export function formatearTipo(tipo) {
  return (tipo && ETIQUETAS_TIPO[tipo]) || '—';
}

/** @param {string|null|undefined} zona */
export function formatearZona(zona) {
  return (zona && ETIQUETAS_ZONA[zona]) || '—';
}

/** @param {number[]|null|undefined} medidas */
export function formatearMedidas(medidas) {
  return medidas && medidas.length ? medidas.join(' · ') : '—';
}

/** @param {string|null|undefined} fecha */
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

/**
 * Convierte enlaces compartidos de Google Drive en un enlace directo de
 * imagen. Las demas URLs se devuelven sin cambios.
 * @param {string|null|undefined} url
 * @param {number} [ancho] ancho deseado (solo Google Drive)
 */
export function normalizarUrlImagen(url, ancho = 1000) {
  if (!url) return null;
  const drive =
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&#]+)/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w${ancho}`;
  return url;
}
