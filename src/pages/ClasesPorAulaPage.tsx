import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../lib/api';
import { createAssignment, fetchScheduleSnapshot, updateAssignment } from '../features/schedule/api';
import {
  scheduleSectionFilters,
  type ScheduleAreaKey,
  type ScheduleAssignment,
  type ScheduleRoom,
  type ScheduleSection,
  type ScheduleSnapshot,
} from '../features/schedule/model';

type RoomTypeFilter = 'all' | 'estandar' | 'laboratorio' | 'auditorio' | 'otro' | 'mantenimiento';

const roomTypeFilters: Array<{ value: RoomTypeFilter; label: string }> = [
  { value: 'all', label: 'Todas las aulas' },
  { value: 'estandar', label: 'Estándar' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'auditorio', label: 'Auditorio' },
  { value: 'otro', label: 'Otras' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

function areaColorClass(areaKey: ScheduleAreaKey): '' | 'green' | 'orange' {
  if (areaKey === 'cienc') return 'green';
  if (areaKey === 'hum' || areaKey === 'admin') return 'orange';
  return '';
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

export function ClasesPorAulaPage() {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sectionFilter, setSectionFilter] = useState<'all' | ScheduleAreaKey>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>('all');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [message, setMessage] = useState('Cargando información desde el backend...');

  const loadSnapshot = async (options?: { silent?: boolean; keepMessage?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const nextSnapshot = await fetchScheduleSnapshot();
      setSnapshot(nextSnapshot);
      setLoadError(null);

      if (!options?.keepMessage) {
        if (!nextSnapshot.rooms.length) {
          setMessage('No hay aulas registradas en el backend.');
        } else if (!nextSnapshot.sections.length) {
          setMessage('No hay secciones registradas en el backend.');
        } else if (!nextSnapshot.activePeriod) {
          setMessage('No existe un período académico activo. Créalo en el módulo de Períodos para poder asignar aulas.');
        } else {
          setMessage('Arrastra una sección hacia un aula disponible.');
        }
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
      setMessage('No se pudo cargar la información desde el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const rooms = snapshot?.rooms ?? [];
  const sections = useMemo(() => snapshot?.sections.filter((section) => section.active) ?? [], [snapshot]);
  const activePeriod = snapshot?.activePeriod ?? null;

  const sectionIndex = useMemo(
      () => new Map<number, ScheduleSection>(sections.map((section) => [section.id, section])),
      [sections],
  );

  const teacherIndex = useMemo(
      () => new Map<number, string>((snapshot?.teachers ?? []).map((teacher) => [teacher.id, teacher.name])),
      [snapshot],
  );

  // Solo cuentan las asignaciones del período activo; sin período activo no hay nada "asignado" todavía.
  const visibleAssignments = useMemo(() => {
    if (!activePeriod) return [] as ScheduleAssignment[];
    return (snapshot?.assignments ?? []).filter((assignment) => assignment.periodId === activePeriod.id);
  }, [activePeriod, snapshot]);

  const assignmentBySectionId = useMemo(
      () => new Map<number, ScheduleAssignment>(visibleAssignments.map((assignment) => [assignment.sectionId, assignment])),
      [visibleAssignments],
  );

  const unassignedSections = sections.filter((section) => {
    const assignment = assignmentBySectionId.get(section.id);
    return !assignment || !assignment.roomId;
  });

  const filteredSections = unassignedSections.filter(
      (section) => sectionFilter === 'all' || section.areaKey === sectionFilter,
  );

  const filteredRooms = rooms.filter((room) => {
    if (roomTypeFilter === 'all') return true;
    if (roomTypeFilter === 'mantenimiento') return room.maintenance;
    return room.typeKey === roomTypeFilter;
  });

  function teacherLabel(section: ScheduleSection, assignment?: ScheduleAssignment) {
    const teacherId = assignment?.teacherId ?? section.teacherId;
    if (!teacherId) return 'Sin asignar';
    return teacherIndex.get(teacherId) ?? section.teacherName;
  }

  async function handleDrop(room: ScheduleRoom) {
    if (draggingId === null) return;
    const section = sectionIndex.get(draggingId);
    setDraggingId(null);
    if (!section) return;

    if (room.maintenance) {
      setMessage(`No se puede asignar ${section.name}: el aula está en mantenimiento.`);
      return;
    }

    const existing = assignmentBySectionId.get(section.id);

    if (existing?.roomId === room.id) {
      setMessage(`${section.name} ya está en ${room.code}.`);
      return;
    }

    const enrolled = existing?.students ?? 0;

    if (enrolled > room.capacity && !existing?.overCapacityConfirmed) {
      setMessage(`No se puede asignar ${section.name}: capacidad excedida en ${room.code}.`);
      return;
    }

    if (!existing && !activePeriod) {
      setMessage('No hay un período académico activo. Créalo en el módulo de Períodos antes de asignar aulas.');
      return;
    }

    setSaving(true);
    try {
      if (existing) {
        await updateAssignment(existing.id, { id_aula: room.id });
      } else {
        await createAssignment({
          id_seccion: section.id,
          id_periodo: activePeriod!.id,
          id_aula: room.id,
          id_docente: section.teacherId,
        });
      }

      await loadSnapshot({ silent: true, keepMessage: true });
      setMessage(
          existing ? `${section.name} se movió a ${room.code}.` : `${section.name} asignada a ${room.code}.`,
      );
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
        <section className="kanban-page">
          <div style={{ padding: 24 }}>Cargando información del backend…</div>
        </section>
    );
  }

  if (loadError) {
    return (
        <section className="kanban-page">
          <div style={{ padding: 24 }}>
            <p className="feedback">{loadError}</p>
            <button className="chip-btn" onClick={() => loadSnapshot()}>Reintentar</button>
          </div>
        </section>
    );
  }

  return (
      <section className="kanban-page">
        <aside className="kanban-left">
          <div className="section-head dark">
            <strong>Secciones sin Aula</strong>
            <span>{filteredSections.length} visibles · {unassignedSections.length} pendientes</span>
          </div>
          <div className="search-box">🔎 Buscar sección...</div>
          <div className="filter-row wrap">
            {scheduleSectionFilters.map((filter) => (
                <button
                    key={filter.value}
                    className={`chip-btn ${sectionFilter === filter.value ? 'active' : ''}`}
                    onClick={() => setSectionFilter(filter.value)}
                >
                  {filter.label}
                </button>
            ))}
          </div>
          <p className="feedback">{saving ? 'Guardando…' : message}</p>
          <div className="stack">
            {filteredSections.map((item) => (
                <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={`subject-card ${areaColorClass(item.areaKey)} ${draggingId === item.id ? 'dragging' : ''}`}
                >
                  <div className="subject-tag">{item.areaLabel}</div>
                  <div className="subject-code">{item.code}</div>
                  <div className="subject-name">{item.name}</div>
                  <div className="subject-teacher">👤 {teacherLabel(item)}</div>
                  <div className="subject-meta">
                    <span>👥 {assignmentBySectionId.get(item.id)?.students ?? 0} alumnos</span>
                    <span>⏱ {item.weeklyHours}h/sem</span>
                  </div>
                </article>
            ))}
            {filteredSections.length === 0 && (
                <p className="feedback">No hay secciones pendientes con este filtro.</p>
            )}
          </div>
        </aside>

        <main className="kanban-board">
          <div className="board-header">
            <div>
              <h2>Aulas Disponibles — Arrastrar secciones para asignar</h2>
              <p>{activePeriod ? `Período: ${activePeriod.name}` : 'Sin período académico activo'}</p>
            </div>
            <div className="filter-row inline">
              {roomTypeFilters.map((filter) => (
                  <button
                      key={filter.value}
                      className={`chip-btn ${roomTypeFilter === filter.value ? 'active' : ''}`}
                      onClick={() => setRoomTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
              ))}
            </div>
          </div>

          <div className="room-grid">
            {filteredRooms.map((room) => {
              const assigned = visibleAssignments.filter((a) => a.roomId === room.id);
              const used = assigned.reduce((sum, a) => sum + a.students, 0);
              const occupancy = room.capacity ? Math.round((used / room.capacity) * 100) : 0;

              return (
                  <section
                      key={room.id}
                      className={`room-column ${room.maintenance ? 'disabled' : ''}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(room)}
                  >
                    <header className="room-head">
                      <strong>{room.code}</strong>
                      <span>{`${room.typeLabel} · Cap. ${room.capacity}`}</span>
                      <small>{occupancy}% ocupado</small>
                    </header>

                    <div className="capacity-bar">
                      <span style={{ width: `${Math.min(occupancy, 100)}%` }} />
                    </div>
                    <p className="room-caption">Usado: {used} / {room.capacity}</p>

                    {assigned.map((a) => {
                      const section = sectionIndex.get(a.sectionId);
                      if (!section) return null;
                      return (
                          <article
                              key={a.id}
                              draggable
                              onDragStart={() => setDraggingId(section.id)}
                              onDragEnd={() => setDraggingId(null)}
                              className={`room-card ${areaColorClass(section.areaKey)} ${draggingId === section.id ? 'dragging' : ''}`}
                          >
                            <div className="subject-tag">{section.areaLabel}</div>
                            <strong>{section.code}</strong>
                            <span>{section.name}</span>
                            <small>👤 {teacherLabel(section, a)}</small>
                            <b>👥 {a.students} alumnos</b>
                          </article>
                      );
                    })}

                    <div className={`drop-zone ${room.maintenance || draggingId === null ? '' : 'highlighted'}`}>
                      <span>{room.maintenance ? 'Aula en mantenimiento' : '+ Soltar sección aquí'}</span>
                    </div>
                  </section>
              );
            })}
            <section className="empty-column" />
          </div>

          <div className="assignment-summary">
            <strong>Asignadas: {visibleAssignments.filter((a) => a.roomId).length}</strong>
            <span>Capacidad validada antes de aceptar cualquier arrastre</span>
          </div>
        </main>
      </section>
  );
}
