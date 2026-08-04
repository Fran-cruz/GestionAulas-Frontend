import { apiRequest } from '../lib/api';

export interface Docente {
    id?: number;
    nombre_completo: string;
    correo_institucional: string;
    telefono: string;
    departamento: string;
    especialidad: string;
    estado: string;
}

const RUTA = '/docentes';

export const obtenerDocentes = (): Promise<Docente[]> => apiRequest<Docente[]>(RUTA);

export const crearDocente = (
    datos: Docente,
): Promise<{ message: string; docente: Docente }> =>
    apiRequest(RUTA, {
        method: 'POST',
        body: JSON.stringify(datos),
    });

export const modificarDocente = (
    id: number,
    datos: Docente,
): Promise<{ message: string; docente: Docente }> =>
    apiRequest(`${RUTA}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
    });

export const eliminarDocente = (id: number): Promise<{ message: string }> =>
    apiRequest(`${RUTA}/${id}`, {
        method: 'DELETE',
    });

/** DOC-001, DOC-002... generado desde el id real (el backend no tiene columna "código"). */
export function codigoDocente(id: number) {
    return `DOC-${String(id).padStart(3, '0')}`;
}