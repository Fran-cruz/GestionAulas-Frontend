import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  Docente,
  DocenteFormValues,
  createDocente,
  deleteDocente,
  docenteCodigo,
  formatEstado,
  listDocentes,
  updateDocente,
} from '../lib/docentes';

const emptyForm: DocenteFormValues = {
  nombre_completo: '',
  correo_institucional: '',
  telefono: '',
  departamento: '',
  especialidad: '',
  estado: 'ACTIVO',
};

export function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DocenteFormValues>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDocentes = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await listDocentes();
      setDocentes(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los docentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocentes();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (docente: Docente) => {
    setEditingId(docente.id);
    setForm({
      nombre_completo: docente.nombre_completo,
      correo_institucional: docente.correo_institucional,
      telefono: docente.telefono ?? '',
      departamento: docente.departamento ?? '',
      especialidad: docente.especialidad ?? '',
      estado: (docente.estado.toUpperCase() as DocenteFormValues['estado']) ?? 'ACTIVO',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleChange = (field: keyof DocenteFormValues) => (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);

    const payload: DocenteFormValues = {
      ...form,
      telefono: form.telefono.trim(),
      especialidad: form.especialidad.trim(),
    };

    try {
      if (editingId) {
        await updateDocente(editingId, payload);
      } else {
        await createDocente(payload);
      }
      setModalOpen(false);
      await loadDocentes();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('No se pudo guardar el docente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docente: Docente) => {
    const confirmed = window.confirm(`¿Eliminar a ${docente.nombre_completo}?`);
    if (!confirmed) return;

    try {
      await deleteDocente(docente.id);
      await loadDocentes();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el docente.');
    }
  };

  return (
      <section className="catalog-page">
        <div className="toolbar">
          <div className="catalog-summary">{docentes.length} Docentes Registrados</div>
          <button className="primary-btn" onClick={openCreateModal}>
            + Nuevo Docente
          </button>
        </div>

        {loadError ? <div className="feedback error">{loadError}</div> : null}

        <div className="table-card full">
          <table>
            <thead>
            <tr>
              <th>Código</th>
              <th>Nombre Completo</th>
              <th>Departamento</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                  <td colSpan={8}>Cargando docentes...</td>
                </tr>
            ) : docentes.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay docentes registrados todavía.</td>
                </tr>
            ) : (
                docentes.map((docente) => (
                    <tr key={docente.id}>
                      <td>{docenteCodigo(docente.id)}</td>
                      <td>{docente.nombre_completo}</td>
                      <td>{docente.departamento || '—'}</td>
                      <td>{docente.especialidad || '—'}</td>
                      <td>
                    <span className={`tag state ${docente.estado.toLowerCase()}`}>
                      {formatEstado(docente.estado)}
                    </span>
                      </td>
                      <td>{docente.correo_institucional}</td>
                      <td>{docente.telefono || '—'}</td>
                      <td className="row-actions">
                        <button className="edit-btn" onClick={() => openEditModal(docente)}>
                          Editar
                        </button>
                        <button className="edit-btn" onClick={() => handleDelete(docente)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                ))
            )}
            </tbody>
          </table>
        </div>

        {modalOpen ? (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingId ? 'Editar Docente' : 'Nuevo Docente'}</h3>
                  <button className="modal-close" onClick={closeModal} disabled={saving} type="button">
                    ×
                  </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label>Nombre Completo</label>
                    <input
                        type="text"
                        value={form.nombre_completo}
                        onChange={handleChange('nombre_completo')}
                        required
                        maxLength={150}
                    />
                  </div>

                  <div className="form-field">
                    <label>Correo Institucional</label>
                    <input
                        type="email"
                        value={form.correo_institucional}
                        onChange={handleChange('correo_institucional')}
                        required
                        maxLength={150}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Teléfono</label>
                      <input
                          type="text"
                          value={form.telefono}
                          onChange={handleChange('telefono')}
                          maxLength={20}
                      />
                    </div>

                    <div className="form-field">
                      <label>Estado</label>
                      <select value={form.estado} onChange={handleChange('estado')}>
                        <option value="ACTIVO">Activo</option>
                        <option value="LICENCIA">Licencia</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Departamento</label>
                      <input
                          type="text"
                          value={form.departamento}
                          onChange={handleChange('departamento')}
                          required
                          maxLength={100}
                      />
                    </div>

                    <div className="form-field">
                      <label>Especialidad</label>
                      <input
                          type="text"
                          value={form.especialidad}
                          onChange={handleChange('especialidad')}
                          maxLength={150}
                      />
                    </div>
                  </div>

                  {formError ? <div className="feedback error">{formError}</div> : null}

                  <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={closeModal} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary-btn" disabled={saving}>
                      {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Docente'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        ) : null}
      </section>
  );
}