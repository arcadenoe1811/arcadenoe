import { formatearTipo } from '@inventario/shared';

export default function EtiquetaTipo({ tipo }) {
  return <span className={`etiqueta-tipo etiqueta-${tipo}`}>{formatearTipo(tipo)}</span>;
}
