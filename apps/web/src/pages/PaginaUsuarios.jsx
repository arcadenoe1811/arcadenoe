import { useState } from 'react'
import {
  cambiarEstadoUsuario,
  formatearFecha,
  formatearRol,
  normalizarError,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import { useUsuarios } from '../hooks/useUsuarios.js'
import ModalUsuario from '../components/usuarios/ModalUsuario.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'
import '../estilos/usuarios.css'

/** @typedef {import('@inventario/shared').Usuario} Usuario */

/**
 * Gestion de usuarios (solo admin). Los usuarios no se eliminan: se
 * deshabilitan. Las reglas (ultimo admin, no deshabilitarse a uno mismo)
 * las aplica la base; aqui solo se anticipan para no ofrecer el boton.
 */
export default function PaginaUsuarios() {
  const { usuario: yo } = useAuth()
  const { usuarios, cargando, error, recargar } = useUsuarios()
  const [modal, setModal] = useState(
    /** @type {{ modo: 'crear'|'editar'|'contrasena', usuario: Usuario|null }|null} */ (
      null
    ),
  )
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))
  const [errorAccion, setErrorAccion] = useState(/** @type {string|null} */ (null))
  const [procesando, setProcesando] = useState(/** @type {string|null} */ (null))

  const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo).length

  const abrir = (modo, usuario = null) => {
    setMensaje(null)
    setErrorAccion(null)
    setModal({ modo, usuario })
  }

  const cambiarEstado = async (/** @type {Usuario} */ u) => {
    if (
      u.activo &&
      !window.confirm(
        `¿Deshabilitar a ${u.nombre}? No podrá iniciar sesión y se cerrarán sus sesiones abiertas. Podrás habilitarlo de nuevo.`,
      )
    )
      return
    setProcesando(u.id)
    setMensaje(null)
    setErrorAccion(null)
    try {
      await cambiarEstadoUsuario(u.id, !u.activo)
      setMensaje(
        u.activo ? `${u.nombre} fue deshabilitado.` : `${u.nombre} fue habilitado.`,
      )
      recargar()
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje)
    } finally {
      setProcesando(null)
    }
  }

  /** Motivo por el que no se puede deshabilitar (null si se puede). */
  const bloqueoEstado = (/** @type {Usuario} */ u) => {
    if (!u.activo) return null
    if (u.id === yo?.id) return 'No puedes deshabilitar tu propio usuario'
    if (u.rol === 'admin' && adminsActivos <= 1)
      return 'Debe existir al menos un administrador activo'
    return null
  }

  return (
    <section className="pagina-usuarios">
      <header className="usuarios-encabezado">
        <div>
          <h1>Usuarios</h1>
          <p className="texto-suave">
            Los usuarios no se eliminan: se deshabilitan y dejan de poder entrar.
          </p>
        </div>
        <button
          type="button"
          className="boton boton-primario boton-compacto"
          onClick={() => abrir('crear')}
        >
          + Nuevo usuario
        </button>
      </header>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {(errorAccion || error) && (
        <Aviso
          tipo="error"
          accion={
            error && (
              <button type="button" className="boton boton-secundario" onClick={recargar}>
                Reintentar
              </button>
            )
          }
        >
          {errorAccion ?? error.mensaje}
        </Aviso>
      )}
      {cargando && usuarios.length === 0 && <Cargando />}

      {usuarios.length > 0 && (
        <div className="tarjeta tabla-usuarios-envoltura">
          <table className="tabla-usuarios">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Creado</th>
                <th scope="col">Último acceso</th>
                <th scope="col">
                  <span className="solo-lector">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const bloqueo = bloqueoEstado(u)
                return (
                  <tr key={u.id} className={u.activo ? undefined : 'usuario-inactivo'}>
                    <td data-etiqueta="Nombre">
                      <span className="usuario-nombre">{u.nombre}</span>
                      {u.id === yo?.id && <span className="insignia-rol">Tú</span>}
                    </td>
                    <td data-etiqueta="Correo" className="usuario-correo">
                      {u.email}
                    </td>
                    <td data-etiqueta="Rol">
                      <span className={`insignia-rol insignia-rol-${u.rol}`}>
                        {formatearRol(u.rol)}
                      </span>
                    </td>
                    <td data-etiqueta="Estado">
                      <span
                        className={`insignia-estado ${u.activo ? 'insignia-disponible' : 'insignia-inactivo'}`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {u.activo && u.debe_cambiar_contrasena && (
                        <span className="texto-suave texto-pequeno usuario-nota">
                          Contraseña temporal
                        </span>
                      )}
                    </td>
                    <td data-etiqueta="Creado">{formatearFecha(u.created_at)}</td>
                    <td data-etiqueta="Último acceso">
                      {u.ultimo_acceso ? formatearFecha(u.ultimo_acceso) : 'Nunca'}
                    </td>
                    <td className="usuario-acciones">
                      <button
                        type="button"
                        className="boton boton-fantasma boton-sm"
                        onClick={() => abrir('editar', u)}
                      >
                        Editar
                      </button>
                      {u.id !== yo?.id && (
                        <button
                          type="button"
                          className="boton boton-fantasma boton-sm"
                          onClick={() => abrir('contrasena', u)}
                        >
                          Resetear contraseña
                        </button>
                      )}
                      <button
                        type="button"
                        className={`boton boton-fantasma boton-sm${u.activo ? ' boton-fantasma-peligro' : ''}`}
                        onClick={() => cambiarEstado(u)}
                        disabled={Boolean(bloqueo) || procesando === u.id}
                        title={bloqueo ?? undefined}
                      >
                        {u.activo ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalUsuario
          modo={modal.modo}
          usuario={modal.usuario}
          esPropio={modal.usuario?.id === yo?.id}
          alCerrar={() => setModal(null)}
          alGuardar={(texto) => {
            setModal(null)
            setMensaje(texto)
            recargar()
          }}
        />
      )}
    </section>
  )
}
