export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando-punto" aria-hidden="true" />
      {texto}
    </div>
  );
}
