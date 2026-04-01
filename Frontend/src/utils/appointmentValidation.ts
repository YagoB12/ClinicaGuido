import type { AppointmentBrief } from "../types/appointment";

const containsEmoji = (text: string): boolean => {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}|\u{2600}-\u{27BF}|\u{FE0F}|\u{1F600}-\u{1F64F}|\u{1F680}-\u{1F6FF}]/u;
  return emojiRegex.test(text);
};

// Parsear "YYYY-MM-DD" a fecha LOCAL (00:00) sin UTC
const toLocalDateAtMidnight = (yyyyMmDd: string): Date => {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const validateAppointmentForm = (form: AppointmentBrief): string | null => {
  //  Campos requeridos
  if (
    !form.dateAppointment ||
    !form.hourAppointment ||
    !form.status ||
    !form.priority ||
    !form.medicalPatientId
  ) {
    return "Todos los campos marcados con * son obligatorios.";
  }

  // Fechas locales (00:00)
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDateLocal = toLocalDateAtMidnight(form.dateAppointment);

  //  Fecha no pasada
  if (selectedDateLocal < todayLocal) {
    return "La fecha de la cita no puede ser anterior a hoy.";
  }

  //  Hora no pasada (si la cita es hoy)
  const [hhStr, mmStr] = form.hourAppointment.split(":");
  const selH = Number(hhStr ?? "0");
  const selM = Number(mmStr ?? "0");
  if (Number.isNaN(selH) || Number.isNaN(selM)) {
    return "La hora de la cita no es válida.";
  }

  if (
    selectedDateLocal.getFullYear() === todayLocal.getFullYear() &&
    selectedDateLocal.getMonth() === todayLocal.getMonth() &&
    selectedDateLocal.getDate() === todayLocal.getDate()
  ) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const selMinutes = selH * 60 + selM;

    if (selMinutes <= nowMinutes) {
      return "La hora de la cita debe ser posterior a la hora actual.";
    }
  }

  //  Horario laboral
  if (selH < 7 || selH > 18 || (selH === 18 && selM > 0)) {
    return "La cita debe programarse entre las 07:00 y las 18:00 horas.";
  }

  // Texto del motivo
  if (form.reasonAppointment && form.reasonAppointment.trim() !== "") {
    const text = form.reasonAppointment.trim();

    if (text.length > 200) {
      return "La razón de la cita no puede superar los 200 caracteres.";
    }
    if (containsEmoji(text)) {
      return "La razón de la cita no puede contener emojis o símbolos especiales.";
    }

    const validTextRegex = /^[a-zA-ZÀ-ÿÁÉÍÓÚáéíóúÜüÑñ0-9\s.,;:!?()'"-]*$/;
    if (!validTextRegex.test(text)) {
      return "La razón de la cita solo puede contener letras, números y signos básicos.";
    }
  }

  return null;
};
