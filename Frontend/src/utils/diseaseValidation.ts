import type { CreateDisease } from "../types/disease";

// Detectar emojis o símbolos fuera del rango normal Unicode
const containsEmoji = (text: string): boolean => {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}|\u{2600}-\u{27BF}|\u{FE0F}|\u{1F600}-\u{1F64F}|\u{1F680}-\u{1F6FF}]/u;
  return emojiRegex.test(text);
};

export const validateDiseaseForm = (form: CreateDisease): string | null => {
  //  Campos requeridos
  if (!form.name || !form.typeDisease || !form.levelSeverity) {
    return "Los campos Nombre, Tipo y Nivel de Severidad son obligatorios.";
  }

  // Nombre
  const name = form.name.trim();
  if (name.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(name))
    return "El nombre solo puede contener letras y espacios.";
  if (containsEmoji(name))
    return "El nombre no puede contener emojis o símbolos especiales.";

  // Tipo
  const type = form.typeDisease.trim();
  if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(type))
    return "El tipo solo puede contener letras y espacios.";
  if (containsEmoji(type))
    return "El tipo no puede contener emojis o símbolos especiales.";

  //  Descripción
  if (form.description && form.description.trim() !== "") {
    const desc = form.description.trim();
    if (desc.length > 300)
      return "La descripción no puede superar los 300 caracteres.";
    if (containsEmoji(desc))
      return "La descripción no puede contener emojis o símbolos especiales.";
  }

  // Nivel de severidad
  const validSeverities = ["Leve", "Moderada", "Grave"];
  if (!validSeverities.includes(form.levelSeverity))
    return "Debe seleccionar un nivel de severidad válido.";

  //  Síntomas
  if (form.symptoms && form.symptoms.trim() !== "") {
    const s = form.symptoms.trim();
    if (s.length > 300)
      return "Los síntomas no pueden superar los 300 caracteres.";
    if (containsEmoji(s))
      return "Los síntomas no pueden contener emojis o símbolos especiales.";
  }

  // Causas
  if (form.causes && form.causes.trim() !== "") {
    const c = form.causes.trim();
    if (c.length > 300)
      return "Las causas no pueden superar los 300 caracteres.";
    if (containsEmoji(c))
      return "Las causas no pueden contener emojis o símbolos especiales.";
  }

  // Campo booleano (no obligatorio, pero por seguridad)
  if (typeof form.isContagious !== "boolean")
    return "El campo 'Es contagiosa' debe ser verdadero o falso.";

  return null; //  Todo correcto
};
