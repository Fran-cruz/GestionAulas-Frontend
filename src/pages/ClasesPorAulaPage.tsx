import { useEffect, useMemo, useRef, useState } from 'react';
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

// Info mínima que necesita la tarjeta "fantasma" que sigue al mouse mientras arrastramos.
type DragGhostInfo = {
  sectionId: number;
  sourceRoomId: number | null;
  code: string;
  name: string;
  areaLabel: string;
  colorClass: '' | 'green' | 'orange';
};

export function ClasesPorAulaPage() {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sectionFilter, setSectionFilter] = useState<'all' | ScheduleAreaKey>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>('all');
  const [message, setMessage] = useState('Cargando información desde el backend...');

  // --- Arrastre propio (no usamos el drag-and-drop nativo del navegador) ---
  // draggingSectionId: qué sección se está moviendo ahora mismo (controla estilos "dragging").
  // hoverRoomId: sobre qué aula está el cursor ahora mismo (controla el resaltado de esa columna).
  // dragInfoRef / dragPosRef: datos que necesitamos leer dentro de los listeners globales sin
  // volver a crearlos en cada pixel de movimiento (evita relentizar el arrastre).
  const [draggingSectionId, setDraggingSectionId] = useState<number | null>(null);
  const [hoverRoomId, setHoverRoomId] = useState<number | null>(null);
  const dragInfoRef = useRef<DragGhostInfo | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const hoverRoomIdRef = useRef<number | null>(null);

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
          setMessage('Haz clic y arrastra una sección hacia un aula disponible.');
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

  async function handleDrop(room: ScheduleRoom, sectionId: number) {
    const section = sectionIndex.get(sectionId);
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
    let overCapacityConfirmed = existing?.overCapacityConfirmed ?? false;

    if (enrolled > room.capacity && !overCapacityConfirmed) {
      const proceed = window.confirm(
          `${section.name} tiene ${enrolled} alumnos y ${room.code} tiene capacidad para ${room.capacity}.\n¿Moverla de todas formas (sobrecupo)?`,
      );

      if (!proceed) {
        setMessage(`Movimiento cancelado: capacidad excedida en ${room.code}.`);
        return;
      }

      overCapacityConfirmed = true;
    }

    if (!existing && !activePeriod) {
      setMessage('No hay un período académico activo. Créalo en el módulo de Períodos antes de asignar aulas.');
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (existing) {
        saved = await updateAssignment(existing.id, {
          id_aula: room.id,
          sobrecargo_confirmado: overCapacityConfirmed,
        });
      } else {
        saved = await createAssignment({
          id_seccion: section.id,
          id_periodo: activePeriod!.id,
          id_aula: room.id,
          id_docente: section.teacherId,
          sobrecargo_confirmado: overCapacityConfirmed,
        });
      }
      // eslint-disable-next-line no-console
      console.debug('[ClasesPorAula] asignación guardada por el backend →', saved);
      if (saved.id_aula !== room.id) {
        // eslint-disable-next-line no-console
        console.warn(
            `[ClasesPorAula] el backend respondió id_aula=${saved.id_aula} pero se soltó sobre el aula ${room.id} (${room.code}). Esto es un problema del Controller, no del arrastre.`,
        );
      }

      await loadSnapshot({ silent: true, keepMessage: true });
      setMessage(
          existing ? `${section.name} se movió a ${room.code}.` : `${section.name} asignada a ${room.code}.`,
      );
    } catch (err) {
      setMessage(`⚠️ ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  }

  function moveGhostTo(x: number, y: number) {
    if (ghostRef.current) {
      ghostRef.current.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
    }
  }

  function roomIdUnderPoint(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y);
    const roomEl = el instanceof Element ? el.closest<HTMLElement>('[data-room-id]') : null;
    if (!roomEl) return null;
    const parsed = Number(roomEl.dataset.roomId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function handlePointerMoveWindow(event: PointerEvent) {
    moveGhostTo(event.clientX, event.clientY);
    const roomId = roomIdUnderPoint(event.clientX, event.clientY);
    hoverRoomIdRef.current = roomId;
    setHoverRoomId((prev) => (prev === roomId ? prev : roomId));
  }

  function handlePointerUpWindow(event: PointerEvent) {
    window.removeEventListener('pointermove', handlePointerMoveWindow);
    window.removeEventListener('pointerup', handlePointerUpWindow);

    const info = dragInfoRef.current;
    dragInfoRef.current = null;
    setDraggingSectionId(null);
    setHoverRoomId(null);

    if (!info) return;

    // Preferimos el punto exacto de soltar; si por un movimiento rápido cae justo
    // en el borde/gap entre columnas, usamos el último aula que sí se resaltó.
    const roomId = roomIdUnderPoint(event.clientX, event.clientY) ?? hoverRoomIdRef.current;
    hoverRoomIdRef.current = null;
    if (roomId === null) {
      setMessage('Suelta la clase sobre un aula para asignarla (se canceló: no soltaste sobre ninguna).');
      return;
    }

    const room = rooms.find((candidate) => candidate.id === roomId);
    if (!room) return;

    void handleDrop(room, info.sectionId);
  }

  function beginDrag(event: React.PointerEvent, info: DragGhostInfo) {
    // Solo el botón principal (o toque) inicia el arrastre.
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    dragInfoRef.current = info;
    hoverRoomIdRef.current = null;
    setDraggingSectionId(info.sectionId);
    moveGhostTo(event.clientX, event.clientY);

    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);
  }

  // Por si el componente se desmonta a mitad de un arrastre.
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const isDragging = draggingSectionId !== null;
  const ghostInfo = dragInfoRef.current;

  return (
      <section className="kanban-page">
        {/* Tarjeta fantasma: sigue al cursor mientras se arrastra una clase. */}
        <div ref={ghostRef} className={`drag-ghost ${isDragging ? 'visible' : ''} ${ghostInfo ? areaColorClass(sectionIndex.get(ghostInfo.sectionId)?.areaKey ?? 'otro') : ''}`}>
          {ghostInfo ? (
              <>
                <strong>{ghostInfo.code}</strong>
                <span>{ghostInfo.name}</span>
              </>
          ) : null}
        </div>

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
          <p className={`feedback ${message.startsWith('⚠️') ? 'error' : ''}`}>{saving ? 'Guardando…' : message}</p>
          <div className="stack">
            {filteredSections.map((item) => (
                <article
                    key={item.id}
                    onPointerDown={(event) =>
                        beginDrag(event, {
                          sectionId: item.id,
                          sourceRoomId: null,
                          code: item.code,
                          name: item.name,
                          areaLabel: item.areaLabel,
                          colorClass: areaColorClass(item.areaKey),
                        })
                    }
                    className={`subject-card ${areaColorClass(item.areaKey)} ${draggingSectionId === item.id ? 'dragging' : ''}`}
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
              const isHovered = isDragging && hoverRoomId === room.id && !room.maintenance;

              return (
                  <section
                      key={room.id}
                      data-room-id={room.id}
                      className={`room-column ${room.maintenance ? 'disabled' : ''} ${isHovered ? 'active' : ''}`}
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
                              onPointerDown={(event) =>
                                  beginDrag(event, {
                                    sectionId: section.id,
                                    sourceRoomId: room.id,
                                    code: section.code,
                                    name: section.name,
                                    areaLabel: section.areaLabel,
                                    colorClass: areaColorClass(section.areaKey),
                                  })
                              }
                              className={`room-card ${areaColorClass(section.areaKey)} ${draggingSectionId === section.id ? 'dragging' : ''}`}
                          >
                            <div className="subject-tag">{section.areaLabel}</div>
                            <strong>{section.code}</strong>
                            <span>{section.name}</span>
                            <small>👤 {teacherLabel(section, a)}</small>
                            <b>👥 {a.students} alumnos</b>
                          </article>
                      );
                    })}

                    <div className={`drop-zone ${room.maintenance || !isDragging ? '' : hoverRoomId === room.id ? 'highlighted' : ''}`}>
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
