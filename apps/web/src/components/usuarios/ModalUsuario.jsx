import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AYUDA_CONTRASENA,
  LIMITES_USUARIO,
  OPCIONES_ROL,
  actualizarUsuario,
  crearUsuario,
  normalizarError,
  resetearContrasena,
} from '@inventario/shared'

/** @typedef {import('@inventario/shared').Usuario} Usuario */

const TITULOS = {
  crear: 'Nuevo usuario',
  editar: 'Editar usuario',
  contrasena: 'Resetear contraseña',
}
const TEXTO_GUARDAR = {
  crear: 'Crear usuario',
  editar: 'Guardar',
  contrasena: 'Resetear contraseña',
}

/**
 * Modal de usuarios, en tres modos:
 * - 'crear':      nombre, correo, rol y contrasena temporal
 * - 'editar':     nombre, correo y rol
 * - 'contrasena': nueva contrasena temporal (reset forzado)
 *
 * Usa <dialog> nativo (foco atrapado y Esc), igual que ModalNuevoTipo.
 *
 * @param {{
 *   modo: 'crear'|'editar'|'contrasena',
 *   usuario?: Usuario|null,
 *   esPropio?: boolean,
 *   alCerrar: () => void,
 *   alGuardar: (mensaje: string) => void,
 * }} props
 */
export default function ModalUsuario({
  modo,
  usuario = null,
  esPropio = false,
  alCerrar,
  alGuardar,
}) {
  const refDialogo = useRef(/** @type {HTMLDialogElement|null} */ (null))
  const id = useId()
  const [formulario, setFormulario] = useState({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    rol: usuario?.rol ?? 'operador',
    contrasena: '',
  })
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [error, setError] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => dialogo?.close()
  }, [])

  const cambiar = (nombre) => (evento) => {
    setFormulario((previo) => ({ ...previo, [nombre]: evento.target.value }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      if (modo === 'crear') {
        await crearUsuario(formulario)
        alGuardar(
          `Usuario ${formulario.email.trim().toLowerCase()} creado. Deberá cambiar la contraseña temporal al entrar.`,
        )
      } else if (modo === 'editar') {
        await actualizarUsuario(usuario.id, formulario)
        alGuardar('Usuario actualizado.')
      } else {
        await resetearContrasena(usuario.id, formulario.contrasena)
        alGuardar(
          `Contraseña de ${usuario.nombre} reseteada. Se cerraron sus sesiones y deberá cambiarla al entrar.`,
        )
      }
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores ?? {})
      setError(normalizado.campo ? null : normalizado.mensaje)
      setGuardando(false)
    }
  }

  const conDatos = modo !== 'contrasena'
  const conContrasena = modo !== 'editar'

  const campo = (nombre, etiqueta, entrada, ayuda) => (
    <div className={`campo${errores[nombre] ? ' campo-con-error' : ''}`}>
      <label htmlFor={`${id}-${nombre}`}>
        {etiqueta}
        <span className="requerido"> *</span>
      </label>
      {entrada}
      {errores[nombre] ? (
        <small className="campo-error">{errores[nombre]}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  )

  return createPortal(
    <dialog
      ref={refDialogo}
      className="modal modal-usuario"
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
          {TITULOS[modo]}
        </h2>

        {modo === 'contrasena' && (
          <p className="texto-suave texto-pequeno">
            Fija una contraseña temporal para <strong>{usuario.nombre}</strong> (
            {usuario.email}). Se cerrarán sus sesiones abiertas y tendrá que elegir una
            nueva al entrar.
          </p>
        )}

        {conDatos &&
          campo(
            'nombre',
            'Nombre',
            <input
              id={`${id}-nombre`}
              type="text"
              autoFocus
              autoComplete="off"
              maxLength={LIMITES_USUARIO.nombre}
              value={formulario.nombre}
              aria-invalid={errores.nombre ? true : undefined}
              onChange={cambiar('nombre')}
            />,
          )}

        {conDatos &&
          campo(
            'email',
            'Correo electrónico',
            <input
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={LIMITES_USUARIO.email}
              placeholder="persona@correo.com"
              value={formulario.email}
              aria-invalid={errores.email ? true : undefined}
              onChange={cambiar('email')}
            />,
          )}

        {conDatos &&
          campo(
            'rol',
            'Rol',
            <select
              id={`${id}-rol`}
              value={formulario.rol}
              disabled={esPropio}
              aria-invalid={errores.rol ? true : undefined}
              onChange={cambiar('rol')}
            >
              {OPCIONES_ROL.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>,
            esPropio
              ? 'No puedes cambiar tu propio rol.'
              : 'Operador: trabaja con conos y colores, sin eliminar; solo consulta cuellos.',
          )}

        {conContrasena &&
          campo(
            'contrasena',
            'Contraseña temporal',
            <div className="entrada-contrasena">
              <input
                id={`${id}-contrasena`}
                type={verContrasena ? 'text' : 'password'}
                autoFocus={!conDatos}
                autoComplete="new-password"
                maxLength={LIMITES_USUARIO.contrasena_maximo}
                value={formulario.contrasena}
                aria-invalid={errores.contrasena ? true : undefined}
                onChange={cambiar('contrasena')}
              />
              <button
                type="button"
                className="boton boton-fantasma boton-sm"
                aria-pressed={verContrasena}
                onClick={() => setVerContrasena((v) => !v)}
              >
                {verContrasena ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>,
            AYUDA_CONTRASENA,
          )}

        {error && (
          <p className="campo-error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-primario" disabled={guardando}>
            {guardando ? 'Guardando…' : TEXTO_GUARDAR[modo]}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  )
}
