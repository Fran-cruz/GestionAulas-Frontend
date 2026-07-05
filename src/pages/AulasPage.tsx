const rooms = [
  ['Aula 201', 'Estándar • Capacidad 40 estudiantes', '45% Ocupado', 'Disponible', 'green'],
  ['Aula 104', 'Estándar • Capacidad 25 estudiantes', '0% Ocupado', 'Mantenimiento', 'red'],
  ['Aula 302', 'Laboratorio • Capacidad 35 estudiantes', '92% Ocupado', 'En Uso', 'blue'],
  ['Aula 403', 'Auditorio • Capacidad 50 estudiantes', '28% Ocupado', 'Disponible', 'green'],
  ['Aula 105', 'Estándar • Capacidad 30 estudiantes', '15% Ocupado', 'Disponible', 'green'],
];

export function AulasPage() {
  return (
    <section className="rooms-page">
      <div className="catalog-toolbar">
        <h2>Catálogo de Aulas</h2>
        <span>/ Infraestructura Física</span>
        <button className="primary-btn">+ Nueva Aula</button>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <article key={room[0]} className="room-summary">
            <div className={`room-top ${room[4]}`} />
            <h3>{room[0]}</h3>
            <p>{room[1]}</p>
            <div className="room-bar"><span className={room[4]} style={{ width: room[2].split('%')[0] + '%' }} /></div>
            <small>{room[2]}</small>
            <span className={`room-status ${room[4]}`}>{room[3]}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
