export type AreaFilter = 'all' | 'ing' | 'cienc' | 'hum' | 'admin';
export type AulaFilter = 'all' | 'estandar' | 'laboratorio' | 'auditorio' | 'mantenimiento';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export type RepeatPattern = 'mon-fri' | 'mon-thu' | 'mon-wed' | 'tue-thu' | 'fri' | 'sat' | 'single';

export type Section = {
  id: string;
  code: string;
  name: string;
  teacher: string;
  area: 'ing' | 'cienc' | 'hum' | 'admin';
  students: number;
  duration: 1 | 2 | 4;
  repeat: RepeatPattern;
  assignedAulaId?: string;
  assignedDay?: DayKey;
  assignedStart?: number;
};

export type Aula = {
  id: string;
  code: string;
  type: 'estandar' | 'laboratorio' | 'auditorio';
  capacity: number;
  occupied: number;
  maintenance?: boolean;
};

export type ScheduleAssignment = {
  sectionId: string;
  aulaId: string;
  day: DayKey;
  start: number;
};

export const days: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'mon', label: 'Lunes', short: 'Lun 7' },
  { key: 'tue', label: 'Martes', short: 'Mar 8' },
  { key: 'wed', label: 'Miércoles', short: 'Mié 9' },
  { key: 'thu', label: 'Jueves', short: 'Jue 10' },
  { key: 'fri', label: 'Viernes', short: 'Vie 11' },
  { key: 'sat', label: 'Sábado', short: 'Sáb 12' },
];

export const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export const repeatLabels: Record<RepeatPattern, string> = {
  'mon-fri': 'L-M-X-J-V',
  'mon-thu': 'L-M-X-J',
  'mon-wed': 'L y Mi',
  'tue-thu': 'Ma y J',
  fri: 'Viernes',
  sat: 'Sábado',
  single: 'Una vez',
};

export const sections: Section[] = [
  { id: 'MAT-301', code: 'MAT-301', name: 'Cálculo Diferencial', teacher: 'Dr. Ramírez', area: 'ing', students: 35, duration: 1, repeat: 'mon-fri' },
  { id: 'INF-102', code: 'INF-102', name: 'Programación I', teacher: 'Lic. Torres', area: 'ing', students: 28, duration: 1, repeat: 'mon-fri' },
  { id: 'FIS-201', code: 'FIS-201', name: 'Física General', teacher: 'Dr. López', area: 'cienc', students: 30, duration: 2, repeat: 'mon-thu' },
  { id: 'QUI-101', code: 'QUI-101', name: 'Química Orgánica', teacher: 'Ing. Medina', area: 'cienc', students: 22, duration: 1, repeat: 'single' },
  { id: 'LET-220', code: 'LET-220', name: 'Literatura Universal', teacher: 'Msc. Ruiz', area: 'hum', students: 40, duration: 2, repeat: 'tue-thu' },
  { id: 'ADM-110', code: 'ADM-110', name: 'Administración I', teacher: 'Lic. Peña', area: 'admin', students: 33, duration: 4, repeat: 'fri' },
];

export const aulas: Aula[] = [
  { id: 'AULA-101', code: 'Aula 101', type: 'estandar', capacity: 30, occupied: 13 },
  { id: 'AULA-201', code: 'Aula 201', type: 'estandar', capacity: 40, occupied: 38 },
  { id: 'AULA-302', code: 'Aula 302', type: 'laboratorio', capacity: 35, occupied: 0 },
];

