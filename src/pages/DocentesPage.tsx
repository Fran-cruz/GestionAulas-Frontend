import {FormEvent, useEffect, useMemo, useState} from 'react';
import {ApiError} from '../lib/api';
import {
  createDocente,
  deleteDocente,
  Docente,
  docenteCodigo,
  DocenteFormValues,
  formatEstado,
  listDocentes,
  updateDocente,
} from '../lib/docentes';

const CORREO_DOMINIO = '@unicah.edu';
const TELEFONO_MAX = 14;

const emptyForm: DocenteFormValues = {
  nombre_completo: '',
  correo_institucional: '',
  telefono: '',
  departamento: '',
  especialidad: '',
  estado: 'ACTIVO',
};

// Validación de todo el formulario en un solo lugar, con mensajes en
// español que se muestran en la tarjeta de retroalimentación — nada
// de los globitos nativos del navegador.
function validar(form: DocenteFormValues): string | null {
  if (!form.nombre_completo.trim()) {
    return 'El nombre completo es obligatorio.';
  }

  const correo = form.correo_institucional.trim();
  if (!correo) {
    return 'El correo institucional es obligatorio.';
  }

  const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  if (!formatoValido) {
    return 'El correo institucional no tiene un formato válido.';
  }

  if (!correo.toLowerCase().endsWith(CORREO_DOMINIO)) {
    return `El correo institucional debe terminar en ${CORREO_DOMINIO}.`;
  }

  if (form.telefono && !/^\d+$/.test(form.telefono)) {
    return 'El teléfono solo puede contener números.';
  }

  if (form.telefono.length > TELEFONO_MAX) {
    return `El teléfono no puede tener más de ${TELEFONO_MAX} dígitos.`;
  }

  if (!form.departamento.trim()) {
    return 'El departamento es obligatorio.';
  }

  return null;
}

export function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DocenteFormValues>(emptyForm);
  // Foto del formulario tal como quedó cargado al abrir "Editar", para
  // saber si el usuario realmente cambió algo antes de dejar guardar.
  const [initialForm, setInitialForm] = useState<DocenteFormValues>(emptyForm);
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

  const filteredDocentes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return docentes;
    return docentes.filter((docente) =>
        docente.nombre_completo.toLowerCase().includes(query) ||
        docente.correo_institucional.toLowerCase().includes(query) ||
        (docente.departamento ?? '').toLowerCase().includes(query) ||
        (docente.especialidad ?? '').toLowerCase().includes(query),
    );
  }, [docentes, search]);

  const hasChanges = editingId !== null && JSON.stringify(form) !== JSON.stringify(initialForm);
  const canSubmit = editingId === null || hasChanges;

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setInitialForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (docente: Docente) => {
    const loaded: DocenteFormValues = {
      nombre_completo: docente.nombre_completo,
      correo_institucional: docente.correo_institucional,
      telefono: docente.telefono ?? '',
      departamento: docente.departamento ?? '',
      especialidad: docente.especialidad ?? '',
      estado: (docente.estado.toUpperCase() as DocenteFormValues['estado']) ?? 'ACTIVO',
    };
    setEditingId(docente.id);
    setForm(loaded);
    setInitialForm(loaded);
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

  // El teléfono no deja escribir nada que no sea dígito, y corta en 14.
  const handleTelefonoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const soloNumeros = event.target.value.replace(/\D/g, '').slice(0, TELEFONO_MAX);
    setForm((prev) => ({...prev, telefono: soloNumeros}));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setFormError('');

    const payload: DocenteFormValues = {
      ...form,
      nombre_completo: form.nombre_completo.trim(),
      correo_institucional: form.correo_institucional.trim(),
      telefono: form.telefono.trim(),
      departamento: form.departamento.trim(),
      especialidad: form.especialidad.trim(),
    };

    const errorValidacion = validar(payload);
    if (errorValidacion) {
      setFormError(errorValidacion);
      return;
    }

    setSaving(true);
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

          <div className="search-box toolbar-search">
            🔎
            <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo, departamento..."
            />
            {search ? (
                <button type="button" className="search-clear" onClick={() => setSearch('')}>
                  ×
                </button>
            ) : null}
          </div>

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
            ) : filteredDocentes.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {search ? 'Ningún docente coincide con la búsqueda.' : 'No hay docentes registrados todavía.'}
                  </td>
                </tr>
            ) : (
                filteredDocentes.map((docente) => (
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

                <form className="modal-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-field">
                    <label>Nombre Completo</label>
                    <input
                        type="text"
                        value={form.nombre_completo}
                        onChange={handleChange('nombre_completo')}
                        maxLength={150}
                    />
                  </div>

                  <div className="form-field">
                    <label>Correo Institucional</label>
                    <input
                        type="text"
                        value={form.correo_institucional}
                        onChange={handleChange('correo_institucional')}
                        placeholder={`nombre${CORREO_DOMINIO}`}
                        maxLength={150}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Teléfono</label>
                      <input
                          type="text"
                          inputMode="numeric"
                          value={form.telefono}
                          onChange={handleTelefonoChange}
                          maxLength={TELEFONO_MAX}
                          placeholder={`Hasta ${TELEFONO_MAX} dígitos`}
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
                    <button type="submit" className="primary-btn" disabled={saving || !canSubmit}>
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