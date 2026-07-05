import { NavLink, Outlet, useLocation } from 'react-router-dom';

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
  const current = titles[location.pathname] ?? titles['/'];

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
              <strong>María González</strong>
            </div>
            <div className="avatar">MG</div>
            <div className="bell">🔔</div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
