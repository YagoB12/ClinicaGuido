using ProyectoAnalisisClinica.Models.Dtos.Appointments;
using ProyectoAnalisisClinica.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ProyectoAnalisisClinica.Utils.Validators
{
    public static class AppointmentValidator
    {
        // Método principal de validación
        public static async Task<string?> ValidateAsync(
            AppointmentCreateDto dto,
            ProyClinicaGuidoDbContext db,
            bool isUpdate = false,
            int? currentId = null)
        {
            // Campos requeridos
            if (dto.MedicalPatientId <= 0)
                return "Debe seleccionar un paciente.";

            if (dto.DateAppointment == default)
                return "La fecha de la cita es obligatoria.";

            if (dto.HourAppointment == default)
                return "La hora de la cita es obligatoria.";

            if (string.IsNullOrWhiteSpace(dto.Priority))
                return "Debe seleccionar una prioridad.";

            if (string.IsNullOrWhiteSpace(dto.Status))
                return "Debe seleccionar un estado.";

            // Validar fecha no pasada con DateOnly
            var todayDateOnly = DateOnly.FromDateTime(DateTime.Now);
            Console.WriteLine($"🟡 DateAppointment (dto): {dto.DateAppointment}");
            Console.WriteLine($"🟢 Hoy (servidor, DateOnly): {todayDateOnly}");

            if (dto.DateAppointment < todayDateOnly)
                return "La fecha de la cita no puede ser anterior a hoy.";

            // Validar hora no pasada (si la cita es hoy)
            if (dto.DateAppointment == todayDateOnly)
            {
                var now = TimeOnly.FromDateTime(DateTime.Now);
                var nowTrimmed = new TimeOnly(now.Hour, now.Minute);

                if (dto.HourAppointment <= nowTrimmed)
                    return "La hora de la cita debe ser posterior a la hora actual.";
            }


            // Validar texto de la razón
            if (!string.IsNullOrWhiteSpace(dto.ReasonAppointment))
            {
                var text = dto.ReasonAppointment.Trim();

                // Longitud máxima
                if (text.Length > 200)
                    return "La razón de la cita no puede superar los 200 caracteres.";

                // Evitar emojis o caracteres fuera de rango Unicode común
                if (ContainsEmoji(text))
                    return "La razón de la cita no puede contener emojis o símbolos especiales.";

                // Validar solo letras, números, signos básicos y espacios
                if (!Regex.IsMatch(text, @"^[a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ\s.,;:!?()-]*$"))
                    return "La razón de la cita solo puede contener letras, números y signos básicos.";
            }

            // Validar solapamiento (mínimo 30 minutos entre citas)
            var sameDayAppointments = await db.Appointment
                .Where(a => a.DateAppointment == dto.DateAppointment && a.Id != (currentId ?? 0))
                .ToListAsync();

            var overlap = sameDayAppointments.Any(a =>
            {
                var diffMinutes = Math.Abs(
                    a.HourAppointment.ToTimeSpan().TotalMinutes - dto.HourAppointment.ToTimeSpan().TotalMinutes
                );
                return diffMinutes < 30;
            });

            if (overlap)
                return "Ya existe una cita en ese horario o dentro de 30 minutos de diferencia.";

            // Validar horario laboral
            if (dto.HourAppointment < new TimeOnly(7, 0) || dto.HourAppointment > new TimeOnly(18, 0))
                return "La cita debe programarse entre las 07:00 y las 18:00 horas.";

            return null; // Todo correcto
        }

        // Detección de emojis / caracteres especiales
        private static bool ContainsEmoji(string input)
        {
            foreach (char c in input)
            {
                if (char.IsSurrogate(c) || char.GetUnicodeCategory(c) == System.Globalization.UnicodeCategory.OtherSymbol)
                    return true;
            }
            return false;
        }
    }
}
