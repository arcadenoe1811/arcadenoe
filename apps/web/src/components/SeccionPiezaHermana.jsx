import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  formatearPieza,
  formatearTamanos,
  normalizarError,
  normalizarPieza,
  paletaDiseno,
  traducirColores,
  vincularPuno,
} from '@inventario/shared'
import { usePiezaHermana } from '../hooks/usePiezaHermana.js'
import { useCuellosDelPuno, usePunoDelCuello } from '../hooks/usePunoDelCuello.js'
import { rutaPieza } from '../utils/rutas.js'
import ImagenCuello from './ImagenCuello.jsx'
import BuscadorPieza from './BuscadorPieza.jsx'
import Aviso from './Aviso.jsx'

/** Diseno de `pieza` pintado con los colores (por posicion) de `colores`. */
const conColoresDe = (pieza, colores) =>
  traducirColores(
    pieza.diseno_efectivo,
    paletaDiseno(pieza.colores),
    paletaDiseno(colores),
  )

/** Texto de donde sale el diseno de una pieza. */
function origenDiseno(pieza, fichaId) {
  if (pieza.padre) {
    return pieza.padre.id === fichaId
      ? 'Igual a esta pieza'
      : `Diseño de ${formatearPieza(pieza.padre.pieza).toLowerCase()} ${pieza.padre.codigo}`
  }
  return pieza.diseno_efectivo ? 'Diseño propio' : 'Sin diseño'
}

/**
 * Seccion de la ficha que relaciona cuello y puno.
 * - En un cuello: el puno que usa (uno existente, vinculado con una nota,
 *   o el de su mismo codigo) y las formas de crearlo o elegirlo.
 * - En un puno: su cuello del mismo codigo y los cuellos que lo usan.
 * @param {{ pieza: Record<string, any>, alCambiar: () => void }} props
 */
export default function SeccionPiezaHermana({ pieza, alCambiar }) {
  return normalizarPieza(pieza.pieza) === 'cuello' ? (
    <SeccionPunoDelCuello cuello={pieza} alCambiar={alCambiar} />
  ) : (
    <SeccionCuellosDelPuno puno={pieza} />
  )
}

/* ------------------------------------------------------------------ */

