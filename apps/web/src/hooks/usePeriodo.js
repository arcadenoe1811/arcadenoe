import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { errorRango, hoyISO, mesDe, rangoDeMes } from '@inventario/shared'

/**
 * Rango de fechas de la pantalla, guardado en la URL (?desde=&hasta=) para
 * que sobreviva a recargas y al boton "atras". Lo que venga en la URL se
 * valida; si no es un rango valido se usa el mes actual.
 * @returns {{ rango: { desde: string, hasta: string }, cambiarRango: (rango: { desde: string, hasta: string }) => void }}
 */
export function usePeriodo() {
  const [parametros, setParametros] = useSearchParams()
  const desde = parametros.get('desde') ?? ''
  const hasta = parametros.get('hasta') ?? ''

  const rango = useMemo(() => {
    const pedido = { desde, hasta }
    return errorRango(pedido) ? rangoDeMes(mesDe(hoyISO())) : pedido
  }, [desde, hasta])

  const cambiarRango = useCallback(
    (nuevo) => {
      if (errorRango(nuevo)) return
      setParametros(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          siguientes.set('desde', nuevo.desde)
          siguientes.set('hasta', nuevo.hasta)
          return siguientes
        },
        { replace: true },
      )
    },
    [setParametros],
  )

  return { rango, cambiarRango }
}
