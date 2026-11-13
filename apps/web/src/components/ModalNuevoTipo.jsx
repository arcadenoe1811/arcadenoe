import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { crearTipo, normalizarError } from '@inventario/shared'

/**
 * Modal para agregar un tipo de cuello al catalogo.
 * Usa <dialog> nativo (foco atrapado y Esc) y se monta en <body> con un
 * portal porque el formulario del cuello no puede contener otro <form>.
 * @param {{ alCerrar: () => void, alCrear: (nombre: string) => void }} props
 */
export default function ModalNuevoTipo({ alCerrar, alCrear }) {
  const refDialogo = useRef(/** @type {HTMLDialogElement|null} */ (null))
  const id = useId()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => dialogo?.close()
  }, [])

  const guardar = async (evento) => {
    // Los eventos de React cruzan el portal: sin esto se enviaria tambien
    // el formulario del cuello.
    evento.preventDefault()
    evento.stopPropagation()
    setGuardando(true)
    setError(null)
    try {
      alCrear(await crearTipo({ nombre }))
    } catch (e) {
      const normalizado = normalizarError(e)
      setError(normalizado.errores?.nombre ?? normalizado.mensaje)
      setGuardando(false)
    }
  }

  return createPortal(
    <dialog
      ref={refDialogo}
      className="modal"
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
          Nuevo tipo de cuello
        </h2>
        <div className={`campo${error ? ' campo-con-error' : ''}`}>
          <label htmlFor={`${id}-nombre`}>
            Nombre<span className="requerido"> *</span>
          </label>
          <input
            id={`${id}-nombre`}
            type="text"
            autoFocus
            autoComplete="off"
            maxLength={40}
            placeholder="Ej: doble tubular"
            value={nombre}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-ayuda`}
            onChange={(evento) => setNombre(evento.target.value)}
          />
          <small id={`${id}-ayuda`} className={error ? 'campo-error' : 'campo-ayuda'}>
            {error ?? 'Quedará disponible para todos los cuellos.'}
          </small>
        </div>
        <div className="modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={alCerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="boton boton-primario"
            disabled={guardando || !nombre.trim()}
          >
            {guardando ? 'Guardando…' : 'Agregar tipo'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  )
}
