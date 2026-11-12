import './Spinner.css';

/**
 * Indicador de carga circular.
 * @param {{ tamano?: 'sm'|'md'|'lg', etiqueta?: string, className?: string }} props
 */
export default function Spinner({ tamano = 'md', etiqueta = 'Cargando', className = '' }) {
  return <span className={`spinner spinner-${tamano} ${className}`.trim()} role="status" aria-label={etiqueta} />;
}
