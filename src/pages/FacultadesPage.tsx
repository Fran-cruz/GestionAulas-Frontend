import { PageShell } from '../components/PageShell';
import { faculties } from '../data/mockData';

export function FacultadesPage() {
  return (
    <PageShell title="Facultades" description="Listado base para administrar las facultades del campus.">
      <div className="grid cards-3">
        {faculties.map((faculty) => (
          <article key={faculty} className="card">
            <strong>{faculty}</strong>
            <p className="muted">Registro de prueba para la entrega inicial.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
