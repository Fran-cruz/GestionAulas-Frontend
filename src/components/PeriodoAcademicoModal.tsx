import {
    FormEvent,
    useEffect,
    useState,
} from 'react';

import {
    PeriodoAcademico,
    PeriodoFormValues,
} from '../lib/periodos';

type PeriodoAcademicoModalProps = {
    title: string;
    initialData?: PeriodoAcademico;
    onClose: () => void;
    onSave: (values: PeriodoFormValues) => void;
    saving?: boolean;
};

const emptyForm: PeriodoFormValues = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'CERRADO',
};

export function PeriodoAcademicoModal({
                                          title,
                                          initialData,
                                          onClose,
                                          onSave,
                                          saving = false,
                                      }: PeriodoAcademicoModalProps) {
    const [form, setForm] =
        useState<PeriodoFormValues>(emptyForm);

    const [error, setError] = useState('');

    useEffect(() => {
        if (!initialData) {
            setForm(emptyForm);
            setError('');
            return;
        }

        setForm({
            nombre: initialData.nombre,
            fecha_inicio:
                initialData.fecha_inicio.slice(0, 10),
            fecha_fin:
                initialData.fecha_fin.slice(0, 10),
            estado:
                initialData.estado.toUpperCase() === 'ACTIVO'
                    ? 'ACTIVO'
                    : 'CERRADO',
        });

        setError('');
    }, [initialData]);

    function update<K extends keyof PeriodoFormValues>(
        key: K,
        value: PeriodoFormValues[K]
    ) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        setError('');

        if (!form.nombre.trim()) {
            setError(
                'El nombre del período es obligatorio.'
            );
            return;
        }

        if (
            !form.fecha_inicio ||
            !form.fecha_fin
        ) {
            setError(
                'Debes completar ambas fechas.'
            );
            return;
        }

        const fechaInicio = new Date(
            `${form.fecha_inicio}T00:00:00`
        );

        const fechaFin = new Date(
            `${form.fecha_fin}T00:00:00`
        );

        if (fechaFin <= fechaInicio) {
            setError(
                'La fecha final debe ser posterior a la fecha de inicio.'
            );
            return;
        }

        onSave({
            ...form,
            nombre: form.nombre.trim(),
        });
    }

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal-box periodo-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h3>{title}</h3>

                        <p className="modal-subtitle">
                            Completa la información del período académico.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>

                {/* Formulario */}
                <form
                    onSubmit={handleSubmit}
                    className="modal-form"
                >

                    <div className="form-group">
                        <label htmlFor="periodo-nombre">
                            Nombre del período
                        </label>

                        <input
                            id="periodo-nombre"
                            type="text"
                            value={form.nombre}
                            onChange={(event) =>
                                update(
                                    'nombre',
                                    event.target.value
                                )
                            }
                            placeholder="Ej. Agosto - Diciembre 2026"
                            maxLength={100}
                            disabled={saving}
                        />
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="periodo-inicio">
                                Fecha de inicio
                            </label>

                            <input
                                id="periodo-inicio"
                                type="date"
                                value={form.fecha_inicio}
                                onChange={(event) =>
                                    update(
                                        'fecha_inicio',
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="periodo-fin">
                                Fecha de fin
                            </label>

                            <input
                                id="periodo-fin"
                                type="date"
                                value={form.fecha_fin}
                                onChange={(event) =>
                                    update(
                                        'fecha_fin',
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label htmlFor="periodo-estado">
                            Estado
                        </label>

                        <select
                            id="periodo-estado"
                            value={form.estado}
                            onChange={(event) =>
                                update(
                                    'estado',
                                    event.target.value as PeriodoFormValues['estado']
                                )
                            }
                            disabled={saving}
                        >
                            <option value="CERRADO">
                                Cerrado
                            </option>

                            <option value="ACTIVO">
                                Activo
                            </option>
                        </select>
                    </div>

                    {error && (
                        <div className="modal-error">
                            {error}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="modal-actions">

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={saving}
                        >
                            {saving
                                ? 'Guardando...'
                                : 'Guardar'}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}