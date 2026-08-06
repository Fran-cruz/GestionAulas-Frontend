import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../lib/api';
import {
  Docente,
  codigoDocente,
  crearDocente,
  eliminarDocente,
  modificarDocente,
  obtenerDocentes,
} from '../lib/docentes';

type EstadoDocente = 'ACTIVO' | 'LICENCIA' | 'INACTIVO';

const formVacio: Docente = {
  nombre_completo: '',
  correo_institucional: '',
  telefono: '',
  departamento: '',
  especialidad: '',
  estado: 'ACTIVO',
};

function formatEstado(estado: string) {
  const lower = estado.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const docentesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return docentes;

    return docentes.filter((docente) => {
      const campos = [
        docente.nombre_completo,
        docente.correo_institucional,
        docente.departamento,
        docente.especialidad,
        docente.id ? codigoDocente(docente.id) : '',
      ];
      return campos.some((campo) => campo?.toLowerCase().includes(termino));
    });
  }, [docentes, busqueda]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Docente>(formVacio);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    if (!mensajeExito) return;
    const timer = setTimeout(() => setMensajeExito(''), 4000);
    return () => clearTimeout(timer);
  }, [mensajeExito]);

  async function cargarDocentes() {
    setLoading(true);
    setLoadError('');
    try {
      const datos = await obtenerDocentes();
      setDocentes(datos);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los docentes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDocentes();
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setForm(formVacio);
    setFormError('');
    setModalAbierto(true);
  }

  function abrirEditar(docente: Docente) {
    if (!docente.id) return;
    setEditandoId(docente.id);
    setForm({
      nombre_completo: docente.nombre_completo,
      correo_institucional: docente.correo_institucional,
      telefono: docente.telefono ?? '',
      departamento: docente.departamento,
      especialidad: docente.especialidad,
      estado: (docente.estado.toUpperCase() as EstadoDocente) ?? 'ACTIVO',
    });
    setFormError('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
  }

  function actualizarCampo<K extends keyof Docente>(campo: K, valor: Docente[K]) {
    setForm((prev: Docente) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!form.nombre_completo.trim()) {
      setFormError('El nombre del docente es obligatorio.');
      return;
    }
    if (!form.correo_institucional.trim()) {
      setFormError('El correo institucional es obligatorio.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_institucional.trim())) {
      setFormError('El correo institucional no es válido.');
      return;
    }
    if (!form.departamento.trim()) {
      setFormError('El departamento es obligatorio.');
      return;
    }
    if (!form.telefono.trim()) {
      setFormError('El teléfono es obligatorio.');
      return;
    }
    if (!form.especialidad.trim()) {
      setFormError('La especialidad es obligatoria.');
      return;
    }

    const payload: Docente = {
      ...form,
      nombre_completo: form.nombre_completo.trim(),
      correo_institucional: form.correo_institucional.trim(),
      telefono: form.telefono.trim(),
      departamento: form.departamento.trim(),
      especialidad: form.especialidad.trim(),
    };

    setGuardando(true);
    try {
      if (editandoId) {
        await modificarDocente(editandoId, payload);
        setMensajeExito(`Docente "${payload.nombre_completo}" actualizado correctamente.`);
      } else {
        await crearDocente(payload);
        setMensajeExito(`Docente "${payload.nombre_completo}" creado correctamente.`);
      }
      setModalAbierto(false);
      await cargarDocentes();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar el docente.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(docente: Docente) {
    if (!docente.id) return;
    const confirmado = window.confirm(`¿Eliminar a ${docente.nombre_completo}?`);
    if (!confirmado) return;

    try {
      await eliminarDocente(docente.id);
      setMensajeExito(`Docente "${docente.nombre_completo}" eliminado correctamente.`);
      await cargarDocentes();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el docente.');
    }
  }

  return (
      <section className="catalog-page">
        <div className="toolbar">
          <div className="catalog-summary">{docentesFiltrados.length} Docentes Registrados</div>
          <div className="search-box narrow">
            🔎
            <input
                type="text"
                placeholder="Buscar por nombre, correo, depto..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                style={{ border: 0, background: 'transparent', outline: 'none', width: '100%', font: 'inherit', color: 'inherit', marginLeft: 8 }}
            />
          </div>
          <button className="primary-btn" onClick={abrirCrear}>
            + Nuevo Docente
          </button>
        </div>

        {loadError ? <div className="feedback error">{loadError}</div> : null}
        {mensajeExito ? <div className="feedback success">{mensajeExito}</div> : null}

        <div className="table-card full">
          <table>
            <thead>
            <tr>
              <th>Código</th>
              <th>Nombre Completo</th>
              <th>Departamento</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                  <td colSpan={8}>Cargando docentes...</td>
                </tr>
            ) : docentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {busqueda ? 'Ningún docente coincide con la búsqueda.' : 'No hay docentes registrados todavía.'}
                  </td>
                </tr>
            ) : (
                docentesFiltrados.map((docente) => (
                    <tr key={docente.id}>
                      <td>{docente.id ? codigoDocente(docente.id) : '—'}</td>
                      <td>{docente.nombre_completo}</td>
                      <td>{docente.departamento || '—'}</td>
                      <td>{docente.especialidad || '—'}</td>
                      <td>
                    <span className={`tag state ${docente.estado.toLowerCase()}`}>
                      {formatEstado(docente.estado)}
                    </span>
                      </td>
                      <td>{docente.correo_institucional}</td>
                      <td>{docente.telefono || '—'}</td>
                      <td className="row-actions">
                        <button className="edit-btn" onClick={() => abrirEditar(docente)}>
                          Editar
                        </button>
                        <button className="delete-btn" onClick={() => handleEliminar(docente)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                ))
            )}
            </tbody>
          </table>
        </div>

        {modalAbierto ? (
            <div className="modal-overlay" onClick={cerrarModal}>
              <div className="modal-box" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editandoId ? 'Editar Docente' : 'Nuevo Docente'}</h3>
                  <button className="modal-close" onClick={cerrarModal} disabled={guardando} type="button">
                    ×
                  </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit} noValidate>
                  <label>
                    Nombre completo
                    <input
                        type="text"
                        placeholder="Ej. Dr. Juan Ramírez"
                        value={form.nombre_completo}
                        onChange={(event) => actualizarCampo('nombre_completo', event.target.value)}
                    />
                  </label>

                  <label>
                    Correo institucional
                    <input
                        type="email"
                        placeholder="Ej. juan.ramirez@unicah.edu"
                        value={form.correo_institucional}
                        onChange={(event) => actualizarCampo('correo_institucional', event.target.value)}
                    />
                  </label>

                  <label>
                    Teléfono
                    <input
                        type="text"
                        placeholder="Ej. 9988-7766"
                        value={form.telefono}
                        onChange={(event) => actualizarCampo('telefono', event.target.value)}
                    />
                  </label>

                  <label>
                    Departamento
                    <input
                        type="text"
                        placeholder="Ej. Ingeniería"
                        value={form.departamento}
                        onChange={(event) => actualizarCampo('departamento', event.target.value)}
                    />
                  </label>

                  <label>
                    Especialidad
                    <input
                        type="text"
                        placeholder="Ej. Programación"
                        value={form.especialidad}
                        onChange={(event) => actualizarCampo('especialidad', event.target.value)}
                    />
                  </label>

                  <label>
                    Estado
                    <select
                        value={form.estado}
                        onChange={(event) => actualizarCampo('estado', event.target.value)}
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="LICENCIA">Licencia</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </label>

                  {formError ? <p className="modal-error">{formError}</p> : null}

                  <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={cerrarModal} disabled={guardando}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary-btn" disabled={guardando}>
                      {guardando ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Crear Docente'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        ) : null}
      </section>
  );
}