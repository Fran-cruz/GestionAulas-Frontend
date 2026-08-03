import React from "react";

export interface AulaForm {
  nombre: string;
  edificio: string;
  piso: number | string;
  tipo: string;
  capacidad_maxima: number | string;
  descripcion: string;
  estado: string;
}

interface Props {
  formulario: AulaForm;
  setFormulario: React.Dispatch<React.SetStateAction<AulaForm>>;
  guardarAula: (e: React.FormEvent<HTMLFormElement>) => void;
  limpiarFormulario: () => void;
  aulaID: number | null;
}

export function FormularioAula({
  formulario,
  setFormulario,
  guardarAula,
  limpiarFormulario,
  aulaID,
}: Props) {
  function cambiarValor(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <form onSubmit={guardarAula}>

      <input
        type="text"
        name="nombre"
        placeholder="Nombre del aula"
        value={formulario.nombre}
        onChange={cambiarValor}
        required
      />

      <br />
      <br />

      <input
        type="text"
        name="edificio"
        placeholder="Edificio"
        value={formulario.edificio}
        onChange={cambiarValor}
        required
      />

      <br />
      <br />

      <input
        type="number"
        name="piso"
        placeholder="Piso"
        value={formulario.piso}
        onChange={cambiarValor}
        required
      />

      <br />
      <br />

      <select
        name="tipo"
        value={formulario.tipo}
        onChange={cambiarValor}
        required
      >
        <option value="">Seleccione un tipo</option>
        <option value="Clase general">Clase general</option>
        <option value="Laboratorio">Laboratorio</option>
        <option value="Laboratorio de Computo">
          Laboratorio de Computo
        </option>
      </select>

      <br />
      <br />

      <input
        type="number"
        name="capacidad_maxima"
        placeholder="Capacidad máxima"
        value={formulario.capacidad_maxima}
        onChange={cambiarValor}
        required
      />

      <br />
      <br />

      <input
        type="text"
        name="descripcion"
        placeholder="Descripción"
        value={formulario.descripcion}
        onChange={cambiarValor}
      />

      <br />
      <br />

      <select
        name="estado"
        value={formulario.estado}
        onChange={cambiarValor}
        required
      >
        <option value="">Seleccione un estado</option>
        <option value="disponible">Disponible</option>
        <option value="ocupada">Ocupada</option>
        <option value="mantenimiento">Mantenimiento</option>
      </select>

      <br />
      <br />

      <button type="submit">
        {aulaID !== null ? "Modificar" : "Crear"}
      </button>

      <button
        type="button"
        onClick={limpiarFormulario}
        style={{ marginLeft: "10px" }}
      >
        Limpiar
      </button>

    </form>
  );
}
