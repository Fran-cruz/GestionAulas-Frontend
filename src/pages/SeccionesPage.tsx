const sections = [
  ['MAT-301', 'Cálculo Diferencial', 'Dr. Juan Ramírez', '35', '4', 'Activa'],
  ['INF-102', 'Programación I', 'Lic. María Torres', '28', '3', 'Activa'],
  ['FIS-201', 'Física General', 'Dr. Carlos López', '30', '4', 'Activa'],
  ['QUI-101', 'Química Orgánica', 'Ing. Rosa Medina', '22', '3', 'Activa'],
  ['LET-220', 'Literatura Universal', 'Msc. Ana Ruiz', '40', '2', 'Activa'],
  ['ADM-110', 'Administración I', 'Lic. Pedro Vega', '33', '3', 'Pendiente'],
];

export function SeccionesPage() {
  return (
    <section className="catalog-page">
      <div className="toolbar">
        <div className="catalog-summary">6 Secciones Registradas</div>

        <button className="primary-btn">+ Nueva Sección</button>
      </div>

      <div className="table-card full">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Asignatura</th>
              <th>Docente Titular</th>
              <th>Alumnos</th>
              <th>Créditos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
                <td>{row[4]}</td>
                <td><span className={`tag state ${row[5].toLowerCase()}`}>{row[5]}</span></td>
                <td><button className="edit-btn">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
