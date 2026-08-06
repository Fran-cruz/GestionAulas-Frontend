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

    return typeof parsed.id === 'number'
        ? parsed.id
        : null;
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

  const [searchTerm, setSearchTerm] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modalMode, setModalMode] = useState<
      'create' | 'edit' | null
  >(null);

  const [editingPeriodo, setEditingPeriodo] =
      useState<PeriodoAcademico | undefined>(undefined);

  const [modalSaving, setModalSaving] = useState(false);

  async function loadPeriodos() {
    setLoading(true);
    setLoadError('');

    try {
      const data = await listPeriodos();
      setPeriodos(data);
    } catch (error) {
      setLoadError(
          error instanceof Error
              ? error.message
              : 'No se pudieron cargar los períodos.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPeriodos();
  }, []);

  /*
   * Ordenar períodos
   */
  const sortedPeriodos = useMemo(() => {
    return [...periodos].sort((a, b) => {
      const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : a.id;

      const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : b.id;

      return bTime - aTime;
    });
  }, [periodos]);

  /*
   * Filtrar períodos mediante búsqueda
   */
  const filteredPeriodos = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return sortedPeriodos;
    }

    return sortedPeriodos.filter((periodo) => {
      const nombre = periodo.nombre.toLowerCase();

      const estado = formatEstado(periodo.estado).toLowerCase();

      const fechaInicio = formatFecha(
          periodo.fecha_inicio
      ).toLowerCase();

      const fechaFin = formatFecha(
          periodo.fecha_fin
      ).toLowerCase();

      return (
          nombre.includes(search) ||
          estado.includes(search) ||
          fechaInicio.includes(search) ||
          fechaFin.includes(search)
      );
    });
  }, [sortedPeriodos, searchTerm]);

  /*
   * Paginación basada en los resultados filtrados
   */
  const totalPages = Math.max(
      1,
      Math.ceil(filteredPeriodos.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const visiblePeriodos = filteredPeriodos.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
  );

  /*
   * Si cambia la búsqueda, regresar a página 1
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /*
   * Evitar quedarse en una página inexistente
   */
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleOpenCreateModal() {
    setEditingPeriodo(undefined);
    setModalMode('create');
  }

  function handleOpenEditModal(
      periodo: PeriodoAcademico
  ) {
    setEditingPeriodo(periodo);
    setModalMode('edit');
  }

  function handleCloseModal() {
    setModalMode(null);
    setEditingPeriodo(undefined);
  }

  async function handleModalSave(
      values: PeriodoFormValues
  ) {
    setModalSaving(true);
    setActionError('');
    setSuccessMessage('');

    try {
      if (modalMode === 'edit' && editingPeriodo) {
        await updatePeriodo(
            editingPeriodo.id,
            values
        );

        setSuccessMessage(
            'Período académico actualizado correctamente.'
        );
      } else {
        const authUserId = getStoredAuthUserId();

        if (!authUserId) {
          setActionError(
              'No se pudo identificar al usuario autenticado. Vuelve a iniciar sesión.'
          );

          return;
        }

        await createPeriodo(values, authUserId);

        setSuccessMessage(
            'Período académico creado correctamente.'
        );
      }

      await loadPeriodos();

      handleCloseModal();
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError(
            'No se pudo guardar el período.'
        );
      }
    } finally {
      setModalSaving(false);
    }
  }

  async function handleDeletePeriodo(
      periodo: PeriodoAcademico
  ) {
    const confirmed = window.confirm(
        `¿Deseas borrar el período "${periodo.nombre}"?`
    );

    if (!confirmed) return;

    setDeletingId(periodo.id);
    setActionError('');
    setSuccessMessage('');

    try {
      await deletePeriodo(periodo.id);

      await loadPeriodos();

      setSuccessMessage(
          `"${periodo.nombre}" fue eliminado correctamente.`
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError(
            'No se pudo borrar el período.'
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
      <section className="page-section">

        {/* Encabezado */}
        <div className="page-header">
          <div>
            <h2>Configuración de Períodos</h2>

            <p className="breadcrumb">
              / Gestión Académica
            </p>
          </div>

          <div className="page-header-actions">
          <span className="registered-count">
            {filteredPeriodos.length} Períodos Registrados
          </span>

            <button
                type="button"
                className="primary-btn"
                onClick={handleOpenCreateModal}
            >
              + Nuevo Período
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {loadError && (
            <div className="feedback error">
              {loadError}
            </div>
        )}

        {actionError && (
            <div className="feedback error">
              {actionError}
            </div>
        )}

        {successMessage && (
            <div className="feedback success">
              {successMessage}
            </div>
        )}

        {/* Tabla */}
        <div className="table-card full periodos-table-card">

          <div className="table-card-header">
            <div>
              <h3>Períodos Académicos</h3>

              <p className="table-description">
                Consulta y administra los períodos académicos registrados.
              </p>
            </div>

            {/* BUSCADOR */}
            <div className="search-wrapper">
            <span className="search-icon">
              🔍
            </span>

              <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(event) =>
                      setSearchTerm(event.target.value)
                  }
                  placeholder="Buscar período..."
                  aria-label="Buscar período"
              />

              {searchTerm && (
                  <button
                      type="button"
                      className="clear-search"
                      onClick={() => setSearchTerm('')}
                      aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <table className="catalog-table">

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
                    <td
                        colSpan={6}
                        className="empty-state"
                    >
                      Cargando períodos...
                    </td>
                  </tr>
              ) : visiblePeriodos.length === 0 ? (
                  <tr>
                    <td
                        colSpan={6}
                        className="empty-state"
                    >
                      {searchTerm
                          ? 'No se encontraron períodos que coincidan con la búsqueda.'
                          : 'No hay períodos registrados todavía.'}
                    </td>
                  </tr>
              ) : (
                  visiblePeriodos.map((periodo) => (
                      <tr key={periodo.id}>

                        <td className="nombre-cell">
                          {periodo.nombre}
                        </td>

                        <td>
                          {formatFecha(
                              periodo.fecha_inicio
                          )}
                        </td>

                        <td>
                          {formatFecha(
                              periodo.fecha_fin
                          )}
                        </td>

                        <td className="secciones-cell">
                          {periodo.secciones}
                        </td>

                        <td>
                      <span
                          className={`tag state ${periodo.estado.toLowerCase()}`}
                      >
                        {formatEstado(
                            periodo.estado
                        )}
                      </span>
                        </td>

                        <td>
                          <div className="row-actions">

                            <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() =>
                                    handleOpenEditModal(
                                        periodo
                                    )
                                }
                                title="Editar período"
                            >
                              Editar
                            </button>

                            <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() =>
                                    handleDeletePeriodo(
                                        periodo
                                    )
                                }
                                disabled={
                                    deletingId === periodo.id
                                }
                                title="Eliminar período"
                            >
                              {deletingId === periodo.id
                                  ? 'Borrando...'
                                  : 'Eliminar'}
                            </button>

                          </div>
                        </td>

                      </tr>
                  ))
              )}

              </tbody>

            </table>
          </div>

          {/* Paginación */}
          {!loading &&
              filteredPeriodos.length > PAGE_SIZE && (
                  <div className="pagination-bar">

              <span className="pagination-info">
                Página {safePage} de {totalPages}
              </span>

                    <div className="pagination-actions">

                      <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                              setCurrentPage((page) =>
                                  Math.max(1, page - 1)
                              )
                          }
                          disabled={safePage <= 1}
                      >
                        Anterior
                      </button>

                      <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                              setCurrentPage((page) =>
                                  Math.min(
                                      totalPages,
                                      page + 1
                                  )
                              )
                          }
                          disabled={
                              safePage >= totalPages
                          }
                      >
                        Siguiente
                      </button>

                    </div>
                  </div>
              )}
        </div>

        {/* Modal */}
        {modalMode && (
            <PeriodoAcademicoModal
                title={
                  modalMode === 'edit'
                      ? 'Editar Período Académico'
                      : 'Nuevo Período Académico'
                }
                initialData={
                  modalMode === 'edit'
                      ? editingPeriodo
                      : undefined
                }
                onClose={handleCloseModal}
                onSave={handleModalSave}
                saving={modalSaving}
            />
        )}

      </section>
  );
}