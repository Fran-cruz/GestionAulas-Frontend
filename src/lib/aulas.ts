import { apiRequest } from './api';

export type EstadoAula = 'disponible' | 'mantenimiento';

export type Aula = {
    id: number;
    nombre: string;
    edificio: string;
    piso: string;
    tipo: string | null;
    capacidad_maxima: number;
    descripcion: string | null;
    estado: string;
    created_at?: string;
    updated_at?: string;
};

export type AulaPayload = {
    nombre: string;
    edificio: string;
    piso: string;
    tipo: string | null;
    capacidad_maxima: number;
    descripcion: string | null;
    estado: EstadoAula;
};

export type AulaFormValues = {
    nombre: string;
    edificio: string;
    piso: string;
    tipo: string;
    capacidad_maxima: string;
    descripcion: string;
    estado: EstadoAula;
};

export function listAulas() {
    return apiRequest<Aula[]>('/aulas');
}

export function createAula(payload: AulaPayload) {
    return apiRequest<{ message: string; aula: Aula }>('/aulas', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateAula(id: number, payload: Partial<AulaPayload>) {
    return apiRequest<{ message: string; aula: Aula }>(`/aulas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteAula(id: number) {
    return apiRequest<{ message: string }>(`/aulas/${id}`, {
        method: 'DELETE',
    });
}

export function aulaCodigo(id: number) {
    return `AUL-${String(id).padStart(3, '0')}`;
}

export function formatEstadoAula(estado: string) {
    return estado === 'mantenimiento' ? 'Mantenimiento' : 'Disponible';
}