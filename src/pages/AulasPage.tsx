import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FiSearch } from "react-icons/fi";

import {
  obtenerAulas,
  crearAula,
  modificarAula,
  eliminarAula,
} from "../lib/aulasServices";

import type { Aula } from "../lib/aulasServices";

import { AulaModal } from "../components/AulaModal";
import type { AulaForm } from "../components/AulaModal";

import { TablaAulas } from "../components/TablaAulas";

export function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [buscar, setBuscar] = useState("");
  const [aulaID, setAulaID] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [aulaAEliminar, setAulaAEliminar] = useState<Aula | null>(null);

  const [alerta, setAlerta] = useState<{
    tipo: "success" | "error";
    mensaje: string;
  } | null>(null);

  const [formulario, setFormulario] = useState<AulaForm>({
    nombre: "",
    edificio: "",
    piso: "",
    tipo: "",
    capacidad_maxima: "",
    descripcion: "",
    estado: "",
  });

  async function getAulas() {
    try {
      const datos = await obtenerAulas();

      setAulas(
        datos.filter(
          (aula): aula is Aula => typeof aula.id === "number"
        )
      );
    } catch (error) {
      console.error(error);

      setAlerta({
        tipo: "error",
        mensaje: "No fue posible cargar las aulas.",
      });
    }
  }

  useEffect(() => {
    getAulas();
  }, []);

  async function guardarAula(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const datos = {
      nombre: formulario.nombre,
      edificio: formulario.edificio,
      piso: formulario.piso.toString(),
      tipo: formulario.tipo,
      capacidad_maxima: Number(formulario.capacidad_maxima),
      descripcion: formulario.descripcion,
      estado: formulario.estado.toLowerCase(),
    };

    try {
      if (aulaID !== null) {
        await modificarAula(aulaID, datos);

        setAlerta({
          tipo: "success",
          mensaje: "Aula modificada correctamente.",
        });
      } else {
        await crearAula(datos);

        setAlerta({
          tipo: "success",
          mensaje: "Aula añadida correctamente.",
        });
      }

      await getAulas();
      limpiarFormulario();
      setModalOpen(false);

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    } catch (error) {
      console.error(error);

      setAlerta({
        tipo: "error",
        mensaje: "No fue posible guardar el aula.",
      });

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    }
  }

  function editarAula(aula: Aula) {
    if (aula.id === undefined) return;

    setAulaID(aula.id);

    setFormulario({
      nombre: aula.nombre ?? "",
      edificio: aula.edificio ?? "",
      piso: aula.piso ?? "",
      tipo: aula.tipo ?? "",
      capacidad_maxima: aula.capacidad_maxima ?? "",
      descripcion: aula.descripcion ?? "",
      estado: aula.estado ?? "",
    });

    setModalOpen(true);
  }

  function pedirEliminar(id: number) {
    const aula = aulas.find((a) => a.id === id);
    if (aula) setAulaAEliminar(aula);
  }

  async function confirmarEliminar() {
    if (!aulaAEliminar?.id) return;

    try {
      await eliminarAula(aulaAEliminar.id);
      await getAulas();

      setAlerta({
        tipo: "success",
        mensaje: "Aula eliminada correctamente.",
      });

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    } catch (error) {
      console.error(error);

      setAlerta({
        tipo: "error",
        mensaje: "No fue posible eliminar el aula.",
      });

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    } finally {
      setAulaAEliminar(null);
    }
  }

  function limpiarFormulario() {
    setFormulario({
      nombre: "",
      edificio: "",
      piso: "",
      tipo: "",
      capacidad_maxima: "",
      descripcion: "",
      estado: "",
    });

    setAulaID(null);
  }

  const aulasFiltradas = aulas.filter((aula) =>
    aula.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <section className="catalog-page">
      <div className="toolbar">
        <div>
          <h2>Aulas</h2>
          <span>Administración de aulas</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            limpiarFormulario();
            setModalOpen(true);
          }}
        >
          + Añadir Aula
        </button>
      </div>

      {alerta && (
        <div
          className={`alert ${
            alerta.tipo === "success" ? "alert-success" : "alert-error"
          }`}
        >
          {alerta.mensaje}
        </div>
      )}

      <div className="period-chip">{aulas.length} Aulas Registradas</div>

      <br />
      <div className="search-container">
        <FiSearch className="search-icon" />

        <input
          className="search-input"
          type="text"
          placeholder="Buscar aula..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      <br />
      <br />

      <TablaAulas
        aulas={aulasFiltradas}
        editarAula={editarAula}
        borrarAula={pedirEliminar}
      />

      <AulaModal
        isOpen={modalOpen}
        onClose={() => {
          limpiarFormulario();
          setModalOpen(false);
        }}
        formulario={formulario}
        setFormulario={setFormulario}
        guardarAula={guardarAula}
        limpiarFormulario={limpiarFormulario}
        aulaID={aulaID}
      />

      {aulaAEliminar && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>
              ¿Seguro que desea eliminar el aula "{aulaAEliminar.nombre}"?
            </p>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setAulaAEliminar(null)}
              >
                Cancelar
              </button>

              <button className="primary-btn" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
