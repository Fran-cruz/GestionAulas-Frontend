import { useEffect, useState } from "react";
import {
  obtenerAulas,
  crearAula,
  modificarAula,
  eliminarAula,
} from "../lib/aulasServices";

import {
  FormularioAula,
  AulaForm,
} from "../components/FormularioAula";

import {
  TablaAulas,
  Aula,
} from "../components/TablaAulas";

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
      setAulas(datos.filter((aula): aula is Aula => typeof aula.id === "number"));
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getAulas();
  }, []);

  async function guardarAula(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const datos = {
      ...formulario,
      piso: Number(formulario.piso),
      capacidad_maxima: Number(formulario.capacidad_maxima),
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
    setAulaID(aula.id);

    setFormulario({
      nombre: aula.nombre,
      edificio: aula.edificio,
      piso: aula.piso,
      tipo: aula.tipo,
      capacidad_maxima: aula.capacidad_maxima,
      descripcion: aula.descripcion,
      estado: aula.estado,
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
        <div className="catalog-summary">
          {aulas.length} Aulas Registradas
        </div>
      </div>

      <FormularioAula
        formulario={formulario}
        setFormulario={setFormulario}
        guardarAula={guardarAula}
        limpiarFormulario={limpiarFormulario}
        aulaID={aulaID}
      />

      <br />

      <input
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

    </section>
  );
}
