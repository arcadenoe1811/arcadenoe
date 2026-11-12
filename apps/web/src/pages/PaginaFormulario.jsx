import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CAMPOS_CUELLO,
  GRUPOS_CUELLO,
  guardarCuello,
  normalizarError,
  obtenerCuello,
  validarColoresCuello,
  validarCuello,
  valoresInicialesCuello,
} from '@inventario/shared';
import { usarCatalogoColores } from '../hooks/usarCatalogoColores.js';
import CampoFormulario from '../components/CampoFormulario.jsx';
import EditorColores, { crearFilaColor } from '../components/EditorColores.jsx';
import ImagenCuello from '../components/ImagenCuello.jsx';
import Cargando from '../components/Cargando.jsx';
import Aviso from '../components/Aviso.jsx';

/** Alta (/cuellos/nuevo) y edicion (/cuellos/:id/editar) de un cuello. */
export default function PaginaFormulario() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const esEdicion = Boolean(id);
  const { colores: catalogo } = usarCatalogoColores();

  const [valores, setValores] = useState(() => valoresInicialesCuello({ codigo: parametros.get('codigo') ?? '' }));
  const [filasColores, setFilasColores] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return undefined;
    let vigente = true;
    setCargando(true);
    obtenerCuello(id)
      .then((cuello) => {
        if (!vigente) return;
        setValores(valoresInicialesCuello(cuello));
        setFilasColores(cuello.colores.map((color) => crearFilaColor(color)));
      })
      .catch((e) => vigente && setErrorGeneral(normalizarError(e)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [id, esEdicion]);

  const cambiarValor = (nombre, valor) => {
    setValores((previos) => ({ ...previos, [nombre]: valor }));
    if (errores[nombre]) setErrores(({ [nombre]: _quitado, ...resto }) => resto);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral(null);

    // Validacion local inmediata (las reglas viven en @inventario/shared).
    const cuello = validarCuello(valores);
    const colores = validarColoresCuello(filasColores);
    const erroresLocales = {
      ...cuello.errores,
      ...Object.fromEntries(Object.entries(colores.errores).map(([k, v]) => [`colores.${k}`, v])),
    };
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length) {
      setErrorGeneral({ mensaje: 'Revisa los campos marcados.' });
      return;
    }

    setGuardando(true);
    try {
      const guardado = await guardarCuello(valores, filasColores);
      navegar(`/cuellos/${guardado.id}`, { replace: true });
    } catch (e) {
      const error = normalizarError(e);
      setErrores(error.errores ?? {});
      setErrorGeneral(error);
      setGuardando(false);
    }
  };

  if (cargando) return <Cargando />;
  if (esEdicion && errorGeneral && !valores.id) {
    return (
      <Aviso tipo="error" accion={<Link to="/" className="boton boton-secundario">Volver</Link>}>
        {errorGeneral.mensaje}
      </Aviso>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <nav className="migas">
        <Link to={esEdicion ? `/cuellos/${id}` : '/'}>← Cancelar</Link>
      </nav>
      <h1>{esEdicion ? `Editar ${valores.codigo || 'cuello'}` : 'Nuevo cuello'}</h1>

      {errorGeneral && <Aviso tipo="error">{errorGeneral.mensaje}</Aviso>}

      {GRUPOS_CUELLO.map((grupo) => (
        <fieldset key={grupo.clave} className={`grupo-campos grupo-${grupo.clave}`}>
          <legend>{grupo.titulo}</legend>
          <div className="campos">
            {CAMPOS_CUELLO.filter((campo) => campo.grupo === grupo.clave).map((descriptor) => (
              <CampoFormulario
                key={descriptor.nombre}
                descriptor={descriptor}
                valor={valores[descriptor.nombre]}
                error={errores[descriptor.nombre]}
                alCambiar={cambiarValor}
              />
            ))}
          </div>
          {grupo.clave === 'detalle' && valores.imagen_url && !errores.imagen_url && (
            <div className="vista-previa">
              <span className="texto-pequeno texto-suave">Vista previa</span>
              <ImagenCuello url={valores.imagen_url} alt="Vista previa de la imagen" />
            </div>
          )}
        </fieldset>
      ))}

      <EditorColores filas={filasColores} errores={errores} alCambiar={setFilasColores} catalogo={catalogo} />

      <div className="formulario-acciones">
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar cuello'}
        </button>
        <Link to={esEdicion ? `/cuellos/${id}` : '/'} className="boton boton-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
