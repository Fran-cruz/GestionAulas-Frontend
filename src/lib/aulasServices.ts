const API_URL =
  "https://darkgray-bee-113622.hostingersite.com/api/aulas";

export interface Aula {
  id?: number;
  nombre: string;
  edificio: string;
  piso: string;
  tipo: string;
  capacidad_maxima: number;
  descripcion: string;
  estado: string;
}

export type AulaData = Omit<Aula, "id">;

export const obtenerAulas = async (): Promise<Aula[]> => {
  const respuesta = await fetch(API_URL);

  if (!respuesta.ok) {
    throw new Error("Error al obtener las aulas");
  }

  return await respuesta.json();
};

export const crearAula = async (
  datos: AulaData
): Promise<Aula> => {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    throw new Error(await respuesta.text());
  }

  return await respuesta.json();
};

export const modificarAula = async (
  id: number,
  datos: AulaData
): Promise<Aula> => {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    throw new Error(await respuesta.text());
  }

  return await respuesta.json();
};

export const eliminarAula = async (
  id: number
): Promise<void> => {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!respuesta.ok) {
    throw new Error(await respuesta.text());
  }
};
