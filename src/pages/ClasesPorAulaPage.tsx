import { useMemo, useState } from 'react';
import { aulas, areaClass, areaLabels, sections, type Aula, type AreaFilter, type Section } from '../data/scheduling';

type AssignmentMap = Record<string, string[]>;

const roomFilters: Array<{ value: AreaFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'ing', label: 'Ing.' },
  { value: 'cienc', label: 'Cienc.' },
  { value: 'hum', label: 'Hum.' },
  { value: 'admin', label: 'Admin.' },
];

const aulaFilters = ['all', 'estandar', 'laboratorio', 'auditorio', 'mantenimiento'] as const;

function parseCapacityLabel(aula: Aula, assigned: Section[]) {
  const used = assigned.reduce((sum, item) => sum + item.students, 0);
  const occupancy = Math.round((used / aula.capacity) * 100);
  return { used, occupancy: Number.isFinite(occupancy) ? occupancy : 0 };
}

export function ClasesPorAulaPage() {
  const [sectionFilter, setSectionFilter] = useState<AreaFilter>('all');
  const [aulaFilter, setAulaFilter] = useState<(typeof aulaFilters)[number]>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [message, setMessage] = useState('Arrastra una sección hacia un aula disponible.');
  const [assignments, setAssignments] = useState<AssignmentMap>({
    'AULA-201': ['MAT-301'],
    'AULA-302': ['INF-102'],
  });

  const sectionIndex = useMemo(() => Object.fromEntries(sections.map((item) => [item.id, item])), []);

  const unassignedSections = sections.filter((section) => !Object.values(assignments).some((list) => list.includes(section.id)));
  const filteredSections = unassignedSections.filter((section) => sectionFilter === 'all' || section.area === sectionFilter);
  const filteredAulas = aulas.filter((aula) => {
    if (aulaFilter === 'all') return true;
    if (aulaFilter === 'mantenimiento') return Boolean(aula.maintenance);
    return aula.type === aulaFilter;
  });

  const handleDrop = (aulaId: string) => {
    if (!draggingId) return;
    const section = sectionIndex[draggingId];
    const aula = aulas.find((item) => item.id === aulaId);
    if (!section || !aula) return;

    const currentAssignments = Object.entries(assignments).flatMap(([assignedAulaId, ids]) =>
      ids.map((id) => ({ assignedAulaId, id })),
    );
    const alreadyAssignedIds = currentAssignments.filter((item) => item.id === section.id);
    const assignedToOtherRoom = alreadyAssignedIds.find((item) => item.assignedAulaId !== aulaId);

    if (aula.maintenance) {
      setMessage(`No se puede asignar ${section.code}: el aula está en mantenimiento.`);
      setDraggingId(null);
      return;
    }
    if (section.students > aula.capacity) {
      setMessage(`No se puede asignar ${section.code}: capacidad excedida en ${aula.code}.`);
      setDraggingId(null);
      return;
    }

    setAssignments((current) => {
      const next: AssignmentMap = {};
      for (const [roomId, ids] of Object.entries(current)) {
        next[roomId] = ids.filter((id) => id !== section.id);
      }
      next[aulaId] = [...(next[aulaId] ?? []).filter((id) => id !== section.id), section.id];
      return next;
    });

    setMessage(
      assignedToOtherRoom
        ? `${section.code} se movió a ${aula.code}.`
        : `${section.code} asignado a ${aula.code}.`,
    );
    setDraggingId(null);
  };

  const assignedSectionIds = Object.values(assignments).flat();

  return (
    <section className="kanban-page">
      <aside className="kanban-left">
        <div className="section-head dark">
          <strong>Secciones sin Aula</strong>
          <span>{filteredSections.length} visibles · {unassignedSections.length} pendientes</span>
        </div>
        <div className="search-box">🔎 Buscar sección...</div>
        <div className="filter-row wrap">
          {roomFilters.map((filter) => (
            <button
              key={filter.value}
              className={`chip-btn ${sectionFilter === filter.value ? 'active' : ''}`}
              onClick={() => setSectionFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="feedback">{message}</p>
        <div className="stack">
          {filteredSections.map((item) => (
            <article
              key={item.id}
              draggable
              onDragStart={() => setDraggingId(item.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`subject-card ${areaClass[item.area]} ${draggingId === item.id ? 'dragging' : ''}`}
            >
              <div className="subject-tag">{areaLabels[item.area]}</div>
              <div className="subject-code">{item.code}</div>
              <div className="subject-name">{item.name}</div>
              <div className="subject-teacher">👤 {item.teacher}</div>
              <div className="subject-meta">
                <span>👥 {item.students} alumnos</span>
                <span>⏱ {item.duration}h/sem</span>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <main className="kanban-board">
        <div className="board-header">
          <div>
            <h2>Aulas Disponibles — Arrastrar secciones para asignar</h2>
            <p>Arrastra una tarjeta de sección hacia la columna del aula correspondiente</p>
          </div>
          <div className="filter-row inline">
            {aulaFilters.map((filter) => (
              <button
                key={filter}
                className={`chip-btn ${aulaFilter === filter ? 'active' : ''}`}
                onClick={() => setAulaFilter(filter)}
              >
                {filter === 'all' ? 'Todas las aulas' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="room-grid">
          {filteredAulas.map((room) => {
            const assigned = (assignments[room.id] ?? []).map((id) => sectionIndex[id]);
            const { used, occupancy } = parseCapacityLabel(room, assigned);

            return (
              <section
                key={room.id}
                className={`room-column ${room.maintenance ? 'disabled' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(room.id)}
              >
                <header className="room-head">
                  <strong>{room.code}</strong>
                  <span>{`${room.type === 'estandar' ? 'Estándar' : room.type === 'laboratorio' ? 'Laboratorio' : 'Auditorio'} · Cap. ${room.capacity}`}</span>
                  <small>{occupancy}% ocupado</small>
                </header>

                <div className="capacity-bar">
                  <span style={{ width: `${Math.min(occupancy, 100)}%` }} />
                </div>
                <p className="room-caption">Usado: {used} / {room.capacity}</p>

                {assigned.map((item) => (
                  <article key={item.id} className={`room-card ${areaClass[item.area]}`}>
                    <div className="subject-tag">{areaLabels[item.area]}</div>
                    <strong>{item.code}</strong>
                    <span>{item.name}</span>
                    <small>👤 {item.teacher}</small>
                    <b>👥 {item.students} alumnos</b>
                  </article>
                ))}

                <div className={`drop-zone ${room.maintenance || draggingId === null ? '' : 'highlighted'}`}>
                  <span>{room.maintenance ? 'Aula en mantenimiento' : '+ Soltar sección aquí'}</span>
                </div>
              </section>
            );
          })}
          <section className="empty-column" />
        </div>

        <div className="assignment-summary">
          <strong>Asignadas: {assignedSectionIds.length}</strong>
          <span>Capacidad validada antes de aceptar cualquier arrastre</span>
        </div>
      </main>
    </section>
  );
}
