import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@unicah.edu.hn');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <section className="auth-screen">
        <aside className="auth-brand-panel">
          <div className="auth-brand-block">
            <h1>UNICAH</h1>
            <p>Campus San Isidro</p>
          </div>

          <h2>Sistema de Gestión Académica</h2>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-card">
            <h3>Iniciar Sesión</h3>
            <p>Bienvenido al sistema administrativo</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                  type="email"
                  placeholder="usuario@unica.edu.hn"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
              />
              <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
              />
              {error ? <div className="auth-error">{error}</div> : null}
              <button type="submit" className="primary-btn auth-submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
              </button>
            </form>

            <Link to="/forgot-password" className="auth-forgot-link">
              ¿Olvidaste tu contraseña?
            </Link>

            <small>© 2026 Universidad Católica de Honduras</small>
          </div>
        </div>
      </section>
  );
}
