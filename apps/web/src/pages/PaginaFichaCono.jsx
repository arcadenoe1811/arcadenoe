import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ETIQUETAS_FAMILIA,
  cambiarActivoCono,
  eliminarCono,
  formatearEntero,
  formatearFecha,
  formatearMoneda,
  formatearPeso,
  normalizarError,
  normalizarUrlImagen,
} from '@inventario/shared'
import { useCono } from '../hooks/useConos.js'
import { useAuth } from '../hooks/useAuth.js'
import MuestraCono from '../components/conos/MuestraCono.jsx'
import InsigniaEstadoCono from '../components/conos/InsigniaEstadoCono.jsx'
import ListaMovimientos from '../components/conos/ListaMovimientos.jsx'
import SeccionDesplegable from '../components/conos/SeccionDesplegable.jsx'
import ModalMovimiento from '../components/conos/ModalMovimiento.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

export default function PaginaFichaCono() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { cono, movimientos, cargando, error, recargar } = useCono(id)
  // Desactivar y eliminar son bajas: solo admin (la base responde 403).
  const puedeEliminar = useAuth().puede('conos.eliminar')
  const [modal, setModal] = useState(
    /** @type {null|'entrada'|'salida'|'ajuste'} */ (null),
  )
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))
  const [errorAccion, setErrorAccion] = useState(/** @type {string|null} */ (null))
  const [procesando, setProcesando] = useState(false)

  if (cargando && !cono) return <Cargando />
  if (error && !cono) {
    return (
      <Aviso
        tipo="error"
        accion={
          <Link to="/conos" className="boton boton-secundario">
            Volver
          </Link>
        }
      >
        {error.mensaje}
      </Aviso>
    )
  }

  const abrir = (tipo) => {
    setMensaje(null)
    setModal(tipo)
  }

  const alternarActivo = async () => {
    setProcesando(true)
    setErrorAccion(null)
    try {
      await cambiarActivoCono(cono.id, !cono.activo)
      recargar()
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje)
    } finally {
      setProcesando(false)
    }
  }

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar el cono ${cono.codigo}? No se puede deshacer.`)) return
    setProcesando(true)
    setErrorAccion(null)
    try {
      await eliminarCono(cono.id)
      navegar('/conos/muestrario', { replace: true })
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje)
      setProcesando(false)
    }
  }

  const imagen = normalizarUrlImagen(cono.imagen_url, 600)

  return (
    <section className="ficha-cono">
      <nav className="migas">
        <Link to="/conos/muestrario" className="boton boton-secundario boton-volver">
          <span aria-hidden="true">←</span> Volver al muestrario
        </Link>
      </nav>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {errorAccion && <Aviso tipo="error">{errorAccion}</Aviso>}
      {!cono.activo && (
        <Aviso tipo="info">
          Este cono está desactivado: no aparece en el muestrario ni en el resumen.
        </Aviso>
      )}

      <header className="ficha-cono-encabezado">
        <MuestraCono hex={cono.hex} texto={cono.codigo_color} tamano="lg" />
        <div className="ficha-cono-titulo">
          <h1>{cono.nombre_color}</h1>
          <p className="texto-suave">
            <code className="codigo">{cono.codigo}</code> ·{' '}
            {[cono.material, cono.titulo_hilo].filter(Boolean).join(' · ')}
          </p>
          <div className="ficha-cono-stock">
            <span className="ficha-cono-stock-numero">
              {formatearEntero(cono.stock_actual)}
            </span>
            <span>
              {cono.stock_actual === 1 ? 'cono' : 'conos'} en stock
              <br />
              <span className="texto-suave texto-pequeno">
                mínimo {formatearEntero(cono.stock_minimo)}
              </span>
            </span>
            {cono.activo && <InsigniaEstadoCono cono={cono} grande />}
          </div>
        </div>
      </header>

      {cono.activo && (
        <div className="acciones-stock">
          <button
            type="button"
            className="boton boton-lg boton-movimiento boton-entrada"
            onClick={() => abrir('entrada')}
          >
            + Entrada
          </button>
          <button
            type="button"
            className="boton boton-lg boton-movimiento boton-salida"
            onClick={() => abrir('salida')}
            disabled={cono.stock_actual === 0}
          >
            − Salida
          </button>
          <button
            type="button"
            className="boton boton-lg boton-secundario"
            onClick={() => abrir('ajuste')}
          >
            Ajustar conteo
          </button>
        </div>
      )}

      <div className="ficha-cono-cuerpo">
        <SeccionDesplegable className="tarjeta" titulo={<h2>Datos del cono</h2>}>
          <dl className="lista-datos">
            <dt>Color</dt>
            <dd>
              <code>{cono.hex}</code>
            </dd>
            <dt>N.º de color</dt>
            <dd>{cono.codigo_color ?? '—'}</dd>
            <dt>Familia</dt>
            <dd>{ETIQUETAS_FAMILIA[cono.familia_color]}</dd>
            <dt>Color del catálogo</dt>
            <dd>{cono.color_catalogo?.nombre ?? '—'}</dd>
            <dt>Proveedor</dt>
            <dd>{cono.proveedor ?? '—'}</dd>
            <dt>Peso por cono</dt>
            <dd>{formatearPeso(cono.peso_por_cono_g)}</dd>
            <dt>Costo por cono</dt>
            <dd>{formatearMoneda(cono.costo_por_cono)}</dd>
            <dt>Costo por kilo</dt>
            <dd>{formatearMoneda(cono.costo_por_kilo)}</dd>
            <dt>Valor en stock</dt>
            <dd>{formatearMoneda(cono.valor_stock)}</dd>
            <dt>Peso en stock</dt>
            <dd>
              {cono.peso_por_cono_g
                ? formatearPeso(cono.peso_por_cono_g * cono.stock_actual)
                : '—'}
            </dd>
            {cono.notas && (
              <>
                <dt className="dato-ancho">Notas</dt>
                <dd className="dato-ancho">
                  <p className="notas">{cono.notas}</p>
                </dd>
              </>
            )}
          </dl>
          {imagen && (
            <img
              className="ficha-cono-imagen"
              src={imagen}
              alt={`Foto del cono ${cono.nombre_color}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          <p className="texto-suave texto-pequeno margen-arriba">
            Registrado {formatearFecha(cono.created_at)}
            {cono.updated_at && ` · editado ${formatearFecha(cono.updated_at)}`}
          </p>
          <div className="ficha-acciones margen-arriba">
            <Link to={`/conos/${cono.id}/editar`} className="boton boton-secundario">
              Editar datos
            </Link>
            {puedeEliminar && (
              <button
                type="button"
                className="boton boton-secundario"
                onClick={alternarActivo}
                disabled={procesando}
              >
                {cono.activo ? 'Desactivar' : 'Reactivar'}
              </button>
            )}
            {puedeEliminar && movimientos.length === 0 && (
              <button
                type="button"
                className="boton boton-fantasma boton-fantasma-peligro"
                onClick={eliminar}
                disabled={procesando}
              >
                Eliminar
              </button>
            )}
          </div>
        </SeccionDesplegable>

        <SeccionDesplegable
          className="tarjeta"
          titulo={
            <h2>
              Historial{' '}
              <span className="texto-suave texto-pequeno">
                (
                {movimientos.length === 1
                  ? '1 movimiento'
                  : `${movimientos.length} movimientos`}
                )
              </span>
            </h2>
          }
        >
          <ListaMovimientos movimientos={movimientos} />
        </SeccionDesplegable>
      </div>

      {modal && (
        <ModalMovimiento
          tipoInicial={modal}
          cono={cono}
          alCerrar={() => setModal(null)}
          alRegistrar={(texto) => {
            setModal(null)
            setMensaje(texto)
            recargar()
          }}
        />
      )}
    </section>
  )
}
