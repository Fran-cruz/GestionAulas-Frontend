export type ScheduleAreaKey = 'ing' | 'cienc' | 'hum' | 'admin' | 'otro';
export type ScheduleDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type ApiAula = {
  id: number;
  nombre: string;
  edificio: string;
  piso: string;
  tipo: string | null;
  capacidad_maxima: number;
  descripcion: string | null;
  estado: 'disponible' | 'mantenimiento' | string;
};

export type ApiDocente = {
  id: number;
  nombre_completo: string;
  correo_institucional: string;
  telefono: string | null;
  departamento: string | null;
  especialidad: string | null;
  estado: string;
};

export type ApiSeccion = {
  id: number;
  materia: string;
  codigo_materia: string | null;
  id_docente: number | null;
  tipo_sesion: 'matutino' | 'vespertino' | string;
  area_academica: string;
  duracion_sesion_horas: number | string;
  horas_semanales_totales: number | string;
  sesiones_por_semana: number;
  activa: boolean;
};

export type ApiAsignacion = {
  id: number;
  id_seccion: number | null;
  id_periodo: number | null;
  id_aula: number | null;
  id_docente: number | null;
  estudiantes_matriculados: number;
  sobrecargo_confirmado: boolean;
  estado: string;
};

export type ApiSesionHorario = {
  id: number;
  id_asignacion: number;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  hora_inicio: string;
  hora_fin: string;
  generado_automaticamente: boolean;
};

export type ApiPeriodoAcademico = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activo' | 'cerrado' | string;
  id_usuario_creador: number;
};

export type ScheduleRoom = {
  id: number;
  code: string;
  typeLabel: string;
  typeKey: 'estandar' | 'laboratorio' | 'auditorio' | 'otro';
  capacity: number;
  maintenance: boolean;
  status: string;
  building: string;
  floor: string;
  description: string | null;
};

export type ScheduleTeacher = {
  id: number;
  name: string;
};

export type ScheduleSection = {
  id: number;
  code: string;
  name: string;
  areaKey: ScheduleAreaKey;
  areaLabel: string;
  teacherName: string;
  teacherId: number | null;
  shift: string;
  durationHours: number;
  weeklyHours: number;
  weeklySessionsTarget: number;
  active: boolean;
};

export type ScheduleAssignment = {
  id: number;
  sectionId: number;
  periodId: number | null;
  roomId: number | null;
  teacherId: number | null;
  students: number;
  overCapacityConfirmed: boolean;
  status: string;
};

export type ScheduleSession = {
  id: number;
  assignmentId: number;
  day: ScheduleDayKey;
  dayLabel: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  generatedAutomatically: boolean;
};

export type SchedulePeriod = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
};

export type ScheduleSnapshot = {
  rooms: ScheduleRoom[];
  teachers: ScheduleTeacher[];
  sections: ScheduleSection[];
  assignments: ScheduleAssignment[];
  sessions: ScheduleSession[];
  periods: SchedulePeriod[];
  activePeriod: SchedulePeriod | null;
};

export const scheduleDays: Array<{ key: ScheduleDayKey; apiValue: ApiSesionHorario['dia']; label: string; short: string }> = [
  { key: 'mon', apiValue: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'tue', apiValue: 'martes', label: 'Martes', short: 'Mar' },
  { key: 'wed', apiValue: 'miercoles', label: 'Miercoles', short: 'Mie' },
  { key: 'thu', apiValue: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'fri', apiValue: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sat', apiValue: 'sabado', label: 'Sabado', short: 'Sab' },
];

export const scheduleSectionFilters: Array<{ value: 'all' | ScheduleAreaKey; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'ing', label: 'Ing.' },
  { value: 'cienc', label: 'Cienc.' },
  { value: 'hum', label: 'Hum.' },
  { value: 'admin', label: 'Admin.' },
  { value: 'otro', label: 'Otros' },
];

function normalizeArea(rawArea: string): { key: ScheduleAreaKey; label: string } {
  const value = rawArea.toLowerCase();
  if (value.includes('ing')) return { key: 'ing', label: 'Ing.' };
  if (value.includes('cien')) return { key: 'cienc', label: 'Cienc.' };
  if (value.includes('human')) return { key: 'hum', label: 'Hum.' };
  if (value.includes('admin')) return { key: 'admin', label: 'Admin.' };
  return { key: 'otro', label: rawArea || 'General' };
}

function normalizeRoomType(rawType: string | null): ScheduleRoom['typeKey'] {
  const value = (rawType ?? '').toLowerCase();
  if (value.includes('lab')) return 'laboratorio';
  if (value.includes('aud')) return 'auditorio';
  if (value.includes('clase')) return 'estandar';
  return 'otro';
}

