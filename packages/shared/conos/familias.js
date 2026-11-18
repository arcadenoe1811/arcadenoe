/** #rrggbb -> { h: 0..360, s: 0..100, l: 0..100 } */
export function hexAHsl(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

/**
 * Sugiere la familia de color a partir del hex (y del material: el lurex
 * es metalico). Es solo una sugerencia: el usuario puede cambiarla.
 * @param {string|null|undefined} hex
 * @param {string|null|undefined} [material]
 * @returns {string|null} valor de FAMILIAS_COLOR, o null si el hex no es valido
 */
export function sugerirFamiliaColor(hex, material) {
  if (String(material ?? '').toLowerCase() === 'lurex') return 'metalicos'
  if (!/^#?[0-9a-f]{6}$/i.test(String(hex ?? '').trim())) return null

  const { h, s, l } = hexAHsl(String(hex).trim())
  if (s < 12 || l < 10 || l > 94) return 'neutros'
  // Tonos calidos oscuros y poco saturados: marrones.
  if (h >= 15 && h < 50 && l < 40) return 'marrones'
  if (h < 12 || h >= 345) return l > 70 ? 'rosas' : 'rojos'
  if (h < 40) return 'naranjas'
  if (h < 68) return 'amarillos'
  if (h < 170) return 'verdes'
  if (h < 255) return 'azules'
  if (h < 295) return 'morados'
  return 'rosas'
}

/**
 * Texto claro u oscuro para escribir encima de un color de fondo.
 * @param {string|null|undefined} hex
 * @returns {'claro'|'oscuro'}
 */
export function contrasteSobre(hex) {
  if (!/^#?[0-9a-f]{6}$/i.test(String(hex ?? ''))) return 'oscuro'
  const n = parseInt(String(hex).replace('#', ''), 16)
  const lineal = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const luminancia =
    0.2126 * lineal((n >> 16) & 255) +
    0.7152 * lineal((n >> 8) & 255) +
    0.0722 * lineal(n & 255)
  return luminancia > 0.4 ? 'oscuro' : 'claro'
}
