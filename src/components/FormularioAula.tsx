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
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="table-card aula-form-card">
      <div className="section-title">
        <h3>
          {aulaID !== null ? "Modificar Aula" : "Registrar Aula"}
        </h3>
      </div>

      <form className="modal-form" onSubmit={guardarAula}>
        <label>
          Nombre del aula
          <input
            type="text"
            name="nombre"
            value={formulario.nombre ?? ""}
            onChange={cambiarValor}
            required
          />
        </label>

        <label>
          Edificio
          <input
            type="text"
            name="edificio"
            value={formulario.edificio ?? ""}
            onChange={cambiarValor}
            required
          />
        </label>

        <label>
          Piso
          <input
            type="number"
            name="piso"
            value={formulario.piso ?? ""}
            onChange={cambiarValor}
            required
          />
        </label>

        <label>
          Tipo
          <select
            name="tipo"
            value={formulario.tipo ?? ""}
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
        </label>

        <label>
          Capacidad máxima
          <input
            type="number"
            name="capacidad_maxima"
            value={formulario.capacidad_maxima ?? ""}
            onChange={cambiarValor}
            required
          />
        </label>

        <label>
          Descripción
          <input
            type="text"
            name="descripcion"
            value={formulario.descripcion ?? ""}
            onChange={cambiarValor}
          />
        </label>

        <label>
          Estado
          <select
            name="estado"
            value={formulario.estado ?? ""}
            onChange={cambiarValor}
            required
          >
            <option value="">Seleccione un estado</option>
            <option value="disponible">Disponible</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </label>

        <div className="row-actions">
          <button
            className="primary-btn"
            type="submit"
          >
            {aulaID !== null ? "Modificar" : "Crear"}
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={limpiarFormulario}
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