function normalizeRoomTypeLabel(rawType: string | null, typeKey: ScheduleRoom['typeKey']) {
  if (rawType && rawType.trim()) {
    return rawType;
  }

  if (typeKey === 'laboratorio') return 'Laboratorio';
  if (typeKey === 'auditorio') return 'Auditorio';
  if (typeKey === 'estandar') return 'Estandar';
  return 'General';
}

function parseDecimal(value: number | string) {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function toTimeString(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function minutesToHourLabel(totalMinutes: number) {
  return toTimeString(totalMinutes);
}

export function buildTimeSlots(startHour = 7, endHour = 19, stepMinutes = 30) {
  const slots: Array<{ minutes: number; label: string; shortLabel: string }> = [];

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += stepMinutes) {
    slots.push({
      minutes,
      label: toTimeString(minutes),
      shortLabel: minutes % 60 === 0 ? toTimeString(minutes) : '',
    });
  }

  return slots;
}

export function dayKeyToApiValue(dayKey: ScheduleDayKey) {
  return scheduleDays.find((day) => day.key === dayKey)?.apiValue ?? 'lunes';
}

export function dayKeyToLabel(dayKey: ScheduleDayKey) {
  return scheduleDays.find((day) => day.key === dayKey)?.label ?? 'Lunes';
}

export function normalizeScheduleSnapshot(raw: {
  aulas: ApiAula[];
  docentes: ApiDocente[];
  secciones: ApiSeccion[];
  asignaciones: ApiAsignacion[];
  sesiones: ApiSesionHorario[];
  periodos: ApiPeriodoAcademico[];
}): ScheduleSnapshot {
  const teacherMap = new Map<number, ScheduleTeacher>(
      raw.docentes.map((teacher) => [
        teacher.id,
        {
          id: teacher.id,
          name: teacher.nombre_completo,
        },
      ]),
  );

  const rooms = raw.aulas.map((room) => {
    const typeKey = normalizeRoomType(room.tipo);
    return {
      id: room.id,
      code: room.nombre,
      typeKey,
      typeLabel: normalizeRoomTypeLabel(room.tipo, typeKey),
      capacity: room.capacidad_maxima,
      maintenance: room.estado === 'mantenimiento',
      status: room.estado,
      building: room.edificio,
      floor: room.piso,
      description: room.descripcion,
    } satisfies ScheduleRoom;
  });

  const sections = raw.secciones.map((section) => {
    const area = normalizeArea(section.area_academica);
    return {
      id: section.id,
      code: section.codigo_materia?.trim() || `SEC-${section.id}`,
      name: section.materia,
      areaKey: area.key,
      areaLabel: area.label,
      teacherName: section.id_docente ? teacherMap.get(section.id_docente)?.name ?? 'Docente sin nombre' : 'Sin docente',
      teacherId: section.id_docente,
      shift: section.tipo_sesion,
      durationHours: parseDecimal(section.duracion_sesion_horas),
      weeklyHours: parseDecimal(section.horas_semanales_totales),
      weeklySessionsTarget: section.sesiones_por_semana,
      active: Boolean(section.activa),
    } satisfies ScheduleSection;
  });

  const assignments = raw.asignaciones
      .filter((assignment): assignment is ApiAsignacion & { id_seccion: number } => assignment.id_seccion !== null)
      .map((assignment) => ({
        id: assignment.id,
        sectionId: assignment.id_seccion,
        periodId: assignment.id_periodo,
        roomId: assignment.id_aula,
        teacherId: assignment.id_docente,
        students: assignment.estudiantes_matriculados,
        overCapacityConfirmed: assignment.sobrecargo_confirmado,
        status: assignment.estado,
      }));

  const sessions = raw.sesiones.map((session) => {
    const day = scheduleDays.find((item) => item.apiValue === session.dia);
    const startMinutes = toMinutes(session.hora_inicio);
    const endMinutes = toMinutes(session.hora_fin);

    return {
      id: session.id,
      assignmentId: session.id_asignacion,
      day: day?.key ?? 'mon',
      dayLabel: day?.label ?? 'Lunes',
      startMinutes,
      endMinutes,
      startTime: toTimeString(startMinutes),
      endTime: toTimeString(endMinutes),
      generatedAutomatically: session.generado_automaticamente,
    } satisfies ScheduleSession;
  });

  const periods = raw.periodos.map((period) => ({
    id: period.id,
    name: period.nombre,
    status: period.estado,
    startDate: period.fecha_inicio,
    endDate: period.fecha_fin,
  }));

  return {
    rooms,
    teachers: [...teacherMap.values()],
    sections,
    assignments,
    sessions,
    periods,
    activePeriod: periods.find((period) => period.status.toUpperCase() === 'ACTIVO') ?? null,
  };
}