import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` solo despues de que deje de cambiar durante `ms`.
 * Sirve para no consultar la base en cada tecla.
 * @template T
 * @param {T} valor
 * @param {number} [ms]
 * @returns {T}
 */
export function usarRetraso(valor, ms = 250) {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);
  return retrasado;
}
