import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  obtenerAulas,
  crearAula,
  modificarAula,
  eliminarAula,
} from "../lib/aulasServices";

import type { Aula, AulaData } from "../lib/aulasServices";

import {
  FormularioAula,
  AulaForm,
} from "../components/FormularioAula";

import { TablaAulas } from "../components/TablaAulas";

export function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [buscar, setBuscar] = useState("");
  const [aulaID, setAulaID] = useState<number | null>(null);

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
    }
  }

  useEffect(() => {
    getAulas();
  }, []);

  async function guardarAula(
    e: FormEvent<HTMLFormElement>
  ) {
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
      } else {
        await crearAula(datos);
      }

      await getAulas();
      limpiarFormulario();
    } catch (error) {
      console.error(error);
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
  }

  async function borrarAula(id: number) {
    try {
      await eliminarAula(id);
      await getAulas();
    } catch (error) {
      console.error(error);
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
        <h2>Aulas</h2>

        <span>Administración de aulas</span>

        <div className="period-chip">
          {aulas.length} Aulas Registradas
        </div>
      </div>

      <div className="aulas-layout">
        <FormularioAula
          formulario={formulario}
          setFormulario={setFormulario}
          guardarAula={guardarAula}
          limpiarFormulario={limpiarFormulario}
          aulaID={aulaID}
        />

        <div>
          <input
            className="search-input"
            type="text"
            placeholder="Buscar aula..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />

          <br />
          <br />

          <TablaAulas
            aulas={aulasFiltradas}
            editarAula={editarAula}
            borrarAula={borrarAula}
          />
        </div>
      </div>
    </section>
  );
}
