import { PageShell } from '../components/PageShell';

export function LoginPage() {
  return (
    <PageShell title="Login" description="Pantalla de acceso para docentes, coordinación y administradores.">
      <div className="auth-grid">
        <form className="card form-card">
          <label>
            Correo institucional
            <input type="email" placeholder="usuario@unicah.edu" />
          </label>
          <label>
            Contraseña
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className="primary-btn">Ingresar</button>
        </form>
        <aside className="card accent">
          <h3>Objetivo</h3>
          <p>Dejar una entrada clara y profesional para la demo, aunque la autenticación real la maneje Laravel.</p>
        </aside>
      </div>
    </PageShell>
  );
}
