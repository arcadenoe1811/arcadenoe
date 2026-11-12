import { useCallback, useEffect, useState } from 'react';
import { normalizarError } from '@inventario/shared';

/**
 * Ejecuta una funcion asincrona cuando cambian las dependencias y expone
 * datos, estado de carga y error normalizado. Ignora respuestas viejas.
 * @template T
 * @param {() => Promise<T>} cargar
 * @param {unknown[]} dependencias
 */
export function usarConsulta(cargar, dependencias) {
  const [estado, setEstado] = useState(
    /** @type {{ datos: T|null, cargando: boolean, error: import('@inventario/shared').ErrorNormalizado|null }} */ ({
      datos: null,
      cargando: true,
      error: null,
    }),
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado((previo) => ({ ...previo, cargando: true, error: null }));
    cargar()
      .then((datos) => {
        if (vigente) setEstado({ datos, cargando: false, error: null });
      })
      .catch((error) => {
        if (vigente) setEstado((previo) => ({ ...previo, cargando: false, error: normalizarError(error) }));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, recargar };
}
