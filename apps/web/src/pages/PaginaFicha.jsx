import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DATOS_FICHA,
  agruparColoresPorZona,
  desactivarCuello,
  formatearFecha,
  formatearZona,
  normalizarError,
  posicionesConColor,
  reactivarCuello,
} from '@inventario/shared'
import { useCuello } from '../hooks/useCuello.js'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import ImagenCuello from '../components/ImagenCuello.jsx'
import EtiquetaTipo from '../components/EtiquetaTipo.jsx'
import MuestraColor from '../components/MuestraColor.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

export default function PaginaFicha() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { cuello, cargando, error, recargar } = useCuello(id)
  const { colores: catalogo } = useCatalogoColores()
  const [errorAccion, setErrorAccion] = useState(null)
  const [procesando, setProcesando] = useState(false)

  if (cargando && !cuello) return <Cargando />
  if (error && !cuello) {
    return (
      <Aviso
        tipo="error"
        accion={
          <Link to="/" className="boton boton-secundario">
            Volver
          </Link>
        }
      >
        {error.mensaje}
      </Aviso>
    )
  }

  const hexPorNombre = Object.fromEntries(
    catalogo.map((c) => [c.nombre.toLowerCase(), c.hex]),
  )
  const grupos = agruparColoresPorZona(cuello.colores)

  const cambiarEstado = async () => {
    if (
      cuello.activo &&
      !window.confirm(
        `¿Dar de baja el cuello “${cuello.codigo}”? Dejará de aparecer en la búsqueda.`,
      )
    )
      return
    setProcesando(true)
    setErrorAccion(null)
    try {
      if (cuello.activo) {
        await desactivarCuello(cuello.id)
        navegar('/')
      } else {
        await reactivarCuello(cuello.id)
        recargar()
      }
    } catch (e) {
      setErrorAccion(normalizarError(e))
    } finally {
      setProcesando(false)
    }
  }

  return (
    <article className="ficha">
      <nav className="migas">
        <button
          type="button"
          className="boton boton-fantasma"
          // vuelve a la busqueda anterior (con sus filtros) si se llego desde la app
          onClick={() => (window.history.state?.idx > 0 ? navegar(-1) : navegar('/'))}
        >
          ← Volver
        </button>
      </nav>

      {!cuello.activo && (
        <Aviso tipo="info">
          Este cuello está dado de baja y no aparece en la búsqueda.
        </Aviso>
      )}
      {errorAccion && <Aviso tipo="error">{errorAccion.mensaje}</Aviso>}

      <header className="ficha-encabezado">
        <div>
          <h1 className="codigo codigo-grande">{cuello.codigo}</h1>
          {cuello.nombre && <p className="ficha-nombre">{cuello.nombre}</p>}
        </div>
        <EtiquetaTipo tipo={cuello.tipo} />
        <div className="ficha-acciones">
          <Link to={`/cuellos/${cuello.id}/editar`} className="boton boton-primario">
            Editar
          </Link>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={cambiarEstado}
            disabled={procesando}
          >
            {cuello.activo ? 'Dar de baja' : 'Reactivar'}
          </button>
        </div>
      </header>

      <div className="ficha-cuerpo">
        <div className="ficha-imagen">
          <ImagenCuello
            url={cuello.imagen_url}
            diseno={cuello.diseno}
            alt={`Cuello ${cuello.codigo}`}
            tamano="grande"
          />
          {cuello.imagen_url && !cuello.diseno && (
            <a
              href={cuello.imagen_url}
              target="_blank"
              rel="noreferrer"
              className="texto-pequeno"
            >
              Abrir imagen original ↗
            </a>
          )}
        </div>

        <div className="ficha-datos">
          <section className="tarjeta">
            <h2>Datos técnicos</h2>
            <dl className="lista-datos">
              {DATOS_FICHA.map((dato) =>
                dato.clave === 'posiciones_cuerpo' && cuello.posiciones_cuerpo?.length ? (
                  // Cada posicion con el color que lleva: "4 = rojo".
                  <div key={dato.clave} className="dato-ancho">
                    <dt>{dato.etiqueta}</dt>
                    <dd>
                      <ol className="lista-posiciones">
                        {posicionesConColor(cuello.posiciones_cuerpo, cuello.colores).map(
                          (p) => (
                            <li key={p.numero}>
                              <span className="lista-posiciones-numero">
                                {p.posicion ?? '?'}
                              </span>
                              <span aria-hidden="true">=</span>
                              <MuestraColor
                                hex={p.hex ?? hexPorNombre[p.color?.toLowerCase()]}
                              />
                              <span className={p.color ? undefined : 'texto-suave'}>
                                {p.color ?? 'sin color'}
                              </span>
                              {p.letra && (
                                <span className="insignia-posicion">letra</span>
                              )}
                            </li>
                          ),
                        )}
                      </ol>
                    </dd>
                  </div>
                ) : (
                  <div key={dato.clave}>
                    <dt>{dato.etiqueta}</dt>
                    <dd>{dato.obtener(cuello)}</dd>
                  </div>
                ),
              )}
            </dl>
          </section>

          <section className="tarjeta">
            <h2>Colores</h2>
            {grupos.length === 0 ? (
              <p className="texto-suave">Sin colores detallados.</p>
            ) : (
              grupos.map((grupo) => (
                <div key={grupo.zona} className="zona-colores">
                  <h3>{formatearZona(grupo.zona)}</h3>
                  <ul>
                    {grupo.colores.map((color) => (
                      <li key={color.id}>
                        <MuestraColor
                          hex={color.hex ?? hexPorNombre[color.color?.toLowerCase()]}
                        />
                        {color.posicion && (
                          <span className="insignia-posicion">
                            Color {color.posicion}
                            {cuello.posiciones_cuerpo?.[color.posicion - 1]?.letra
                              ? ' · letra'
                              : ''}
                          </span>
                        )}
                        <span>{color.color}</span>
                        {color.codigo && (
                          <span className="codigo-cono">#{color.codigo}</span>
                        )}
                        {color.cantidad_hilos !== null && (
                          <span className="texto-suave">
                            {color.cantidad_hilos}{' '}
                            {color.cantidad_hilos === 1 ? 'hilo' : 'hilos'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="tarjeta">
            <h2>Notas</h2>
            {cuello.notas ? (
              <p className="notas">{cuello.notas}</p>
            ) : (
              <p className="texto-suave">Sin notas.</p>
            )}
          </section>

          <p className="texto-pequeno texto-suave">
            Creado: {formatearFecha(cuello.created_at)}
            {cuello.updated_at && ` · Actualizado: ${formatearFecha(cuello.updated_at)}`}
          </p>
        </div>
      </div>
    </article>
  )
}
