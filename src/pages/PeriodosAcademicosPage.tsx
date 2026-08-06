import { FormEvent, useEffect, useMemo, useState } from 'react';
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

const emptyForm: PeriodoFormValues = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'CERRADO',
};

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
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState<PeriodoFormValues>(emptyForm);
  const [createSaving, setCreateSaving] = useState(false);
  const [createFormError, setCreateFormError] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoAcademico | undefined>(undefined);
  const [modalSaving, setModalSaving] = useState(false);

  async function loadPeriodos() {
    setLoading(true);
    setLoadError('');
    try {
      setPeriodos(await listPeriodos());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los períodos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPeriodos();
  }, []);

  const sortedPeriodos = useMemo(
    () =>
      [...periodos].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return bTime - aTime;
      }),
    [periodos],
  );

  const totalPages = Math.max(1, Math.ceil(sortedPeriodos.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visiblePeriodos = sortedPeriodos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function updateCreateForm<K extends keyof PeriodoFormValues>(key: K, value: PeriodoFormValues[K]) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenCreateModal() {
    setModalMode('create');
  }

  function handleOpenEditModal(periodo: PeriodoAcademico) {
    setEditingPeriodo(periodo);
    setModalMode('edit');
  }

  function handleCloseModal() {
    setModalMode(null);
    setEditingPeriodo(undefined);
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateFormError('');
    setActionError('');
    setSuccessMessage('');

    if (!createForm.nombre.trim()) {
      setCreateFormError('El nombre del período es obligatorio.');
      return;
    }
    if (!createForm.fecha_inicio || !createForm.fecha_fin) {
      setCreateFormError('Debes completar ambas fechas.');
      return;
    }
    if (new Date(createForm.fecha_fin) <= new Date(createForm.fecha_inicio)) {
      setCreateFormError('La fecha final debe ser posterior a la fecha de inicio.');
      return;
    }

    const authUserId = getStoredAuthUserId();
    if (!authUserId) {
      setCreateFormError('No se pudo identificar al usuario autenticado. Vuelve a iniciar sesión.');
      return;
    }

    setCreateSaving(true);
    try {
      await createPeriodo(
        {
          ...createForm,
          nombre: createForm.nombre.trim(),
        },
        authUserId,
      );
      setCreateForm(emptyForm);
      setSuccessMessage('Período académico creado correctamente.');
      await loadPeriodos();
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateFormError(error.message);
      } else {
        setCreateFormError('No se pudo guardar el período.');
      }
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleModalSave(values: PeriodoFormValues) {
    setModalSaving(true);
    setActionError('');
    setSuccessMessage('');

    try {
      if (modalMode === 'edit' && editingPeriodo) {
        await updatePeriodo(editingPeriodo.id, values);
        setSuccessMessage('Período académico actualizado correctamente.');
      } else {
        const authUserId = getStoredAuthUserId();
        if (!authUserId) {
          setActionError('No se pudo identificar al usuario autenticado. Vuelve a iniciar sesión.');
          return;
        }
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
      setModalSaving(false);
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

  return (
    <section className="catalog-page">
      <div className="toolbar">
        <div>
          <h2>Configuración de Períodos</h2>
          <span>/ Gestión Académica</span>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="primary-btn" onClick={handleOpenCreateModal}>
            + Nuevo Período
          </button>
        </div>
      </div>

      {loadError ? <div className="feedback error">{loadError}</div> : null}
      {actionError ? <div className="feedback error">{actionError}</div> : null}
      {successMessage ? <div className="feedback success">{successMessage}</div> : null}

      <div className="content-grid periodos-grid">
        <section className="table-card periodos-form-card">
          <h3>Crear Nuevo Período Académico</h3>
          <div className="periodos-divider" />

          <form onSubmit={handleCreateSubmit} className="periodos-form">
            <label>
              <span>Nombre del Período</span>
              <input
                type="text"
                value={createForm.nombre}
                onChange={(event) => updateCreateForm('nombre', event.target.value)}
                placeholder="Ej: Agosto - Diciembre 2026"
                maxLength={100}
              />
            </label>

            <label>
              <span>Fecha de Inicio</span>
              <input
                type="date"
                value={createForm.fecha_inicio}
                onChange={(event) => updateCreateForm('fecha_inicio', event.target.value)}
              />
            </label>

            <label>
              <span>Fecha de Fin</span>
              <input
                type="date"
                value={createForm.fecha_fin}
                onChange={(event) => updateCreateForm('fecha_fin', event.target.value)}
              />
            </label>

            {createFormError ? <div className="feedback error">{createFormError}</div> : null}

            <button type="submit" className="primary-btn periodos-submit" disabled={createSaving}>
              {createSaving ? 'Guardando...' : 'Guardar Nuevo Período'}
            </button>
          </form>
        </section>

        <section className="table-card periodos-table-card">
          <h3>Períodos Anteriores</h3>
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
                        <button type="button" className="edit-btn" onClick={() => handleOpenEditModal(periodo)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeletePeriodo(periodo)}
                          disabled={deletingId === periodo.id}
                        >
                          {deletingId === periodo.id ? 'Borrando...' : 'Borrar'}
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
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage <= 1}
              >
                Anterior
              </button>
              <span>
                Página {safePage} de {totalPages}
              </span>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage >= totalPages}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {modalMode ? (
        <PeriodoAcademicoModal
          title={modalMode === 'edit' ? 'Editar Período Académico' : 'Nuevo Período Académico'}
          initialData={modalMode === 'edit' ? editingPeriodo : undefined}
          onClose={handleCloseModal}
          onSave={handleModalSave}
          saving={modalSaving}
        />
      ) : null}
    </section>
  );
}
