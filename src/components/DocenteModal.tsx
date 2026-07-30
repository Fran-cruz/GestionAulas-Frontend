import { FormEvent, useState } from 'react';

export type DocenteFormData = {
    nombre: string;
    departamento: string;
    especialidad: string;
    estado: 'Activo' | 'Licencia' | 'Inactivo';
    cargaHoraria: number;
};

type DocenteModalProps = {
    title: string;
    initialData?: DocenteFormData;
    onClose: () => void;
    onSave: (docente: DocenteFormData) => void;
};

const emptyForm: DocenteFormData = {
    nombre: '',
    departamento: '',
    especialidad: '',
    estado: 'Activo',
    cargaHoraria: 0,
};

export function DocenteModal({ title, initialData, onClose, onSave }: DocenteModalProps) {
    const [form, setForm] = useState<DocenteFormData>(initialData ?? emptyForm);
    const [error, setError] = useState('');

    function update<K extends keyof DocenteFormData>(key: K, value: DocenteFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!form.nombre.trim()) {
            setError('El nombre del docente es obligatorio.');
            return;
        }
        if (!form.departamento.trim()) {
            setError('El departamento es obligatorio.');
            return;
        }
        if (!form.especialidad.trim()) {
            setError('La especialidad es obligatoria.');
            return;
        }
        if (form.cargaHoraria < 0) {
            setError('La carga horaria no puede ser negativa.');
            return;
        }

        onSave({
            ...form,
            nombre: form.nombre.trim(),
            departamento: form.departamento.trim(),
            especialidad: form.especialidad.trim(),
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
                        Nombre completo
                        <input
                            type="text"
                            placeholder="Ej. Dr. Juan Ramírez"
                            value={form.nombre}
                            onChange={(event) => update('nombre', event.target.value)}
                        />
                    </label>

                    <label>
                        Departamento
                        <input
                            type="text"
                            placeholder="Ej. Ingeniería"
                            value={form.departamento}
                            onChange={(event) => update('departamento', event.target.value)}
                        />
                    </label>

                    <label>
                        Especialidad
                        <input
                            type="text"
                            placeholder="Ej. Programación"
                            value={form.especialidad}
                            onChange={(event) => update('especialidad', event.target.value)}
                        />
                    </label>

                    <label>
                        Carga horaria (horas)
                        <input
                            type="number"
                            min="0"
                            placeholder="Ej. 16"
                            value={form.cargaHoraria}
                            onChange={(event) => update('cargaHoraria', Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Estado
                        <select
                            value={form.estado}
                            onChange={(event) => update('estado', event.target.value as DocenteFormData['estado'])}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Licencia">Licencia</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </label>

                    {error && <p className="modal-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="primary-btn">
                            Guardar Docente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}