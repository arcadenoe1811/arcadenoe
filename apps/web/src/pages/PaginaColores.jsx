import { useState } from 'react'
import { eliminarColor, guardarColor, normalizarError } from '@inventario/shared'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import { useAuth } from '../hooks/useAuth.js'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'
import MuestraColor from '../components/MuestraColor.jsx'
import SelectorColorHex from '../components/SelectorColorHex.jsx'

const FORMULARIO_VACIO = { id: '', nombre: '', hex: '' }

/** Administracion simple del catalogo de colores. */
export default function PaginaColores() {
  const { colores, cargando, error, recargar } = useCatalogoColores()
  // Solo el admin elimina (la base responde 403 a un operador).
  const puedeEliminar = useAuth().puede('colores.eliminar')
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (nombre, valor) => {
    setFormulario((previo) => ({ ...previo, [nombre]: valor }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorGeneral(null)
    try {
      await guardarColor(formulario)
      setFormulario(FORMULARIO_VACIO)
      setErrores({})
      recargar()
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores ?? {})
      setErrorGeneral(normalizado)
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (color) => {
    if (
      !window.confirm(
        `¿Eliminar “${color.nombre}” del catálogo? Los cuellos que lo usan no cambian.`,
      )
    )
      return
    setErrorGeneral(null)
    try {
      await eliminarColor(color.id)
      if (formulario.id === color.id) setFormulario(FORMULARIO_VACIO)
      recargar()
    } catch (e) {
      setErrorGeneral(normalizarError(e))
    }
  }

  const hexValido = /^#?[0-9a-f]{6}$/i.test(formulario.hex)
    ? `#${formulario.hex.replace('#', '')}`
    : null

  return (
    <section className="pagina-colores">
      <h1>Catálogo de colores</h1>
      <p className="texto-suave">
        Estos nombres se sugieren al escribir colores en un cuello, para no repetir el
        mismo color con nombres distintos.
      </p>

      <form className="tarjeta formulario-color" onSubmit={enviar} noValidate>
        <div className={`campo${errores.nombre ? ' campo-con-error' : ''}`}>
          <label htmlFor="color-nombre">Nombre</label>
          <input
            id="color-nombre"
            value={formulario.nombre}
            placeholder="celeste #34"
            autoComplete="off"
            aria-invalid={errores.nombre ? true : undefined}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
          {errores.nombre && <small className="campo-error">{errores.nombre}</small>}
        </div>
        <div className={`campo${errores.hex ? ' campo-con-error' : ''}`}>
          <label htmlFor="color-hex">Hex (opcional)</label>
          <div className="entrada-hex">
            <SelectorColorHex
              valor={hexValido ?? ''}
              etiqueta="Color del catálogo"
              mostrarHex={false}
              conCatalogo={false}
              alCambiar={(hex) => cambiar('hex', hex)}
            />
            <input
              id="color-hex"
              value={formulario.hex}
              placeholder="#7ec8e3"
              autoComplete="off"
              aria-invalid={errores.hex ? true : undefined}
              onChange={(e) => cambiar('hex', e.target.value)}
            />
          </div>
          {errores.hex && <small className="campo-error">{errores.hex}</small>}
        </div>
        <div className="formulario-color-acciones">
          <button type="submit" className="boton boton-primario" disabled={guardando}>
            {formulario.id ? 'Guardar' : 'Agregar'}
          </button>
          {formulario.id && (
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => setFormulario(FORMULARIO_VACIO)}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {(errorGeneral || error) && (
        <Aviso tipo="error">{(errorGeneral || error).mensaje}</Aviso>
      )}
      {cargando && colores.length === 0 && <Cargando />}

      {!cargando && colores.length === 0 && !error && (
        <p className="texto-suave">El catálogo está vacío.</p>
      )}

      {colores.length > 0 && (
        <ul className="lista-colores">
          {colores.map((color) => (
            <li
              key={color.id}
              className={formulario.id === color.id ? 'seleccionado' : undefined}
            >
              <MuestraColor hex={color.hex} />
              <span className="lista-colores-nombre">{color.nombre}</span>
              <code className="texto-suave">{color.hex ?? '—'}</code>
              <button
                type="button"
                className="boton boton-fantasma"
                onClick={() => {
                  setFormulario({
                    id: color.id,
                    nombre: color.nombre,
                    hex: color.hex ?? '',
                  })
                  setErrores({})
                }}
              >
                Editar
              </button>
              {puedeEliminar && (
                <button
                  type="button"
                  className="boton boton-fantasma boton-fantasma-peligro"
                  onClick={() => borrar(color)}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
