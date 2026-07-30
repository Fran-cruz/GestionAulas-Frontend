import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import {
    Aula,
    AulaFormValues,
    aulaCodigo,
    createAula,
    deleteAula,
    formatEstadoAula,
    listAulas,
    updateAula,
} from '../lib/aulas';

const emptyForm: AulaFormValues = {
    nombre: '',
    edificio: '',
    piso: '',
    tipo: '',
    capacidad_maxima: '',
    descripcion: '',
    estado: 'disponible',
};

export function AulasPage() {
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<AulaFormValues>(emptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const loadAulas = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await listAulas();
            setAulas(data);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las aulas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAulas();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (aula: Aula) => {
        setEditingId(aula.id);
        setForm({
            nombre: aula.nombre,
            edificio: aula.edificio,
            piso: aula.piso,
            tipo: aula.tipo ?? '',
            capacidad_maxima: String(aula.capacidad_maxima),
            descripcion: aula.descripcion ?? '',
            estado: (aula.estado as AulaFormValues['estado']) ?? 'disponible',
        });
        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setModalOpen(false);
    };

    const handleChange = (field: keyof AulaFormValues) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        const capacidad = Number.parseInt(form.capacidad_maxima, 10);
        if (!Number.isFinite(capacidad) || capacidad < 1) {
            setFormError('La capacidad máxima debe ser un número mayor a 0.');
            return;
        }

        setSaving(true);

        const payload = {
            nombre: form.nombre.trim(),
            edificio: form.edificio.trim(),
            piso: form.piso.trim(),
            tipo: form.tipo.trim() || null,
            capacidad_maxima: capacidad,
            descripcion: form.descripcion.trim() || null,
            estado: form.estado,
        };

        try {
            if (editingId) {
                await updateAula(editingId, payload);
            } else {
                await createAula(payload);
            }
            setModalOpen(false);
            await loadAulas();
        } catch (error) {
            if (error instanceof ApiError) {
                setFormError(error.message);
            } else {
                setFormError('No se pudo guardar el aula.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (aula: Aula) => {
        const confirmed = window.confirm(`¿Eliminar el aula ${aula.nombre}?`);
        if (!confirmed) return;

        try {
            await deleteAula(aula.id);
            await loadAulas();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'No se pudo eliminar el aula.');
        }
    };

    return (
        <section className="catalog-page">
            <div className="toolbar">
                <div className="catalog-summary">{aulas.length} Aulas Registradas</div>
                <button className="primary-btn" onClick={openCreateModal}>
                    + Nueva Aula
                </button>
            </div>

            {loadError ? <div className="feedback error">{loadError}</div> : null}

            <div className="table-card full">
                <table>
                    <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Edificio</th>
                        <th>Piso</th>
                        <th>Tipo</th>
                        <th>Capacidad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={8}>Cargando aulas...</td>
                        </tr>
                    ) : aulas.length === 0 ? (
                        <tr>
                            <td colSpan={8}>No hay aulas registradas todavía.</td>
                        </tr>
                    ) : (
                        aulas.map((aula) => (
                            <tr key={aula.id}>
                                <td>{aulaCodigo(aula.id)}</td>
                                <td>{aula.nombre}</td>
                                <td>{aula.edificio}</td>
                                <td>{aula.piso}</td>
                                <td>{aula.tipo || '—'}</td>
                                <td>{aula.capacidad_maxima}</td>
                                <td>
                    <span className={`tag state ${aula.estado.toLowerCase()}`}>
                      {formatEstadoAula(aula.estado)}
                    </span>
                                </td>
                                <td className="row-actions">
                                    <button className="edit-btn" onClick={() => openEditModal(aula)}>
                                        Editar
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(aula)}>
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
                            <h3>{editingId ? 'Editar Aula' : 'Nueva Aula'}</h3>
                            <button className="modal-close" onClick={closeModal} disabled={saving} type="button">
                                ×
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={handleChange('nombre')}
                                    required
                                    maxLength={100}
                                    placeholder="Ej. Aula 201"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Edificio</label>
                                    <input
                                        type="text"
                                        value={form.edificio}
                                        onChange={handleChange('edificio')}
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Piso</label>
                                    <input
                                        type="text"
                                        value={form.piso}
                                        onChange={handleChange('piso')}
                                        required
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Tipo</label>
                                    <input
                                        type="text"
                                        value={form.tipo}
                                        onChange={handleChange('tipo')}
                                        maxLength={100}
                                        placeholder="Estándar, Laboratorio, Auditorio..."
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Capacidad Máxima</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.capacidad_maxima}
                                        onChange={handleChange('capacidad_maxima')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Estado</label>
                                <select value={form.estado} onChange={handleChange('estado')}>
                                    <option value="disponible">Disponible</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    value={form.descripcion}
                                    onChange={handleChange('descripcion')}
                                    placeholder="Notas u observaciones (opcional)"
                                />
                            </div>

                            {formError ? <div className="feedback error">{formError}</div> : null}

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={closeModal} disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="primary-btn" disabled={saving}>
                                    {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Aula'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

