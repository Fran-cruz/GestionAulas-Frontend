const coordinators = [
  ['DOC-001', 'Dr. Juan Ramírez', 'Ingeniería', 'Cálculo', 'Activa', '18h'],
  ['DOC-002', 'Lic. María Torres', 'Ingeniería', 'Programación', 'Activa', '16h'],
  ['DOC-003', 'Dr. Carlos López', 'Ciencias', 'Física', 'Licencia', '12h'],
  ['DOC-004', 'Ing. Rosa Medina', 'Ciencias', 'Química', 'Activa', '20h'],
];

export function CoordinadoresPage() {
  return (
    <section className="catalog-page">
      <div className="catalog-toolbar">
        <h2>Catálogo de Coordinadores</h2>
        <span>/ Gestión de Personal Académico</span>
        <button className="primary-btn">+ Nuevo Coordinador</button>
      </div>

      <div className="catalog-summary">4 Coordinadores Registrados</div>

      <div className="table-card full">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre Completo</th>
              <th>Departamento</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Carga Horaria</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coordinators.map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
                <td><span className={`tag state ${row[4].toLowerCase()}`}>{row[4]}</span></td>
                <td>{row[5]}</td>
                <td><button className="edit-btn">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
