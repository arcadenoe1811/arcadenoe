import { CAMPOS_COLOR, valoresInicialesColor } from '@inventario/shared';
import CampoFormulario from './CampoFormulario.jsx';

const ID_LISTA_COLORES = 'lista-catalogo-colores';

let contadorFilas = 0;

/** Crea una fila del editor con una clave estable para React. */
export function crearFilaColor(color = {}) {
  contadorFilas += 1;
  return { ...valoresInicialesColor(color), clave: `fila-${contadorFilas}` };
}

/**
 * Seccion dinamica para agregar colores por zona.
 * Las filas son objetos de strings; los errores usan la clave
 * `colores.${indice}.${campo}` (igual que la validacion de shared).
 */
export default function EditorColores({ filas, errores = {}, alCambiar, catalogo = [] }) {
  const cambiarCampo = (indice, nombre, valor) => {
    alCambiar(filas.map((fila, i) => (i === indice ? { ...fila, [nombre]: valor } : fila)));
  };

  const agregar = () => {
    const ultima = filas[filas.length - 1];
    const zona = ultima?.zona ?? 'cuerpo';
    const enZona = filas.filter((f) => f.zona === zona).length;
    alCambiar([...filas, crearFilaColor({ zona, orden: enZona + 1 })]);
  };

  const quitar = (indice) => alCambiar(filas.filter((_, i) => i !== indice));

  const mover = (indice, direccion) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= filas.length) return;
    const copia = [...filas];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    alCambiar(copia);
  };

  return (
    <fieldset className="editor-colores">
      <legend>Colores por zona</legend>
      <datalist id={ID_LISTA_COLORES}>
        {catalogo.map((color) => (
          <option key={color.id} value={color.nombre} />
        ))}
      </datalist>

      {filas.length === 0 && <p className="texto-suave">Sin colores. Agrega uno para detallar tubular, cuerpo o borde.</p>}

      {filas.length > 0 && (
        <div className="colores-encabezado" aria-hidden="true">
          {CAMPOS_COLOR.map((c) => (
            <span key={c.nombre}>{c.etiqueta}</span>
          ))}
          <span />
        </div>
      )}

      {filas.map((fila, indice) => (
        <div className="fila-color" key={fila.clave}>
          {CAMPOS_COLOR.map((descriptor) => (
            <CampoFormulario
              key={descriptor.nombre}
              descriptor={{ ...descriptor, ayuda: undefined }}
              valor={fila[descriptor.nombre]}
              error={errores[`colores.${indice}.${descriptor.nombre}`]}
              alCambiar={(nombre, valor) => cambiarCampo(indice, nombre, valor)}
              listaSugerencias={descriptor.nombre === 'color' ? ID_LISTA_COLORES : undefined}
              ocultarEtiqueta
            />
          ))}
          <div className="fila-color-acciones">
            <button type="button" className="boton-icono" onClick={() => mover(indice, -1)} disabled={indice === 0} aria-label="Subir">
              ↑
            </button>
            <button
              type="button"
              className="boton-icono"
              onClick={() => mover(indice, 1)}
              disabled={indice === filas.length - 1}
              aria-label="Bajar"
            >
              ↓
            </button>
            <button type="button" className="boton-icono boton-icono-peligro" onClick={() => quitar(indice)} aria-label="Quitar color">
              ✕
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="boton boton-secundario" onClick={agregar}>
        + Agregar color
      </button>
    </fieldset>
  );
}
