/**
 * Mensaje en caja. tipo: 'error' | 'exito' | 'info'
 */
export default function Aviso({ tipo = 'info', children, accion = null }) {
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <div>{children}</div>
      {accion}
    </div>
  )
}
