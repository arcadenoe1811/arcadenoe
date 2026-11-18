/**
 * Seccion tipo acordeon (<details> nativo: accesible y sin JS).
 * @param {{
 *   titulo: import('react').ReactNode,
 *   abierta?: boolean,
 *   className?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function SeccionDesplegable({
  titulo,
  abierta = true,
  className = '',
  children,
}) {
  return (
    <details className={`desplegable ${className}`} open={abierta}>
      <summary className="desplegable-titulo">
        <span className="desplegable-texto">{titulo}</span>
        <svg
          className="desplegable-flecha"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="desplegable-contenido">{children}</div>
    </details>
  )
}
