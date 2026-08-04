import { FormEvent, useEffect, useState } from 'react';
import { Seccion } from '../lib/seccionesServices';
import { DocenteResumen, obtenerDocentesResumen } from '../lib/docentesServices';

type SeccionModalProps = {
    title: string;
    initialData?: Seccion;
    onClose: () => void;
    onSave: (seccion: Seccion) => void;
};

// 👇 Nueva función: normaliza "matutino" o "MATUTINO" a "Matutino"
function normalizarTipoSesion(valor: string): string {
    if (!valor) return 'Matutino';
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

const emptyForm: Seccion = {
    materia: '',
    codigo_materia: '',
    id_docente: null,
    tipo_sesion: 'Matutino',
    area_academica: '',
    duracion_sesion_horas: 1,
    horas_semanales_totales: 1,
    sesiones_por_semana: 1,
    activa: true,
};

export function SeccionModal({ title, initialData, onClose, onSave }: SeccionModalProps) {
    const [form, setForm] = useState<Seccion>(
        initialData
            ? { ...initialData, tipo_sesion: normalizarTipoSesion(initialData.tipo_sesion) }
            : emptyForm
    );
    const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
    const [error, setError] = useState('');

    // ... el resto del archivo se queda exactamente igual ...

    useEffect(() => {
        obtenerDocentesResumen()
            .then(setDocentes)
            .catch(() => setDocentes([]));
    }, []);

    function update<K extends keyof Seccion>(key: K, value: Seccion[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!form.materia.trim()) {
            setError('La materia es obligatoria.');
            return;
        }
        if (!form.codigo_materia.trim()) {
            setError('El código de la materia es obligatorio.');
            return;
        }
        if (!form.area_academica.trim()) {
            setError('El área académica es obligatoria.');
            return;
        }
        if (form.duracion_sesion_horas <= 0 || form.horas_semanales_totales <= 0 || form.sesiones_por_semana <= 0) {
            setError('Las horas y sesiones deben ser mayores a cero.');
            return;
        }

        onSave({
            ...form,
            materia: form.materia.trim(),
            codigo_materia: form.codigo_materia.trim(),
            area_academica: form.area_academica.trim(),
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
                        Materia
                        <input
                            type="text"
                            placeholder="Ej. Cálculo Diferencial"
                            value={form.materia}
                            onChange={(event) => update('materia', event.target.value)}
                        />
                    </label>

                    <label>
                        Código de materia
                        <input
                            type="text"
                            placeholder="Ej. MAT-301"
                            value={form.codigo_materia}
                            onChange={(event) => update('codigo_materia', event.target.value)}
                        />
                    </label>

                    <label>
                        Docente titular
                        <select
                            value={form.id_docente ?? ''}
                            onChange={(event) => update('id_docente', event.target.value ? Number(event.target.value) : null)}
                        >
                            <option value="">Sin asignar</option>
                            {docentes.map((docente) => (
                                <option key={docente.id} value={docente.id}>
                                    {docente.nombre_completo}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Área académica
                        <input
                            type="text"
                            placeholder="Ej. Ingeniería"
                            value={form.area_academica}
                            onChange={(event) => update('area_academica', event.target.value)}
                        />
                    </label>

                    <label>
                        Tipo de sesión
                        <select
                            value={form.tipo_sesion}
                            onChange={(event) => update('tipo_sesion', event.target.value)}
                        >
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                        </select>
                    </label>
                    <label>
                        Duración por sesión (horas)
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={form.duracion_sesion_horas}
                            onChange={(event) => update('duracion_sesion_horas', Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Horas semanales totales
                        <input
                            type="number"
                            min="1"
                            value={form.horas_semanales_totales}
                            onChange={(event) => update('horas_semanales_totales', Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Sesiones por semana
                        <input
                            type="number"
                            min="1"
                            value={form.sesiones_por_semana}
                            onChange={(event) => update('sesiones_por_semana', Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Estado
                        <select
                            value={form.activa ? 'activa' : 'inactiva'}
                            onChange={(event) => update('activa', event.target.value === 'activa')}
                        >
                            <option value="activa">Activa</option>
                            <option value="inactiva">Inactiva</option>
                        </select>
                    </label>

                    {error && <p className="modal-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="primary-btn">
                            Guardar Sección
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}