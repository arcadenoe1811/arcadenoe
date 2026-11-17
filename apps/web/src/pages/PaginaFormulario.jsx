import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  GRUPOS_CUELLO,
  calcularOverrides,
  coloresSinPareja,
  coloresUsados,
  conMapaColores,
  paletaConNombres,
  piezaPadrePermitida,
  tallasDeMedidas,
  camposPieza,
  disenoHeredado,
  formatearPieza,
  guardarCuello,
  mapearColoresParcial,
  normalizarCodigo,
  normalizarError,
  normalizarPieza,
  opcionesColores,
  obtenerCuello,
  paletaDiseno,
  traducirColores,
  validarColoresCuello,
  validarCuello,
  valoresInicialesCuello,
  valoresInicialesPosicion,
  coloresFueraDeLista,
  disenoConColores,
  formatearZona,
  leerZonaColor,
  mapearColoresDiseno,
} from '@inventario/shared'
import { leerHex } from '../components/SelectorColorHex.jsx'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useSugerenciaDiseno } from '../hooks/useSugerenciaDiseno.js'
import { rutaPieza } from '../utils/rutas.js'
import CampoFormulario from '../components/CampoFormulario.jsx'
import SelectorTipo from '../components/SelectorTipo.jsx'
import PosicionesCuerpo from '../components/PosicionesCuerpo.jsx'
import SelectorMedidas from '../components/SelectorMedidas.jsx'
import SelectorTallas from '../components/SelectorTallas.jsx'
import EditorColores, {
  crearFilaColor,
  sincronizarFilasColores,
} from '../components/EditorColores.jsx'
import ImagenCuello from '../components/ImagenCuello.jsx'
import DisenadorCuello from '../components/DisenadorCuello.jsx'
import BuscadorPieza from '../components/BuscadorPieza.jsx'
import PanelHerencia from '../components/PanelHerencia.jsx'
import MapaColores from '../components/MapaColores.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/** Campos compuestos con control propio; el resto usa CampoFormulario. */
const CONTROLES_PROPIOS = {
  tipo_cuello: SelectorTipo,
  medidas: SelectorMedidas,
  tallas: SelectorTallas,
}

/**
 * Alta y edicion de una pieza: /cuellos/nuevo, /punos/nuevo,
 * /cuellos/:id/editar y /punos/:id/editar. Cuello y puno usan el mismo
 * formulario y el mismo disenador; el puno cambia medidas por tallas.
 * @param {{ pieza?: 'cuello'|'puno' }} props  pieza del alta (al editar manda la guardada)
 */
