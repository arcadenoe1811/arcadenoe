import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fijarPrecioBase,
  formatearMoneda,
  formatearPieza,
  formatearTamanos,
  normalizarError,
  textoComparable,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import { useDisenos } from '../hooks/useDisenos.js'
import { rutaPieza } from '../utils/rutas.js'
import { descargarCSV } from '../utils/descargar.js'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const COLUMNAS_EXPORTAR = [
  { titulo: 'Código', valor: (d) => d.codigo },
  { titulo: 'Pieza', valor: (d) => formatearPieza(d.pieza) },
  { titulo: 'Nombre', valor: (d) => d.nombre },
  { titulo: 'Tallas / medidas', valor: (d) => formatearTamanos(d) },
  {
    titulo: 'Precio base',
    valor: (d) => (d.precio_base === null ? '' : Number(d.precio_base)),
  },
]

/**
 * Disenos con su precio base. El precio aplica a todas las
 * tallas del diseno; solo el admin lo cambia (la base lo exige) y el
 * cambio no afecta a las ventas ya registradas.
 */
export default function PaginaDisenos() {
  const { puede } = useAuth()
  const editaPrecios = puede('precios.editar')
  const { disenos, cargando, error, recargar } = useDisenos()
  const [termino, setTermino] = useState('')
  const [edicion, setEdicion] = useState(
    /** @type {{ id: string, valor: string, error: string|null, guardando: boolean }|null} */ (
      null
    ),
  )
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))

  const buscado = textoComparable(termino)
  const filas = disenos.filter(
    (d) => !buscado || textoComparable(`${d.codigo} ${d.nombre ?? ''}`).includes(buscado),
  )
  const sinPrecio = disenos.filter((d) => d.precio_base === null).length

  const guardarPrecio = async (evento, diseno) => {
    evento.preventDefault()
    setEdicion((e) => e && { ...e, guardando: true, error: null })
    try {
      const precio = await fijarPrecioBase(diseno.id, edicion.valor)
      setEdicion(null)
      setMensaje(
        precio === null
          ? `${diseno.codigo} quedó sin precio base.`
          : `Precio de ${diseno.codigo}: ${formatearMoneda(precio)}. Las ventas anteriores no cambian.`,
      )
      recargar()
    } catch (e) {
      const normalizado = normalizarError(e)
      setEdicion(
        (previa) =>
          previa && {
            ...previa,
            guardando: false,
            error: normalizado.errores.precio_base ?? normalizado.mensaje,
          },
      )
    }
  }

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <div>
          <h1>Diseños</h1>
          <p className="texto-suave">
            Precio base de cada diseño. El precio es el mismo para todas las medidas.
          </p>
        </div>
        <div className="acciones-pagina">
          {filas.length > 0 && (
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => descargarCSV('disenos y precios', COLUMNAS_EXPORTAR, filas)}
            >
              Exportar a Excel
            </button>
          )}
          {puede('cuellos.editar') && (
            <>
              <Link to="/cuellos/nuevo" className="boton boton-primario boton-compacto">
                + Nuevo cuello
              </Link>
              <Link to="/punos/nuevo" className="boton boton-secundario">
                + Nuevo puño
              </Link>
            </>
          )}
        </div>
      </div>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
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
      {sinPrecio > 0 && !error && (
        <Aviso tipo="info">
          {sinPrecio === 1
            ? '1 diseño no tiene precio base'
            : `${sinPrecio} diseños no tienen precio base`}
          : al venderlos habrá que escribir el precio a mano.
        </Aviso>
      )}
      {cargando && disenos.length === 0 && <Cargando />}

      {disenos.length > 0 && (
        <section className="tarjeta">
          <div className="campo">
            <label htmlFor="buscar-diseno">Buscar diseño</label>
            <input
              id="buscar-diseno"
              type="search"
              placeholder="Código o nombre"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
            />
          </div>
          {filas.length === 0 ? (
            <p className="texto-suave margen-arriba">Ningún diseño coincide.</p>
          ) : (
            <div className="tabla-envoltura margen-arriba">
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th scope="col">Diseño</th>
                    <th scope="col">Pieza</th>
                    <th scope="col">Medidas / tallas</th>
                    <th scope="col" className="numero">
                      Precio base
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link to={rutaPieza(d.pieza, d.id)}>
                          <code>{d.codigo}</code>
                        </Link>
                        {d.nombre && <span className="texto-suave"> {d.nombre}</span>}
                      </td>
                      <td>{formatearPieza(d.pieza)}</td>
                      <td>{formatearTamanos(d)}</td>
                      <td className="numero">
                        {edicion?.id === d.id ? (
                          <form
                            className="precio-edicion"
                            onSubmit={(e) => guardarPrecio(e, d)}
                          >
                            <input
                              aria-label={`Precio base de ${d.codigo}`}
                              inputMode="decimal"
                              autoComplete="off"
                              autoFocus
                              value={edicion.valor}
                              aria-invalid={edicion.error ? true : undefined}
                              title={edicion.error ?? undefined}
                              onChange={(e) =>
                                setEdicion({
                                  ...edicion,
                                  valor: e.target.value,
                                  error: null,
                                })
                              }
                            />
                            <button
                              type="submit"
                              className="boton boton-primario boton-sm boton-compacto"
                              disabled={edicion.guardando}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              className="boton boton-fantasma boton-sm"
                              onClick={() => setEdicion(null)}
                            >
                              Cancelar
                            </button>
                            {edicion.error && (
                              <small className="campo-error" role="alert">
                                {edicion.error}
                              </small>
                            )}
                          </form>
                        ) : (
                          <span className="precio-edicion">
                            {d.precio_base === null ? (
                              <span className="texto-suave">Sin precio</span>
                            ) : (
                              formatearMoneda(d.precio_base)
                            )}
                            {editaPrecios && (
                              <button
                                type="button"
                                className="boton boton-fantasma boton-sm"
                                aria-label={`Cambiar precio de ${d.codigo}`}
                                onClick={() => {
                                  setMensaje(null)
                                  setEdicion({
                                    id: d.id,
                                    valor:
                                      d.precio_base === null ? '' : String(d.precio_base),
                                    error: null,
                                    guardando: false,
                                  })
                                }}
                              >
                                Cambiar
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  )
}