export const initialAssignments: ScheduleAssignment[] = [
  { sectionId: 'MAT-301', aulaId: 'AULA-201', day: 'mon', start: 7 },
  { sectionId: 'MAT-301', aulaId: 'AULA-201', day: 'tue', start: 7 },
  { sectionId: 'MAT-301', aulaId: 'AULA-201', day: 'wed', start: 7 },
  { sectionId: 'MAT-301', aulaId: 'AULA-201', day: 'thu', start: 7 },
  { sectionId: 'MAT-301', aulaId: 'AULA-201', day: 'fri', start: 7 },
  { sectionId: 'INF-102', aulaId: 'AULA-302', day: 'mon', start: 8 },
  { sectionId: 'INF-102', aulaId: 'AULA-302', day: 'tue', start: 8 },
  { sectionId: 'INF-102', aulaId: 'AULA-302', day: 'wed', start: 8 },
  { sectionId: 'INF-102', aulaId: 'AULA-302', day: 'thu', start: 8 },
  { sectionId: 'INF-102', aulaId: 'AULA-302', day: 'fri', start: 8 },
  { sectionId: 'LET-220', aulaId: 'AULA-101', day: 'tue', start: 10 },
  { sectionId: 'LET-220', aulaId: 'AULA-101', day: 'thu', start: 10 },
];

export const areaLabels: Record<Section['area'], string> = {
  ing: 'Ing.',
  cienc: 'Cienc.',
  hum: 'Hum.',
  admin: 'Admin.',
};

export const areaClass: Record<Section['area'], 'blue' | 'green' | 'orange' | 'gray'> = {
  ing: 'blue',
  cienc: 'green',
  hum: 'orange',
  admin: 'orange',
};

export const aulaTypeLabels: Record<Aula['type'], string> = {
  estandar: 'Estándar',
  laboratorio: 'Laboratorio',
  auditorio: 'Auditorio',
};

export function getRepeatDays(pattern: RepeatPattern): DayKey[] {
  switch (pattern) {
    case 'mon-fri':
      return ['mon', 'tue', 'wed', 'thu', 'fri'];
    case 'mon-thu':
      return ['mon', 'tue', 'wed', 'thu'];
    case 'mon-wed':
      return ['mon', 'wed'];
    case 'tue-thu':
      return ['tue', 'thu'];
    case 'fri':
      return ['fri'];
    case 'sat':
      return ['sat'];
    case 'single':
      return ['mon'];
  }
}

export function getAnchorDays(pattern: RepeatPattern): DayKey[] {
  switch (pattern) {
    case 'mon-fri':
    case 'mon-thu':
    case 'mon-wed':
      return ['mon'];
    case 'tue-thu':
      return ['tue'];
    case 'fri':
      return ['fri'];
    case 'sat':
      return ['sat'];
    case 'single':
      return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  }
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const bucket = key(item);
    acc[bucket] = acc[bucket] ?? [];
    acc[bucket].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function timeToIndex(time: number) {
  return time - 7;
}

export function indexToTime(index: number) {
  return 7 + index;
}

export function canPlaceSection(section: Section, aula: Aula, existing: ScheduleAssignment[], day: DayKey, start: number) {
  if (aula.maintenance) {
    return { ok: false, reason: 'El aula está en mantenimiento' };
  }

  if (section.students > aula.capacity) {
    return { ok: false, reason: 'La capacidad del aula es menor que la cantidad de estudiantes' };
  }

  const repeatDays = getRepeatDays(section.repeat);
  const anchorDays = getAnchorDays(section.repeat);
  const requiredSlots = Array.from({ length: section.duration }, (_, offset) => start + offset);
  const repeatCheckDays = anchorDays.includes(day) ? repeatDays : [];

  if (!repeatCheckDays.length) {
    return { ok: false, reason: 'El día seleccionado no coincide con la repetición de la clase' };
  }

  if (requiredSlots.some((slot) => slot < 7 || slot > 18)) {
    return { ok: false, reason: 'El horario excede el rango permitido' };
  }

  const conflicts = existing.filter((item) =>
    item.aulaId === aula.id &&
    repeatCheckDays.includes(item.day) &&
    item.start < start + section.duration &&
    item.start + getSectionById(item.sectionId).duration > start,
  );

  if (conflicts.length > 0) {
    return { ok: false, reason: 'Existe choque con otra sección en ese horario' };
  }

  return { ok: true as const, repeatDays: repeatCheckDays, requiredSlots };
}

export function getSectionById(id: string) {
  const section = sections.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Sección no encontrada: ${id}`);
  }
  return section;
}
