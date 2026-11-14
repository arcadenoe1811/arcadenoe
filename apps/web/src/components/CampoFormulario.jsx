import { useId } from 'react'
import { soloEnteros } from '../utils/soloEnteros.js'

/**
 * Pinta un campo a partir de un descriptor de @inventario/shared.
 * @param {{
 *   descriptor: import('@inventario/shared').DescriptorCampo,
 *   valor: string,
 *   error?: string,
 *   alCambiar: (nombre: string, valor: string) => void,
 *   listaSugerencias?: string,
 *   ocultarEtiqueta?: boolean,
 *   deshabilitado?: boolean,
 * }} props
 */
export default function CampoFormulario({
  descriptor,
  valor,
  error,
  alCambiar,
  listaSugerencias,
  ocultarEtiqueta = false,
  deshabilitado = false,
}) {
  const id = useId()
  const {
    nombre,
    etiqueta,
    tipo,
    requerido,
    placeholder,
    ayuda,
    maximo,
    filas,
    opciones,
  } = descriptor
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`

  const comunes = {
    id,
    name: nombre,
    value: valor ?? '',
    placeholder,
    required: requerido,
    disabled: deshabilitado || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby':
      [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined,
    onChange: (evento) => alCambiar(nombre, evento.target.value),
  }

  let control
  if (tipo === 'seleccion') {
    control = (
      <select {...comunes}>
        {opciones?.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    )
  } else if (tipo === 'area_texto') {
    control = <textarea {...comunes} rows={filas ?? 4} />
  } else if (tipo === 'numero') {
    // Solo enteros sin signo: type="number" deja escribir "e", "." y "-".
    const largo = maximo ? String(maximo).length : undefined
    control = (
      <input
        {...comunes}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={largo}
        onChange={(evento) => alCambiar(nombre, soloEnteros(evento.target.value, largo))}
      />
    )
  } else if (tipo === 'url') {
    control = <input {...comunes} type="url" inputMode="url" />
  } else {
    control = (
      <input
        {...comunes}
        type="text"
        list={listaSugerencias}
        autoComplete="off"
        inputMode={tipo === 'lista_numeros' ? 'numeric' : undefined}
      />
    )
  }

  return (
    <div className={`campo campo-${tipo}${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id} className={ocultarEtiqueta ? 'solo-lector' : undefined}>
        {etiqueta}
        {requerido && (
          <span className="requerido" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {ayuda && !error && (
        <small id={idAyuda} className="campo-ayuda">
          {ayuda}
        </small>
      )}
      {error && (
        <small id={idError} className="campo-error">
          {error}
        </small>
      )}
    </div>
  )
}
