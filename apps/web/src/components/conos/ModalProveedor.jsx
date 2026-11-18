import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LIMITES_CONO } from '@inventario/shared'

/** Minusculas y sin acentos, para comparar nombres. */
const comparable = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Modal para dar de alta un proveedor nuevo desde el formulario de cono.
 *
 * El proveedor es texto libre del cono (no hay tabla aparte): este modal solo
 * captura el nombre, evita duplicados con los ya usados y lo devuelve para
 * dejarlo seleccionado en el campo.
 *
 * Usa <dialog> nativo (foco atrapado y Esc), igual que ModalUsuario.
 *
 * @param {{
 *   existentes?: string[],
 *   alCerrar: () => void,
 *   alGuardar: (nombre: string) => void,
 * }} props
 */
export default function ModalProveedor({ existentes = [], alCerrar, alGuardar }) {
  const refDialogo = useRef(/** @type {HTMLDialogElement|null} */ (null))
  const id = useId()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(/** @type {string|null} */ (null))

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => dialogo?.close()
  }, [])

  const guardar = (evento) => {
    evento.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) {
      setError('Escribe el nombre del proveedor.')
      return
    }
    if (limpio.length > LIMITES_CONO.proveedor) {
      setError(`Máximo ${LIMITES_CONO.proveedor} caracteres.`)
      return
    }
    // Si ya existe (ignorando mayúsculas y acentos), reusa el nombre guardado.
    const yaExiste = existentes.find((p) => comparable(p) === comparable(limpio))
    alGuardar(yaExiste ?? limpio)
  }

  const cambiar = (valor) => {
    setNombre(valor)
    if (error) setError(null)
  }

  const coincidencia = existentes.find((p) => comparable(p) === comparable(nombre))

  let ayuda
  if (error) ayuda = <small className="campo-error">{error}</small>
  else if (coincidencia)
    ayuda = (
      <small className="campo-ayuda">
        Ya tienes un proveedor así: se usará «{coincidencia}».
      </small>
    )
  else
    ayuda = (
      <small className="campo-ayuda">
        Se guardará con el cono y aparecerá como sugerencia.
      </small>
    )

  return createPortal(
    <dialog
      ref={refDialogo}
      className="modal modal-proveedor"
      aria-labelledby={`${id}-titulo`}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      onClick={(evento) => {
        // Clic en el fondo (fuera de la caja) cierra.
        if (evento.target === evento.currentTarget) alCerrar()
      }}
    >
      <form className="modal-caja" onSubmit={guardar} noValidate>
        <h2 id={`${id}-titulo`} className="modal-titulo">
          Nuevo proveedor
        </h2>

        <div className={`campo${error ? ' campo-con-error' : ''}`}>
          <label htmlFor={`${id}-nombre`}>
            Nombre del proveedor
            <span className="requerido" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id={`${id}-nombre`}
            type="text"
            autoFocus
            autoComplete="off"
            maxLength={LIMITES_CONO.proveedor}
            placeholder="Ej: Hilos del Norte"
            value={nombre}
            aria-invalid={error ? true : undefined}
            onChange={(e) => cambiar(e.target.value)}
          />
          {ayuda}
        </div>

        <div className="modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-primario">
            Usar proveedor
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  )
}