function SeccionPunoDelCuello({ cuello, alCambiar }) {
  const id = useId()
  const navegar = useNavigate()
  const { puno, vinculado, cargando } = usePunoDelCuello(
    cuello.id,
    cuello.codigo,
    cuello.puno_id,
  )
  const [buscando, setBuscando] = useState(false)
  // Puno elegido en el buscador, esperando su nota antes de guardar.
  const [elegido, setElegido] = useState(/** @type {Record<string, any>|null} */ (null))
  const [editandoNota, setEditandoNota] = useState(false)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(/** @type {{ mensaje: string }|null} */ (null))

  const guardar = async (punoId, texto) => {
    setGuardando(true)
    setError(null)
    try {
      await vincularPuno(cuello.id, punoId, texto)
      setElegido(null)
      setEditandoNota(false)
      alCambiar()
    } catch (e) {
      setError(normalizarError(e))
    } finally {
      setGuardando(false)
    }
  }

  const elegir = (p) => {
    setBuscando(false)
    setElegido(p)
    setNota(
      `Mismo diseño que el puño ${p.codigo}, tejido con los colores de ${cuello.codigo}.`,
    )
  }

  const quitar = () => {
    if (window.confirm(`¿Dejar de usar el puño ${puno.codigo} en este cuello?`)) {
      guardar(null, null)
    }
  }

  // Alta de un puno con el mismo codigo, copiando datos tecnicos y colores.
  const crear = (padreId) => {
    const parametros = new URLSearchParams({ codigo: cuello.codigo, desde: cuello.id })
    if (padreId) parametros.set('padre', padreId)
    navegar(`${rutaPieza('puno')}?${parametros}`)
  }

  const campoNota = (
    <div className="campo">
      <label htmlFor={`${id}-nota`}>Nota del puño</label>
      <textarea
        id={`${id}-nota`}
        rows={3}
        maxLength={500}
        value={nota}
        placeholder="Ej: mismo diseño, pero el tubular va en rojo #45"
        onChange={(evento) => setNota(evento.target.value)}
      />
    </div>
  )

  // Paso 2 al elegir un puno existente: vista previa + nota.
  if (elegido) {
    return (
      <section className="tarjeta">
        <h2>Puño</h2>
        {error && <Aviso tipo="error">{error.mensaje}</Aviso>}
        <VistaPuno puno={elegido} cuello={cuello} />
        {campoNota}
        <div className="grupo-diseno-origen acciones-pieza-hermana">
          <button
            type="button"
            className="boton boton-primario boton-sm"
            disabled={guardando}
            onClick={() => guardar(elegido.id, nota)}
          >
            {guardando ? 'Guardando…' : `Usar el puño ${elegido.codigo}`}
          </button>
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            onClick={() => setElegido(null)}
          >
            Cancelar
          </button>
        </div>
      </section>
    )
  }

  const buscador = buscando && (
    <BuscadorPieza
      titulo="¿Qué puño usa este cuello?"
      pieza="puno"
      excluir={puno?.id}
      alElegir={elegir}
      alCancelar={() => setBuscando(false)}
    />
  )

  return (
    <section className="tarjeta">
      <h2>Puño</h2>
      {error && <Aviso tipo="error">{error.mensaje}</Aviso>}
      {cargando && !puno && <p className="texto-suave">Buscando…</p>}

      {puno && vinculado && (
        <>
          <VistaPuno puno={puno} cuello={cuello} />
          {editandoNota ? (
            <>
              {campoNota}
              <div className="grupo-diseno-origen acciones-pieza-hermana">
                <button
                  type="button"
                  className="boton boton-primario boton-sm"
                  disabled={guardando}
                  onClick={() => guardar(puno.id, nota)}
                >
                  Guardar nota
                </button>
                <button
                  type="button"
                  className="boton boton-secundario boton-sm"
                  onClick={() => setEditandoNota(false)}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <p className={cuello.puno_nota ? 'notas' : 'texto-suave texto-pequeno'}>
              {cuello.puno_nota || 'Sin nota.'}
            </p>
          )}
          {!editandoNota && (
            <div className="grupo-diseno-origen acciones-pieza-hermana">
              <button
                type="button"
                className="boton boton-contorno boton-sm"
                onClick={() => {
                  setNota(cuello.puno_nota ?? '')
                  setEditandoNota(true)
                }}
              >
                Editar nota
              </button>
              <button
                type="button"
                className="boton boton-contorno boton-sm"
                onClick={() => setBuscando(true)}
              >
                Cambiar puño…
              </button>
              <button
                type="button"
                className="boton boton-fantasma-peligro boton-sm"
                onClick={quitar}
              >
                Quitar
              </button>
            </div>
          )}
        </>
      )}

      {puno && !vinculado && (
        <>
          <TarjetaPieza pieza={puno} fichaId={cuello.id} />
          <div className="grupo-diseno-origen acciones-pieza-hermana">
            <button
              type="button"
              className="boton boton-contorno boton-sm"
              onClick={() => setBuscando(true)}
            >
              Usar otro puño existente…
            </button>
          </div>
        </>
      )}

      {!cargando && !puno && (
        <>
          <p className="texto-pequeno texto-suave">
            Este cuello no tiene puño. Puedes usar un puño que ya existe (por ejemplo el
            de otro producto, con una nota de los colores) o crear uno con el código{' '}
            <span className="codigo">{cuello.codigo}</span>.
          </p>
          <div className="grupo-diseno-origen acciones-pieza-hermana">
            <button
              type="button"
              className="boton boton-secundario boton-sm"
              onClick={() => setBuscando(true)}
            >
              Usar un puño existente…
            </button>
            <button
              type="button"
              className="boton boton-contorno boton-sm"
              onClick={() => crear(cuello.id)}
              disabled={!cuello.diseno_efectivo}
              title={cuello.diseno_efectivo ? undefined : 'Este cuello no tiene diseño'}
            >
              Crear puño igual a este
            </button>
            <button
              type="button"
              className="boton boton-contorno boton-sm"
              onClick={() => crear(null)}
            >
              Crear puño con diseño propio
            </button>
          </div>
        </>
      )}
      {buscador}
    </section>
  )
}

