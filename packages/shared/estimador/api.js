import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { leerDecimal } from '../conos/validaciones.js'
import { LIMITES_VENTA } from '../ventas/constantes.js'
import { validarEstimacion } from '../ventas/validaciones.js'

const errorValidacion = (errores) =>
  new ErrorNormalizado({
    mensaje: 'Revisa los campos marcados.',
    codigo: 'validacion',
    errores,
  })

/** Tarifa de mano de obra por hora configurada. */
export async function obtenerTarifaHora() {
  const fila = verificarRespuesta(
    await obtenerCliente().from('configuracion').select('tarifa_hora').maybeSingle(),
  )
  return Number(fila?.tarifa_hora ?? 0)
}

/** Cambia la tarifa por hora predeterminada (solo admin). */
export async function guardarTarifaHora(valor) {
  const tarifa = leerDecimal(valor)
  if (
    tarifa === null ||
    tarifa === undefined ||
    tarifa < 0 ||
    tarifa > LIMITES_VENTA.tarifa_hora
  )
    throw errorValidacion({ tarifa_hora: 'Escribe una tarifa válida (no negativa).' })
  verificarRespuesta(
    await obtenerCliente()
      .from('configuracion')
      .update({ tarifa_hora: Math.round(tarifa * 100) / 100 })
      .eq('id', true),
  )
}

/**
 * Guarda una estimacion (solo lo estimado; nunca tiempos reales). La base
 * recalcula los totales.
 * @returns {Promise<string>} id
 */
export async function guardarEstimacion(formulario, lineas) {
  const { valido, errores, datos } = validarEstimacion(formulario, lineas)
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_guardar_estimacion', {
      p_estimacion: datos.estimacion,
      p_lineas: datos.lineas,
    }),
  )
}

/** Historial de estimaciones con sus lineas. @param {number} [limite] */
export async function listarEstimaciones(limite = 100) {
  const estimaciones =
    verificarRespuesta(
      await obtenerCliente()
        .from('estimaciones')
        .select(
          'id, fecha, nombre, notas, tarifa_hora, costo_cono, total_unidades, total_conos, ' +
            'total_minutos, costo_material, costo_mano_obra, costo_total, created_at, ' +
            'lineas:estimacion_lineas(id, cuello_id, diseno_codigo, pieza, talla, cantidad, conos_por_unidad, minutos_por_unidad, orden)',
        )
        .order('created_at', { ascending: false })
        .limit(limite),
    ) ?? []
  for (const e of estimaciones)
    e.lineas = [...(e.lineas ?? [])].sort((a, b) => a.orden - b.orden)
  return estimaciones
}

/** Elimina una estimacion (solo admin). @param {string} id */
export async function eliminarEstimacion(id) {
  verificarRespuesta(await obtenerCliente().from('estimaciones').delete().eq('id', id))
}
