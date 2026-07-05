const periods = [
  ['Enero - Junio 2026', '10/01/2026', '30/06/2026', '118', 'Cerrado'],
  ['Agosto - Diciembre 2025', '05/08/2025', '18/12/2025', '105', 'Cerrado'],
  ['Enero - Junio 2025', '08/01/2025', '25/06/2025', '96', 'Cerrado'],
];

export function PeriodosAcademicosPage() {
  return (
    <section className="catalog-page">
      <div className="toolbar">
        <div className="catalog-summary">Gestión de Períodos Académicos</div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', paddingTop: 40 }}>
        <section className="table-card" style={{ padding: 32, minHeight: 560 }}>
          <h3 style={{ marginTop: 0 }}>Crear Nuevo Período Académico</h3>
          <div style={{ borderTop: '1px solid #dbe4f0', margin: '48px 0 28px' }} />

          <div style={{ display: 'grid', gap: 28 }}>
            <label className="period-field">
              <span>Nombre del Período</span>
              <strong>Agosto - Diciembre 2026</strong>
            </label>
            <label className="period-field">
              <span>Fecha de Inicio</span>
              <strong>01/08/2026</strong>
            </label>
            <label className="period-field">
              <span>Fecha de Fin</span>
              <strong>20/12/2026</strong>
            </label>
          </div>

          <button className="primary-btn" style={{ marginTop: 48, width: 270 }}>
            Guardar Nuevo Período
          </button>
        </section>

        <section className="table-card" style={{ padding: 24, minHeight: 660 }}>
          <h3 style={{ marginTop: 0, marginBottom: 24 }}>Períodos Anteriores</h3>
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Secciones</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                  <td><span className="tag state pendiente">{row[4]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