/** Puno vinculado: original y como queda con los colores del cuello. */
function VistaPuno({ puno, cuello }) {
  return (
    <div className="vista-puno">
      <figure>
        <ImagenCuello
          url={null}
          diseno={conColoresDe(puno, cuello.colores)}
          alt={`Puño ${puno.codigo} con los colores de ${cuello.codigo}`}
        />
        <figcaption className="texto-pequeno">
          Con los colores de <span className="codigo">{cuello.codigo}</span>
        </figcaption>
      </figure>
      <figure>
        <Link to={rutaPieza('puno', puno.id)}>
          <ImagenCuello
            url={puno.imagen_url}
            diseno={puno.diseno_efectivo}
            alt={`Puño ${puno.codigo}`}
          />
        </Link>
        <figcaption className="texto-pequeno">
          Puño <span className="codigo">{puno.codigo}</span> (original) ·{' '}
          {formatearTamanos(puno)}
        </figcaption>
      </figure>
    </div>
  )
}

/** Tarjeta enlazada de una pieza con su origen y tamanos. */
function TarjetaPieza({ pieza, fichaId, nota }) {
  const otra = normalizarPieza(pieza.pieza)
  return (
    <Link to={rutaPieza(pieza.pieza, pieza.id)} className="pieza-hermana">
      <ImagenCuello
        url={pieza.imagen_url}
        diseno={pieza.diseno_efectivo}
        alt={`${formatearPieza(otra)} ${pieza.codigo}`}
      />
      <span className="pieza-hermana-info">
        <span className="codigo">{pieza.codigo}</span>
        <span className="texto-pequeno">{nota ?? origenDiseno(pieza, fichaId)}</span>
        <span className="texto-pequeno texto-suave">
          {otra === 'puno' ? 'Tallas' : 'Medidas'}: {formatearTamanos(pieza)}
        </span>
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ */

function SeccionCuellosDelPuno({ puno }) {
  const { hermana, cargando } = usePiezaHermana('cuello', puno.codigo)
  const { cuellos } = useCuellosDelPuno(puno.id)

  return (
    <section className="tarjeta">
      <h2>Cuello</h2>
      {cargando && !hermana && <p className="texto-suave">Buscando…</p>}
      {hermana && <TarjetaPieza pieza={hermana} fichaId={puno.id} />}
      {!cargando && !hermana && (
        <p className="texto-pequeno texto-suave">
          No hay cuello con el código <span className="codigo">{puno.codigo}</span>.
        </p>
      )}

      {cuellos.length > 0 && (
        <>
          <p className="texto-pequeno">
            También usan este puño ({cuellos.length}{' '}
            {cuellos.length === 1 ? 'cuello' : 'cuellos'}):
          </p>
          <ul className="lista-hijos">
            {cuellos.map((c) => (
              <li key={c.id}>
                <Link to={rutaPieza('cuello', c.id)} className="pieza-hermana">
                  <ImagenCuello
                    url={null}
                    diseno={conColoresDe(puno, c.colores)}
                    alt={`Puño ${puno.codigo} con los colores de ${c.codigo}`}
                  />
                  <span className="pieza-hermana-info">
                    <span>
                      <span className="codigo">{c.codigo}</span>
                      {c.nombre && <span className="texto-suave"> · {c.nombre}</span>}
                    </span>
                    <span className="texto-pequeno">
                      {c.puno_nota || 'Con los colores de ese cuello.'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
