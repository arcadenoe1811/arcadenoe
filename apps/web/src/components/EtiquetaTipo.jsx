import { formatearTipo } from '@inventario/shared'

export default function EtiquetaTipo({ tipo }) {
  // Los tipos agregados por el usuario pueden tener espacios o acentos.
  const clase = String(tipo ?? '').replace(/[^a-z0-9_-]+/gi, '-')
  const texto = formatearTipo(tipo)
  return (
    <span className={`etiqueta-tipo etiqueta-${clase}`} title={texto}>
      {texto}
    </span>
  )
}
