import { apiRequest } from '../lib/api';

export type EstadoPeriodo = 'ACTIVO' | 'CERRADO';

export type PeriodoAcademico = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  secciones: number;
  created_at?: string;
  updated_at?: string;
};

export type PeriodoFormValues = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPeriodo;
};

export function listPeriodos() {
  return apiRequest<PeriodoAcademico[]>('/periodos-academicos');
}

export function createPeriodo(values: PeriodoFormValues, idUsuarioCreador: number) {
  const payload = {
    nombre: values.nombre,
    fecha_inicio: values.fecha_inicio,
    fecha_fin: values.fecha_fin,
    estado: values.estado,
    id_usuario_creador: idUsuarioCreador,
  };

  return apiRequest<{ message: string; periodo: PeriodoAcademico }>('/periodos-academicos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function activatePeriodo(id: number) {
  return apiRequest<{ message: string; periodo: PeriodoAcademico }>(`/periodos-academicos/${id}/activar`, {
    method: 'POST',
  });
}

export function deletePeriodo(id: number) {
  return apiRequest<{ message: string }>(`/periodos-academicos/${id}`, {
    method: 'DELETE',
  });
}

export function formatFecha(fecha: string) {
  const soloFecha = fecha.split('T')[0];
  const [year, month, day] = soloFecha.split('-');
  return `${day}/${month}/${year}`;
}

export function formatEstado(estado: string) {
  const lower = estado.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
