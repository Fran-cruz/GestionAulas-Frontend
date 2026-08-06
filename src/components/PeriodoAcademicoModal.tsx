import { FormEvent, useEffect, useState } from 'react';
import { PeriodoAcademico, PeriodoFormValues } from '../lib/periodos';

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

export function PeriodoAcademicoModal({ title, initialData, onClose, onSave, saving = false }: PeriodoAcademicoModalProps) {
    const [form, setForm] = useState<PeriodoFormValues>(emptyForm);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!initialData) {
            setForm(emptyForm);
            setError('');
            return;
        }

        setForm({
            nombre: initialData.nombre,
            fecha_inicio: initialData.fecha_inicio.slice(0, 10),
            fecha_fin: initialData.fecha_fin.slice(0, 10),
            estado: (initialData.estado.toUpperCase() === 'ACTIVO' ? 'ACTIVO' : 'CERRADO'),
        });
        setError('');
    }, [initialData]);

    function update<K extends keyof PeriodoFormValues>(key: K, value: PeriodoFormValues[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError('');

        if (!form.nombre.trim()) {
            setError('El nombre del período es obligatorio.');
            return;
        }
        if (!form.fecha_inicio || !form.fecha_fin) {
            setError('Debes completar ambas fechas.');
            return;
        }
        if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
            setError('La fecha final debe ser posterior a la fecha de inicio.');
            return;
        }

        onSave({
            ...form,
            nombre: form.nombre.trim(),
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <label>
                        Nombre del período
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(event) => update('nombre', event.target.value)}
                            placeholder="Ej. Agosto - Diciembre 2026"
                            maxLength={100}
                        />
                    </label>

                    <label>
                        Fecha de inicio
                        <input
                            type="date"
                            value={form.fecha_inicio}
                            onChange={(event) => update('fecha_inicio', event.target.value)}
                        />
                    </label>

                    <label>
                        Fecha de fin
                        <input
                            type="date"
                            value={form.fecha_fin}
                            onChange={(event) => update('fecha_fin', event.target.value)}
                        />
                    </label>

                    <label>
                        Estado
                        <select
                            value={form.estado}
                            onChange={(event) => update('estado', event.target.value as PeriodoFormValues['estado'])}
                        >
                            <option value="CERRADO">Cerrado</option>
                            <option value="ACTIVO">Activo</option>
                        </select>
                    </label>

                    {error ? <p className="modal-error">{error}</p> : null}

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="primary-btn" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
