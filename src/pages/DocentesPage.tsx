import { useEffect, useState } from 'react';
import { DocenteModal, DocenteFormData } from '../components/DocenteModal';

type Docente = DocenteFormData & { codigo: string };

const STORAGE_KEY = 'gestion-aulas:teachers';

const initialTeachers: Docente[] = [
  { codigo: 'DOC-001', nombre: 'Dr. Juan Ramírez', departamento: 'Ingeniería', especialidad: 'Cálculo', estado: 'Activo', cargaHoraria: 18 },
  { codigo: 'DOC-002', nombre: 'Lic. María Torres', departamento: 'Ingeniería', especialidad: 'Programación', estado: 'Activo', cargaHoraria: 16 },
  { codigo: 'DOC-003', nombre: 'Dr. Carlos López', departamento: 'Ciencias', especialidad: 'Física', estado: 'Licencia', cargaHoraria: 12 },
  { codigo: 'DOC-004', nombre: 'Ing. Rosa Medina', departamento: 'Ciencias', especialidad: 'Química', estado: 'Activo', cargaHoraria: 20 },
];

function loadTeachers(): Docente[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialTeachers;
  } catch {
    return initialTeachers;
  }
}

function nextCodigo(teachers: Docente[]): string {
  const numbers = teachers.map((t) => Number(t.codigo.replace('DOC-', '')) || 0);
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `DOC-${String(next).padStart(3, '0')}`;
}

export function DocentesPage() {
  const [teachers, setTeachers] = useState<Docente[]>(loadTeachers);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCodigo, setEditingCodigo] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
  }, [teachers]);

  function handleOpenCreate() {
    setEditingCodigo(null);
    setModalMode('create');
  }

  function handleOpenEdit(codigo: string) {
    setEditingCodigo(codigo);
    setModalMode('edit');
  }

  function handleCloseModal() {
    setModalMode(null);
    setEditingCodigo(null);
  }

  function handleSave(data: DocenteFormData) {
    if (modalMode === 'edit' && editingCodigo) {
      setTeachers((prev) =>
          prev.map((t) => (t.codigo === editingCodigo ? { ...t, ...data } : t))
      );
    } else {
      setTeachers((prev) => [...prev, { ...data, codigo: nextCodigo(prev) }]);
    }
    handleCloseModal();
  }

  const editingTeacher = teachers.find((t) => t.codigo === editingCodigo);

  return (
      <section className="catalog-page">
        <div className="toolbar">
          <div className="catalog-summary">{teachers.length} Docentes Registrados</div>
          <button className="primary-btn" onClick={handleOpenCreate}>
            + Nuevo Docente
          </button>
        </div>

        <div className="table-card full">
          <table>
            <thead>
            <tr>
              <th>Código</th>
              <th>Nombre Completo</th>
              <th>Departamento</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Carga Horaria</th>
              <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {teachers.map((row) => (
                <tr key={row.codigo}>
                  <td>{row.codigo}</td>
                  <td>{row.nombre}</td>
                  <td>{row.departamento}</td>
                  <td>{row.especialidad}</td>
                  <td>
                    <span className={`tag state ${row.estado.toLowerCase()}`}>{row.estado}</span>
                  </td>
                  <td>{row.cargaHoraria}h</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleOpenEdit(row.codigo)}>
                      Editar
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {modalMode === 'create' && (
            <DocenteModal title="Nuevo Docente" onClose={handleCloseModal} onSave={handleSave} />
        )}

        {modalMode === 'edit' && editingTeacher && (
            <DocenteModal
                title="Editar Docente"
                initialData={{
                  nombre: editingTeacher.nombre,
                  departamento: editingTeacher.departamento,
                  especialidad: editingTeacher.especialidad,
                  estado: editingTeacher.estado,
                  cargaHoraria: editingTeacher.cargaHoraria,
                }}
                onClose={handleCloseModal}
                onSave={handleSave}
            />
        )}
      </section>
  );
}