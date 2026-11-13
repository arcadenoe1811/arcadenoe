import { useCallback, useEffect, useState } from 'react'
import { normalizarError } from '@inventario/shared'

/**
 * Ejecuta `cargar` y expone datos, estado de carga y error normalizado.
 *
 * `cargar` DEBE ser estable (funcion de modulo o envuelta en useCallback):
 * cada vez que cambia su identidad se vuelve a consultar. Asi las
 * dependencias quedan declaradas en el useCallback del llamador y este
 * efecto cumple exhaustive-deps sin silenciar nada.
 *
 * Mientras se recarga se conservan los datos anteriores; `cargando` se
 * deriva comparando contra la ultima respuesta recibida, sin setState
 * sincrono dentro del efecto. Las respuestas viejas se descartan.
 *
 * @template T
 * @param {() => Promise<T>} cargar
 */
export function useConsulta(cargar) {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState(
    /** @type {{ origen: Function|null, version: number, datos: T|null, error: import('@inventario/shared').ErrorNormalizado|null }} */ ({
      origen: null,
      version: -1,
      datos: null,
      error: null,
    }),
  )

  useEffect(() => {
    let cancelado = false

    cargar()
      .then((datos) => {
        if (!cancelado) setResultado({ origen: cargar, version, datos, error: null })
      })
      .catch((error) => {
        if (!cancelado) {
          setResultado((previo) => ({
            ...previo,
            origen: cargar,
            version,
            error: normalizarError(error),
          }))
        }
      })

    return () => {
      cancelado = true
    }
  }, [cargar, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  const vigente = resultado.origen === cargar && resultado.version === version
  return {
    datos: resultado.datos,
    cargando: !vigente,
    error: vigente ? resultado.error : null,
    recargar,
  }
}
