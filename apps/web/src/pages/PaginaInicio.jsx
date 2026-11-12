import { Link, useSearchParams } from 'react-router-dom';
import { buscarCuellos, hayFiltrosActivos } from '@inventario/shared';
import { usarConsulta } from '../hooks/usarConsulta.js';
import { usarRetraso } from '../hooks/usarRetraso.js';
import FiltrosCuellos from '../components/FiltrosCuellos.jsx';
import TarjetaCuello from '../components/TarjetaCuello.jsx';
import Cargando from '../components/Cargando.jsx';
import Aviso from '../components/Aviso.jsx';

/** Nombre del parametro de URL para cada filtro. */
const PARAMETROS = { termino: 'q', tipo: 'tipo', medida: 'medida' };

/** @param {URLSearchParams} parametros */
function leerFiltros(parametros) {
  return Object.fromEntries(Object.entries(PARAMETROS).map(([filtro, parametro]) => [filtro, parametros.get(parametro) ?? '']));
}

export default function PaginaInicio() {
  // Los filtros viven en la URL: al volver de una ficha se conserva la busqueda.
  const [parametros, setParametros] = useSearchParams();
  const filtros = leerFiltros(parametros);

  const claveRetrasada = usarRetraso(parametros.toString(), 250);
  const { datos: cuellos, cargando, error, recargar } = usarConsulta(
    () => buscarCuellos(leerFiltros(new URLSearchParams(claveRetrasada))),
    [claveRetrasada],
  );

  const cambiarFiltro = (nombre, valor) => {
    const nuevos = new URLSearchParams(parametros);
    if (valor) nuevos.set(PARAMETROS[nombre], valor);
    else nuevos.delete(PARAMETROS[nombre]);
    setParametros(nuevos, { replace: true });
  };

  const hayFiltros = hayFiltrosActivos(filtros);

  return (
    <section>
      <FiltrosCuellos
        filtros={filtros}
        alCambiar={cambiarFiltro}
        alLimpiar={() => setParametros({}, { replace: true })}
        hayFiltros={hayFiltros}
      />

      {error && (
        <Aviso
          tipo="error"
          accion={
            <button type="button" className="boton boton-secundario" onClick={recargar}>
              Reintentar
            </button>
          }
        >
          {error.mensaje}
        </Aviso>
      )}

      {cargando && !cuellos && <Cargando texto="Buscando cuellos…" />}

      {cuellos && (
        <>
          <p className="resumen-resultados" aria-live="polite">
            {cuellos.length === 1 ? '1 cuello' : `${cuellos.length} cuellos`}
            {cargando && ' · actualizando…'}
          </p>

          {cuellos.length === 0 ? (
            <div className="vacio">
              <p>{hayFiltros ? 'Ningún cuello coincide con la búsqueda.' : 'Todavía no hay cuellos registrados.'}</p>
              <Link
                to={filtros.termino ? `/cuellos/nuevo?codigo=${encodeURIComponent(filtros.termino)}` : '/cuellos/nuevo'}
                className="boton boton-primario"
              >
                {filtros.termino ? `Registrar “${filtros.termino}”` : 'Registrar un cuello'}
              </Link>
            </div>
          ) : (
            <div className="rejilla-cuellos">
              {cuellos.map((cuello) => (
                <TarjetaCuello key={cuello.id} cuello={cuello} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
