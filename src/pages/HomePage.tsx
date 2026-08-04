import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { DashboardData, fetchDashboard, timeAgo } from '../lib/dashboard';
import { fetchScheduleSnapshot } from '../features/schedule/api';
import { exportHorarioPdf } from '../lib/exportHorarioPdf';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleExportPdf = async () => {
    setExporting(true);
    setExportError('');
    try {
      const snapshot = await fetchScheduleSnapshot();
      exportHorarioPdf(snapshot);
    } catch (err) {
      setExportError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
        <section className="dashboard-page">
          <div style={{ padding: 24 }}>Cargando indicadores desde el backend…</div>
        </section>
    );
  }

  if (error || !data) {
    return (
        <section className="dashboard-page">
          <div style={{ padding: 24 }}>
            <p className="feedback error">{error || 'No se pudo cargar el dashboard.'}</p>
            <button className="chip-btn" onClick={() => void load()}>Reintentar</button>
          </div>
        </section>
    );
  }

  const seccionesTotal = data.secciones.total;
  const seccionesAsignadas = data.secciones.asignadas;
  const seccionesPct = pct(seccionesAsignadas, seccionesTotal);

  const aulasTotal = data.aulas.total;
  const aulasDisponibilidadPct = pct(data.aulas.disponibles, aulasTotal);

  const docentesTotal = data.docentes.total;
  const docentesCoberturaPct = pct(data.docentes.activos, docentesTotal);

  return (
      <section className="dashboard-page">
        <div className="dashboard-head">
          <div className="toolbar">
            <div>
              <h3>Indicadores en Tiempo Real{data.periodo_activo ? ` - ${data.periodo_activo.nombre}` : ''}</h3>
              <p>
                {lastUpdated ? `Actualizado hace ${timeAgo(lastUpdated.toISOString())}` : ''}
                {data.periodo_activo ? ` • ${data.periodo_activo.nombre}` : ' • Sin período activo'}
              </p>
            </div>
            <div className="toolbar-actions">
              <button className="secondary-btn" onClick={() => void load()} disabled={loading}>↻ Actualizar</button>
              <button className="primary-btn dropdown-btn" onClick={() => void handleExportPdf()} disabled={exporting}>
                ↑ {exporting ? 'Generando PDF...' : 'Exportar Horario'}
              </button>
            </div>
          </div>
          {exportError ? <p className="feedback error" style={{ margin: '0 24px 12px' }}>{exportError}</p> : null}
        </div>

        <div className="stats-grid">
          <article className="stat-panel blue">
            <div className="stat-top">
              <span>SECCIONES TOTALES</span>
              <div className="icon-box">▤</div>
            </div>
            <div className="stat-big">{seccionesAsignadas} <small>/ {seccionesTotal}</small></div>
            <p>{seccionesPct}% del período asignado</p>
            <div className="progress"><span style={{ width: `${seccionesPct}%` }} /></div>
            <div className="stat-footer">
              <strong>{seccionesAsignadas} Asignadas</strong>
              <span>{data.secciones.pendientes} Pendientes</span>
            </div>
          </article>

          <article className="stat-panel green">
            <div className="stat-top">
              <span>ESTADO DE AULAS</span>
              <div className="icon-box">▥</div>
            </div>
            <div className="mini-stats">
              <div className="mini-stat success"><strong>{data.aulas.disponibles}</strong><span>Disponibles</span></div>
              <div className="mini-stat soft"><strong>{data.aulas.en_uso}</strong><span>En Uso</span></div>
              <div className="mini-stat gray"><strong>{data.aulas.mantenimiento}</strong><span>Mant.</span></div>
            </div>
            <div className="progress"><span style={{ width: `${aulasDisponibilidadPct}%` }} /></div>
            <div className="stat-footer">
              <strong>{aulasDisponibilidadPct}% disponibilidad</strong>
              <span>Total: {aulasTotal} aulas</span>
            </div>
          </article>

          <article className="stat-panel orange">
            <div className="stat-top">
              <span>ESTADO DE DOCENTES</span>
              <div className="icon-box">◫</div>
            </div>
            <div className="mini-stats">
              <div className="mini-stat success"><strong>{data.docentes.activos}</strong><span>Activos</span></div>
              <div className="mini-stat gray"><strong>{data.docentes.sin_asignar}</strong><span>Sin Asignar</span></div>
            </div>
            <div className="progress"><span style={{ width: `${docentesCoberturaPct}%` }} /></div>
            <div className="stat-footer">
              <strong>{docentesCoberturaPct}% cobertura activa</strong>
              <span>Total: {docentesTotal} docentes</span>
            </div>
          </article>
        </div>

        <div className="content-grid">
          <section className="table-card">
            <div className="section-title">
              <h3>Conflictos Detectados ({data.conflictos.length})</h3>
              <Link to="/clases-por-aula">Ver todos →</Link>
            </div>
            <table>
              <thead>
              <tr>
                <th>#</th>
                <th>Sección</th>
                <th>Docente</th>
                <th>Aula</th>
                <th>Tipo de Conflicto</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
              </thead>
              <tbody>
              {data.conflictos.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No hay conflictos detectados en este momento. 🎉</td>
                  </tr>
              ) : (
                  data.conflictos.map((row, index) => (
                      <tr key={row.id}>
                        <td>{String(index + 1).padStart(2, '0')}</td>
                        <td>{row.seccion}</td>
                        <td>{row.docente}</td>
                        <td>{row.aula}</td>
                        <td>{row.tipo}</td>
                        <td><span className={`tag priority ${row.prioridad.toLowerCase()}`}>{row.prioridad}</span></td>
                        <td><span className={`tag state ${row.estado.toLowerCase().replace(/\s/g, '-')}`}>{row.estado}</span></td>
                        <td>
                          <Link to="/clases-por-aula" className="link-btn">Resolver →</Link>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </section>

          <aside className="side-panels">
            <div className="section-title compact">
              <h3>Panel de Control</h3>
              <Link to="/clases-por-aula">Ir al módulo →</Link>
            </div>
            <div className="quick-card">
              <h4>Acciones Rápidas</h4>
              <Link to="/secciones" className="wide-action blue">+ Nueva Sección</Link>
              <Link to="/clases-por-aula" className="wide-action green">◇ Asignar Aula</Link>
              <button className="wide-action gray" onClick={() => void handleExportPdf()} disabled={exporting}>
                ⎙ {exporting ? 'Generando...' : 'Imprimir Horario'}
              </button>
            </div>
            <div className="activity-card">
              <h4>Actividad Reciente</h4>
              {data.actividad_reciente.length === 0 ? (
                  <p className="feedback">Todavía no hay actividad registrada.</p>
              ) : (
                  <ul>
                    {data.actividad_reciente.map((item, index) => (
                        <li key={index}>
                          <span className="dot blue" /> {item.descripcion} <small>{timeAgo(item.fecha)}</small>
                        </li>
                    ))}
                  </ul>
              )}
            </div>
            <div className="progress-card">
              <h4>Progreso del Período</h4>
              <div className="progress"><span style={{ width: `${seccionesPct}%` }} /></div>
              <div className="progress-footer">
                <strong>{seccionesPct}%</strong>
                <span>{seccionesAsignadas} de {seccionesTotal} secciones</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
  );
}
