import React, { useState } from "react";

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
  isOpen: boolean;
  onClose: () => void;
  formulario: AulaForm;
  setFormulario: React.Dispatch<React.SetStateAction<AulaForm>>;
  guardarAula: (e: React.FormEvent<HTMLFormElement>) => void;
  limpiarFormulario: () => void;
  aulaID: number | null;
}

export function AulaModal({
  isOpen,
  onClose,
  formulario,
  setFormulario,
  guardarAula,
  limpiarFormulario,
  aulaID,
}: Props) {

  if (!isOpen) return null;

  function cambiarValor(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
  function validarFormulario() {
  const nuevosErrores = {
    nombre: formulario.nombre.trim()
      ? ""
      : "Nombre del aula es obligatorio.",

    edificio: formulario.edificio.trim()
      ? ""
      : "Edificio es obligatorio.",

    piso: formulario.piso !== ""
      ? ""
      : "Piso es obligatorio.",

    tipo: formulario.tipo
      ? ""
      : "Seleccione un tipo.",

    capacidad_maxima: formulario.capacidad_maxima !== ""
      ? ""
      : "Capacidad máxima es obligatoria.",

    descripcion: formulario.descripcion.trim()
      ? ""
      : "Descripción es obligatoria.",

    estado: formulario.estado
      ? ""
      : "Seleccione un estado.",
  };

  setErrores(nuevosErrores);

  return !Object.values(nuevosErrores).some((x) => x !== "");
}
  const [errores, setErrores] = useState({
  nombre: "",
  edificio: "",
  piso: "",
  tipo: "",
  capacidad_maxima: "",
  descripcion: "",
  estado: "",
});

  function cerrar() {
    limpiarFormulario();
    onClose();
  }

  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <button
          className="modal-close"
          onClick={cerrar}
        >
          ×
        </button>

        <h2>
          {aulaID !== null ? "Modificar Aula" : "Nueva Aula"}
        </h2>

        <form className="modal-form" onSubmit={guardarAula}>

          <label>
            Nombre del aula
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={cambiarValor}
              required
            />
          </label>

          <label>
            Edificio
            <input
              type="text"
              name="edificio"
              value={formulario.edificio}
              onChange={cambiarValor}
              required
            />
          </label>

          <label>
            Piso
            <input
              type="number"
              name="piso"
              value={formulario.piso}
              onChange={cambiarValor}
              required
            />
          </label>

          <label>
            Tipo
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
          </label>

          <label>
            Capacidad máxima
            <input
              type="number"
              name="capacidad_maxima"
              value={formulario.capacidad_maxima}
              onChange={cambiarValor}
              required
            />
          </label>

          <label>
            Descripción
            <input
              type="text"
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiarValor}
            />
          </label>

          <label>
            Estado
            <select
              name="estado"
              value={formulario.estado}
              onChange={cambiarValor}
              required
            >
              <option value="">Seleccione un estado</option>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </label>

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-btn"
              onClick={cerrar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-btn"
            >
              {aulaID !== null ? "Modificar Aula" : "Crear Aula"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
