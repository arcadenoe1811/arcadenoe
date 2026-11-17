import { describe, it, expect } from 'vitest'
import {
  describirRango,
  diasEntre,
  errorRango,
  esFechaValida,
  etiquetaPeriodo,
  mesDelRango,
  nombreMes,
  periodoAnterior,
  rangoDeMes,
  sumarDias,
  variacion,
} from '../reportes/periodos.js'
import { BOM, aCSV, celdaCSV, nombreArchivo } from '../reportes/exportar.js'

describe('periodos', () => {
  it('rango de un mes (incluye bisiestos)', () => {
    expect(rangoDeMes('2026-11')).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(rangoDeMes('2028-02').hasta).toBe('2028-02-29')
    expect(rangoDeMes('2026-13')).toBeNull()
    expect(rangoDeMes('noviembre')).toBeNull()
  })

  it('reconoce un mes completo', () => {
    expect(mesDelRango({ desde: '2026-11-01', hasta: '2026-11-30' })).toBe('2026-11')
    expect(mesDelRango({ desde: '2026-11-02', hasta: '2026-11-30' })).toBeNull()
  })

  it('fechas: validez, suma y diferencia', () => {
    expect(esFechaValida('2026-02-28')).toBe(true)
    expect(esFechaValida('2026-02-30')).toBe(false)
    expect(esFechaValida('16/11/2026')).toBe(false)
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    expect(diasEntre('2026-11-01', '2026-11-30')).toBe(29)
  })

  it('valida el rango', () => {
    expect(errorRango({ desde: '2026-11-01', hasta: '2026-11-30' })).toBeNull()
    expect(errorRango({ desde: '2026-11-30', hasta: '2026-11-01' })).toMatch(/posterior/)
    expect(errorRango({ desde: '2020-01-01', hasta: '2026-01-01' })).toMatch(/3 años/)
    expect(errorRango({ desde: '', hasta: '2026-01-01' })).toBeTruthy()
  })

  it('periodo anterior: mes previo o los mismos dias antes', () => {
    expect(periodoAnterior({ desde: '2026-03-01', hasta: '2026-03-31' })).toEqual({
      desde: '2026-02-01',
      hasta: '2026-02-28',
    })
    expect(periodoAnterior({ desde: '2026-01-01', hasta: '2026-01-31' })).toEqual({
      desde: '2025-12-01',
      hasta: '2025-12-31',
    })
    expect(periodoAnterior({ desde: '2026-11-10', hasta: '2026-11-16' })).toEqual({
      desde: '2026-11-03',
      hasta: '2026-11-09',
    })
    expect(periodoAnterior({ desde: '2026-11-16', hasta: '2026-11-16' })).toEqual({
      desde: '2026-11-15',
      hasta: '2026-11-15',
    })
  })

  it('etiquetas', () => {
    expect(etiquetaPeriodo('2026-11-16', 'day')).toBe('16 nov')
    expect(etiquetaPeriodo('2026-11-09', 'week')).toBe('sem. 9 nov')
    expect(etiquetaPeriodo('2026-11-01', 'month')).toBe('nov 2026')
    expect(nombreMes('2026-11')).toBe('Noviembre 2026')
    expect(describirRango({ desde: '2026-11-01', hasta: '2026-11-30' })).toBe(
      'Noviembre 2026',
    )
    expect(describirRango({ desde: '2026-11-16', hasta: '2026-11-16' })).toBe(
      '16 nov 2026',
    )
    expect(describirRango({ desde: '2026-11-10', hasta: '2026-11-16' })).toBe(
      '10 nov 2026 – 16 nov 2026',
    )
  })

  it('variacion porcentual', () => {
    expect(variacion(150, 100)).toBe(50)
    expect(variacion(50, 100)).toBe(-50)
    expect(variacion(10, 0)).toBeNull()
  })
})

describe('exportar a CSV', () => {
  it('escapa comas, comillas y saltos de linea', () => {
    expect(celdaCSV('a,b')).toBe('"a,b"')
    expect(celdaCSV('di "hola"')).toBe('"di ""hola"""')
    expect(celdaCSV('uno\ndos')).toBe('"uno\ndos"')
    expect(celdaCSV(null)).toBe('')
    expect(celdaCSV(12.5)).toBe('12.5')
  })

  it('neutraliza formulas (inyeccion en CSV) pero no numeros negativos', () => {
    expect(celdaCSV('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
    expect(celdaCSV('+1')).toBe("'+1")
    expect(celdaCSV('@cmd')).toBe("'@cmd")
    expect(celdaCSV('-pendiente')).toBe("'-pendiente")
    expect(celdaCSV(-5)).toBe('-5')
  })

  it('arma el archivo con BOM, encabezados y CRLF', () => {
    const csv = aCSV(
      [
        { titulo: 'Diseño', valor: (f) => f.codigo },
        { titulo: 'Total', valor: (f) => f.total },
      ],
      [{ codigo: 'maz4', total: 10 }],
    )
    expect(csv).toBe(`${BOM}Diseño,Total\r\nmaz4,10\r\n`)
  })

  it('nombre de archivo seguro', () => {
    expect(nombreArchivo('Ventas por diseño')).toBe('ventas-por-diseno')
    expect(nombreArchivo('../../etc/passwd')).toBe('etc-passwd')
    expect(nombreArchivo('')).toBe('reporte')
  })
})
