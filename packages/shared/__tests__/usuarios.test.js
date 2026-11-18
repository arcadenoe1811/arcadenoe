import { describe, it, expect } from 'vitest'
import { puede, formatearRol, ROLES } from '../usuarios/permisos.js'
import {
  validarCambioContrasena,
  validarContrasena,
  validarUsuario,
} from '../usuarios/validaciones.js'
import {
  MINUTOS_INACTIVIDAD_POR_DEFECTO,
  limiteInactividadMs,
  sesionInactiva,
  validarInicioSesion,
} from '../auth/sesion.js'
import { normalizarError } from '../api/errores.js'
import { aplicarFiltros } from '../cuellos/filtros.js'

describe('puede (permisos por rol)', () => {
  it('el admin tiene todos los permisos', () => {
    for (const permiso of [
      'usuarios.gestionar',
      'cuellos.editar',
      'colores.eliminar',
      'conos.eliminar',
      'conos.editar',
    ]) {
      expect(puede('admin', permiso)).toBe(true)
    }
  })

  it('el operador crea y edita conos y colores, pero no elimina', () => {
    expect(puede('operador', 'conos.editar')).toBe(true)
    expect(puede('operador', 'colores.editar')).toBe(true)
    expect(puede('operador', 'conos.eliminar')).toBe(false)
    expect(puede('operador', 'colores.eliminar')).toBe(false)
  })

  it('el operador solo consulta cuellos y no gestiona usuarios', () => {
    expect(puede('operador', 'cuellos.ver')).toBe(true)
    expect(puede('operador', 'cuellos.editar')).toBe(false)
    expect(puede('operador', 'usuarios.gestionar')).toBe(false)
  })

  it('el operador registra producción pero no ve dashboard, ventas, estimador ni reportes', () => {
    expect(puede('operador', 'produccion.registrar')).toBe(true)
    expect(puede('operador', 'dashboard.ver')).toBe(false)
    expect(puede('operador', 'ventas.ver')).toBe(false)
    expect(puede('operador', 'ventas.registrar')).toBe(false)
    expect(puede('operador', 'estimador.usar')).toBe(false)
    expect(puede('operador', 'reportes.ver')).toBe(false)
    // El admin conserva el acceso a esos módulos.
    expect(puede('admin', 'dashboard.ver')).toBe(true)
    expect(puede('admin', 'ventas.ver')).toBe(true)
    expect(puede('admin', 'estimador.usar')).toBe(true)
    expect(puede('admin', 'reportes.ver')).toBe(true)
  })

  it('sin rol, con rol desconocido o permiso desconocido no hay acceso', () => {
    expect(puede(null, 'conos.ver')).toBe(false)
    expect(puede(undefined, 'conos.ver')).toBe(false)
    expect(puede('superadmin', 'conos.ver')).toBe(false)
    expect(puede('admin', 'no.existe')).toBe(false)
  })

  it('solo existen dos roles', () => {
    expect(ROLES).toEqual(['admin', 'operador'])
    expect(formatearRol('admin')).toBe('Administrador')
    expect(formatearRol('otro')).toBe('—')
  })
})

describe('validarContrasena', () => {
  it('acepta 8+ caracteres con número y mayúscula', () => {
    expect(validarContrasena('Segura123')).toBeNull()
  })

  it.each([
    ['', /Escribe/],
    ['Abc1234', /al menos 8/],
    ['Sinnumero', /número/],
    ['sinmayuscula1', /mayúscula/],
    ['A1' + 'x'.repeat(80), /Máximo 72/],
    [12345678, /Escribe/],
    [null, /Escribe/],
  ])('rechaza %j', (valor, patron) => {
    expect(validarContrasena(valor)).toMatch(patron)
  })
})

describe('validarUsuario', () => {
  const base = { nombre: '  Ana   Pérez ', email: ' ANA@Taller.com ', rol: 'operador' }

  it('normaliza nombre y correo', () => {
    const { valido, datos } = validarUsuario(base)
    expect(valido).toBe(true)
    expect(datos).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@taller.com',
      rol: 'operador',
    })
  })

  it('exige nombre, correo con formato y un rol válido', () => {
    const { valido, errores } = validarUsuario({
      nombre: ' ',
      email: 'ana@',
      rol: 'root',
    })
    expect(valido).toBe(false)
    expect(Object.keys(errores).sort()).toEqual(['email', 'nombre', 'rol'])
  })

  it('rechaza correos con espacios o sin dominio', () => {
    for (const email of ['a b@c.com', 'sin-arroba.com', 'a@b', "a'--@b.c d"]) {
      expect(validarUsuario({ ...base, email }).errores.email).toBeTruthy()
    }
  })

  it('solo exige contraseña al crear', () => {
    expect(validarUsuario(base).valido).toBe(true)
    const alCrear = validarUsuario(
      { ...base, contrasena: 'debil' },
      { conContrasena: true },
    )
    expect(alCrear.valido).toBe(false)
    expect(alCrear.errores.contrasena).toBeTruthy()
    expect(
      validarUsuario({ ...base, contrasena: 'Temporal2026' }, { conContrasena: true })
        .valido,
    ).toBe(true)
  })
})

