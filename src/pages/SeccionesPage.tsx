import { useEffect, useState } from 'react';
import {
  obtenerSecciones,
  crearSeccion,
  modificarSeccion,
  Seccion,
} from '../lib/seccionesServices';
import { obtenerDocentesResumen, DocenteResumen } from '../lib/docentesServices';
import { SeccionModal } from '../components/SeccionModal';

export function SeccionesPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function cargarSecciones() {
    try {
      setCargando(true);
      const [datosSecciones, datosDocentes] = await Promise.all([
        obtenerSecciones(),
        obtenerDocentesResumen(),
      ]);
      setSecciones(datosSecciones);
      setDocentes(datosDocentes);
      setErrorCarga('');
    } catch (error) {
      console.error(error);
      setErrorCarga('No se pudieron cargar las secciones. Intenta de nuevo más tarde.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSecciones();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setModalMode('create');
  }

  function handleOpenEdit(id: number) {
    setEditingId(id);
    setModalMode('edit');
  }

  function handleCloseModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function handleSave(datos: Seccion) {
    try {
      if (modalMode === 'edit' && editingId !== null) {
        await modificarSeccion(editingId, datos);
      } else {
        await crearSeccion(datos);
      }
      await cargarSecciones();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar la sección. Revisa los datos e intenta de nuevo.');
    }
  }

  function nombreDocente(id: number | null) {
    if (id === null) return 'Sin asignar';
    return docentes.find((d) => d.id === id)?.nombre_completo ?? 'Sin asignar';
  }

  const editingSeccion = secciones.find((s) => s.id === editingId);

  return (
      <section className="catalog-page">
        <div className="toolbar">
          <div className="catalog-summary">{secciones.length} Secciones Registradas</div>
          <button className="primary-btn" onClick={handleOpenCreate}>
            + Nueva Sección
          </button>
        </div>

        <div className="table-card full">
          {cargando ? (
              <p style={{ padding: 24 }}>Cargando secciones...</p>
          ) : errorCarga ? (
              <p style={{ padding: 24, color: '#ef4444' }}>{errorCarga}</p>
          ) : (
              <table>
                <thead>
                <tr>
                  <th>Materia</th>
                  <th>Código</th>
                  <th>Docente Titular</th>
                  <th>Área Académica</th>
                  <th>Sesiones/Semana</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {secciones.map((row) => (
                    <tr key={row.id}>
                      <td>{row.materia}</td>
                      <td>{row.codigo_materia}</td>
                      <td>{nombreDocente(row.id_docente)}</td>
                      <td>{row.area_academica}</td>
                      <td>{row.sesiones_por_semana}</td>
                      <td>
                    <span className={`tag state ${row.activa ? 'activa' : 'inactivo'}`}>
                      {row.activa ? 'Activa' : 'Inactiva'}
                    </span>
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => row.id && handleOpenEdit(row.id)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>

        {modalMode === 'create' && (
            <SeccionModal title="Nueva Sección" onClose={handleCloseModal} onSave={handleSave} />
        )}

        {modalMode === 'edit' && editingSeccion && (
            <SeccionModal
                title="Editar Sección"
                initialData={editingSeccion}
                onClose={handleCloseModal}
                onSave={handleSave}
            />
        )}
      </section>
  );
}