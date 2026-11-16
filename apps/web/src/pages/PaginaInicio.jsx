import { Link, useSearchParams } from 'react-router-dom'
import { formatearPieza, hayFiltrosActivos } from '@inventario/shared'
import { rutaPieza } from '../utils/rutas.js'
import { useCuellos } from '../hooks/useCuellos.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useAuth } from '../hooks/useAuth.js'
import FiltrosCuellos from '../components/FiltrosCuellos.jsx'
import TarjetaCuello from '../components/TarjetaCuello.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/** Nombre del parametro de URL para cada filtro. */
const PARAMETROS = { termino: 'q', pieza: 'pieza', tipo: 'tipo', medida: 'medida' }

/** @param {URLSearchParams} parametros */
function leerFiltros(parametros) {
  return Object.fromEntries(
    Object.entries(PARAMETROS).map(([filtro, parametro]) => [
      filtro,
      parametros.get(parametro) ?? '',
    ]),
  )
}

export default function PaginaInicio() {
  // Los filtros viven en la URL: al volver de una ficha se conserva la busqueda.
  const [parametros, setParametros] = useSearchParams()
  const filtros = leerFiltros(parametros)
  // El operador solo consulta: no se le ofrece registrar piezas.
  const puedeEditar = useAuth().puede('cuellos.editar')

  // Se retrasa la cadena de la URL (primitivo estable) y luego se pasan
  // los filtros como strings al hook.
  const claveRetrasada = useDebounce(parametros.toString(), 250)
  const filtrosRetrasados = leerFiltros(new URLSearchParams(claveRetrasada))
  const { cuellos, cargando, error, recargar } = useCuellos(filtrosRetrasados)

  const cambiarFiltro = (nombre, valor) => {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(PARAMETROS[nombre], valor)
    else nuevos.delete(PARAMETROS[nombre])
    setParametros(nuevos, { replace: true })
  }

  const hayFiltros = hayFiltrosActivos(filtros)

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

      {cargando && !cuellos && <Cargando texto="Buscando…" />}

      {cuellos && (
        <>
          <p className="resumen-resultados" aria-live="polite">
            {cuellos.length === 1 ? '1 pieza' : `${cuellos.length} piezas`}
            {cargando && ' · actualizando…'}
          </p>

          {cuellos.length === 0 ? (
            <div className="vacio">
              <p>
                {hayFiltros
                  ? 'Ninguna pieza coincide con la búsqueda.'
                  : 'Todavía no hay piezas registradas.'}
              </p>
              {puedeEditar && (
                <Link
                  to={
                    filtros.termino
                      ? `${rutaPieza(filtros.pieza)}?codigo=${encodeURIComponent(filtros.termino)}`
                      : rutaPieza(filtros.pieza)
                  }
                  className="boton boton-primario"
                >
                  {filtros.termino
                    ? `Registrar ${formatearPieza(filtros.pieza).toLowerCase()} “${filtros.termino}”`
                    : `Registrar un ${formatearPieza(filtros.pieza).toLowerCase()}`}
                </Link>
              )}
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
  )
}
