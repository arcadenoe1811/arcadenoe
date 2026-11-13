import Spinner from './Spinner.jsx'
import './Boton.css'

/**
 * Boton base. Las mismas clases (.boton, .boton-primario...) sirven para
 * dar aspecto de boton a un <Link>.
 *
 * @param {{
 *   variante?: 'primario'|'secundario'|'peligro'|'fantasma',
 *   tamano?: 'sm'|'md'|'lg',
 *   cargando?: boolean,
 *   deshabilitado?: boolean,
 *   ancho_completo?: boolean,
 *   type?: 'button'|'submit'|'reset',
 *   className?: string,
 *   children?: import('react').ReactNode,
 * } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  deshabilitado = false,
  ancho_completo = false,
  type = 'button',
  className = '',
  children,
  ...resto
}) {
  const clases = [
    'boton',
    `boton-${variante}`,
    `boton-${tamano}`,
    ancho_completo && 'boton-ancho-completo',
    cargando && 'boton-cargando',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={clases}
      disabled={deshabilitado || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando && <Spinner tamano="sm" etiqueta="Procesando" />}
      {children}
    </button>
  )
}
