using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Consultations;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;
using System.Globalization;
using System.Linq;

namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // autenticación requerida para todo
    public class ConsultationsController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _db;
        public ConsultationsController(ProyClinicaGuidoDbContext db) => _db = db;

        // =========================== Utilidades de validación ===========================
        private static bool ContainsEmojiOrSurrogates(string? s)
        {
            if (string.IsNullOrEmpty(s)) return false;
            // Muchos emojis/pictogramas usan pares suplentes UTF-16
            return s.Any(char.IsSurrogate);
        }

        private static void ValidateText(
            List<string> errors,
            string field,
            string? value,
            bool required,
            int maxLen = 4000)
        {
            var v = value?.Trim();

            if (required && string.IsNullOrWhiteSpace(v))
            {
                errors.Add($"{field} es requerido.");
                return;
            }

            if (!string.IsNullOrEmpty(v))
            {
                if (v.Length > maxLen)
                    errors.Add($"{field} excede el máximo de {maxLen} caracteres.");

                if (ContainsEmojiOrSurrogates(v))
                    errors.Add($"{field} contiene caracteres no permitidos.");
            }
        }

        private static void ValidateIntRange(List<string> errors, string name, int? value, int min, int max)
        {
            if (value is null) return;
            if (value < min || value > max)
                errors.Add($"{name} fuera de rango ({min}–{max}).");
        }

        private static void ValidateDoubleRange(List<string> errors, string name, double? value, double min, double max)
        {
            if (value is null) return;
            if (double.IsNaN(value.Value) || double.IsInfinity(value.Value))
            {
                errors.Add($"{name} no puede ser NaN/Infinity.");
                return;
            }
            if (value < min || value > max)
                errors.Add($"{name} fuera de rango ({min:0.##}–{max:0.##}).");
        }

        private BadRequestObjectResult ModelStateToBadRequest()
        {
            var details = ModelState
                .Where(kvp => kvp.Value?.Errors?.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            return BadRequest(new
            {
                error = "Errores de validación.",
                details
            });
        }
        // ===============================================================================

        // GET: api/consultations?appointmentId=1
        [HttpGet]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetAll([FromQuery] int? appointmentId, CancellationToken ct)
        {
            var q = _db.Consultation.AsNoTracking().AsQueryable();

            if (appointmentId.HasValue)
                q = q.Where(x => x.AppointmentId == appointmentId);

            var consultations = await q
                .OrderByDescending(x => x.Id)
                .ToListAsync(ct);

            return Ok(consultations);
        }

        // GET: api/consultations/5
        [HttpGet("{id:int}")]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var consultation = await _db.Consultation
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (consultation is null) return NotFound();
            return Ok(consultation);
        }

        // POST: api/consultations
        [HttpPost]
        [Authorize(Policy = Perms.Consultations_Update_Mine)]
        public async Task<IActionResult> Create([FromBody] ConsultationCreateDto dto, CancellationToken ct)
        {
            // Binding inválido (p. ej. decimales en Temperature:int?) ⇒ 400 detallado
            if (!ModelState.IsValid) return ModelStateToBadRequest();
            if (dto is null) return BadRequest(new { error = "Solicitud inválida." });

            var errors = new List<string>();

            // Texto
            ValidateText(errors, "ReasonConsultation", dto.ReasonConsultation, required: true, maxLen: 2000);
            ValidateText(errors, "Diagnostic", dto.Diagnostic, required: false, maxLen: 4000);
            ValidateText(errors, "Notes", dto.Notes, required: false, maxLen: 4000);
            ValidateText(errors, "TreatmentPlan", dto.TreatmentPlan, required: false, maxLen: 4000);

            // Reglas numéricas según el DTO
            ValidateIntRange(errors, "Temperatura (°C)", dto.Temperature, 30, 45);
            ValidateDoubleRange(errors, "Presión arterial (mmHg)", dto.BloodPressure, 40, 300);
            ValidateDoubleRange(errors, "Pulso (bpm)", dto.HeartRate, 20, 250);
            ValidateDoubleRange(errors, "Peso (kg)", dto.Weight, 0, 500);
            ValidateDoubleRange(errors, "Altura (m)", dto.Height, 0, 3.0);

            if (dto.AppointmentId <= 0)
                errors.Add("Debe seleccionar una cita válida.");

            if (errors.Count > 0)
                return BadRequest(new { error = "Errores de validación.", details = errors });

            // Reglas de negocio existentes
            var appt = await _db.Appointment.FirstOrDefaultAsync(a => a.Id == dto.AppointmentId, ct);
            if (appt is null)
                return BadRequest(new { error = $"La cita {dto.AppointmentId} no existe." });

            // 1 cita → 1 consulta
            var alreadyHas = await _db.Consultation
                .AnyAsync(c => c.AppointmentId == dto.AppointmentId, ct);

            if (alreadyHas)
                return Conflict(new { error = $"La cita #{dto.AppointmentId} ya tiene una consulta registrada." });

            var estado = (appt.Status ?? "").Trim().ToLowerInvariant();
            if (estado is "terminada" or "completada" or "cancelada")
                return BadRequest(new { error = $"La cita #{dto.AppointmentId} no está disponible para consulta (estado: {appt.Status})." });

            var entity = new Consultation
            {
                AppointmentId = dto.AppointmentId,
                ReasonConsultation = dto.ReasonConsultation.Trim(),
                Diagnostic = string.IsNullOrWhiteSpace(dto.Diagnostic) ? null : dto.Diagnostic.Trim(),
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                TreatmentPlan = string.IsNullOrWhiteSpace(dto.TreatmentPlan) ? null : dto.TreatmentPlan.Trim(),
                Temperature = dto.Temperature,
                BloodPressure = dto.BloodPressure,
                HeartRate = dto.HeartRate,
                Weight = dto.Weight,
                Height = dto.Height
            };

            _db.Consultation.Add(entity);
            appt.Status = "Atendida";

            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                var existsNow = await _db.Consultation.AnyAsync(c => c.AppointmentId == dto.AppointmentId, ct);
                if (existsNow)
                    return Conflict(new { error = $"La cita #{dto.AppointmentId} ya tiene una consulta registrada." });
                throw;
            }

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        // PUT: api/consultations/5
        [HttpPut("{id:int}")]
        [Authorize(Policy = Perms.Consultations_Update_Mine)]
        public async Task<IActionResult> Update(int id, [FromBody] ConsultationUpdateDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ModelStateToBadRequest();

            var entity = await _db.Consultation.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            var errors = new List<string>();

            // Texto
            ValidateText(errors, "ReasonConsultation", dto.ReasonConsultation, required: true, maxLen: 2000);
            ValidateText(errors, "Diagnostic", dto.Diagnostic, required: false, maxLen: 4000);
            ValidateText(errors, "Notes", dto.Notes, required: false, maxLen: 4000);
            ValidateText(errors, "TreatmentPlan", dto.TreatmentPlan, required: false, maxLen: 4000);

            // Reglas numéricas según el DTO
            ValidateIntRange(errors, "Temperatura (°C)", dto.Temperature, 30, 45);
            ValidateDoubleRange(errors, "Presión arterial (mmHg)", dto.BloodPressure, 40, 300);
            ValidateDoubleRange(errors, "Pulso (bpm)", dto.HeartRate, 20, 250);
            ValidateDoubleRange(errors, "Peso (kg)", dto.Weight, 0, 500);
            ValidateDoubleRange(errors, "Altura (m)", dto.Height, 0, 3.0);

            if (errors.Count > 0)
                return BadRequest(new { error = "Errores de validación.", details = errors });

            entity.ReasonConsultation = dto.ReasonConsultation.Trim();
            entity.Diagnostic = string.IsNullOrWhiteSpace(dto.Diagnostic) ? null : dto.Diagnostic.Trim();
            entity.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
            entity.TreatmentPlan = string.IsNullOrWhiteSpace(dto.TreatmentPlan) ? null : dto.TreatmentPlan.Trim();
            entity.Temperature = dto.Temperature;
            entity.BloodPressure = dto.BloodPressure;
            entity.HeartRate = dto.HeartRate;
            entity.Weight = dto.Weight;
            entity.Height = dto.Height;

            await _db.SaveChangesAsync(ct);
            return Ok(entity);
        }

        // DELETE: api/consultations/5
        [HttpDelete("{id:int}")]
        [Authorize(Policy = Perms.Consultations_Update_Mine)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Consultation.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            var appt = await _db.Appointment.FirstOrDefaultAsync(a => a.Id == entity.AppointmentId, ct);

            _db.Consultation.Remove(entity);

            if (appt is not null)
                appt.Status = "Programada";

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
        // GET: api/consultations/eligible-for-prescription?search=juan&page=1&pageSize=10
        [HttpGet("eligible-for-prescription")]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetEligibleForPrescription(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 50) pageSize = 10;

            // Base: Consultas con cita Terminada y SIN receta
            var q = _db.Consultation
                .AsNoTracking()
                .Include(c => c.Appointment)!.ThenInclude(a => a.MedicalPatient)
                .Include(c => c.MedicalPrescription)
                .Where(c =>
                    c.Appointment != null &&
                    (c.Appointment.Status == "Terminada" || c.Appointment.Status == "Atendida") &&
                    c.MedicalPrescription == null)
                .AsQueryable();

            // BÚSQUEDA flexible
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();

                // 1) Nombre / Identificación (case-insensitive)
                var sLower = s.ToLower();
                q = q.Where(c =>
                    (c.Appointment!.MedicalPatient!.Name.ToLower().Contains(sLower)) ||
                    (c.Appointment!.MedicalPatient!.Identification.ToLower().Contains(sLower)));

                // 2) Fecha (DateOnly) si viene en formato reconocible
                if (DateOnly.TryParseExact(
                        s,
                        new[] { "yyyy-MM-dd", "dd/MM/yyyy" },
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out var dateFilter))
                {
                    q = q.Where(c => c.Appointment!.DateAppointment == dateFilter);
                }

                // 3) Hora (TimeOnly) tipo "HH:mm"
                if (TimeOnly.TryParseExact(s, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var timeFilter))
                {
                    q = q.Where(c => c.Appointment!.HourAppointment == timeFilter);
                }
            }

            var total = await q.CountAsync(ct);

            var items = await q
                .OrderByDescending(c => c.Appointment!.DateAppointment)
                .ThenByDescending(c => c.Appointment!.HourAppointment)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new ConsultationBriefDto
                {
                    Id = c.Id,
                    PatientName = c.Appointment!.MedicalPatient!.Name,
                    PatientIdentification = c.Appointment!.MedicalPatient!.Identification,
                    AppointmentDate = c.Appointment!.DateAppointment.ToString("yyyy-MM-dd"),
                    AppointmentTime = c.Appointment!.HourAppointment.ToString("HH:mm"),
                    OfficeNumber = c.Appointment!.OfficeNumber ?? "—",
                    ReasonConsultation = c.ReasonConsultation
                })
                .ToListAsync(ct);

            return Ok(new { items, total });
        }

    }
}
