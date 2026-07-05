import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ClasesPorAulaPage } from './pages/ClasesPorAulaPage';
import { LoginPage } from './pages/LoginPage';
import { HorarioPage } from './pages/HorarioPage';
import { FacultadesPage } from './pages/FacultadesPage';
import { AulasPage } from './pages/AulasPage';
import { DocentesPage } from './pages/DocentesPage';
import { SeccionesPage } from './pages/SeccionesPage';
import { PeriodosAcademicosPage } from './pages/PeriodosAcademicosPage';
import { CoordinadoresPage } from './pages/CoordinadoresPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/clases-por-aula" element={<ClasesPorAulaPage />} />
        <Route path="/horario" element={<HorarioPage />} />
        <Route path="/facultades" element={<FacultadesPage />} />
        <Route path="/aulas" element={<AulasPage />} />
        <Route path="/docentes" element={<DocentesPage />} />
        <Route path="/secciones" element={<SeccionesPage />} />
        <Route path="/periodos" element={<PeriodosAcademicosPage />} />
        <Route path="/coordinadores" element={<CoordinadoresPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
