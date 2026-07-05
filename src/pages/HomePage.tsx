const conflicts = [
  ['01', 'MAT-301', 'Dr. Ramírez J.', 'Aula 201', 'Sobrecargo de capacidad (35/30)', 'ALTA', 'Pendiente'],
  ['02', 'INF-102', 'Lic. Torres M.', 'Aula 104', 'Aula en mantenimiento', 'ALTA', 'Bloqueado'],
  ['03', 'FIS-201', 'Dr. López A.', 'Aula 103', 'Conflicto de horario docente', 'ALTA', 'Pendiente'],
  ['04', 'QUI-101', 'Ing. Medina R.', 'Aula 302', 'Sin aula asignada', 'MEDIA', 'En Revisión'],
  ['05', 'LET-220', 'Msc. Ruiz C.', '—', 'Sobrecarga horaria docente', 'MEDIA', 'En Revisión'],
  ['06', 'ADM-110', 'Lic. Peña V.', 'Aula 205', 'Capacidad excedida 5%', 'BAJA', 'En Proceso'],
  ['07', 'ECO-301', 'Dr. Vega S.', '—', 'Sin aula asignada', 'BAJA', 'En Revisión'],
  ['08', 'SOC-102', 'Lic. Castro D.', 'Aula 401', 'Conflicto de espacio', 'MEDIA', 'Pendiente'],
];

export function HomePage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-head">
        <div className="toolbar">
          <div>
            <h3>Indicadores en Tiempo Real - Período Activo</h3>
            <p>Actualizado hace 2 min • Agosto-Diciembre 2026</p>
          </div>
          <div className="toolbar-actions">
            <button className="secondary-btn">↻ Actualizar</button>
            <button className="primary-btn dropdown-btn">↑ Exportar Horario <span>▾</span></button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-panel blue">
          <div className="stat-top">
            <span>SECCIONES TOTALES</span>
            <div className="icon-box">▤</div>
          </div>
          <div className="stat-big">45 <small>/ 120</small></div>
          <p>37.5% del período asignado</p>
          <div className="progress"><span style={{ width: '37.5%' }} /></div>
          <div className="stat-footer">
            <strong>45 Asignadas</strong>
            <span>75 Pendientes</span>
          </div>
        </article>

        <article className="stat-panel green">
          <div className="stat-top">
            <span>ESTADO DE AULAS</span>
            <div className="icon-box">▥</div>
          </div>
          <div className="mini-stats">
            <div className="mini-stat success"><strong>18</strong><span>Disponibles</span></div>
            <div className="mini-stat soft"><strong>12</strong><span>En Uso</span></div>
            <div className="mini-stat gray"><strong>3</strong><span>Mant.</span></div>
          </div>
          <div className="progress"><span style={{ width: '54%' }} /></div>
          <div className="stat-footer">
            <strong>54% disponibilidad</strong>
            <span>Total: 33 aulas</span>
          </div>
        </article>

        <article className="stat-panel orange">
          <div className="stat-top">
            <span>ESTADO DE DOCENTES</span>
            <div className="icon-box">◫</div>
          </div>
          <div className="mini-stats">
            <div className="mini-stat success"><strong>28</strong><span>Activos</span></div>
            <div className="mini-stat gray"><strong>6</strong><span>Sin Asignar</span></div>
          </div>
          <div className="progress"><span style={{ width: '74%' }} /></div>
          <div className="stat-footer">
            <strong>74% cobertura activa</strong>
            <span>Total: 38 docentes</span>
          </div>
        </article>
      </div>

      <div className="content-grid">
        <section className="table-card">
          <div className="section-title">
            <h3>Conflictos Detectados Recientemente</h3>
            <a href="/clases-por-aula">Ver todos →</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Docente</th>
                <th>Aula</th>
                <th>Tipo de Conflicto</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                  <td>{row[4]}</td>
                  <td><span className={`tag priority ${row[5].toLowerCase()}`}>{row[5]}</span></td>
                  <td><span className={`tag state ${row[6].toLowerCase().replace(/\s/g, '-')}`}>{row[6]}</span></td>
                  <td><button className="link-btn">Resolver →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="side-panels">
          <div className="section-title compact">
            <h3>Panel de Control</h3>
            <a href="/clases-por-aula">Ir al módulo →</a>
          </div>
          <div className="quick-card">
            <h4>Acciones Rápidas</h4>
            <button className="wide-action blue">+ Nueva Sección</button>
            <button className="wide-action green">◇ Asignar Aula</button>
            <button className="wide-action gray">⎙ Imprimir Horario</button>
          </div>
          <div className="activity-card">
            <h4>Actividad Reciente</h4>
            <ul>
              <li><span className="dot blue" /> MAT-301 → Aula 201 asignada <small>hace 5 min</small></li>
              <li><span className="dot orange" /> Torres M.: licencia aprobada <small>hace 12 min</small></li>
              <li><span className="dot red" /> Aula 104 en mantenimiento <small>hace 25 min</small></li>
              <li><span className="dot orange" /> INF-102: sobrecarga detectado <small>hace 1 hora</small></li>
            </ul>
          </div>
          <div className="progress-card">
            <h4>Progreso del Período</h4>
            <div className="progress"><span style={{ width: '37.5%' }} /></div>
            <div className="progress-footer"><strong>37.5%</strong><span>45 de 120 secciones</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