describe('validarCambioContrasena', () => {
  it('acepta una contraseña nueva válida y confirmada', () => {
    expect(
      validarCambioContrasena({
        actual: 'Vieja1234',
        contrasena: 'Nueva1234',
        confirmacion: 'Nueva1234',
      }).valido,
    ).toBe(true)
  })

  it('pide la actual, que la nueva sea distinta y que coincida la confirmación', () => {
    expect(
      validarCambioContrasena({ contrasena: 'Nueva1234' }).errores.actual,
    ).toBeTruthy()
    expect(
      validarCambioContrasena({
        actual: 'Misma1234',
        contrasena: 'Misma1234',
        confirmacion: 'Misma1234',
      }).errores.contrasena,
    ).toMatch(/distinta/)
    expect(
      validarCambioContrasena({
        actual: 'Vieja1234',
        contrasena: 'Nueva1234',
        confirmacion: 'Nueva12345',
      }).errores.confirmacion,
    ).toMatch(/no coinciden/)
  })
})

describe('sesionInactiva', () => {
  const HORA = 60 * 60 * 1000
  const ahora = 1_800_000_000_000
  const limite = 8 * HORA

  it('sigue activa dentro del límite', () => {
    expect(sesionInactiva(ahora - 7 * HORA, ahora, limite)).toBe(false)
    expect(sesionInactiva(String(ahora - 1000), ahora, limite)).toBe(false)
  })

  it('vence al cumplirse el límite', () => {
    expect(sesionInactiva(ahora - limite, ahora, limite)).toBe(true)
    expect(sesionInactiva(ahora - 9 * HORA, ahora, limite)).toBe(true)
  })

  it('sin registro de actividad, o con uno manipulado, se da por vencida', () => {
    expect(sesionInactiva(null, ahora, limite)).toBe(true)
    expect(sesionInactiva('', ahora, limite)).toBe(true)
    expect(sesionInactiva('abc', ahora, limite)).toBe(true)
    expect(sesionInactiva(ahora + 24 * HORA, ahora, limite)).toBe(true)
  })

  it('el límite configurable cae en 8 horas si el valor no sirve', () => {
    expect(MINUTOS_INACTIVIDAD_POR_DEFECTO).toBe(480)
    expect(limiteInactividadMs(undefined)).toBe(8 * HORA)
    expect(limiteInactividadMs('abc')).toBe(8 * HORA)
    expect(limiteInactividadMs(-5)).toBe(8 * HORA)
    expect(limiteInactividadMs('30')).toBe(30 * 60 * 1000)
  })
})

describe('validarInicioSesion', () => {
  it('rechaza correos mal formados y contraseñas vacías', () => {
    expect(validarInicioSesion({ email: 'x', contrasena: '' }).valido).toBe(false)
    expect(
      validarInicioSesion({ email: ' Admin@Inventario.Local ', contrasena: 'x' }).datos
        .email,
    ).toBe('admin@inventario.local')
  })
})

describe('normalizarError (reglas y permisos de la base)', () => {
  it('muestra el mensaje de una regla de negocio y marca su campo', () => {
    const error = normalizarError({
      code: 'P0001',
      message: 'Ya existe un usuario con ese correo.',
      hint: 'email',
    })
    expect(error.mensaje).toBe('Ya existe un usuario con ese correo.')
    expect(error.campo).toBe('email')
    expect(error.errores).toEqual({ email: 'Ya existe un usuario con ese correo.' })
  })

  it('ignora un hint que no parece un nombre de campo', () => {
    const error = normalizarError({
      code: 'P0001',
      message: 'Regla',
      hint: 'Prueba <b>x</b>',
    })
    expect(error.campo).toBeNull()
  })

  it('traduce el 403 de la base (42501)', () => {
    expect(
      normalizarError({ code: '42501', message: 'permission denied' }).mensaje,
    ).toMatch(/No tienes permiso/)
  })
})

describe('aplicarFiltros (sin inyección en el filtro or)', () => {
  const consultaFalsa = () => {
    const llamadas = []
    const q = {
      llamadas,
      eq: (...a) => (llamadas.push(['eq', ...a]), q),
      or: (...a) => (llamadas.push(['or', ...a]), q),
      contains: (...a) => (llamadas.push(['contains', ...a]), q),
    }
    return q
  }

  it('interpola solo medidas enteras', () => {
    const q = consultaFalsa()
    aplicarFiltros(q, { tipo: null, medida: 16 })
    expect(q.llamadas).toEqual([['or', 'medidas.cs.{16},tallas.cs.{pg}']])
  })

  it('descarta una medida que no sea un entero', () => {
    for (const medida of ['16},activo.eq.false,medidas.cs.{1', '16', 1.5, -1, NaN]) {
      const q = consultaFalsa()
      aplicarFiltros(q, { tipo: null, medida })
      expect(q.llamadas).toEqual([])
    }
  })
})
