import { apiRequest } from './api';

export type DashboardConflicto = {
    id: string;
    seccion: string;
    docente: string;
    aula: string;
    tipo: string;
    prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
    estado: string;
    asignacion_id: number | null;
};

export type DashboardActividad = {
    descripcion: string;
    fecha: string | null;
};

export type DashboardData = {
    periodo_activo: { id: number; nombre: string } | null;
    secciones: { total: number; asignadas: number; pendientes: number };
    aulas: { total: number; disponibles: number; en_uso: number; mantenimiento: number };
    docentes: { total: number; activos: number; sin_asignar: number };
    conflictos: DashboardConflicto[];
    actividad_reciente: DashboardActividad[];
};

export function fetchDashboard() {
    return apiRequest<DashboardData>('/dashboard');
}

export function timeAgo(iso: string | null): string {
    if (!iso) return '';

    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = Math.max(now - then, 0);
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'hace un momento';
    if (minutes < 60) return `hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;

    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
}