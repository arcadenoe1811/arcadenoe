import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CAMPOS_CUELLO,
  GRUPOS_CUELLO,
  guardarCuello,
  normalizarError,
  opcionesColores,
  obtenerCuello,
  validarColoresCuello,
  validarCuello,
  valoresInicialesCuello,
  coloresFueraDeLista,
  disenoConColores,
  formatearZona,
  leerZonaColor,
  mapearColoresDiseno,
} from '@inventario/shared'
import { leerHex } from '../components/SelectorColorHex.jsx'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import CampoFormulario from '../components/CampoFormulario.jsx'
import SelectorTipo from '../components/SelectorTipo.jsx'
import PosicionesCuerpo from '../components/PosicionesCuerpo.jsx'
import SelectorMedidas from '../components/SelectorMedidas.jsx'
import EditorColores, {
  crearFilaColor,
  sincronizarFilasColores,
} from '../components/EditorColores.jsx'
import ImagenCuello from '../components/ImagenCuello.jsx'
import DisenadorCuello from '../components/DisenadorCuello.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/** Campos compuestos con control propio; el resto usa CampoFormulario. */
const CONTROLES_PROPIOS = {
  tipo_cuello: SelectorTipo,
  medidas: SelectorMedidas,
}

/** Alta (/cuellos/nuevo) y edicion (/cuellos/:id/editar) de un cuello. */
export default function PaginaFormulario() {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const esEdicion = Boolean(id)
  const { colores: catalogo } = useCatalogoColores()

  const [valores, setValores] = useState(() =>
    valoresInicialesCuello({ codigo: parametros.get('codigo') ?? '' }),
  )
  const [filasColores, setFilasColores] = useState([])
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  // id del cuello ya cargado en el formulario; "cargando" se deriva de el.
  const [idCargado, setIdCargado] = useState(/** @type {string|null} */ (null))
  const cargando = esEdicion && idCargado !== id
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!esEdicion) return undefined
    let vigente = true
    obtenerCuello(id)
      .then((cuello) => {
        if (!vigente) return
        setValores(valoresInicialesCuello(cuello))
        // Al abrir no se descarta nada: solo se completan los colores del
        // cuerpo que no tengan fila (las sobrantes quedan para revisarlas).
        setFilasColores(
          sincronizarFilasColores(
            cuello.colores.map((color) =>
              crearFilaColor(color, { hilosPorDefecto: cuello.cantidad_hilos }),
            ),
            cuello.posiciones_cuerpo?.length ?? 0,
            { estricto: false },
          ),
        )
      })
      .catch((e) => vigente && setErrorGeneral(normalizarError(e)))
      .finally(() => vigente && setIdCargado(id))
    return () => {
      vigente = false
    }
  }, [id, esEdicion])

  const textoGuardar = esEdicion ? 'Guardar cambios' : 'Registrar cuello'

  const cambiarValor = (nombre, valor) => {
    setValores((previos) => ({ ...previos, [nombre]: valor }))
    if (errores[nombre]) setErrores(({ [nombre]: _quitado, ...resto }) => resto)
  }

  // Las posiciones tienen errores por fila (`posiciones_cuerpo.N`).
  // "Cantidad de colores" manda: Colores por zona queda con una fila por
  // cada color del cuerpo (ni mas ni menos).
  const cambiarPosiciones = (nombre, valor) => {
    if (valor.length !== valores[nombre].length) {
      setFilasColores((previas) => sincronizarFilasColores(previas, valor.length))
      setErrores((previos) =>
        Object.fromEntries(
          Object.entries(previos).filter(([clave]) => !clave.startsWith('colores.')),
        ),
      )
    }
    setValores((previos) => ({ ...previos, [nombre]: valor }))
    setErrores((previos) =>
      Object.fromEntries(
        Object.entries(previos).filter(([clave]) => !clave.startsWith(nombre)),
      ),
    )
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral(null)

    // Validacion local inmediata (las reglas viven en @inventario/shared).
    const cuello = validarCuello(valores)
    const colores = validarColoresCuello(filasColores, opcionesColores(valores))
    const erroresLocales = {
      ...cuello.errores,
      ...Object.fromEntries(
        Object.entries(colores.errores).map(([k, v]) => [`colores.${k}`, v]),
      ),
    }
    // El diseno solo puede usar los colores de "Colores por zona".
    if (
      !erroresLocales.diseno &&
      coloresFueraDeLista(
        valores.diseno,
        coloresDiseno.map((c) => c.hex),
      ).length
    ) {
      erroresLocales.diseno =
        'El diseño usa colores que no están en "Colores por zona". Cambia los marcados en rojo.'
    }
    setErrores(erroresLocales)
    if (Object.keys(erroresLocales).length) {
      setErrorGeneral({ mensaje: 'Revisa los campos marcados.' })
      return
    }

    setGuardando(true)
    try {
      const guardado = await guardarCuello(valores, filasColores)
      navegar(`/cuellos/${guardado.id}`, { replace: true })
    } catch (e) {
      const error = normalizarError(e)
      setErrores(error.errores ?? {})
      setErrorGeneral(error)
      setGuardando(false)
    }
  }

  // Colores disponibles para el diseno: los de "Colores por zona" que
  // tienen tono (sin repetir tonos), en el mismo orden.
  /** @type {{ hex: string, nombre: string, detalle: string, letra: boolean }[]} */
  const coloresDiseno = []
  for (const fila of filasColores) {
    const hex = leerHex(fila.hex)
    if (!hex || coloresDiseno.some((c) => c.hex === hex)) continue
    const { zona, posicion } = leerZonaColor(fila.zona)
    const datosPosicion = posicion ? valores.posiciones_cuerpo[posicion - 1] : null
    coloresDiseno.push({
      hex,
      nombre: fila.color.trim() || hex,
      detalle: posicion
        ? `Color ${posicion}${datosPosicion?.posicion ? ` · pos. ${datosPosicion.posicion}` : ''}`
        : formatearZona(zona),
      letra: Boolean(datosPosicion?.letra),
    })
  }

  // Si se cambia el tono de un color en "Colores por zona", el diseno lo
  // sigue (mismo color, nuevo tono) en vez de quedar con el tono viejo.
  const cambiarFilasColores = (nuevas) => {
    const reemplazos = new Map()
    for (const fila of nuevas) {
      const antes = leerHex(filasColores.find((f) => f.clave === fila.clave)?.hex)
      const ahora = leerHex(fila.hex)
      if (antes && ahora && antes !== ahora) reemplazos.set(antes, ahora)
    }
    if (reemplazos.size && valores.diseno) {
      setValores((previos) => ({
        ...previos,
        diseno: mapearColoresDiseno(
          previos.diseno,
          (hex) => reemplazos.get(leerHex(hex)) ?? hex,
        ),
      }))
    }
    setFilasColores(nuevas)
  }

  const editorColores = (
    <EditorColores
      filas={filasColores}
      errores={errores}
      alCambiar={cambiarFilasColores}
      catalogo={catalogo}
      posiciones={valores.posiciones_cuerpo}
      hilosPorDefecto={valores.cantidad_hilos}
    />
  )

  const quitarDiseno = () => {
    if (window.confirm('¿Quitar el diseño de este cuello?')) cambiarValor('diseno', null)
  }

  const disenador = (
    <fieldset className="grupo-campos grupo-diseno">
      <legend>Diseño del cuello</legend>
      {valores.diseno ? (
        <>
          {coloresDiseno.length === 0 && (
            <Aviso tipo="info">
              El diseño usa los colores de &quot;Colores por zona&quot;. Agrega ahí los
              colores con su tono para poder elegirlos.
            </Aviso>
          )}
          <DisenadorCuello
            valor={valores.diseno}
            colores={coloresDiseno}
            error={errores.diseno}
            alCambiar={(diseno) => cambiarValor('diseno', diseno)}
          />
          <div className="grupo-diseno-acciones">
            <button
              type="button"
              className="boton boton-fantasma-peligro boton-sm"
              onClick={quitarDiseno}
            >
              Quitar diseño
            </button>
          </div>
        </>
      ) : (
        <div className="grupo-diseno-vacio">
          <p className="texto-suave">
            Dibuja el cuello en la cuadrícula Jacquard en lugar de subir una imagen: solo
            se guardan el texto, los colores y las líneas.{' '}
            {coloresDiseno.length === 0 &&
              'Primero define en "Colores por zona" los colores con su tono: el diseño solo usa esos.'}
          </p>
          <button
            type="button"
            className="boton boton-secundario"
            disabled={coloresDiseno.length === 0}
            onClick={() =>
              cambiarValor(
                'diseno',
                disenoConColores({
                  texto: valores.nombre,
                  colores: coloresDiseno.map((c) => c.hex),
                  indiceLetra: coloresDiseno.findIndex((c) => c.letra),
                }),
              )
            }
          >
            Crear diseño
          </button>
        </div>
      )}
    </fieldset>
  )

  if (cargando) return <Cargando />
  if (esEdicion && errorGeneral && !valores.id) {
    return (
      <Aviso
        tipo="error"
        accion={
          <Link to="/" className="boton boton-secundario">
            Volver
          </Link>
        }
      >
        {errorGeneral.mensaje}
      </Aviso>
    )
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <nav className="migas">
        <Link to={esEdicion ? `/cuellos/${id}` : '/'}>← Cancelar</Link>
      </nav>
      <h1>{esEdicion ? `Editar ${valores.codigo || 'cuello'}` : 'Nuevo cuello'}</h1>

      {errorGeneral && <Aviso tipo="error">{errorGeneral.mensaje}</Aviso>}

      {GRUPOS_CUELLO.map((grupo) => (
        // "Colores por zona" y el diseno van antes de "Detalle e imagen".
        <Fragment key={grupo.clave}>
          {grupo.clave === 'detalle' && editorColores}
          {grupo.clave === 'detalle' && disenador}
          <fieldset className={`grupo-campos grupo-${grupo.clave}`}>
            <legend>{grupo.titulo}</legend>
            <div className="campos">
              {CAMPOS_CUELLO.filter((campo) => campo.grupo === grupo.clave).map(
                (descriptor) => {
                  if (descriptor.tipo === 'posiciones_cuerpo') {
                    return (
                      <PosicionesCuerpo
                        key={descriptor.nombre}
                        descriptor={descriptor}
                        valor={valores[descriptor.nombre]}
                        errores={errores}
                        alCambiar={cambiarPosiciones}
                      />
                    )
                  }
                  const Control = CONTROLES_PROPIOS[descriptor.tipo] ?? CampoFormulario
                  return (
                    <Control
                      key={descriptor.nombre}
                      descriptor={descriptor}
                      valor={valores[descriptor.nombre]}
                      error={errores[descriptor.nombre]}
                      alCambiar={cambiarValor}
                    />
                  )
                },
              )}
            </div>
            {grupo.clave === 'detalle' && valores.imagen_url && !errores.imagen_url && (
              <div className="vista-previa">
                <span className="texto-pequeno texto-suave">Vista previa</span>
                <ImagenCuello url={valores.imagen_url} alt="Vista previa de la imagen" />
              </div>
            )}
          </fieldset>
        </Fragment>
      ))}

      <div className="formulario-acciones">
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : textoGuardar}
        </button>
        <Link to={esEdicion ? `/cuellos/${id}` : '/'} className="boton boton-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
