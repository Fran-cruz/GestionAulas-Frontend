import { apiRequest } from '../../lib/api';
import type {
  ApiAsignacion,
  ApiAula,
  ApiDocente,
  ApiPeriodoAcademico,
  ApiSeccion,
  ApiSesionHorario,
  ScheduleSnapshot,
} from './model';
import { normalizeScheduleSnapshot } from './model';

export type AssignmentMutationPayload = {
  id_seccion: number;
  id_periodo: number;
  id_aula: number | null;
  id_docente: number | null;
  estudiantes_matriculados?: number;
  sobrecargo_confirmado?: boolean;
  estado?: string;
};

export type SessionMutationPayload = {
  id_asignacion: number;
  dia: ApiSesionHorario['dia'];
  hora_inicio: string;
  hora_fin: string;
  generado_automaticamente?: boolean;
};

export async function fetchScheduleSnapshot(): Promise<ScheduleSnapshot> {
  const [aulas, docentes, secciones, asignaciones, sesiones, periodos] = await Promise.all([
    apiRequest<ApiAula[]>('/aulas'),
    apiRequest<ApiDocente[]>('/docentes'),
    apiRequest<ApiSeccion[]>('/secciones'),
    apiRequest<ApiAsignacion[]>('/asignaciones'),
    apiRequest<ApiSesionHorario[]>('/sesiones-horario'),
    apiRequest<ApiPeriodoAcademico[]>('/periodos-academicos'),
  ]);

  return normalizeScheduleSnapshot({
    aulas,
    docentes,
    secciones,
    asignaciones,
    sesiones,
    periodos,
  });
}

export function createAssignment(payload: AssignmentMutationPayload) {
  return apiRequest<ApiAsignacion>('/asignaciones', {
    method: 'POST',
    body: JSON.stringify({
      estudiantes_matriculados: 0,
      sobrecargo_confirmado: false,
      estado: 'asignada',
      ...payload,
    }),
  });
}

export function updateAssignment(id: number, payload: Partial<AssignmentMutationPayload>) {
  return apiRequest<ApiAsignacion>(`/asignaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function createSession(payload: SessionMutationPayload) {
  return apiRequest<ApiSesionHorario>('/sesiones-horario', {
    method: 'POST',
    body: JSON.stringify({
      generado_automaticamente: false,
      ...payload,
    }),
  });
}

export function updateSession(id: number, payload: Partial<SessionMutationPayload>) {
  return apiRequest<ApiSesionHorario>(`/sesiones-horario/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteSession(id: number) {
  return apiRequest<unknown>(`/sesiones-horario/${id}`, {
    method: 'DELETE',
  });
}
