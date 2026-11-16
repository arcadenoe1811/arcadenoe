import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FAMILIAS_COLOR,
  MATERIALES,
  TITULOS_HILO,
  formatearMoneda,
  guardarCono,
  leerDecimal,
  normalizarError,
  sugerirFamiliaColor,
  valoresDistintos,
} from '@inventario/shared'
import { useCono, useConos } from '../hooks/useConos.js'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import { soloEnteros } from '../utils/soloEnteros.js'
import SelectorColorHex, { leerHex } from '../components/SelectorColorHex.jsx'
import MuestraCono from '../components/conos/MuestraCono.jsx'
import CampoSugerencias from '../components/ui/CampoSugerencias.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/** Fila de la base -> valores del formulario (todo texto). */
function aFormulario(cono) {
  if (!cono) {
    return {
      codigo: '',
      nombre_color: '',
      hex: '',
      color_catalogo_id: '',
      codigo_color: '',
      familia_color: '',
      material: '',
      titulo_hilo: '',
      proveedor: '',
      peso_por_cono: '',
      unidad_peso: 'g',
      costo: '',
      modo_costo: 'cono',
      stock_minimo: '',
      stock_inicial: '',
      imagen_url: '',
      notas: '',
    }
  }
  const texto = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    id: cono.id,
    codigo: cono.codigo,
    nombre_color: cono.nombre_color,
    hex: cono.hex,
    color_catalogo_id: texto(cono.color_catalogo_id),
    codigo_color: texto(cono.codigo_color),
    familia_color: cono.familia_color,
    material: cono.material,
    titulo_hilo: texto(cono.titulo_hilo),
    proveedor: texto(cono.proveedor),
    // Ya no se pide en el formulario; se conserva el valor guardado.
    // El peso ya no se pide en el formulario; se conserva el guardado.
    peso_por_cono: texto(cono.peso_por_cono_g),
    unidad_peso: 'g',
    costo: texto(cono.costo_por_cono),
    modo_costo: 'cono',
    stock_minimo: texto(cono.stock_minimo),
    imagen_url: texto(cono.imagen_url),
    notas: texto(cono.notas),
    activo: cono.activo,
  }
}

