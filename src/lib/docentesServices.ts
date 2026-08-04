const API_URL = "https://darkgray-bee-113622.hostingersite.com/api/docentes";

export interface DocenteResumen {
    id: number;
    nombre_completo: string;
}

export const obtenerDocentesResumen = async (): Promise<DocenteResumen[]> => {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
        throw new Error("Error al obtener los docentes");
    }

    return await respuesta.json();
};