import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DATOS_FICHA,
  ETIQUETAS_HEREDABLES,
  agruparColoresPorZona,
  codigosMaquina,
  desactivarCuello,
  formatearPieza,
  formatearFecha,
  formatearZona,
  normalizarError,
  posicionesConColor,
  reactivarCuello,
} from '@inventario/shared'
import { useCuello } from '../hooks/useCuello.js'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import { useHijos } from '../hooks/useHijos.js'
import { useAuth } from '../hooks/useAuth.js'
import SeccionPiezaHermana from '../components/SeccionPiezaHermana.jsx'
import { rutaPieza } from '../utils/rutas.js'
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
  const { hijos } = useHijos(id)
  // El operador solo consulta cuellos y punos (la base responde 403).
  const puedeEditar = useAuth().puede('cuellos.editar')
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
  const pieza = formatearPieza(cuello.pieza)
  const nombrePieza = pieza.toLowerCase()
  const codigos = codigosMaquina(cuello)
  const cambiosPadre = Object.keys(cuello.overrides ?? {})
    .map((campo) => ETIQUETAS_HEREDABLES[campo])
    .filter(Boolean)

  const cambiarEstado = async () => {
    if (
      cuello.activo &&
      !window.confirm(
        `¿Dar de baja el ${nombrePieza} “${cuello.codigo}”? Dejará de aparecer en la búsqueda.${
          hijos.length
            ? ` Tiene ${hijos.length} ${hijos.length === 1 ? 'pieza que hereda' : 'piezas que heredan'} su diseño: lo seguirán usando.`
            : ''
        }`,
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
          Este {nombrePieza} está dado de baja y no aparece en la búsqueda.
        </Aviso>
      )}
      {errorAccion && <Aviso tipo="error">{errorAccion.mensaje}</Aviso>}

      <header className="ficha-encabezado">
        <div>
          <span className="insignia-posicion">{pieza}</span>
          <h1 className="codigo codigo-grande">{cuello.codigo}</h1>
          {cuello.nombre && <p className="ficha-nombre">{cuello.nombre}</p>}
          {codigos.length > 0 && (
            <p className="texto-pequeno texto-suave">
              Códigos de máquina: <span className="codigo">{codigos.join(' · ')}</span>
            </p>
          )}
        </div>
        <EtiquetaTipo tipo={cuello.tipo} />
        {puedeEditar && (
          <div className="ficha-acciones">
            <Link
              to={rutaPieza(cuello.pieza, cuello.id, 'editar')}
              className="boton boton-primario"
            >
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
        )}
      </header>

      <div className="ficha-cuerpo">
        <div className="ficha-imagen">
          <ImagenCuello
            url={cuello.imagen_url}
            diseno={cuello.diseno_efectivo ?? cuello.diseno}
            alt={`${pieza} ${cuello.codigo}`}
            tamano="grande"
          />
          {cuello.imagen_url && !cuello.diseno_efectivo && (
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

          <SeccionPiezaHermana key={cuello.id} pieza={cuello} alCambiar={recargar} />

          {(cuello.padre || hijos.length > 0) && (
            <section className="tarjeta">
              <h2>Diseño</h2>
              {cuello.padre && (
                <p>
                  Hereda de{' '}
                  <Link to={rutaPieza(cuello.padre.pieza, cuello.padre.id)}>
                    {formatearPieza(cuello.padre.pieza).toLowerCase()}{' '}
                    <span className="codigo">{cuello.padre.codigo}</span>
                  </Link>
                  {cambiosPadre.length > 0 ? (
                    <span className="texto-suave">
                      {' '}
                      · cambia: {cambiosPadre.join(', ')}
                    </span>
                  ) : (
                    <span className="texto-suave"> · igual al padre</span>
                  )}
                </p>
              )}
              {hijos.length > 0 && (
                <>
                  <p className="texto-pequeno texto-suave">Heredan este diseño:</p>
                  <ul className="lista-hijos">
                    {hijos.map((hijo) => (
                      <li key={hijo.id}>
                        <Link to={rutaPieza(hijo.pieza, hijo.id)}>
                          <span className="insignia-posicion">
                            {formatearPieza(hijo.pieza)}
                          </span>{' '}
                          <span className="codigo">{hijo.codigo}</span>
                          {hijo.nombre && ` · ${hijo.nombre}`}
                        </Link>
                        {Object.keys(hijo.overrides ?? {}).length > 0 && (
                          <span className="texto-suave texto-pequeno">
                            {' '}
                            (con cambios)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

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
