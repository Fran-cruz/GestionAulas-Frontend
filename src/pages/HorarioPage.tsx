import { useMemo, useState } from 'react';
import { aulas, days, getAnchorDays, getRepeatDays, indexToTime, initialAssignments, repeatLabels, sections, timeSlots, type DayKey, type RepeatPattern, type ScheduleAssignment, type Section } from '../data/scheduling';

type DropState = { sectionId: string; day: DayKey; start: number } | null;

const dayOrder: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const scheduleSectionFilters = ['all', 'ing', 'cienc', 'hum', 'admin'] as const;

function getLabel(day: DayKey) {
  return days.find((item) => item.key === day)!;
}

function sectionColor(area: Section['area']) {
  return area === 'ing' ? 'blue' : area === 'cienc' ? 'green' : area === 'hum' ? 'purple' : 'orange';
}

function blockDaysForPattern(pattern: RepeatPattern, day: DayKey): DayKey[] {
  const anchorDays = getAnchorDays(pattern);
  if (!anchorDays.includes(day)) return [];

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
      return [day];
  }
}

export function HorarioPage() {
  const [selectedAula, setSelectedAula] = useState(aulas[0].id);
  const [sectionFilter, setSectionFilter] = useState<(typeof scheduleSectionFilters)[number]>('all');
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dropState, setDropState] = useState<DropState>(null);
  const [message, setMessage] = useState('Arrastra una sección hacia una celda del horario.');
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>(initialAssignments);

  const sectionIndex = useMemo(() => Object.fromEntries(sections.map((item) => [item.id, item])), []);
  const currentAula = aulas.find((item) => item.id === selectedAula)!;
  const assignedInRoom = assignments.filter((item) => item.aulaId === selectedAula);
  const assignedSectionIds = new Set(assignments.map((item) => item.sectionId));
  const sidebarSections = sections.filter((section) => sectionFilter === 'all' || section.area === sectionFilter);

  const weeklyBlocks = useMemo(() => {
    const blocks = assignments.filter((item) => item.aulaId === selectedAula);
    return Object.fromEntries(
      dayOrder.map((day) => [
        day,
        blocks
          .filter((item) => item.day === day)
          .sort((a, b) => a.start - b.start)
          .map((item) => ({ ...item, section: sectionIndex[item.sectionId] })),
      ]),
    ) as Record<DayKey, Array<ScheduleAssignment & { section: Section }>>;
  }, [assignments, selectedAula, sectionIndex]);

  const occupiedHours = assignedInRoom.reduce((sum, item) => sum + sectionIndex[item.sectionId].duration, 0);

  const conflictReason = (section: Section, aulaId: string, day: DayKey, start: number) => {
    const aula = aulas.find((item) => item.id === aulaId)!;
    if (section.students > aula.capacity) return 'La capacidad del aula es menor que el grupo';

    const daysForBlock = blockDaysForPattern(section.repeat, day) as DayKey[];
    if (!daysForBlock.length) return 'El día de arrastre no coincide con la repetición de la clase';

    const slots = Array.from({ length: section.duration }, (_, offset) => start + offset);
    if (slots.some((slot) => slot < 7 || slot > 18)) return 'La clase excede el rango horario';

    for (const currentDay of daysForBlock) {
      for (const hour of slots) {
        const clash = assignments.find(
          (item) =>
            item.aulaId === aulaId &&
            item.day === currentDay &&
            hour >= item.start &&
            hour < item.start + sectionIndex[item.sectionId].duration &&
            item.sectionId !== section.id,
        );
        if (clash) {
          return `Choque con ${clash.sectionId} en ${getLabel(currentDay).label} ${indexToTime(hour)}:00`;
        }
      }
    }

    return null;
  };

  const commitDrop = (sectionId: string, day: DayKey, start: number) => {
    const section = sectionIndex[sectionId];
    const conflict = conflictReason(section, selectedAula, day, start);
    if (conflict) {
      setMessage(conflict);
      setDraggingSectionId(null);
      setDropState(null);
      return;
    }

    const daysForBlock = blockDaysForPattern(section.repeat, day) as DayKey[];
    const slots = Array.from({ length: section.duration }, (_, offset) => start + offset);

    setAssignments((current) => [
      ...current.filter((item) => item.sectionId !== section.id || item.aulaId === selectedAula),
      ...daysForBlock.flatMap((currentDay) => slots.map((slot) => ({ sectionId: section.id, aulaId: selectedAula, day: currentDay as DayKey, start: slot }))),
    ]);
    setMessage(`${section.code} se programó en ${currentAula.code}.`);
    setDraggingSectionId(null);
    setDropState(null);
  };

  return (
    <section className="schedule-page">
      <div className="schedule-toolbar">
        <div className="select-box">
          <select value={selectedAula} onChange={(event) => setSelectedAula(event.target.value)}>
            {aulas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.type === 'laboratorio' ? 'Laboratorio' : item.type === 'auditorio' ? 'Auditorio' : 'Estándar'}
              </option>
            ))}
          </select>
        </div>
        <div className="search-box narrow">🔎 Buscar aula...</div>
        <div className="week-box">
          <button type="button">‹</button>
          <strong>Semana 28 — Jul 7–12, 2025</strong>
          <button type="button">›</button>
        </div>
        <div className="availability">● Disponible — {Math.max(0, 100 - Math.round((occupiedHours / currentAula.capacity) * 100))}% libre</div>
        <button className="replicate-btn">◉ Replicar en L-M-X-J</button>
        <button className="ghost-btn">Imprimir</button>
      </div>

      <div className="schedule-grid">
        <aside className="schedule-sidebar">
          <div className="section-head dark compact">
            <strong>Secciones Asignadas</strong>
            <span>{assignedInRoom.length} bloques en este aula</span>
          </div>
          <div className="filter-row wrap">
            {scheduleSectionFilters.map((filter) => (
              <button
                key={filter}
                className={`chip-btn ${sectionFilter === filter ? 'active' : ''}`}
                onClick={() => setSectionFilter(filter)}
              >
                {filter === 'all' ? 'Todas' : filter}
              </button>
            ))}
          </div>
          <p className="feedback">{message}</p>
          {sidebarSections.map((section) => (
            <article
              key={section.id}
              draggable
              onDragStart={() => setDraggingSectionId(section.id)}
              onDragEnd={() => setDraggingSectionId(null)}
              className={`mini-card ${sectionColor(section.area)} ${draggingSectionId === section.id ? 'dragging' : ''}`}
            >
              <strong>{section.code}</strong>
              <span>{section.name}</span>
              <small>👤 {section.teacher}</small>
              <div className="mini-pill">✔ Replicar {repeatLabels[section.repeat]}</div>
              <small>{section.duration} hora{section.duration > 1 ? 's' : ''}</small>
            </article>
          ))}
          <p className="sidebar-note">Arrastra hacia el calendario para asignar horario.</p>
        </aside>

        <div className="calendar">
          <div className="calendar-head">
            <div className="time-gap" />
            {days.map((day) => (
              <div key={day.key} className={`day-head ${day.key === 'mon' || day.key === 'fri' ? 'active' : ''}`}>
                <strong>{day.label}</strong>
                <span>{day.short}</span>
              </div>
            ))}
          </div>

          {timeSlots.map((time, index) => (
            <div key={time} className="calendar-row">
              <div className="time-cell">{time}</div>
              {days.map((day) => {
                const blocks = weeklyBlocks[day.key] ?? [];
                const block = blocks.find((item) => item.start === index + 7);
                const isDropTarget = dropState?.day === day.key && dropState?.start === index + 7;
                const conflict = dropState && draggingSectionId
                  ? conflictReason(sectionIndex[draggingSectionId], selectedAula, day.key, index + 7)
                  : null;

                return (
                  <div
                    key={`${day.key}-${time}`}
                    className={`slot ${isDropTarget ? 'hover' : ''} ${conflict ? 'invalid' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnter={() => {
                      if (draggingSectionId) setDropState({ sectionId: draggingSectionId, day: day.key, start: index + 7 });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingSectionId) {
                        setDropState({ sectionId: draggingSectionId, day: day.key, start: index + 7 });
                        commitDrop(draggingSectionId, day.key, index + 7);
                      }
                    }}
                  >
                    {block ? (
                      <article className={`event ${sectionColor(block.section.area)} tall`}>
                        <strong>{block.section.code}</strong>
                        <span>{block.section.name}</span>
                        <small>👤 {block.section.teacher}</small>
                        <b>⌁ {repeatLabels[block.section.repeat]}</b>
                      </article>
                    ) : null}
                    {isDropTarget && !block ? <div className="drop-hint">Soltar aquí</div> : null}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="legend">
            <span>LEYENDA:</span>
            <i className="legend-item blue">MAT-301</i>
            <i className="legend-item green">INF-102</i>
            <i className="legend-item purple">FIS-201</i>
            <i className="legend-item orange">ADM-110</i>
            <i className="legend-item teal">QUI-101</i>
            <i className="legend-item border">Bloque replicado</i>
          </div>
        </div>
      </div>
    </section>
  );
}
