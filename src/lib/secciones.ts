import { apiRequest } from './api';

export type EstadoSeccion = 'true' | 'false';

export type Seccion = {
    id: number;
    materia: string;
    codigo_materia: string | null;
    id_docente: number | null;
    tipo_sesion: 'MATUTINO' | 'VESPERTINO';
    area_academica: string;
    duracion_sesion_horas: number;
    horas_semanales_totales: number;
    cantidad_alumnos: number | null;
    sesiones_por_semana: number | null;
    activa: boolean;
    docente_nombre: string | null;
    created_at?: string;
    updated_at?: string;
};

export type SeccionFormValues = {
    materia: string;
    codigo_materia: string;
    id_docente: string;
    tipo_sesion: 'MATUTINO' | 'VESPERTINO';
    area_academica: string;
    duracion_sesion_horas: string;
    horas_semanales_totales: string;
    cantidad_alumnos: string;
    sesiones_por_semana: string;
    activa: boolean;
};

export function listSecciones() {
    return apiRequest<Seccion[]>('/secciones');
}

export function createSeccion(values: SeccionFormValues) {
    const payload = {
        materia: values.materia,
        codigo_materia: values.codigo_materia.trim() || null,
        id_docente: values.id_docente ? parseInt(values.id_docente) : null,
        tipo_sesion: values.tipo_sesion,
        area_academica: values.area_academica,
        duracion_sesion_horas: parseFloat(values.duracion_sesion_horas),
        horas_semanales_totales: parseFloat(values.horas_semanales_totales),
        cantidad_alumnos: values.cantidad_alumnos ? parseInt(values.cantidad_alumnos) : null,
        sesiones_por_semana: values.sesiones_por_semana ? parseInt(values.sesiones_por_semana) : null,
        activa: values.activa,
    };

    return apiRequest<{ message: string; seccion: Seccion }>('/secciones', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateSeccion(id: number, values: SeccionFormValues) {
    const payload = {
        materia: values.materia,
        codigo_materia: values.codigo_materia.trim() || null,
        id_docente: values.id_docente ? parseInt(values.id_docente) : null,
        tipo_sesion: values.tipo_sesion,
        area_academica: values.area_academica,
        duracion_sesion_horas: parseFloat(values.duracion_sesion_horas),
        horas_semanales_totales: parseFloat(values.horas_semanales_totales),
        cantidad_alumnos: values.cantidad_alumnos ? parseInt(values.cantidad_alumnos) : null,
        sesiones_por_semana: values.sesiones_por_semana ? parseInt(values.sesiones_por_semana) : null,
        activa: values.activa,
    };

    return apiRequest<{ message: string; seccion: Seccion }>(`/secciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteSeccion(id: number) {
    return apiRequest<{ message: string }>(`/secciones/${id}`, {
        method: 'DELETE',
    });
}

export function seccionCodigo(id: number) {
    return `SEC-${String(id).padStart(3, '0')}`;
}

export function formatEstado(activa: boolean) {
    return activa ? 'Activa' : 'Inactiva';
}

export function formatTipoSesion(tipo: string) {
    const lower = tipo.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
