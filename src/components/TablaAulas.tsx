import type { Aula } from "../lib/aulasServices";

interface Props {
  aulas: Aula[];
  editarAula: (aula: Aula) => void;
  borrarAula: (id: number) => void;
}

export function TablaAulas({
  aulas,
  editarAula,
  borrarAula,
}: Props) {

  return (
    <div className="table-card full">

      <div className="section-title">
        <h3>Lista de Aulas</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Edificio</th>
            <th>Piso</th>
            <th>Tipo</th>
            <th>Capacidad</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {aulas.length > 0 ? (
            aulas.map((aula) => (
              <tr key={aula.id}>
                <td>{aula.id}</td>
                <td>{aula.nombre}</td>
                <td>{aula.edificio}</td>
                <td>{aula.piso}</td>
                <td>{aula.tipo}</td>
                <td>{aula.capacidad_maxima}</td>
                <td>{aula.descripcion}</td>
                <td>
                  <span
                    className={`estado-badge ${
                      aula.estado.toLowerCase() === "disponible"
                        ? "estado-disponible"
                        : "estado-mantenimiento"
                    }`}
                  >
                    {aula.estado}
                  </span>
                </td>

                        <td>
            <div className="acciones">
              <button
                className="edit-btn"
                onClick={() => editarAula(aula)}
              >
                Editar
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  aula.id !== undefined && borrarAula(aula.id)
                }
              >
                Eliminar
              </button>
            </div>
          </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={9}
                style={{ textAlign: "center" }}
              >
                No hay aulas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}
