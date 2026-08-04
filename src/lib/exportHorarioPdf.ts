import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { scheduleDays, type ScheduleSnapshot } from '../features/schedule/model';

export function exportHorarioPdf(snapshot: ScheduleSnapshot) {
    const sectionById = new Map(snapshot.sections.map((s) => [s.id, s]));
    const roomById = new Map(snapshot.rooms.map((r) => [r.id, r]));
    const teacherById = new Map(snapshot.teachers.map((t) => [t.id, t]));
    const assignmentById = new Map(snapshot.assignments.map((a) => [a.id, a]));

    const rows = snapshot.sessions
        .map((session) => {
            const assignment = assignmentById.get(session.assignmentId);
            const section = assignment ? sectionById.get(assignment.sectionId) : undefined;
            const room = assignment?.roomId ? roomById.get(assignment.roomId) : undefined;
            const teacherId = assignment?.teacherId ?? section?.teacherId ?? null;
            const teacher = teacherId ? teacherById.get(teacherId) : undefined;

            return {
                dayOrder: scheduleDays.findIndex((d) => d.key === session.day),
                day: session.dayLabel,
                time: `${session.startTime} - ${session.endTime}`,
                startMinutes: session.startMinutes,
                code: section?.code ?? '—',
                name: section?.name ?? '—',
                teacher: teacher?.name ?? section?.teacherName ?? 'Sin asignar',
                room: room?.code ?? 'Sin aula',
            };
        })
        .sort((a, b) => (a.dayOrder - b.dayOrder) || (a.startMinutes - b.startMinutes));

    const doc = new jsPDF({ orientation: 'landscape' });

    const title = 'Horario General';
    const subtitle = snapshot.activePeriod
        ? `Período: ${snapshot.activePeriod.name}`
        : 'Sin período académico activo';
    const generatedAt = `Generado el ${new Date().toLocaleString('es-HN')}`;

    doc.setFontSize(16);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitle, 14, 23);
    doc.text(generatedAt, 14, 28);

    autoTable(doc, {
        startY: 34,
        head: [['Día', 'Hora', 'Código', 'Sección', 'Docente', 'Aula']],
        body: rows.length
            ? rows.map((r) => [r.day, r.time, r.code, r.name, r.teacher, r.room])
            : [['Sin sesiones de horario registradas para el período activo.', '', '', '', '', '']],
        headStyles: { fillColor: [47, 107, 243] },
        styles: { fontSize: 9 },
    });

    const fileName = snapshot.activePeriod
        ? `horario-${snapshot.activePeriod.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
        : 'horario.pdf';

    doc.save(fileName);
}