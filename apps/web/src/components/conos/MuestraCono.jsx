import { contrasteSobre } from '@inventario/shared'

/**
 * Bloque con el color del cono y, encima, su numero de color.
 * tamano: 'sm' (listas) | 'md' (tarjetas) | 'lg' (ficha)
 * @param {{ hex: string, texto?: string|null, tamano?: 'sm'|'md'|'lg', className?: string }} props
 */
export default function MuestraCono({
  hex,
  texto = null,
  tamano = 'md',
  className = '',
}) {
  return (
    <span
      className={`muestra-cono muestra-cono-${tamano} texto-${contrasteSobre(hex)} ${className}`}
      style={{ background: hex }}
      aria-hidden="true"
    >
      {texto && <span className="muestra-cono-numero">{texto}</span>}
    </span>
  )
}
