import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordRequest } from '../lib/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await forgotPasswordRequest(email);
      setMessage(data.message);
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : 'No se pudo enviar el enlace.');
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
          <h3>Recuperar contraseña</h3>
          <p>Ingresa tu correo institucional para recibir instrucciones.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="usuario@unica.edu.hn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {message ? <div className="auth-success">{message}</div> : null}
            {error ? <div className="auth-error">{error}</div> : null}
            <button type="submit" className="primary-btn auth-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <Link to="/login" className="auth-forgot-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </section>
  );
}
