import Spinner from './ui/Spinner.jsx';

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" aria-live="polite">
      <Spinner tamano="sm" etiqueta={texto} />
      {texto}
    </div>
  );
}
