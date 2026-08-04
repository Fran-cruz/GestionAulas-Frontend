const API_URL = "https://darkgray-bee-113622.hostingersite.com/api/secciones";

export interface Seccion {
    id?: number;
    materia: string;
    codigo_materia: string;
    id_docente: number | null;
    tipo_sesion: string;   // ← antes: tipo_sesion
    area_academica: string;
    duracion_sesion_horas: number;
    horas_semanales_totales: number;
    sesiones_por_semana: number;
    activa: boolean;
}

export const obtenerSecciones = async (): Promise<Seccion[]> => {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
        throw new Error("Error al obtener las secciones");
    }

    return await respuesta.json();
};

export const crearSeccion = async (datos: Seccion): Promise<Seccion> => {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(error);
    }

    return await respuesta.json();
};

export const modificarSeccion = async (
    id: number,
    datos: Seccion
): Promise<Seccion> => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(error);
    }

    return await respuesta.json();
};

export const eliminarSeccion = async (id: number): Promise<void> => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });

    if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(error);
    }
};