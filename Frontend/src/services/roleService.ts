const API_URL = "/api/rol"; // Ajustá el puerto si tu backend usa otro

export const getRoles = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener roles");
    return await response.json();
  } catch (error) {
    console.error("Error en getRoles:", error);
    return [];
  }
};
