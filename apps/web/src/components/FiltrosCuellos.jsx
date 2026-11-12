import { FILTROS_CUELLO } from '@inventario/shared';
import CampoFormulario from './CampoFormulario.jsx';

/** Barra de busqueda prominente + filtros por tipo y medida. */
export default function FiltrosCuellos({ filtros, alCambiar, alLimpiar, hayFiltros }) {
  return (
    <div className="panel-busqueda">
      <label htmlFor="busqueda" className="solo-lector">
        Buscar cuellos
      </label>
      <div className="barra-busqueda">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="busqueda"
          type="search"
          autoFocus
          autoComplete="off"
          placeholder="Buscar por código, nombre, notas o color…  (ej: maz)"
          value={filtros.termino}
          onChange={(evento) => alCambiar('termino', evento.target.value)}
        />
      </div>
      <div className="filtros">
        {FILTROS_CUELLO.map((descriptor) => (
          <CampoFormulario key={descriptor.nombre} descriptor={descriptor} valor={filtros[descriptor.nombre]} alCambiar={alCambiar} />
        ))}
        {hayFiltros && (
          <button type="button" className="boton boton-fantasma" onClick={alLimpiar}>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
