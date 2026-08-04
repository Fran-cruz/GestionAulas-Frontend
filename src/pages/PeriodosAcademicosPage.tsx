import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  PeriodoAcademico,
  PeriodoFormValues,
  createPeriodo,
  formatEstado,
  formatFecha,
  deletePeriodo,
  listPeriodos,
  activatePeriodo,
} from '../lib/periodos';

const emptyForm: PeriodoFormValues = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'CERRADO',
};

function getStoredAuthUserId() {
  const raw = localStorage.getItem('auth_user');
  if (!raw) {
    return null;
  }

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
  const [form, setForm] = useState<PeriodoFormValues>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleChange = (field: keyof PeriodoFormValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setActionError('');
    setSuccessMessage('');

    const authUserId = getStoredAuthUserId();
    if (!authUserId) {
      setFormError('No se pudo identificar al usuario autenticado. Vuelve a iniciar sesión.');
      return;
    }

    if (form.fecha_fin <= form.fecha_inicio) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    setSaving(true);

    const payload: PeriodoFormValues = {
      ...form,
      nombre: form.nombre.trim(),
      estado: 'CERRADO',
    };

    try {
      await createPeriodo(payload, authUserId);
      setForm(emptyForm);
      setSuccessMessage('Período académico creado correctamente.');
      await loadPeriodos();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError('No se pudo guardar el período.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPeriodo = async (periodo: PeriodoAcademico) => {
    setActionError('');
    setSuccessMessage('');

    const confirmed = window.confirm(
      `¿Deseas seleccionar "${periodo.nombre}" como el período académico activo?`,
    );
    if (!confirmed) {
      return;
    }

    setUpdatingId(periodo.id);

    try {
      await activatePeriodo(periodo.id);

      await loadPeriodos();
      setSuccessMessage(`"${periodo.nombre}" fue seleccionado como período activo.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
        return;
      }

      setActionError('No se pudo activar el período.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeletePeriodo = async (periodo: PeriodoAcademico) => {
    if (periodo.estado.toUpperCase() === 'ACTIVO') {
      setActionError('No se puede borrar el período activo.');
      return;
    }

    setActionError('');
    setSuccessMessage('');

    const confirmed = window.confirm(`¿Deseas borrar el período "${periodo.nombre}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(periodo.id);

    try {
      await deletePeriodo(periodo.id);
      await loadPeriodos();
      setSuccessMessage(`"${periodo.nombre}" fue eliminado correctamente.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
        return;
      }

      setActionError('No se pudo borrar el período.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedPeriodos = [...periodos].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : a.id;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : b.id;

    return bTime - aTime;
  });

  return (
    <section className="catalog-page">
      <div className="toolbar">
        <div className="catalog-summary">Gestión de Períodos Académicos</div>
      </div>

      {loadError ? <div className="feedback error">{loadError}</div> : null}
      {actionError ? <div className="feedback error">{actionError}</div> : null}
      {successMessage ? <div className="feedback success">{successMessage}</div> : null}

      <div className="content-grid" style={{ gridTemplateColumns: '0.82fr 1.18fr', paddingTop: 40 }}>
        <section className="table-card" style={{ padding: 28, minHeight: 560 }}>
          <h3 style={{ marginTop: 0 }}>Crear Nuevo Período Académico</h3>
          <div style={{ borderTop: '1px solid #dbe4f0', margin: '48px 0 28px' }} />

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 28 }}>
            <label className="period-field">
              <span>Nombre del Período</span>
              <input
                type="text"
                value={form.nombre}
                onChange={handleChange('nombre')}
                placeholder="Ej: Agosto - Diciembre 2026"
                required
                maxLength={100}
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: '1px solid #dbe4f0',
                  padding: '8px 0',
                  outline: 'none',
                  color: '#1a1a1a',
                }}
              />
            </label>

            <label className="period-field">
              <span>Fecha de Inicio</span>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={handleChange('fecha_inicio')}
                required
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: '1px solid #dbe4f0',
                  padding: '8px 0',
                  outline: 'none',
                  color: '#1a1a1a',
                }}
              />
            </label>

            <label className="period-field">
              <span>Fecha de Fin</span>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={handleChange('fecha_fin')}
                required
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: '1px solid #dbe4f0',
                  padding: '8px 0',
                  outline: 'none',
                color: '#1a1a1a',
                }}
              />
            </label>

            {formError ? <div className="feedback error">{formError}</div> : null}

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
              style={{ marginTop: 20, width: 270 }}
            >
              {saving ? 'Guardando...' : 'Guardar Nuevo Período'}
            </button>
          </form>
        </section>

        <section className="table-card" style={{ padding: 22, minHeight: 660, overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: 24 }}>Períodos Anteriores</h3>
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
              ) : periodos.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hay períodos registrados todavía.</td>
                </tr>
              ) : (
                sortedPeriodos.map((periodo) => (
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
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleSelectPeriodo(periodo)}
                          disabled={updatingId === periodo.id || periodo.estado.toUpperCase() === 'ACTIVO'}
                        >
                          {periodo.estado.toUpperCase() === 'ACTIVO'
                            ? 'Activo'
                            : updatingId === periodo.id
                              ? 'Seleccionando...'
                              : 'Seleccionar'}
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeletePeriodo(periodo)}
                          disabled={deletingId === periodo.id || periodo.estado.toUpperCase() === 'ACTIVO'}
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
        </section>
      </div>
    </section>
  );
}
