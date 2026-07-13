import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getStoredAuthUser, logout } from '../lib/auth';

const navSections = [
  {
    title: 'Principal',
    items: [
      { to: '/', label: 'Dashboard' },
      { to: '/clases-por-aula', label: 'Clases por Aula' },
      { to: '/horario', label: 'Horario por Aula' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { to: '/docentes', label: 'Docentes' },
      { to: '/aulas', label: 'Aulas' },
      { to: '/secciones', label: 'Secciones' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { to: '/periodos', label: 'Períodos Académicos' },
      { to: '/coordinadores', label: 'Coordinadores' },
    ],
  },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredAuthUser();

  const titles: Record<string, { title: string; breadcrumb: string }> = {
    '/': { title: 'Dashboard', breadcrumb: 'Inicio' },
    '/clases-por-aula': { title: 'Clases por Aula', breadcrumb: 'Asignación Sección → Aula' },
    '/horario': { title: 'Horario por Aula', breadcrumb: 'Calendario Semanal' },
    '/docentes': { title: 'Catálogo de Docentes', breadcrumb: 'Gestión de Personal Académico' },
    '/aulas': { title: 'Catálogo de Aulas', breadcrumb: 'Infraestructura Física' },
    '/secciones': { title: 'Catálogo de Secciones', breadcrumb: 'Asignaturas y Grupos' },
    '/periodos': { title: 'Configuración de Períodos', breadcrumb: 'Gestión Académica' },
    '/coordinadores': { title: 'Catálogo de Coordinadores', breadcrumb: 'Gestión de Personal Académico' },
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const current = titles[location.pathname] ?? titles['/'];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">U</div>
          <div>
            <div className="brand-title">UNICAH</div>
            <div className="brand-subtitle">Campus San Isidro</div>
          </div>
        </div>

        <div className="period-card">
          <span>PERÍODO ACTIVO</span>
          <strong>Agosto – Diciembre 2026</strong>
        </div>

        {navSections.map((section) => (
          <div key={section.title} className="nav-group">
            <span className="nav-group-title">{section.title}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
              >
                <span className="diamond" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="page-title">
            <h1>{current.title}</h1>
            <span>/ {current.breadcrumb}</span>
          </div>
          <div className="period-chip">● Periodo: Ago-Dic 2026</div>
          <div className="user-area">
            <div className="user-meta">
              <span>Coordinador Académico</span>
              <strong>{user.name}</strong>
            </div>
            <div className="avatar">MG</div>
            <div className="bell">
              <img className="bell" src="https://p.turbosquid.com/ts-thumb/t2/xar3sg/DS/z0p1x1/jpg/1696609801/600x600/fit_q87/6b6794d4a18b97facbf08c8409027895a19f8abd/z0p1x1.jpg" alt=""/>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
