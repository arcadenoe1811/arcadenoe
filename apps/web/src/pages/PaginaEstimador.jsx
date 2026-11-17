import { useId, useState } from 'react'
import {
  calcularEstimacion,
  costoPromedioCono,
  eliminarEstimacion,
  formatearDia,
  formatearDuracion,
  formatearEntero,
  formatearMoneda,
  guardarEstimacion,
  guardarTarifaHora,
  listarConos,
  listarEstimaciones,
  normalizarError,
  obtenerTarifaHora,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import { useConsulta } from '../hooks/useConsulta.js'
import { useDisenos } from '../hooks/useDisenos.js'
import {
  Campo,
  BuscadorDiseno,
  SelectorTalla,
  etiquetaDiseno,
  nuevaClave,
} from '../components/lineas/CamposLinea.jsx'
import ImagenCuello from '../components/ImagenCuello.jsx'
import MuestraColor from '../components/MuestraColor.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const HASTA_3_DECIMALES = new Intl.NumberFormat('es', { maximumFractionDigits: 3 })

const lineaVacia = (cuello_id = '') => ({
  clave: nuevaClave(),
  cuello_id,
  talla: '',
  cantidad: '',
  conos_por_unidad: '',
  minutos_por_unidad: '',
})

const cargarHistorial = () => listarEstimaciones(100)

/** Disenos distintos de una estimacion: "maz4t5, cous2t". */
const disenosDe = (estimacion) =>
  [...new Set(estimacion.lineas.map((l) => l.diseno_codigo))].join(', ')

/**
 * Estimador de costos: cuanto cuesta producir cuellos ANTES de fabricarlos.
 * Se apilan lineas (diseno + talla) y el calculo se actualiza al escribir.
 * Guardar registra solo lo estimado; no guarda tiempos reales de produccion.
 */
export default function PaginaEstimador() {
  const id = useId()
  const { puede } = useAuth()
  const { disenos, cargando: cargandoDisenos, error: errorDisenos } = useDisenos()
  const conos = useConsulta(listarConos)
  const tarifaConfigurada = useConsulta(obtenerTarifaHora)
  const historial = useConsulta(cargarHistorial)

  const [disenoActual, setDisenoActual] = useState('')
  const [lineas, setLineas] = useState(() => [lineaVacia()])
  const [nombre, setNombre] = useState('')
  const [notas, setNotas] = useState('')
  // null = todavia no se edito: se usa el valor del inventario / la configuracion.
  const [tarifaEditada, setTarifaEditada] = useState(/** @type {string|null} */ (null))
  const [costoEditado, setCostoEditado] = useState(/** @type {string|null} */ (null))
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))
  const [errorGeneral, setErrorGeneral] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)

  const costoInventario = costoPromedioCono(conos.datos ?? [])
  const tarifa = tarifaEditada ?? String(tarifaConfigurada.datos ?? 0)
  const costoCono = costoEditado ?? String(costoInventario)
  const calculo = calcularEstimacion(lineas, { costoCono, tarifaHora: tarifa })
  const disenoPorId = new Map(disenos.map((d) => [d.id, d]))
  const elegido = disenoPorId.get(disenoActual)

  const cambiarLinea = (clave, campo, valor) =>
    setLineas((previas) =>
      previas.map((l) => (l.clave === clave ? { ...l, [campo]: valor } : l)),
    )
  const limpiarAvisos = () => {
    setMensaje(null)
    setErrorGeneral(null)
  }

  const elegirDiseno = (idDiseno) => {
    setDisenoActual(idDiseno)
    // Las lineas que aun no tienen diseno toman el elegido.
    if (idDiseno)
      setLineas((previas) =>
        previas.map((l) => (l.cuello_id ? l : { ...l, cuello_id: idDiseno })),
      )
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    limpiarAvisos()
    setGuardando(true)
    try {
      await guardarEstimacion(
        { nombre, notas, tarifa_hora: tarifa, costo_cono: costoCono },
        lineas,
      )
      setErrores({})
      setMensaje('Estimación guardada. Puedes seguir ajustándola o duplicarla más tarde.')
      historial.recargar()
    } catch (e) {
      const error = normalizarError(e)
      setErrores(error.errores)
      setErrorGeneral(error.errores.lineas ?? error.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const duplicar = (estimacion) => {
    limpiarAvisos()
    setErrores({})
    setNombre(estimacion.nombre ? `${estimacion.nombre} (copia)`.slice(0, 120) : '')
    setNotas(estimacion.notas ?? '')
    setTarifaEditada(String(estimacion.tarifa_hora))
    setCostoEditado(String(estimacion.costo_cono))
    setLineas(
      estimacion.lineas.map((l) => ({
        clave: nuevaClave(),
        // Si el diseno ya no esta activo, la linea queda sin diseno para elegir otro.
        cuello_id: l.cuello_id && disenoPorId.has(l.cuello_id) ? l.cuello_id : '',
        talla: l.talla,
        cantidad: String(l.cantidad),
        conos_por_unidad: String(l.conos_por_unidad),
        minutos_por_unidad: String(l.minutos_por_unidad),
      })),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminar = async (estimacion) => {
    if (!window.confirm('¿Eliminar esta estimación del historial?')) return
    limpiarAvisos()
    try {
      await eliminarEstimacion(estimacion.id)
      historial.recargar()
    } catch (e) {
      setErrorGeneral(normalizarError(e).mensaje)
    }
  }

  const guardarTarifa = async () => {
    limpiarAvisos()
    try {
      await guardarTarifaHora(tarifa)
      setErrores((previos) => ({ ...previos, tarifa_hora: undefined }))
      setMensaje('Tarifa por hora guardada como predeterminada.')
      tarifaConfigurada.recargar()
    } catch (e) {
      const error = normalizarError(e)
      setErrores((previos) => ({ ...previos, ...error.errores }))
      setErrorGeneral(error.mensaje)
    }
  }

  if (cargandoDisenos && disenos.length === 0) return <Cargando />

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <div>
          <h1>Estimador de costos</h1>
          <p className="texto-suave">
            Calcula cuánto cuesta producir cuellos antes de fabricarlos.
          </p>
        </div>
      </div>

      {errorDisenos && <Aviso tipo="error">{errorDisenos.mensaje}</Aviso>}
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

      <form className="pagina-modulo" onSubmit={guardar} noValidate>
        <section className="tarjeta">
          <h2>
            <span className="paso">1</span>Seleccionar diseño
          </h2>
          <Campo id={`${id}-diseno`} etiqueta="Diseño">
            <BuscadorDiseno
              id={`${id}-diseno`}
              valor={disenoActual}
              alCambiar={elegirDiseno}
              disenos={disenos}
            />
          </Campo>
          {elegido && (
            <div className="diseno-elegido">
              <ImagenCuello
                url={elegido.imagen_url}
                diseno={elegido.diseno}
                alt={`Diseño ${elegido.codigo}`}
              />
              <div className="diseno-elegido-texto">
                <strong>{etiquetaDiseno(elegido)}</strong>
                {elegido.colores?.length > 0 ? (
                  <div className="diseno-colores">
                    {elegido.colores.map((c, i) => (
                      <span key={`${c.zona}-${c.color}-${i}`}>
                        <MuestraColor hex={c.hex} />
                        {c.color}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="texto-suave texto-pequeno">
                    Este diseño no tiene colores registrados.
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="tarjeta">
          <h2>
            <span className="paso">2</span>Líneas de producción
          </h2>
          <div className="lineas">
            {lineas.map((linea, i) => {
              const e = (campo) => errores[`lineas.${i}.${campo}`]
              const base = `${id}-${linea.clave}`
              return (
                <div key={linea.clave} className="linea linea-estimacion">
                  <Campo
                    id={`${base}-diseno`}
                    etiqueta="Diseño"
                    error={e('cuello_id')}
                    className="linea-diseno"
                  >
                    <BuscadorDiseno
                      id={`${base}-diseno`}
                      valor={linea.cuello_id}
                      alCambiar={(v) => cambiarLinea(linea.clave, 'cuello_id', v)}
                      disenos={disenos}
                      invalido={Boolean(e('cuello_id'))}
                    />
                  </Campo>
                  <Campo id={`${base}-talla`} etiqueta="Medida" error={e('talla')}>
                    <SelectorTalla
                      id={`${base}-talla`}
                      valor={linea.talla}
                      alCambiar={(v) => cambiarLinea(linea.clave, 'talla', v)}
                      diseno={disenoPorId.get(linea.cuello_id)}
                      invalido={Boolean(e('talla'))}
                    />
                  </Campo>
                  <Campo
                    id={`${base}-cantidad`}
                    etiqueta="Cantidad"
                    error={e('cantidad')}
                  >
                    <input
                      id={`${base}-cantidad`}
                      inputMode="numeric"
                      autoComplete="off"
                      value={linea.cantidad}
                      onChange={(ev) =>
                        cambiarLinea(
                          linea.clave,
                          'cantidad',
                          ev.target.value.replace(/\D/g, '').slice(0, 5),
                        )
                      }
                    />
                  </Campo>
                  <Campo
                    id={`${base}-conos`}
                    etiqueta="Conos por unidad"
                    error={e('conos_por_unidad')}
                  >
                    <input
                      id={`${base}-conos`}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.5"
                      value={linea.conos_por_unidad}
                      onChange={(ev) =>
                        cambiarLinea(linea.clave, 'conos_por_unidad', ev.target.value)
                      }
                    />
                  </Campo>
                  <Campo
                    id={`${base}-minutos`}
                    etiqueta="Minutos por unidad"
                    error={e('minutos_por_unidad')}
                  >
                    <input
                      id={`${base}-minutos`}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="25"
                      value={linea.minutos_por_unidad}
                      onChange={(ev) =>
                        cambiarLinea(linea.clave, 'minutos_por_unidad', ev.target.value)
                      }
                    />
                  </Campo>
                  <div className="linea-quitar">
                    <button
                      type="button"
                      className="boton boton-fantasma boton-fantasma-peligro"
                      onClick={() =>
                        setLineas((previas) =>
                          previas.filter((l) => l.clave !== linea.clave),
                        )
                      }
                      disabled={lineas.length === 1}
                      aria-label={`Quitar línea ${i + 1}`}
                    >
                      × Quitar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="lineas-pie margen-arriba">
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() =>
                setLineas((previas) => [...previas, lineaVacia(disenoActual)])
              }
              disabled={lineas.length >= 50}
            >
              + Agregar línea
            </button>
          </div>
        </section>

        <section className="tarjeta">
          <h2>
            <span className="paso">3</span>Cálculo
          </h2>
          <div className="campos">
            <Campo
              id={`${id}-costo`}
              etiqueta="Costo por cono (Q.)"
              error={errores.costo_cono}
              ayuda={`Promedio del inventario: ${formatearMoneda(costoInventario)}`}
            >
              <input
                id={`${id}-costo`}
                inputMode="decimal"
                autoComplete="off"
                value={costoCono}
                onChange={(ev) => setCostoEditado(ev.target.value)}
              />
            </Campo>
            <Campo
              id={`${id}-tarifa`}
              etiqueta="Mano de obra por hora (Q.)"
              error={errores.tarifa_hora}
              ayuda={`Predeterminada: ${formatearMoneda(tarifaConfigurada.datos ?? 0)}`}
            >
              <input
                id={`${id}-tarifa`}
                inputMode="decimal"
                autoComplete="off"
                value={tarifa}
                onChange={(ev) => setTarifaEditada(ev.target.value)}
              />
            </Campo>
            {puede('configuracion.editar') && tarifaEditada !== null && (
              <div className="linea-quitar">
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={guardarTarifa}
                >
                  Usar como tarifa predeterminada
                </button>
              </div>
            )}
          </div>

          <dl className="resultado margen-arriba" aria-live="polite">
            <div>
              <dt>Conos necesarios</dt>
              <dd>{HASTA_3_DECIMALES.format(calculo.conos)}</dd>
            </div>
            <div>
              <dt>Tiempo estimado</dt>
              <dd>{formatearDuracion(calculo.minutos)}</dd>
            </div>
            <div>
              <dt>Costo de material</dt>
              <dd>{formatearMoneda(calculo.costoMaterial)}</dd>
            </div>
            <div>
              <dt>Costo de mano de obra</dt>
              <dd>{formatearMoneda(calculo.costoManoObra)}</dd>
            </div>
            <div className="resultado-principal">
              <dt>Costo total estimado</dt>
              <dd>{formatearMoneda(calculo.costoTotal)}</dd>
            </div>
            <div className="resultado-principal">
              <dt>Costo por unidad ({formatearEntero(calculo.unidades)} uds.)</dt>
              <dd>{formatearMoneda(calculo.costoPorUnidad)}</dd>
            </div>
          </dl>

          <div className="campos margen-arriba">
            <Campo
              id={`${id}-nombre`}
              etiqueta="Nombre (opcional)"
              error={errores.nombre}
            >
              <input
                id={`${id}-nombre`}
                maxLength={120}
                placeholder="Ej: Pedido colegio"
                value={nombre}
                onChange={(ev) => setNombre(ev.target.value)}
              />
            </Campo>
            <div className="campo-area_texto">
              <Campo id={`${id}-notas`} etiqueta="Notas (opcional)" error={errores.notas}>
                <textarea
                  id={`${id}-notas`}
                  rows={2}
                  maxLength={1000}
                  value={notas}
                  onChange={(ev) => setNotas(ev.target.value)}
                />
              </Campo>
            </div>
          </div>

          <div className="lineas-pie margen-arriba">
            <span className="texto-suave texto-pequeno">
              Se guarda solo el estimado, no los tiempos reales de producción.
            </span>
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar estimación'}
            </button>
          </div>
        </section>
      </form>

      <section className="tarjeta">
        <header className="bloque-encabezado">
          <h2>Historial de estimaciones</h2>
        </header>
        {historial.error && <Aviso tipo="error">{historial.error.mensaje}</Aviso>}
        {historial.cargando && !historial.datos && <Cargando />}
        {historial.datos &&
          (historial.datos.length === 0 ? (
            <p className="texto-suave">Todavía no hay estimaciones guardadas.</p>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col" className="columna-opcional">
                      Nombre
                    </th>
                    <th scope="col">Diseño(s)</th>
                    <th scope="col" className="numero">
                      Cantidad
                    </th>
                    <th scope="col" className="numero columna-opcional">
                      Tiempo
                    </th>
                    <th scope="col" className="numero">
                      Costo estimado
                    </th>
                    <th scope="col">
                      <span className="solo-lector">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historial.datos.map((e) => (
                    <tr key={e.id}>
                      <td>{formatearDia(e.fecha)}</td>
                      <td className="columna-opcional">{e.nombre ?? '—'}</td>
                      <td>{disenosDe(e)}</td>
                      <td className="numero">{formatearEntero(e.total_unidades)}</td>
                      <td className="numero columna-opcional">
                        {formatearDuracion(e.total_minutos)}
                      </td>
                      <td className="numero">{formatearMoneda(e.costo_total)}</td>
                      <td className="celda-acciones">
                        <button
                          type="button"
                          className="boton boton-fantasma boton-sm"
                          onClick={() => duplicar(e)}
                        >
                          Duplicar
                        </button>
                        {puede('estimaciones.eliminar') && (
                          <button
                            type="button"
                            className="boton boton-fantasma boton-fantasma-peligro boton-sm"
                            onClick={() => eliminar(e)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>
    </section>
  )
}
