import { apiRequest } from './api';

export type EstadoDocente = 'ACTIVO' | 'LICENCIA' | 'INACTIVO';

export type Docente = {
    id: number;
    nombre_completo: string;
    correo_institucional: string;
    telefono: string | null;
    departamento: string | null;
    especialidad: string | null;
    estado: string;
    created_at?: string;
    updated_at?: string;
};

export type DocenteFormValues = {
    nombre_completo: string;
    correo_institucional: string;
    telefono: string;
    departamento: string;
    especialidad: string;
    estado: EstadoDocente;
};

export function listDocentes() {
    return apiRequest<Docente[]>('/docentes');
}

export function createDocente(values: DocenteFormValues) {
    return apiRequest<{ message: string; docente: Docente }>('/docentes', {
        method: 'POST',
        body: JSON.stringify(values),
    });
}

export function updateDocente(id: number, values: DocenteFormValues) {
    return apiRequest<{ message: string; docente: Docente }>(`/docentes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
    });
}

export function deleteDocente(id: number) {
    return apiRequest<{ message: string }>(`/docentes/${id}`, {
        method: 'DELETE',
    });
}

export function docenteCodigo(id: number) {
    return `DOC-${String(id).padStart(3, '0')}`;
}

export function formatEstado(estado: string) {
    const lower = estado.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}