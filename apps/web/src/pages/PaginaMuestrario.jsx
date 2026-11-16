import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AGRUPACIONES_CONO,
  ESTADOS_CONO,
  agruparConos,
  filtrarConos,
  formatearConos,
  valoresDistintos,
} from '@inventario/shared'
import { useConos } from '../hooks/useConos.js'
import TarjetaCono from '../components/conos/TarjetaCono.jsx'
import SeccionDesplegable from '../components/conos/SeccionDesplegable.jsx'
import NavegacionFamilias from '../components/conos/NavegacionFamilias.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/** Parametro de URL de cada filtro: al volver de una ficha se conservan. */
const PARAMETROS = {
  termino: 'q',
  familia: 'familia',
  material: 'material',
  proveedor: 'proveedor',
  estado: 'estado',
  inactivos: 'inactivos',
  agrupar: 'agrupar',
}

/** Muestrario de colores: todos los conos con su hex, nombre y stock. */
export default function PaginaMuestrario() {
  const [parametros, setParametros] = useSearchParams()
  const { conos, cargando, error, recargar } = useConos()
  const refContenido = useRef(/** @type {HTMLDivElement|null} */ (null))

  const leer = (filtro) => parametros.get(PARAMETROS[filtro]) ?? ''
  const filtros = {
    termino: leer('termino'),
    familia: leer('familia'),
    material: leer('material'),
    proveedor: leer('proveedor'),
    estado: leer('estado'),
    inactivos: leer('inactivos') === '1',
  }
  // Por defecto se agrupa por familia de color.
  const agrupar = parametros.has(PARAMETROS.agrupar) ? leer('agrupar') : 'familia_color'

  const cambiar = (filtro, valor) => {
    const nuevos = new URLSearchParams(parametros)
    if (valor || (filtro === 'agrupar' && valor === ''))
      nuevos.set(PARAMETROS[filtro], valor)
    else nuevos.delete(PARAMETROS[filtro])
    setParametros(nuevos, { replace: true })
  }

  // Conteo por familia con el resto de filtros aplicados (sin el de familia).
  const sinFamilia = filtrarConos(conos, { ...filtros, familia: '' })
  /** @type {Record<string, number>} */
  const conteos = {}
  for (const c of sinFamilia)
    conteos[c.familia_color] = (conteos[c.familia_color] ?? 0) + 1

  const elegirFamilia = (familia) => {
    cambiar('familia', familia)
    // Si el contenido ya quedo arriba fuera de vista, se vuelve a su inicio.
    const caja = refContenido.current
    if (caja && caja.getBoundingClientRect().top < 0) {
      caja.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const visibles = filtrarConos(conos, filtros)
  const grupos = agruparConos(visibles, agrupar)
  const hayFiltros = Boolean(
    filtros.termino ||
    filtros.familia ||
    filtros.material ||
    filtros.proveedor ||
    filtros.estado ||
    filtros.inactivos,
  )
  const totalConos = visibles.reduce((suma, c) => suma + c.stock_actual, 0)

  return (
    <section>
      <div className="encabezado-pagina encabezado-muestrario">
        <div className="encabezado-muestrario-titulo">
          <Link to="/conos" className="boton boton-secundario boton-volver">
            <span aria-hidden="true">←</span> Volver al resumen
          </Link>
          <h1>Muestrario de conos</h1>
        </div>
        <Link to="/conos/nuevo" className="boton boton-primario boton-lg">
          + Nuevo cono
        </Link>
      </div>

      <div className="panel-busqueda">
        <div className="barra-busqueda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            aria-label="Buscar cono"
            placeholder="Buscar por color, número, código o hex…"
            value={filtros.termino}
            onChange={(e) => cambiar('termino', e.target.value)}
          />
        </div>
      </div>

      <div className="muestrario-layout">
        <aside className="muestrario-lateral">
          <NavegacionFamilias
            conteos={conteos}
            total={sinFamilia.length}
            activa={filtros.familia}
            alElegir={elegirFamilia}
          />
        </aside>

        <div className="muestrario-contenido" ref={refContenido}>
          <div className="filtros">
            <div className="campo">
              <label htmlFor="filtro-material">Material</label>
              <select
                id="filtro-material"
                value={filtros.material}
                onChange={(e) => cambiar('material', e.target.value)}
              >
                <option value="">Todos</option>
                {valoresDistintos(conos, 'material').map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="filtro-proveedor">Proveedor</label>
              <select
                id="filtro-proveedor"
                value={filtros.proveedor}
                onChange={(e) => cambiar('proveedor', e.target.value)}
              >
                <option value="">Todos</option>
                {valoresDistintos(conos, 'proveedor').map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="filtro-estado">Disponibilidad</label>
              <select
                id="filtro-estado"
                value={filtros.estado}
                onChange={(e) => cambiar('estado', e.target.value)}
              >
                <option value="">Todas</option>
                {ESTADOS_CONO.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="filtro-agrupar">Agrupar por</label>
              <select
                id="filtro-agrupar"
                value={agrupar}
                onChange={(e) => cambiar('agrupar', e.target.value)}
              >
                {AGRUPACIONES_CONO.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <label className="casilla-filtro">
              <input
                type="checkbox"
                checked={filtros.inactivos}
                onChange={(e) => cambiar('inactivos', e.target.checked ? '1' : '')}
              />
              Ver inactivos
            </label>
            {hayFiltros && (
              <button
                type="button"
                className="boton boton-fantasma"
                onClick={() =>
                  setParametros(parametros.has(PARAMETROS.agrupar) ? { agrupar } : {}, {
                    replace: true,
                  })
                }
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {error && (
            <Aviso
              tipo="error"
              accion={
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={recargar}
                >
                  Reintentar
                </button>
              }
            >
              {error.mensaje}
            </Aviso>
          )}
          {cargando && conos.length === 0 && <Cargando />}

          {!cargando && !error && (
            <p className="resumen-muestrario" aria-live="polite">
              <span className="resumen-muestrario-dato">
                <strong>{visibles.length}</strong>{' '}
                {visibles.length === 1 ? 'tipo de cono' : 'tipos de cono'}
              </span>
              <span className="resumen-muestrario-dato">
                <strong>{formatearConos(totalConos).split(' ')[0]}</strong>{' '}
                {totalConos === 1 ? 'cono en stock' : 'conos en stock'}
              </span>
            </p>
          )}

          {!cargando && visibles.length === 0 && !error && (
            <div className="vacio">
              <p>
                {hayFiltros
                  ? 'Ningún cono coincide con los filtros.'
                  : 'Todavía no hay conos registrados.'}
              </p>
              {!hayFiltros && (
                <Link to="/conos/nuevo" className="boton boton-primario">
                  Registrar el primer cono
                </Link>
              )}
            </div>
          )}

          {grupos
            .filter((g) => g.conos.length > 0)
            .map((grupo) => {
              const rejilla = (
                <div className="rejilla-conos">
                  {grupo.conos.map((cono) => (
                    <TarjetaCono key={cono.id} cono={cono} />
                  ))}
                </div>
              )
              // Sin agrupar: una sola rejilla, sin acordeon.
              if (!grupo.etiqueta) {
                return (
                  <section key="todos" className="grupo-conos">
                    {rejilla}
                  </section>
                )
              }
              return (
                <SeccionDesplegable
                  key={grupo.clave}
                  className="grupo-conos"
                  titulo={
                    <h2 className="grupo-conos-titulo">
                      {grupo.hex && (
                        <span
                          className="chip-familia-muestra"
                          style={{ background: grupo.hex }}
                        />
                      )}
                      {grupo.etiqueta}
                      <span className="texto-suave texto-pequeno">
                        {' '}
                        · {grupo.conos.length}{' '}
                        {grupo.conos.length === 1 ? 'tipo' : 'tipos'}
                      </span>
                    </h2>
                  }
                >
                  {rejilla}
                </SeccionDesplegable>
              )
            })}
        </div>
      </div>
    </section>
  )
}
