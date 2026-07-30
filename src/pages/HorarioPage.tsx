import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  createAssignment,
  createSession,
  deleteSession,
  fetchScheduleSnapshot,
  updateAssignment,
  updateSession,
} from '../features/schedule/api';
import {
  buildTimeSlots,
  dayKeyToApiValue,
  dayKeyToLabel,
  minutesToHourLabel,
  scheduleDays,
  scheduleSectionFilters,
  type ScheduleAreaKey,
  type ScheduleAssignment,
  type ScheduleDayKey,
  type ScheduleRoom,
  type ScheduleSection,
  type ScheduleSession,
  type ScheduleSnapshot,
  toTimeString,
} from '../features/schedule/model';

type DragState =
  | { kind: 'section'; sectionId: number }
  | { kind: 'session'; sessionId: number; sectionId: number; assignmentId: number }
  | null;

type DropState = {
  day: ScheduleDayKey;
  startMinutes: number;
} | null;

const timeSlots = buildTimeSlots();
const slotHeight = 56;
const academicHourMinutes = 60;
const academicVisibleMinutes = 50;

function areaColor(area: ScheduleAreaKey) {
  if (area === 'ing') return 'blue';
  if (area === 'cienc') return 'green';
  if (area === 'hum') return 'purple';
  if (area === 'admin') return 'orange';
  return 'gray';
}

function overlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function getDurationBlocks(section: ScheduleSection) {
  return Math.max(1, Math.round(section.durationHours) || 1);
}

function getDurationMinutes(section: ScheduleSection) {
  return getDurationBlocks(section) * academicHourMinutes - (academicHourMinutes - academicVisibleMinutes);
}

function getSessionBlockSpan(startMinutes: number, endMinutes: number) {
  return Math.max(1, Math.round((endMinutes - startMinutes + (academicHourMinutes - academicVisibleMinutes)) / academicHourMinutes));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrio un error inesperado.';
}

function getAutoCompleteDays(anchorDay: ScheduleDayKey, sessionsPerWeek: number): ScheduleDayKey[] {
  const alternatingEngineeringDays: ScheduleDayKey[] = ['mon', 'wed', 'fri'];
  const alternatingTuesdayDays: ScheduleDayKey[] = ['tue', 'thu', 'sat'];

  if (sessionsPerWeek <= 1) {
    return [anchorDay];
  }

  if (sessionsPerWeek >= 5) {
    return ['mon', 'tue', 'wed', 'thu', 'fri'];
  }

  if (sessionsPerWeek === 4) {
    return ['mon', 'tue', 'wed', 'thu'];
  }

  const family = alternatingEngineeringDays.includes(anchorDay)
    ? alternatingEngineeringDays
    : alternatingTuesdayDays;

  if (sessionsPerWeek === 3) {
    return family;
  }

  const anchorIndex = family.indexOf(anchorDay);
  const startIndex = anchorIndex >= family.length - 1 ? family.length - 2 : Math.max(0, anchorIndex);
  return family.slice(startIndex, startIndex + 2);
}

