import './MensajeError.css';

/**
 * Caja de error con icono de alerta y boton opcional para cerrarla.
 * @param {{ mensaje: string|null|undefined, onCerrar?: () => void }} props
 */
export default function MensajeError({ mensaje, onCerrar }) {
  if (!mensaje) return null;
  return (
    <div className="mensaje-error" role="alert">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mensaje-error-icono">
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="mensaje-error-texto">{mensaje}</span>
      {onCerrar && (
        <button type="button" className="mensaje-error-cerrar" onClick={onCerrar} aria-label="Cerrar mensaje">
          ✕
        </button>
      )}
    </div>
  );
}
