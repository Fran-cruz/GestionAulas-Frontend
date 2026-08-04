import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  Seccion,
  SeccionFormValues,
  createSeccion,
  deleteSeccion,
  listSecciones,
  seccionCodigo,
  updateSeccion,
  formatEstado,
  formatTipoSesion,
} from '../lib/secciones';
import { Docente, listDocentes } from '../lib/docentes';

const emptyForm: SeccionFormValues = {
  materia: '',
  codigo_materia: '',
  id_docente: '',
  tipo_sesion: 'MATUTINO',
  area_academica: '',
  duracion_sesion_horas: '0',
  horas_semanales_totales: '0',
  cantidad_alumnos: '0',
  sesiones_por_semana: '1',
  activa: true,
};

export function SeccionesPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SeccionFormValues>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSecciones = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await listSecciones();
      setSecciones(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las secciones.');
    } finally {
      setLoading(false);
    }
  };

  const loadDocentes = async () => {
    try {
      const data = await listDocentes();
      setDocentes(data);
    } catch (error) {
      console.error('Error cargando docentes:', error);
    }
  };

  useEffect(() => {
    loadSecciones();
    loadDocentes();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (seccion: Seccion) => {
    setEditingId(seccion.id);
    setForm({
      materia: seccion.materia,
      codigo_materia: seccion.codigo_materia ?? '',
      id_docente: seccion.id_docente ? String(seccion.id_docente) : '',
      tipo_sesion: seccion.tipo_sesion,
      area_academica: seccion.area_academica,
      duracion_sesion_horas: String(seccion.duracion_sesion_horas),
      horas_semanales_totales: String(seccion.horas_semanales_totales),
      cantidad_alumnos: String(seccion.cantidad_alumnos ?? 0),
      sesiones_por_semana: String(seccion.sesiones_por_semana ?? 1),
      activa: seccion.activa,
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleChange = (field: keyof SeccionFormValues) => (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (field === 'activa') {
      setForm((prev) => ({ ...prev, [field]: (event.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);

    const payload: SeccionFormValues = {
      ...form,
      codigo_materia: form.codigo_materia.trim(),
      area_academica: form.area_academica.trim(),
    };

    try {
      if (editingId) {
        await updateSeccion(editingId, payload);
      } else {
        await createSeccion(payload);
      }
      setModalOpen(false);
      await loadSecciones();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('No se pudo guardar la sección.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seccion: Seccion) => {
    const confirmed = window.confirm(`¿Eliminar la sección ${seccion.materia}?`);
    if (!confirmed) return;

    try {
      await deleteSeccion(seccion.id);
      await loadSecciones();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la sección.');
    }
  };

  return (
      <section className="catalog-page">
        <div className="toolbar">
          <div className="catalog-summary">{secciones.length} Secciones Registradas</div>
          <button className="primary-btn" onClick={openCreateModal}>
            + Nueva Sección
          </button>
        </div>

        {loadError ? <div className="feedback error">{loadError}</div> : null}

        <div className="table-card full">
          <table>
            <thead>
            <tr>
              <th>Materia</th>
              <th>Código</th>
              <th>Docente</th>
              <th>Tipo Sesión</th>
              <th>Área Académica</th>
              <th>Horas Semanales</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                  <td colSpan={8}>Cargando secciones...</td>
                </tr>
            ) : secciones.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay secciones registradas todavía.</td>
                </tr>
            ) : (
                secciones.map((seccion) => (
                    <tr key={seccion.id}>
                      <td>{seccion.materia}</td>
                      <td>{seccionCodigo(seccion.id)}</td>
                      <td>{seccion.docente_nombre || '—'}</td>
                      <td>{formatTipoSesion(seccion.tipo_sesion)}</td>
                      <td>{seccion.area_academica}</td>
                      <td>{seccion.horas_semanales_totales}h</td>
                      <td>
                    <span className={`tag state ${seccion.activa ? 'activa' : 'inactiva'}`}>
                      {formatEstado(seccion.activa)}
                    </span>
                      </td>
                      <td className="row-actions">
                        <button className="edit-btn" onClick={() => openEditModal(seccion)}>
                          Editar
                        </button>
                        <button className="edit-btn" onClick={() => handleDelete(seccion)}>
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
                  <h3>{editingId ? 'Editar Sección' : 'Nueva Sección'}</h3>
                  <button className="modal-close" onClick={closeModal} disabled={saving} type="button">
                    ×
                  </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label>Materia *</label>
                    <input
                        type="text"
                        value={form.materia}
                        onChange={handleChange('materia')}
                        required
                        maxLength={150}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Código de Materia</label>
                      <input
                          type="text"
                          value={form.codigo_materia}
                          onChange={handleChange('codigo_materia')}
                          maxLength={30}
                      />
                    </div>

                    <div className="form-field">
                      <label>Docente Titular</label>
                      <select value={form.id_docente} onChange={handleChange('id_docente')}>
                        <option value="">Seleccionar Docente</option>
                        {docentes.map((docente) => (
                            <option key={docente.id} value={docente.id}>
                              {docente.nombre_completo}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Tipo de Sesión *</label>
                      <select value={form.tipo_sesion} onChange={handleChange('tipo_sesion')}>
                        <option value="MATUTINO">Matutino</option>
                        <option value="VESPERTINO">Vespertino</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Área Académica *</label>
                      <input
                          type="text"
                          value={form.area_academica}
                          onChange={handleChange('area_academica')}
                          required
                          maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Duración Sesión (horas) *</label>
                      <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99.99"
                          value={form.duracion_sesion_horas}
                          onChange={handleChange('duracion_sesion_horas')}
                          required
                      />
                    </div>

                    <div className="form-field">
                      <label>Horas Semanales Totales *</label>
                      <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99.99"
                          value={form.horas_semanales_totales}
                          onChange={handleChange('horas_semanales_totales')}
                          required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Cantidad de Alumnos *</label>
                      <input
                          type="number"
                          min="0"
                          value={form.cantidad_alumnos}
                          onChange={handleChange('cantidad_alumnos')}
                          required
                      />
                    </div>

                    <div className="form-field">
                      <label>Sesiones por Semana</label>
                      <input
                          type="number"
                          min="1"
                          value={form.sesiones_por_semana}
                          onChange={handleChange('sesiones_por_semana')}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <input
                            type="checkbox"
                            checked={form.activa}
                            onChange={handleChange('activa')}
                        />
                        Activa
                      </label>
                    </div>
                  </div>

                  {formError ? <div className="feedback error">{formError}</div> : null}

                  <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={closeModal} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary-btn" disabled={saving}>
                      {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Sección'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        ) : null}
      </section>
  );
}