export function HorarioPage() {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(null);
  const [selectedAula, setSelectedAula] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState<'all' | ScheduleAreaKey>('all');
  const [dragState, setDragState] = useState<DragState>(null);
  const [dropState, setDropState] = useState<DropState>(null);
  const [message, setMessage] = useState('Cargando horario desde Hostinger...');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);

  const loadSnapshot = async (options?: { silent?: boolean; keepMessage?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const nextSnapshot = await fetchScheduleSnapshot();
      setSnapshot(nextSnapshot);
      setError(null);
      setSelectedAula((current) => current ?? nextSnapshot.rooms[0]?.id ?? null);

      if (!options?.keepMessage) {
        if (!nextSnapshot.rooms.length) {
          setMessage('No hay aulas disponibles en el backend.');
        } else if (!nextSnapshot.sections.length) {
          setMessage('No hay secciones disponibles para programar.');
        } else if (!nextSnapshot.activePeriod) {
          setMessage('No existe un periodo activo. Puedes visualizar horarios existentes, pero no crear nuevas asignaciones.');
        } else {
          setMessage('Arrastra una seccion al calendario o mueve un bloque existente.');
        }
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setMessage('No se pudo cargar el horario desde el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  useEffect(() => {
    if (!snapshot?.rooms.length) {
      setSelectedAula(null);
      return;
    }

    if (selectedAula && snapshot.rooms.some((room) => room.id === selectedAula)) {
      return;
    }

    setSelectedAula(snapshot.rooms[0].id);
  }, [selectedAula, snapshot]);

  const rooms = snapshot?.rooms ?? [];
  const sections = snapshot?.sections.filter((section) => section.active) ?? [];
  const assignments = snapshot?.assignments ?? [];
  const sessions = snapshot?.sessions ?? [];
  const activePeriod = snapshot?.activePeriod ?? null;

  const sectionIndex = useMemo(
    () => new Map<number, ScheduleSection>(sections.map((section) => [section.id, section])),
    [sections],
  );
  const assignmentIndex = useMemo(
    () => new Map<number, ScheduleAssignment>(assignments.map((assignment) => [assignment.id, assignment])),
    [assignments],
  );

  const visibleAssignments = useMemo(() => {
    if (!activePeriod) {
      return assignments;
    }

    return assignments.filter((assignment) => assignment.periodId === activePeriod.id);
  }, [activePeriod, assignments]);

  const assignmentBySectionId = useMemo(
    () => new Map<number, ScheduleAssignment>(visibleAssignments.map((assignment) => [assignment.sectionId, assignment])),
    [visibleAssignments],
  );

  const sessionsByAssignmentId = useMemo(() => {
    const bucket = new Map<number, ScheduleSession[]>();

    for (const session of sessions) {
      const current = bucket.get(session.assignmentId) ?? [];
      current.push(session);
      bucket.set(session.assignmentId, current);
    }

    for (const sessionList of bucket.values()) {
      sessionList.sort((left, right) => left.startMinutes - right.startMinutes);
    }

    return bucket;
  }, [sessions]);

  const currentAula = rooms.find((room) => room.id === selectedAula) ?? null;

  const roomAssignments = useMemo(() => {
    if (!currentAula) {
      return [];
    }

    return visibleAssignments.filter((assignment) => assignment.roomId === currentAula.id);
  }, [currentAula, visibleAssignments]);

  const roomAssignmentIds = new Set(roomAssignments.map((assignment) => assignment.id));

  const weeklyBlocks = useMemo(() => {
    const byDay = new Map<ScheduleDayKey, ScheduleSession[]>(
      scheduleDays.map((day) => [day.key, []]),
    );

    for (const session of sessions) {
      if (!roomAssignmentIds.has(session.assignmentId)) {
        continue;
      }

      byDay.get(session.day)?.push(session);
    }

    for (const list of byDay.values()) {
      list.sort((left, right) => left.startMinutes - right.startMinutes);
    }

    return byDay;
  }, [roomAssignmentIds, sessions]);

  const roomSections = useMemo(() => {
    return roomAssignments
      .map((assignment) => {
        const section = sectionIndex.get(assignment.sectionId);
        if (!section) {
          return null;
        }

        const assignmentSessions = sessionsByAssignmentId.get(assignment.id) ?? [];
        const scheduleSummary = assignmentSessions.length
          ? assignmentSessions.map((session) => `${session.dayLabel} ${session.startTime}-${session.endTime}`).join(' · ')
          : 'Sin horario';

        return {
          assignment,
          section,
          scheduleSummary,
          sessionCount: assignmentSessions.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => sectionFilter === 'all' || item.section.areaKey === sectionFilter)
      .sort((left, right) => left.section.name.localeCompare(right.section.name));
  }, [roomAssignments, sectionFilter, sectionIndex, sessionsByAssignmentId]);

  const occupancy = useMemo(() => {
    if (!currentAula) {
      return { students: 0, percent: 0 };
    }

    const uniqueStudents = roomAssignments.reduce((total, assignment) => total + assignment.students, 0);
    const percent = currentAula.capacity > 0 ? Math.round((uniqueStudents / currentAula.capacity) * 100) : 0;

    return {
      students: uniqueStudents,
      percent: Math.max(0, percent),
    };
  }, [currentAula, roomAssignments]);

  const findConflict = (
    section: ScheduleSection,
    room: ScheduleRoom,
    day: ScheduleDayKey,
    startMinutes: number,
    excludeSessionId?: number,
  ) => {
    if (room.maintenance) {
      return 'El aula esta en mantenimiento.';
    }

    const durationMinutes = getDurationMinutes(section);
    const endMinutes = startMinutes + durationMinutes;
    const sectionAssignment = assignmentBySectionId.get(section.id);
    const enrolledStudents = sectionAssignment?.students ?? 0;

    if (enrolledStudents > room.capacity && !sectionAssignment?.overCapacityConfirmed) {
      return `La capacidad de ${room.code} es menor que la matricula registrada.`;
    }

    if (endMinutes > 18 * 60 + academicVisibleMinutes) {
      return 'La sesion excede el rango visible del horario.';
    }

    const daySessions = weeklyBlocks.get(day) ?? [];
    for (const session of daySessions) {
      if (session.id === excludeSessionId) {
        continue;
      }

      if (!overlap(startMinutes, endMinutes, session.startMinutes, session.endMinutes)) {
        continue;
      }

      const conflictingAssignment = assignmentIndex.get(session.assignmentId);
      const conflictingSection = conflictingAssignment
        ? sectionIndex.get(conflictingAssignment.sectionId)
        : null;
      const conflictingCode = conflictingSection?.code ?? `ASIG-${session.assignmentId}`;

      return `Choque con ${conflictingCode} en ${dayKeyToLabel(day)} ${minutesToHourLabel(session.startMinutes)}.`;
    }

    return null;
  };

  const ensureAssignment = async (section: ScheduleSection, roomId: number) => {
    const existing = assignmentBySectionId.get(section.id);
    if (existing) {
      if (existing.roomId !== roomId) {
        await updateAssignment(existing.id, {
          id_aula: roomId,
          id_docente: existing.teacherId ?? section.teacherId,
        });
      }

      return existing.id;
    }

    if (!activePeriod) {
      throw new Error('No existe un periodo activo para crear una asignacion nueva.');
    }

    const created = await createAssignment({
      id_seccion: section.id,
      id_periodo: activePeriod.id,
      id_aula: roomId,
      id_docente: section.teacherId,
      estudiantes_matriculados: 0,
      sobrecargo_confirmado: false,
      estado: 'asignada',
    });

    return created.id;
  };

  const refreshAfterMutation = async (nextMessage: string) => {
    await loadSnapshot({ silent: true, keepMessage: true });
    setMessage(nextMessage);
  };

  const handleSectionDrop = async (sectionId: number, day: ScheduleDayKey, startMinutes: number) => {
    if (!currentAula) {
      return;
    }

    const section = sectionIndex.get(sectionId);
    if (!section) {
      return;
    }

    const existingAssignment = assignmentBySectionId.get(section.id);
    const existingSessions = existingAssignment ? sessionsByAssignmentId.get(existingAssignment.id) ?? [] : [];
    if (existingSessions.length >= section.weeklySessionsTarget) {
      setMessage(`La seccion ${section.code} ya tiene sus ${section.weeklySessionsTarget} sesiones. Mueve un bloque existente o elimina uno.`);
      setDragState(null);
      setDropState(null);
      return;
    }

    const plannedDays = autoCompleteEnabled && existingSessions.length === 0
      ? getAutoCompleteDays(day, section.weeklySessionsTarget)
      : [day];

    for (const plannedDay of plannedDays) {
      const conflict = findConflict(section, currentAula, plannedDay, startMinutes);
      if (conflict) {
        setMessage(conflict);
        setDragState(null);
        setDropState(null);
        return;
      }
    }

    setSaving(true);
    try {
      const assignmentId = await ensureAssignment(section, currentAula.id);
      const endMinutes = startMinutes + getDurationMinutes(section);

      for (const plannedDay of plannedDays) {
        await createSession({
          id_asignacion: assignmentId,
          dia: dayKeyToApiValue(plannedDay),
          hora_inicio: toTimeString(startMinutes),
          hora_fin: toTimeString(endMinutes),
          generado_automaticamente: autoCompleteEnabled && plannedDays.length > 1,
        });
      }

      await refreshAfterMutation(
        autoCompleteEnabled && plannedDays.length > 1
          ? `${section.code} se autocompleto en ${plannedDays.length} dia(s) de la semana.`
          : `${section.code} se programo en ${currentAula.code}.`,
      );
    } catch (mutationError) {
      setMessage(getErrorMessage(mutationError));
    } finally {
      setSaving(false);
      setDragState(null);
      setDropState(null);
    }
  };

  const handleSessionMove = async (
    sessionId: number,
    assignmentId: number,
    sectionId: number,
    day: ScheduleDayKey,
    startMinutes: number,
  ) => {
    if (!currentAula) {
      return;
    }

    const section = sectionIndex.get(sectionId);
    const assignment = assignmentIndex.get(assignmentId);
    if (!section || !assignment) {
      return;
    }

    const conflict = findConflict(section, currentAula, day, startMinutes, sessionId);
    if (conflict) {
      setMessage(conflict);
      setDragState(null);
      setDropState(null);
      return;
    }

    setSaving(true);
    try {
      const endMinutes = startMinutes + getDurationMinutes(section);

      if (assignment.roomId !== currentAula.id) {
        await updateAssignment(assignment.id, { id_aula: currentAula.id });
      }

      await updateSession(sessionId, {
        dia: dayKeyToApiValue(day),
        hora_inicio: toTimeString(startMinutes),
        hora_fin: toTimeString(endMinutes),
      });

      await refreshAfterMutation(`${section.code} se movio a ${dayKeyToLabel(day)} ${minutesToHourLabel(startMinutes)}.`);
    } catch (mutationError) {
      setMessage(getErrorMessage(mutationError));
    } finally {
      setSaving(false);
      setDragState(null);
      setDropState(null);
    }
  };

  const handleDeleteSession = async (sessionId: number, sectionCode: string) => {
    setSaving(true);
    try {
      await deleteSession(sessionId);
      await refreshAfterMutation(`Se elimino un bloque de ${sectionCode}.`);
    } catch (mutationError) {
      setMessage(getErrorMessage(mutationError));
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (day: ScheduleDayKey, startMinutes: number) => {
    if (!dragState) {
      return;
    }

    if (dragState.kind === 'section') {
      await handleSectionDrop(dragState.sectionId, day, startMinutes);
      return;
    }

    await handleSessionMove(
      dragState.sessionId,
      dragState.assignmentId,
      dragState.sectionId,
      day,
      startMinutes,
    );
  };

  const currentRoomBlocks = roomAssignments.reduce((sum, assignment) => {
    return sum + (sessionsByAssignmentId.get(assignment.id)?.length ?? 0);
  }, 0);

  return (
    <section className="schedule-page">
      <div className="schedule-toolbar">
        <div className="select-box">
          <select
            value={selectedAula ?? ''}
            onChange={(event) => setSelectedAula(Number(event.target.value))}
            disabled={!rooms.length || loading || saving}
          >
            {rooms.length ? null : <option value="">Sin aulas</option>}
            {rooms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.typeLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="search-box narrow">
          {currentAula ? `${currentAula.building} piso ${currentAula.floor}` : 'Sin aula seleccionada'}
        </div>
        <label className="week-box autocomplete-box">
          <span className="autocomplete-copy">
            <strong>Autocompletar semana</strong>
            <small>
              {autoCompleteEnabled
                ? 'Replica segun dias por semana y duracion.'
                : 'Desactivado: arrastra bloque por bloque.'}
            </small>
          </span>
          <input
            type="checkbox"
            checked={autoCompleteEnabled}
            onChange={(event) => setAutoCompleteEnabled(event.target.checked)}
            disabled={saving}
          />
        </label>
        <div className="availability">
          <span>{currentAula?.maintenance ? 'Mantenimiento' : 'Disponible'}</span>
          <strong>{currentAula ? `${Math.max(0, 100 - occupancy.percent)}% libre` : '0% libre'}</strong>
        </div>
        <button className="replicate-btn" type="button" onClick={() => void loadSnapshot({ keepMessage: true })} disabled={loading || saving}>
          {saving ? 'Guardando...' : 'Actualizar horario'}
        </button>
        <button className="ghost-btn" type="button" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      <div className="schedule-grid">
        <aside className="schedule-sidebar">
          <div className="section-head dark compact">
            <strong>Secciones de esta aula</strong>
            <span>{roomSections.length} asignadas · {currentRoomBlocks} bloques en este aula</span>
          </div>
          {!loading && roomSections.length ? (
            <div className="assigned-section-list">
              {roomSections.map(({ assignment, section, scheduleSummary, sessionCount }) => (
                <article
                  key={assignment.id}
                  draggable={!saving}
                  onDragStart={() => {
                    const assignmentSessions = sessionsByAssignmentId.get(assignment.id) ?? [];
                    const firstSession = assignmentSessions[0];
                    if (firstSession) {
                      setDragState({
                        kind: 'session',
                        sessionId: firstSession.id,
                        assignmentId: assignment.id,
                        sectionId: section.id,
                      });
                      return;
                    }

                    setDragState({
                      kind: 'section',
                      sectionId: section.id,
                    });
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                    setDropState(null);
                  }}
                  className={`mini-card assigned ${areaColor(section.areaKey)}`}
                >
                  <strong>{section.code}</strong>
                  <span>{section.name}</span>
                  <small>{section.teacherName}</small>
                  <div className={`mini-pill ${areaColor(section.areaKey)}`}>{section.areaLabel}</div>
                  <small>{scheduleSummary}</small>
                  <small>Bloques: {sessionCount}/{section.weeklySessionsTarget} · Matricula: {assignment.students}</small>
                  <small>Duracion: {getDurationBlocks(section)} hora(s) academica(s)</small>
                </article>
              ))}
            </div>
          ) : null}
          {!loading && !roomSections.length ? (
            <p className="sidebar-note">Esta aula aun no tiene secciones asignadas o sus asignaciones no tienen horario creado.</p>
          ) : null}
          <div className="filter-row wrap">
            {scheduleSectionFilters.map((filter) => (
              <button
                key={filter.value}
                className={`chip-btn ${sectionFilter === filter.value ? 'active' : ''}`}
                onClick={() => setSectionFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className={`feedback ${error ? 'error' : ''}`}>{error ?? message}</p>
          {loading ? <p className="sidebar-note">Cargando datos del backend...</p> : null}
          <p className="sidebar-note">
            Solo se muestran las secciones ya asignadas a esta aula. Con autocompletar activo, la primera sesion replica el resto de la semana; apagado, debes arrastrar hora por hora.
          </p>
        </aside>

        <div className="calendar">
          <div className="calendar-head">
            <div className="time-gap" />
            {scheduleDays.map((day) => (
              <div key={day.key} className={`day-head ${day.key === 'mon' || day.key === 'fri' ? 'active' : ''}`}>
                <strong>{day.label}</strong>
                <span>{day.short}</span>
              </div>
            ))}
          </div>

          {timeSlots.map((slot) => (
            <div key={slot.minutes} className="calendar-row">
              <div className="time-cell">{slot.shortLabel}</div>
              {scheduleDays.map((day) => {
                const dayBlocks = weeklyBlocks.get(day.key) ?? [];
                const block = dayBlocks.find((item) => item.startMinutes === slot.minutes);
                const assignment = block ? assignmentIndex.get(block.assignmentId) : null;
                const section = assignment ? sectionIndex.get(assignment.sectionId) : null;
                const isDropTarget = dropState?.day === day.key && dropState?.startMinutes === slot.minutes;
                const conflict =
                  dropState && dragState && currentAula
                    ? (() => {
                        const sectionId = dragState.kind === 'section'
                          ? dragState.sectionId
                          : dragState.sectionId;
                        const previewSection = sectionIndex.get(sectionId);
                        return previewSection
                          ? findConflict(
                              previewSection,
                              currentAula,
                              day.key,
                              slot.minutes,
                              dragState.kind === 'session' ? dragState.sessionId : undefined,
                            )
                          : null;
                      })()
                    : null;

                const eventHeight = block && section
                  ? Math.max(slotHeight - 10, getSessionBlockSpan(block.startMinutes, block.endMinutes) * slotHeight - 10)
                  : slotHeight - 10;

                return (
                  <div
                    key={`${day.key}-${slot.minutes}`}
                    className={`slot ${isDropTarget ? 'hover' : ''} ${conflict ? 'invalid' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnter={() => {
                      if (dragState) {
                        setDropState({ day: day.key, startMinutes: slot.minutes });
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDrop(day.key, slot.minutes);
                    }}
                  >
                    {block && section ? (
                      <article
                        draggable={!saving}
                        onDragStart={() =>
                          setDragState({
                            kind: 'session',
                            sessionId: block.id,
                            assignmentId: block.assignmentId,
                            sectionId: section.id,
                          })
                        }
                        onDragEnd={() => {
                          setDragState(null);
                          setDropState(null);
                        }}
                        className={`event ${areaColor(section.areaKey)}`}
                        style={{ height: `${eventHeight}px`, zIndex: 2 }}
                      >
                        <div className="event-header">
                          <strong>{section.code}</strong>
                          <button
                            type="button"
                            className="event-delete"
                            onClick={() => void handleDeleteSession(block.id, section.code)}
                            disabled={saving}
                          >
                            x
                          </button>
                        </div>
                        <span>{section.name}</span>
                        <small>{section.teacherName}</small>
                        <b>{block.startTime} - {block.endTime}</b>
                      </article>
                    ) : null}
                    {isDropTarget && !block ? <div className="drop-hint">Soltar aqui</div> : null}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="legend">
            <span>LEYENDA:</span>
            <i className="legend-item blue">Ingenieria</i>
            <i className="legend-item green">Ciencias</i>
            <i className="legend-item purple">Humanidades</i>
            <i className="legend-item orange">Administracion</i>
            <i className="legend-item gray">Otros</i>
          </div>
        </div>
      </div>

      <div className="assignment-summary">
        <strong>{currentAula ? `${currentAula.code}: ${occupancy.students}/${currentAula.capacity} estudiantes` : 'Sin aula seleccionada'}</strong>
        <span>
          {activePeriod
            ? `Periodo activo: ${activePeriod.name}`
            : 'Sin periodo activo: solo puedes mover sesiones ya existentes.'}
        </span>
      </div>
    </section>
  );
}