/** Campo con etiqueta, ayuda y error. */
function Campo({ id, etiqueta, requerido, error, ayuda, ancho, children }) {
  return (
    <div
      className={`campo${error ? ' campo-con-error' : ''}${ancho ? ' campo-ancho' : ''}`}
    >
      <label htmlFor={id}>
        {etiqueta}
        {requerido && (
          <span className="requerido" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <small className="campo-error">{error}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  )
}

function FormularioCono({ inicial }) {
  const navegar = useNavigate()
  const { colores: catalogo } = useCatalogoColores()
  const { conos } = useConos()
  const [f, setF] = useState(() => aFormulario(inicial))
  // Mientras el usuario no elija la familia a mano, se sugiere segun el hex.
  const [familiaManual, setFamiliaManual] = useState(Boolean(inicial))
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [errorGeneral, setErrorGeneral] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)
  const editando = Boolean(inicial)

  const cambiar = (nombre, valor) => {
    setF((previo) => ({ ...previo, [nombre]: valor }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  const familia = familiaManual
    ? f.familia_color
    : (sugerirFamiliaColor(leerHex(f.hex), f.material) ?? f.familia_color)

  const elegirDelCatalogo = (idColor) => {
    cambiar('color_catalogo_id', idColor)
    const color = catalogo.find((c) => c.id === idColor)
    if (!color) return
    // Completa nombre y hex si estan vacios.
    setF((previo) => ({
      ...previo,
      color_catalogo_id: idColor,
      nombre_color:
        previo.nombre_color ||
        color.nombre.charAt(0).toUpperCase() + color.nombre.slice(1),
      hex: previo.hex || color.hex || '',
    }))
  }

  // Costo equivalente en la otra unidad, como ayuda.
  const costo = leerDecimal(f.costo)
  let costoEquivalente
  if (costo) {
    costoEquivalente =
      f.modo_costo === 'docena'
        ? `= ${formatearMoneda(costo / 12)} por cono`
        : `= ${formatearMoneda(costo * 12)} por docena`
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorGeneral(null)
    try {
      const cono = await guardarCono({ ...f, familia_color: familia })
      navegar(`/conos/${cono.id}`, { replace: editando })
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores ?? {})
      setErrorGeneral(normalizado.mensaje)
      setGuardando(false)
    }
  }

  const hexValido = leerHex(f.hex)
  const proveedores = valoresDistintos(conos, 'proveedor')
  const materiales = [...new Set([...MATERIALES, ...valoresDistintos(conos, 'material')])]
  const titulos = [
    ...new Set([...TITULOS_HILO, ...valoresDistintos(conos, 'titulo_hilo')]),
  ]

  return (
    <form className="formulario formulario-cono" onSubmit={enviar} noValidate>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

      <fieldset className="grupo-campos">
        <legend>Color</legend>
        <div className="vista-color-cono">
          <MuestraCono
            hex={hexValido ?? '#ffffff'}
            texto={f.codigo_color || null}
            tamano="lg"
            className={hexValido ? '' : 'muestra-cono-vacia'}
          />
          <div className="campos">
            <Campo
              id="cono-nombre"
              etiqueta="Nombre del color"
              requerido
              error={errores.nombre_color}
            >
              <input
                id="cono-nombre"
                autoComplete="off"
                placeholder="Ej: Dorado oscuro"
                value={f.nombre_color}
                onChange={(e) => cambiar('nombre_color', e.target.value)}
              />
            </Campo>
            <Campo id="cono-hex" etiqueta="Color (hex)" requerido error={errores.hex}>
              <div className="entrada-hex">
                <SelectorColorHex
                  valor={hexValido ?? ''}
                  etiqueta="Color del cono"
                  mostrarHex={false}
                  conCatalogo={false}
                  alCambiar={(hex) => cambiar('hex', hex)}
                />
                <input
                  id="cono-hex"
                  autoComplete="off"
                  placeholder="#b8860b"
                  value={f.hex}
                  onChange={(e) => cambiar('hex', e.target.value)}
                />
              </div>
            </Campo>
            <Campo
              id="cono-catalogo"
              etiqueta="Color del catálogo"
              ayuda="Lo enlaza con el diseñador de cuellos y puños."
            >
              <select
                id="cono-catalogo"
                value={f.color_catalogo_id}
                onChange={(e) => elegirDelCatalogo(e.target.value)}
              >
                <option value="">— Sin enlazar —</option>
                {catalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                    {c.hex ? ` (${c.hex})` : ''}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo
              id="cono-codigo-color"
              etiqueta="N.º de color"
              error={errores.codigo_color}
              ayuda="El mismo número que usas en el diseño (ej: 34)."
            >
              <input
                id="cono-codigo-color"
                autoComplete="off"
                value={f.codigo_color}
                onChange={(e) => cambiar('codigo_color', e.target.value)}
              />
            </Campo>
            <Campo
              id="cono-familia"
              etiqueta="Familia de color"
              error={errores.familia_color}
              ayuda={familiaManual ? undefined : 'Sugerida según el color.'}
            >
              <select
                id="cono-familia"
                value={familia}
                onChange={(e) => {
                  setFamiliaManual(true)
                  cambiar('familia_color', e.target.value)
                }}
              >
                {!familia && <option value="">— Elegir —</option>}
                {FAMILIAS_COLOR.map((fam) => (
                  <option key={fam.valor} value={fam.valor}>
                    {fam.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>
      </fieldset>

      <fieldset className="grupo-campos">
        <legend>Hilo</legend>
        <div className="campos">
          <Campo
            id="cono-codigo"
            etiqueta="Código del cono"
            error={errores.codigo}
            ayuda={editando ? undefined : 'Vacío = se genera (CON-0001…).'}
          >
            <input
              id="cono-codigo"
              autoComplete="off"
              placeholder={editando ? '' : 'Automático'}
              value={f.codigo}
              onChange={(e) => cambiar('codigo', e.target.value.toUpperCase())}
            />
          </Campo>
          <Campo
            id="cono-material"
            etiqueta="Material"
            requerido
            error={errores.material}
          >
            <CampoSugerencias
              id="cono-material"
              placeholder="Ej: acrílico"
              valor={f.material}
              alCambiar={(v) => cambiar('material', v)}
              sugerencias={materiales}
              invalido={Boolean(errores.material)}
            />
          </Campo>
          <Campo id="cono-titulo" etiqueta="Título / calibre" error={errores.titulo_hilo}>
            <CampoSugerencias
              id="cono-titulo"
              placeholder="Ej: 2/32"
              valor={f.titulo_hilo}
              alCambiar={(v) => cambiar('titulo_hilo', v)}
              sugerencias={titulos}
              invalido={Boolean(errores.titulo_hilo)}
            />
          </Campo>
          <Campo id="cono-proveedor" etiqueta="Proveedor" error={errores.proveedor}>
            <CampoSugerencias
              id="cono-proveedor"
              placeholder="Ej: Hilos del Norte"
              valor={f.proveedor}
              alCambiar={(v) => cambiar('proveedor', v)}
              sugerencias={proveedores}
              invalido={Boolean(errores.proveedor)}
              vacio="Proveedor nuevo: se guardará como lo escribas."
            />
          </Campo>
          <Campo
            id="cono-costo"
            etiqueta="Costo"
            error={errores.costo}
            ayuda={costoEquivalente}
          >
            <div className="entrada-con-unidad">
              <input
                id="cono-costo"
                inputMode="decimal"
                autoComplete="off"
                value={f.costo}
                onChange={(e) => cambiar('costo', e.target.value)}
              />
              <select
                aria-label="El costo es"
                value={f.modo_costo}
                onChange={(e) => cambiar('modo_costo', e.target.value)}
              >
                <option value="cono">por cono</option>
                <option value="docena">por docena</option>
              </select>
            </div>
          </Campo>
        </div>
      </fieldset>

      <fieldset className="grupo-campos">
        <legend>Stock</legend>
        <div className="campos">
          <Campo
            id="cono-minimo"
            etiqueta="Stock mínimo"
            error={errores.stock_minimo}
            ayuda="Avisa cuando queden esta cantidad o menos."
          >
            <input
              id="cono-minimo"
              inputMode="numeric"
              autoComplete="off"
              value={f.stock_minimo}
              placeholder="0"
              onChange={(e) => cambiar('stock_minimo', soloEnteros(e.target.value, 5))}
            />
          </Campo>
          {!editando && (
            <Campo
              id="cono-inicial"
              etiqueta="Conos que hay ahora"
              error={errores.stock_inicial}
              ayuda="Se registra como entrada de stock inicial."
            >
              <input
                id="cono-inicial"
                inputMode="numeric"
                autoComplete="off"
                value={f.stock_inicial}
                placeholder="0"
                onChange={(e) => cambiar('stock_inicial', soloEnteros(e.target.value, 5))}
              />
            </Campo>
          )}
        </div>
        {editando && (
          <p className="texto-suave texto-pequeno margen-arriba">
            El stock solo cambia con entradas, salidas o ajustes desde la ficha del cono.
          </p>
        )}
      </fieldset>

      <fieldset className="grupo-campos">
        <legend>Otros</legend>
        <div className="campos">
          <Campo
            id="cono-imagen"
            etiqueta="Foto del cono (URL, opcional)"
            error={errores.imagen_url}
            ancho
          >
            <input
              id="cono-imagen"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://…"
              value={f.imagen_url}
              onChange={(e) => cambiar('imagen_url', e.target.value)}
            />
          </Campo>
          <Campo id="cono-notas" etiqueta="Notas" error={errores.notas} ancho>
            <textarea
              id="cono-notas"
              rows={3}
              value={f.notas}
              onChange={(e) => cambiar('notas', e.target.value)}
            />
          </Campo>
        </div>
      </fieldset>

      <div className="formulario-acciones">
        <button
          type="submit"
          className="boton boton-primario boton-lg"
          disabled={guardando}
        >
          {guardando && 'Guardando…'}
          {!guardando && (editando ? 'Guardar cambios' : 'Registrar cono')}
        </button>
        <Link
          to={editando ? `/conos/${inicial.id}` : '/conos'}
          className="boton boton-secundario boton-lg"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

/** Alta (/conos/nuevo) y edicion (/conos/:id/editar) de un cono. */
export default function PaginaFormularioCono() {
  const { id } = useParams()
  const { cono, cargando, error } = useCono(id)

  if (id && cargando && !cono) return <Cargando />
  if (id && error && !cono) return <Aviso tipo="error">{error.mensaje}</Aviso>

  return (
    <section>
      <nav className="migas">
        <Link to={id ? `/conos/${id}` : '/conos'} className="boton boton-fantasma">
          ← {id ? 'Volver a la ficha' : 'Volver al inventario'}
        </Link>
      </nav>
      <h1>{id ? `Editar ${cono.codigo}` : 'Nuevo cono'}</h1>
      <FormularioCono key={cono?.id ?? 'nuevo'} inicial={cono} />
    </section>
  )
}