export default function PaginaFormulario({ pieza: piezaRuta = 'cuello' }) {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const esEdicion = Boolean(id)
  const { colores: catalogo } = useCatalogoColores()

  const [valores, setValores] = useState(() =>
    valoresInicialesCuello({ codigo: parametros.get('codigo') ?? '', pieza: piezaRuta }),
  )
  const [filasColores, setFilasColores] = useState([])
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  // id del cuello ya cargado en el formulario; "cargando" se deriva de el.
  const [idCargado, setIdCargado] = useState(/** @type {string|null} */ (null))
  // Alta "desde" otra pieza (ej: el puno de un cuello): se copian sus datos
  // tecnicos y colores, y el diseno se hereda de `padre` (si viene).
  const desde = esEdicion ? null : parametros.get('desde')
  const padreInicial = parametros.get('padre') ?? ''
  const idACargar = id ?? desde
  const cargando = Boolean(idACargar) && idCargado !== idACargar
  const [guardando, setGuardando] = useState(false)
  // Pieza padre cargada (con colores y diseno efectivo) si esta hereda.
  const [padre, setPadre] = useState(/** @type {Record<string, any>|null} */ (null))
  // Buscador de piezas abierto: para heredar o para usar como plantilla.
  const [buscando, setBuscando] = useState(
    /** @type {'heredar'|'plantilla'|null} */ (null),
  )

  const pieza = normalizarPieza(valores.pieza)
  const nombrePieza = formatearPieza(pieza).toLowerCase()

  useEffect(() => {
    if (!idACargar) return undefined
    let vigente = true
    obtenerCuello(idACargar)
      .then((cuello) => {
        if (!vigente) return
        setValores(
          esEdicion
            ? valoresInicialesCuello(cuello)
            : valoresInicialesCuello({
                ...cuello,
                // Pieza nueva con el mismo codigo; solo se copia lo tecnico.
                id: '',
                pieza: piezaRuta,
                medidas: piezaRuta === 'puno' ? [] : cuello.medidas,
                tallas: piezaRuta === 'puno' ? tallasDeMedidas(cuello.medidas) : [],
                imagen_url: null,
                notas: null,
                diseno: null,
                padre_id: padreInicial,
                overrides: {},
              }),
        )
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
      .finally(() => vigente && setIdCargado(idACargar))
    return () => {
      vigente = false
    }
  }, [idACargar, esEdicion, piezaRuta, padreInicial])

  // Carga el padre cuando cambia padre_id (al abrir o al elegir uno).
  useEffect(() => {
    const padreId = valores.padre_id
    if (!padreId || padre?.id === padreId) return undefined
    let vigente = true
    obtenerCuello(padreId)
      .then((datos) => vigente && setPadre(datos))
      .catch((e) => vigente && setErrorGeneral(normalizarError(e)))
    return () => {
      vigente = false
    }
  }, [valores.padre_id, padre?.id])
  const padreActual = valores.padre_id && padre?.id === valores.padre_id ? padre : null

  // Sugerencia: otra pieza con el mismo codigo de diseno (puno maz4t5 ->
  // cuello maz4t5) mientras esta todavia no tiene diseno.
  const codigoRetrasado = useDebounce(normalizarCodigo(valores.codigo), 400)
  const sugerencias = useSugerenciaDiseno(
    codigoRetrasado,
    !valores.padre_id && !valores.diseno && codigoRetrasado.length >= 2,
    valores.id,
  )

  const textoGuardar = esEdicion ? 'Guardar cambios' : `Registrar ${nombrePieza}`

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

  // Paleta canonica de esta pieza (mismo orden que en la base): con ella
  // se traducen por posicion los colores que vienen del padre.
  const paletaPropiaNombres = paletaConNombres(
    validarColoresCuello(filasColores, opcionesColores(valores)).datos,
  )
  const paletaPropia = paletaPropiaNombres.map((c) => c.hex)

  // Hijo: base (lo que da el padre) y efectivo (base + overrides). El mapa
  // de colores dice que color del hijo recibe cada color del padre.
  const paletaPadreNombres = paletaConNombres(padreActual?.colores)
  const paletaPadre = paletaPadreNombres.map((c) => c.hex)
  const mapaColores = valores.overrides?.mapa_colores ?? {}
  const herencia = valores.padre_id
    ? disenoHeredado({
        disenoPadre: padreActual?.diseno_efectivo,
        paletaPadre,
        paletaHijo: paletaPropia,
        overrides: valores.overrides,
      })
    : null
  const disenoMostrado = herencia ? herencia.efectivo : valores.diseno
  const sinPareja = herencia
    ? coloresSinPareja({
        disenoPadre: padreActual?.diseno_efectivo,
        paletaPadre,
        paletaHijo: paletaPropia,
        mapa: mapaColores,
      })
    : []
  const errorMapa = sinPareja.length
    ? `${sinPareja.length === 1 ? 'El color' : 'Los colores'} ${sinPareja.join(', ')} del padre no ${sinPareja.length === 1 ? 'tiene' : 'tienen'} pareja en esta pieza: elige a qué color va.`
    : null

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
    // Hijo: cada color que usa el padre necesita pareja en esta pieza.
    if (errorMapa) erroresLocales.mapa_colores = errorMapa
    // La herencia cruza de pieza (la base tambien lo comprueba).
    if (padreActual && normalizarPieza(padreActual.pieza) === pieza) {
      erroresLocales.padre_id = `Un ${nombrePieza} solo puede heredar de un ${formatearPieza(piezaPadrePermitida(pieza)).toLowerCase()}. Cambia el padre o desvincula.`
    }
    // El diseno (propio o heredado) solo puede usar los colores de
    // "Colores por zona".
    if (
      !erroresLocales.diseno &&
      !errorMapa &&
      coloresFueraDeLista(
        disenoMostrado,
        coloresDiseno.map((c) => c.hex),
      ).length
    ) {
      erroresLocales.diseno = valores.padre_id
        ? 'El diseño heredado usa colores que esta pieza no tiene en "Colores por zona". Agrega los colores que faltan (van por posición: color 1, 2, 3…).'
        : 'El diseño usa colores que no están en "Colores por zona". Cambia los marcados en rojo.'
    }
    setErrores(erroresLocales)
    if (Object.keys(erroresLocales).length) {
      setErrorGeneral({ mensaje: 'Revisa los campos marcados.' })
      return
    }

    setGuardando(true)
    try {
      const guardado = await guardarCuello(valores, filasColores)
      navegar(rutaPieza(guardado.pieza, guardado.id), { replace: true })
    } catch (e) {
      const error = normalizarError(e)
      setErrores(error.errores ?? {})
      setErrorGeneral(error)
      setGuardando(false)
    }
  }

  // Al editar un hijo solo se guardan los campos que difieren del padre.
  const cambiarDiseno = (diseno) => {
    if (herencia?.base) {
      cambiarValor(
        'overrides',
        conMapaColores(calcularOverrides(herencia.base, diseno), mapaColores),
      )
    } else cambiarValor('diseno', diseno)
  }

  const cambiarMapaColores = (mapa) =>
    cambiarValor('overrides', conMapaColores(valores.overrides, mapa))

  // Si se cambia el tono de un color en "Colores por zona", el diseno lo
  // sigue (mismo color, nuevo tono) en vez de quedar con el tono viejo.
  const cambiarFilasColores = (nuevas) => {
    const reemplazos = new Map()
    for (const fila of nuevas) {
      const antes = leerHex(filasColores.find((f) => f.clave === fila.clave)?.hex)
      const ahora = leerHex(fila.hex)
      if (antes && ahora && antes !== ahora) reemplazos.set(antes, ahora)
    }
    const reemplazar = (hex) => reemplazos.get(leerHex(hex)) ?? hex
    if (reemplazos.size && valores.padre_id) {
      setValores((previos) => ({
        ...previos,
        overrides: mapearColoresParcial(previos.overrides ?? {}, reemplazar),
      }))
    } else if (reemplazos.size && valores.diseno) {
      setValores((previos) => ({
        ...previos,
        diseno: mapearColoresDiseno(previos.diseno, reemplazar),
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

  /* ---------- Origen del diseno: desde cero, plantilla o heredado ---------- */

  const crearDesdeCero = () =>
    cambiarValor(
      'diseno',
      disenoConColores({
        texto: valores.nombre,
        colores: coloresDiseno.map((c) => c.hex),
        indiceLetra: coloresDiseno.findIndex((c) => c.letra),
      }),
    )

  // Plantilla: copia el diseno (colores traducidos por posicion), sin vinculo.
  const usarPlantilla = (fuente) => {
    setBuscando(null)
    setValores((previos) => ({
      ...previos,
      padre_id: '',
      overrides: {},
      diseno: traducirColores(
        fuente.diseno_efectivo,
        paletaDiseno(fuente.colores),
        paletaPropia,
      ),
    }))
  }

  const heredarDe = (fuente) => {
    if (
      valores.diseno &&
      !window.confirm(
        `Esto cambia el diseño de ESTE ${nombrePieza} (${valores.codigo || 'nuevo'}): su diseño propio se reemplaza por el de ${fuente.codigo}.` +
          (pieza === 'cuello'
            ? '\n\nSi lo que quieres es que el PUÑO use otro diseño, cancela y hazlo desde la ficha del cuello, sección "Puño".'
            : '') +
          '\n\n¿Continuar?',
      )
    )
      return
    setBuscando(null)
    setErrores(({ padre_id: _padre, diseno: _diseno, ...resto }) => resto)
    setValores((previos) => ({
      ...previos,
      padre_id: fuente.id,
      overrides: {},
      diseno: null,
    }))
  }

  // Deja de seguir al padre: el diseno que se ve pasa a ser propio.
  const desvincular = () => {
    if (!window.confirm('¿Dejar de heredar? El diseño actual se copia como propio.'))
      return
    setValores((previos) => ({
      ...previos,
      padre_id: '',
      overrides: {},
      diseno: herencia?.efectivo ?? null,
    }))
  }

  const restablecerCampo = (campo) =>
    cambiarValor(
      'overrides',
      Object.fromEntries(
        Object.entries(valores.overrides ?? {}).filter(([clave]) => clave !== campo),
      ),
    )

  // Un hijo sin colores puede copiar los del padre (posiciones y colores);
  // despues se cambian solo los que difieren.
  const copiarColoresPadre = () => {
    if (!padreActual) return
    const posiciones = valores.posiciones_cuerpo.length
      ? valores.posiciones_cuerpo
      : (padreActual.posiciones_cuerpo ?? []).map((p) => valoresInicialesPosicion(p))
    const hilos = valores.cantidad_hilos || String(padreActual.cantidad_hilos ?? '')
    setValores((previos) => ({
      ...previos,
      posiciones_cuerpo: posiciones,
      cantidad_hilos: hilos,
    }))
    setFilasColores(
      sincronizarFilasColores(
        (padreActual.colores ?? []).map((color) =>
          crearFilaColor(color, { hilosPorDefecto: hilos }),
        ),
        posiciones.length,
        { estricto: false },
      ),
    )
  }

  const quitarDiseno = () => {
    if (window.confirm(`¿Quitar el diseño de este ${nombrePieza}?`)) {
      cambiarValor('diseno', null)
    }
  }

  const buscador = buscando && (
    <BuscadorPieza
      titulo={
        buscando === 'heredar'
          ? `Elige el ${formatearPieza(piezaPadrePermitida(pieza)).toLowerCase()} padre (este ${nombrePieza} seguirá sus cambios)`
          : 'Elige el diseño a copiar como plantilla'
      }
      excluir={valores.id}
      // La herencia cruza de pieza: un cuello solo hereda de un puno y al reves.
      pieza={buscando === 'heredar' ? piezaPadrePermitida(pieza) : ''}
      alElegir={buscando === 'heredar' ? heredarDe : usarPlantilla}
      alCancelar={() => setBuscando(null)}
    />
  )

  const sugerencia = sugerencias[0] && !buscando && (
    <Aviso
      tipo="info"
      accion={
        <div className="grupo-diseno-origen">
          <button
            type="button"
            className="boton boton-primario boton-sm"
            onClick={() => heredarDe(sugerencias[0])}
          >
            Heredar
          </button>
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            onClick={() => usarPlantilla(sugerencias[0])}
          >
            Usar como plantilla
          </button>
        </div>
      }
    >
      Ya existe el {formatearPieza(sugerencias[0].pieza).toLowerCase()}{' '}
      <strong>{sugerencias[0].codigo}</strong> con diseño. Puedes heredarlo (seguirá sus
      cambios) o copiarlo como plantilla.
    </Aviso>
  )

  const avisoSinColores = coloresDiseno.length === 0 && (
    <Aviso
      tipo="info"
      accion={
        padreActual?.colores?.length ? (
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            onClick={copiarColoresPadre}
          >
            Copiar colores del padre
          </button>
        ) : null
      }
    >
      El diseño usa los colores de &quot;Colores por zona&quot;. Agrega ahí los colores
      con su tono para poder elegirlos.
    </Aviso>
  )

  let contenidoDiseno
  if (valores.padre_id) {
    contenidoDiseno = (
      <>
        <PanelHerencia
          padre={padreActual}
          overrides={valores.overrides}
          error={errores.padre_id}
          alRestablecer={restablecerCampo}
          alCambiarPadre={() => setBuscando('heredar')}
          alDesvincular={desvincular}
        />
        {buscador}
        {avisoSinColores}
        {padreActual && paletaPropia.length > 0 && (
          <MapaColores
            paletaPadre={paletaPadreNombres}
            paletaHijo={paletaPropiaNombres}
            usados={coloresUsados(padreActual.diseno_efectivo, paletaPadre)}
            mapa={mapaColores}
            error={errorMapa ?? undefined}
            alCambiar={cambiarMapaColores}
          />
        )}
        {!padreActual && <Cargando texto="Cargando diseño padre…" />}
        {padreActual && !disenoMostrado && (
          <Aviso tipo="info">El padre todavía no tiene diseño.</Aviso>
        )}
        {disenoMostrado && (
          <DisenadorCuello
            valor={disenoMostrado}
            colores={coloresDiseno}
            error={errores.diseno}
            etiquetaPieza={nombrePieza}
            alCambiar={cambiarDiseno}
          />
        )}
      </>
    )
  } else if (valores.diseno) {
    contenidoDiseno = (
      <>
        {avisoSinColores}
        <DisenadorCuello
          valor={valores.diseno}
          colores={coloresDiseno}
          error={errores.diseno}
          etiquetaPieza={nombrePieza}
          alCambiar={cambiarDiseno}
        />
        {buscador}
        <div className="grupo-diseno-acciones">
          <button
            type="button"
            className="boton boton-contorno boton-sm"
            onClick={() => setBuscando('heredar')}
          >
            Heredar de otra pieza
          </button>
          <button
            type="button"
            className="boton boton-fantasma-peligro boton-sm"
            onClick={quitarDiseno}
          >
            Quitar diseño
          </button>
        </div>
      </>
    )
  } else {
    contenidoDiseno = (
      <>
        {sugerencia}
        <div className="grupo-diseno-vacio">
          <p className="texto-suave">
            Dibuja el {nombrePieza} en la cuadrícula Jacquard en lugar de subir una
            imagen: solo se guardan el texto, los colores y las líneas.{' '}
            {coloresDiseno.length === 0 &&
              'Para crearlo desde cero, primero define en "Colores por zona" los colores con su tono: el diseño solo usa esos.'}
          </p>
          <div className="grupo-diseno-origen">
            <button
              type="button"
              className="boton boton-secundario"
              disabled={coloresDiseno.length === 0}
              onClick={crearDesdeCero}
            >
              Crear desde cero
            </button>
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => setBuscando('plantilla')}
            >
              Usar plantilla
            </button>
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => setBuscando('heredar')}
            >
              Heredar de otra pieza
            </button>
          </div>
        </div>
        {buscador}
      </>
    )
  }

  const disenador = (
    <fieldset className="grupo-campos grupo-diseno">
      <legend>Diseño del {nombrePieza}</legend>
      {contenidoDiseno}
    </fieldset>
  )

  if (cargando) return <Cargando />
  if (esEdicion && errorGeneral && !valores.id) {
    return (
      <Aviso
        tipo="error"
        accion={
          <Link to="/cuellos" className="boton boton-secundario">
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
        <Link to={esEdicion ? rutaPieza(pieza, id) : '/cuellos'}>← Cancelar</Link>
      </nav>
      <h1>
        {esEdicion
          ? `Editar ${nombrePieza} ${valores.codigo}`.trim()
          : `Nuevo ${nombrePieza}`}
      </h1>

      {errorGeneral && <Aviso tipo="error">{errorGeneral.mensaje}</Aviso>}

      {GRUPOS_CUELLO.map((grupo) => (
        // "Colores por zona" y el diseno van antes de "Detalle e imagen".
        <Fragment key={grupo.clave}>
          {grupo.clave === 'detalle' && editorColores}
          {grupo.clave === 'detalle' && disenador}
          <fieldset className={`grupo-campos grupo-${grupo.clave}`}>
            <legend>{grupo.titulo}</legend>
            <div className="campos">
              {camposPieza(pieza)
                .filter((campo) => campo.grupo === grupo.clave)
                .map((descriptor) => {
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
                })}
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
        <Link
          to={esEdicion ? rutaPieza(pieza, id) : '/cuellos'}
          className="boton boton-secundario"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
