import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  PeriodoAcademico,
  PeriodoFormValues,
  createPeriodo,
  deletePeriodo,
  formatEstado,
  formatFecha,
  listPeriodos,
  updatePeriodo,
} from '../lib/periodos';
import { PeriodoAcademicoModal } from '../components/PeriodoAcademicoModal';

const PAGE_SIZE = 8;

function getStoredAuthUserId() {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { id?: number };
    return typeof parsed.id === 'number' ? parsed.id : null;
  } catch {
    return null;
  }
}

export function PeriodosAcademicosPage() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPeriodos = async () => {
    setLoading(true);
    setLoadError('');

    try {
      const data = await listPeriodos();
      setPeriodos(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los períodos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPeriodos();
  }, []);

  const sortedPeriodos = useMemo(() => {
    return [...periodos].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : b.id;
      return bTime - aTime;
    });
  }, [periodos]);

  const totalPages = Math.max(1, Math.ceil(sortedPeriodos.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visiblePeriodos = sortedPeriodos.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleOpenCreate() {
    setEditingId(null);
    setModalMode('create');
    setActionError('');
    setSuccessMessage('');
  }

  function handleOpenEdit(id: number) {
    setEditingId(id);
    setModalMode('edit');
    setActionError('');
    setSuccessMessage('');
  }

  function handleCloseModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function handleSave(values: PeriodoFormValues) {
    const authUserId = getStoredAuthUserId();
    if (!authUserId && modalMode === 'create') {
      setActionError('No se pudo identificar al usuario autenticado. Vuelve a iniciar sesión.');
      return;
    }

    setSaving(true);
    setActionError('');
    setSuccessMessage('');

    try {
      if (modalMode === 'edit' && editingId !== null) {
        await updatePeriodo(editingId, values);
        setSuccessMessage('Período académico actualizado correctamente.');
      } else if (authUserId) {
        await createPeriodo(values, authUserId);
        setSuccessMessage('Período académico creado correctamente.');
      }

      await loadPeriodos();
      handleCloseModal();
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError('No se pudo guardar el período.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePeriodo(periodo: PeriodoAcademico) {
    const confirmed = window.confirm(`¿Deseas borrar el período "${periodo.nombre}"?`);
    if (!confirmed) return;

    setDeletingId(periodo.id);
    setActionError('');
    setSuccessMessage('');

    try {
      await deletePeriodo(periodo.id);
      await loadPeriodos();
      setSuccessMessage(`"${periodo.nombre}" fue eliminado correctamente.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError('No se pudo borrar el período.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  const editingPeriodo = periodos.find((periodo) => periodo.id === editingId);

  return (
    <section className="periodos-shell">
      <aside className="periodos-brand-panel">
        <div className="periodos-brand-card">
          <div className="periodos-brand-emblem">PA</div>
        </div>
        <div className="periodos-brand-copy">
          <span className="periodos-brand-line" />
          <h1>Períodos Académicos</h1>
          <p>Configuración y control de los periodos activos y cerrados del sistema.</p>
        </div>
      </aside>

      <main className="periodos-content-panel">
        <div className="periodos-card">
          <div className="periodos-card-head">
            <div>
              <p className="periodos-kicker">Restablecer configuración</p>
              <h2>Gestión de Períodos Académicos</h2>
              <span>Crear, editar y eliminar registros con paginación.</span>
            </div>
            <button type="button" className="primary-btn" onClick={handleOpenCreate}>
              + Nuevo Período
            </button>
          </div>

          {loadError ? <div className="feedback error">{loadError}</div> : null}
          {actionError ? <div className="feedback error">{actionError}</div> : null}
          {successMessage ? <div className="feedback success">{successMessage}</div> : null}

          <div className="table-card full">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Secciones</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Cargando períodos...</td>
                  </tr>
                ) : visiblePeriodos.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay períodos registrados todavía.</td>
                  </tr>
                ) : (
                  visiblePeriodos.map((periodo) => (
                    <tr key={periodo.id}>
                      <td>{periodo.nombre}</td>
                      <td>{formatFecha(periodo.fecha_inicio)}</td>
                      <td>{formatFecha(periodo.fecha_fin)}</td>
                      <td>{periodo.secciones}</td>
                      <td>
                        <span className={`tag state ${periodo.estado.toLowerCase()}`}>
                          {formatEstado(periodo.estado)}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="edit-btn" onClick={() => handleOpenEdit(periodo.id)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDeletePeriodo(periodo)}
                            disabled={deletingId === periodo.id}
                          >
                            {deletingId === periodo.id ? 'Borrando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!loading && sortedPeriodos.length > PAGE_SIZE ? (
              <div className="pagination-bar">
                <span>
                  Página {safePage} de {totalPages}
                </span>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage <= 1}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {modalMode === 'create' ? (
        <PeriodoAcademicoModal
          title="Nuevo Período Académico"
          onClose={handleCloseModal}
          onSave={handleSave}
          saving={saving}
        />
      ) : null}

      {modalMode === 'edit' && editingPeriodo ? (
        <PeriodoAcademicoModal
          title="Editar Período Académico"
          initialData={editingPeriodo}
          onClose={handleCloseModal}
          onSave={handleSave}
          saving={saving}
        />
      ) : null}
    </section>
  );
}
