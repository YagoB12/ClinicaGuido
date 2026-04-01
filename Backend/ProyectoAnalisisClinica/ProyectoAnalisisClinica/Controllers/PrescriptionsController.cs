using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Prescriptions;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;

namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrescriptionsController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _db;
        public PrescriptionsController(ProyClinicaGuidoDbContext db) => _db = db;

        // =========================
        // Helpers de validación
        // =========================
        private static readonly Regex _collapseWs = new(@"\s+", RegexOptions.Compiled);

        private static string NormalizeText(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            var t = s.Trim();
            t = _collapseWs.Replace(t, " ");
            return t;
        }

        private static bool ContainsEmojiOrControl(string s)
        {
            // Bloqueo: emojis comunes + símbolos varios + caracteres de control
            foreach (var rune in s.EnumerateRunes())
            {
                var u = rune.Value;

                // Control chars
                if (char.IsControl((char)u)) return true;

                // Rango emojis/ símbolos frecuentes
                if (
                    (u >= 0x1F300 && u <= 0x1FAFF) || // Emojis
                    (u >= 0x1F1E6 && u <= 0x1F1FF) || // Flags
                    (u >= 0x2600 && u <= 0x27BF)   || // Misc symbols
                    (u >= 0xFE00 && u <= 0xFE0F)   || // Variation selectors
                    (u >= 0x1F900 && u <= 0x1F9FF)    // Supplemental Symbols
                )
                    return true;
            }
            return false;
        }

        private static bool IsValidPlain(string? s, int maxLen = 500)
        {
            if (string.IsNullOrWhiteSpace(s)) return true;
            var t = NormalizeText(s);
            if (t.Length > maxLen) return false;
            return !ContainsEmojiOrControl(t);
        }

        private BadRequestObjectResult BadRequestModelBindingIfAny()
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(kv => kv.Value?.Errors?.Count > 0)
                    .Select(kv => new
                    {
                        field = kv.Key,
                        errors = kv.Value!.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage)
                            ? "Formato inválido (¿tipo incorrecto? ej. enviar texto donde va número)."
                            : e.ErrorMessage)
                    });
                return BadRequest(new { errors });
            }
            // fallback (no debería llegar)
            return BadRequest(ModelState);
        }

        private static bool IsDateNotInFuture(DateOnly d)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return d <= today;
        }

        // =========================
        // GET: /api/Prescriptions/5
        // =========================
        [HttpGet("{id:int}")]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var pres = await _db.MedicalPrescription
                .AsNoTracking()
                .Include(p => p.Items)!.ThenInclude(i => i.Medicine)
                .Include(p => p.Consultation)
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (pres is null) return NotFound();
            return Ok(pres);
        }

        // =========================
        // GET: /api/Prescriptions/by-consultation/10
        // =========================
        [HttpGet("by-consultation/{consultationId:int}")]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetByConsultation(int consultationId, CancellationToken ct)
        {
            var pres = await _db.MedicalPrescription
                .AsNoTracking()
                .Include(p => p.Items)!.ThenInclude(i => i.Medicine)
                .Include(p => p.Consultation)
                .FirstOrDefaultAsync(p => p.ConsultationId == consultationId, ct);

            if (pres is null) return NotFound();
            return Ok(pres);
        }

        // =========================
        // POST: /api/Prescriptions
        // =========================
        [HttpPost]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto body, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequestModelBindingIfAny();

            // Consulta válida
            if (body.ConsultationId <= 0) return BadRequest(new { error = "Consulta inválida." });

            var consultation = await _db.Consultation
                .Include(c => c.Appointment)
                .FirstOrDefaultAsync(c => c.Id == body.ConsultationId, ct);

            if (consultation is null)
                return BadRequest(new { error = $"La consulta {body.ConsultationId} no existe." });

            // Ya existe una receta para esta consulta
            var exists = await _db.MedicalPrescription
                .AnyAsync(p => p.ConsultationId == body.ConsultationId, ct);
            if (exists) return Conflict(new { error = $"La consulta #{body.ConsultationId} ya tiene una receta." });

            // Validaciones texto (sin emojis/controls, límites)
            if (!IsValidPlain(body.Observation, 1000))
                return BadRequest(new { error = "Observación inválida (sin emojis/controles y máx 1000 caracteres)." });

            if (!IsValidPlain(body.AdditionalInstructions, 1000))
                return BadRequest(new { error = "Instrucciones adicionales inválidas (sin emojis/controles y máx 1000 caracteres)." });

            // Fecha de emisión automática: hoy, pero nunca antes de la fecha de la cita.
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var issueDate = today;

            var apptDate = consultation.Appointment?.DateAppointment;
            if (apptDate.HasValue && issueDate < apptDate.Value)
            {
                // Si la cita es a futuro, la receta se emite en la fecha de la cita.
                issueDate = apptDate.Value;
            }

            var entity = new MedicalPrescription
            {
                ConsultationId = body.ConsultationId,
                IssueDate = issueDate,
                Observation = string.IsNullOrWhiteSpace(body.Observation) ? null : NormalizeText(body.Observation),
                AdditionalInstructions = string.IsNullOrWhiteSpace(body.AdditionalInstructions) ? null : NormalizeText(body.AdditionalInstructions),
                Items = new List<PrescriptionMedicine>()
            };

            // Validación de items
            if (body.Items is not null && body.Items.Count > 0)
            {
                var seen = new HashSet<int>();
                foreach (var it in body.Items)
                {
                    if (!TryValidateModel(it)) return BadRequestModelBindingIfAny();

                    if (it.MedicineInventoryId <= 0)
                        return BadRequest(new { error = "MedicineInventoryId inválido." });

                    if (it.TreatmentDurationDays <= 0 || it.TreatmentDurationDays > 365)
                        return BadRequest(new { error = "La duración del tratamiento debe ser entre 1 y 365 días." });

                    if (it.QuantityTotal <= 0)
                        return BadRequest(new { error = "La cantidad debe ser mayor a 0." });

                    if (!IsValidPlain(it.DailyDose, 100))
                        return BadRequest(new { error = "DailyDose inválido (sin emojis/controles y máx 100 chars)." });

                    if (!IsValidPlain(it.Frequency, 100))
                        return BadRequest(new { error = "Frequency inválido (sin emojis/controles y máx 100 chars)." });

                    if (!IsValidPlain(it.ItemObservation, 500))
                        return BadRequest(new { error = "ItemObservation inválido (sin emojis/controles y máx 500 chars)." });

                    if (!seen.Add(it.MedicineInventoryId))
                        return BadRequest(new { error = $"El medicamento {it.MedicineInventoryId} está repetido en la receta." });

                    var med = await _db.MedicineInventory
                        .FirstOrDefaultAsync(m => m.Id == it.MedicineInventoryId, ct);

                    if (med is null)
                        return BadRequest(new { error = $"El medicamento {it.MedicineInventoryId} no existe." });

                    var stockDisponible = med.AvailableQuantity;
                    if (it.QuantityTotal > stockDisponible)
                        return BadRequest(new { error = $"Cantidad solicitada ({it.QuantityTotal}) supera el stock disponible ({stockDisponible})." });

                    entity.Items.Add(new PrescriptionMedicine
                    {
                        MedicineInventoryId = it.MedicineInventoryId,
                        DailyDose = NormalizeText(it.DailyDose),
                        Frequency = NormalizeText(it.Frequency),
                        TreatmentDurationDays = it.TreatmentDurationDays,
                        ItemObservation = string.IsNullOrWhiteSpace(it.ItemObservation) ? null : NormalizeText(it.ItemObservation),
                        QuantityTotal = it.QuantityTotal
                    });
                }
            }

            _db.MedicalPrescription.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }


        // =========================
        // PUT: /api/Prescriptions/5
        // =========================
        [HttpPut("{id:int}")]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePrescriptionDto body, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequestModelBindingIfAny();

            var entity = await _db.MedicalPrescription
                .Include(p => p.Consultation)
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (entity is null) return NotFound();

            if (!IsValidPlain(body.Observation, 1000))
                return BadRequest(new { error = "Observación inválida (sin emojis/controles y máx 1000 caracteres)." });

            if (!IsValidPlain(body.AdditionalInstructions, 1000))
                return BadRequest(new { error = "Instrucciones adicionales inválidas (sin emojis/controles y máx 1000 caracteres)." });

            entity.Observation = string.IsNullOrWhiteSpace(body.Observation) ? null : NormalizeText(body.Observation);
            entity.AdditionalInstructions = string.IsNullOrWhiteSpace(body.AdditionalInstructions) ? null : NormalizeText(body.AdditionalInstructions);

            // Cambiar estado SOLO en update
            if (!string.IsNullOrWhiteSpace(body.Status))
            {
                var allowed = new[] { "Emitida", "Revisada", "Entregada", "Anulada" }; // ajusta a tu flujo
                var s = NormalizeText(body.Status);
                if (!allowed.Contains(s, StringComparer.OrdinalIgnoreCase))
                    return BadRequest(new { error = $"Estado inválido. Permitidos: {string.Join(", ", allowed)}." });
                entity.Status = s;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(entity);
        }

        // =========================
        // POST: /api/Prescriptions/5/items
        // =========================
        [HttpPost("{id:int}/items")]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> AddItem(int id, [FromBody] UpsertPrescriptionItemDto body, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequestModelBindingIfAny();

            var pres = await _db.MedicalPrescription
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (pres is null) return NotFound();

            if (body.MedicineInventoryId <= 0)
                return BadRequest(new { error = "MedicineInventoryId inválido." });

            if (body.TreatmentDurationDays <= 0 || body.TreatmentDurationDays > 365)
                return BadRequest(new { error = "La duración del tratamiento debe ser entre 1 y 365 días." });

            if (body.QuantityTotal <= 0)
                return BadRequest(new { error = "La cantidad debe ser mayor a 0." });

            if (!IsValidPlain(body.DailyDose, 100))
                return BadRequest(new { error = "DailyDose inválido (sin emojis/controles y máx 100 chars)." });

            if (!IsValidPlain(body.Frequency, 100))
                return BadRequest(new { error = "Frequency inválido (sin emojis/controles y máx 100 chars)." });

            if (!IsValidPlain(body.ItemObservation, 500))
                return BadRequest(new { error = "ItemObservation inválido (sin emojis/controles y máx 500 chars)." });

            // Evitar duplicados
            if (pres.Items.Any(x => x.MedicineInventoryId == body.MedicineInventoryId))
                return BadRequest(new { error = $"El medicamento {body.MedicineInventoryId} ya está en la receta." });

            var med = await _db.MedicineInventory
                .FirstOrDefaultAsync(m => m.Id == body.MedicineInventoryId, ct);
            if (med is null)
                return BadRequest(new { error = $"El medicamento {body.MedicineInventoryId} no existe." });

            // ⚠️ Ajustá 'med.Stock' al nombre real
            var stockDisponible = med.AvailableQuantity;
            if (body.QuantityTotal > stockDisponible)
                return BadRequest(new { error = $"Cantidad solicitada ({body.QuantityTotal}) supera el stock disponible ({stockDisponible})." });

            var item = new PrescriptionMedicine
            {
                MedicalPrescriptionId = pres.Id,
                MedicineInventoryId = med.Id,
                DailyDose = NormalizeText(body.DailyDose),
                Frequency = NormalizeText(body.Frequency),
                TreatmentDurationDays = body.TreatmentDurationDays,
                ItemObservation = string.IsNullOrWhiteSpace(body.ItemObservation) ? null : NormalizeText(body.ItemObservation),
                QuantityTotal = body.QuantityTotal
            };

            _db.PrescriptionMedicine.Add(item);
            await _db.SaveChangesAsync(ct);
            return Ok(item);
        }

        // =========================
        // PUT: /api/Prescriptions/items/99
        // =========================
        [HttpPut("items/{itemId:int}")]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpsertPrescriptionItemDto body, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequestModelBindingIfAny();

            var item = await _db.PrescriptionMedicine
                .FirstOrDefaultAsync(i => i.Id == itemId, ct);
            if (item is null) return NotFound();

            if (body.MedicineInventoryId <= 0)
                return BadRequest(new { error = "MedicineInventoryId inválido." });

            if (body.TreatmentDurationDays <= 0 || body.TreatmentDurationDays > 365)
                return BadRequest(new { error = "La duración del tratamiento debe ser entre 1 y 365 días." });

            if (body.QuantityTotal <= 0)
                return BadRequest(new { error = "La cantidad debe ser mayor a 0." });

            if (!IsValidPlain(body.DailyDose, 100))
                return BadRequest(new { error = "DailyDose inválido (sin emojis/controles y máx 100 chars)." });

            if (!IsValidPlain(body.Frequency, 100))
                return BadRequest(new { error = "Frequency inválido (sin emojis/controles y máx 100 chars)." });

            if (!IsValidPlain(body.ItemObservation, 500))
                return BadRequest(new { error = "ItemObservation inválido (sin emojis/controles y máx 500 chars)." });

            var med = await _db.MedicineInventory
                .FirstOrDefaultAsync(m => m.Id == body.MedicineInventoryId, ct);
            if (med is null)
                return BadRequest(new { error = $"El medicamento {body.MedicineInventoryId} no existe." });

            
            var stockDisponible = med.AvailableQuantity;
            if (body.QuantityTotal > stockDisponible)
                return BadRequest(new { error = $"Cantidad solicitada ({body.QuantityTotal}) supera el stock disponible ({stockDisponible})." });

            item.MedicineInventoryId = body.MedicineInventoryId;
            item.DailyDose = NormalizeText(body.DailyDose);
            item.Frequency = NormalizeText(body.Frequency);
            item.TreatmentDurationDays = body.TreatmentDurationDays;
            item.ItemObservation = string.IsNullOrWhiteSpace(body.ItemObservation) ? null : NormalizeText(body.ItemObservation);
            item.QuantityTotal = body.QuantityTotal;

            await _db.SaveChangesAsync(ct);
            return Ok(item);
        }

        // =========================
        // DELETE: /api/Prescriptions/items/99
        // =========================
        [HttpDelete("items/{itemId:int}")]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> DeleteItem(int itemId, CancellationToken ct)
        {
            var item = await _db.PrescriptionMedicine
                .FirstOrDefaultAsync(i => i.Id == itemId, ct);
            if (item is null) return NotFound();

            _db.PrescriptionMedicine.Remove(item);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // =========================
        // DELETE: /api/Prescriptions/5
        // =========================
        [HttpDelete("{id:int}")]
        [Authorize(Policy = Perms.Prescriptions_Create)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var pres = await _db.MedicalPrescription
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (pres is null) return NotFound();

            _db.MedicalPrescription.Remove(pres);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // =========================
        // GET: /api/Prescriptions?q=...&from=...&to=...&page=1&pageSize=20
        // =========================
        [HttpGet]
        [Authorize(Policy = Perms.Consultations_View_Mine)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? q,
            [FromQuery] DateOnly? from,
            [FromQuery] DateOnly? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _db.MedicalPrescription
                .AsNoTracking()
                .Select(p => new PrescriptionListItemDto
                {
                    Id = p.Id,
                    IssueDate = p.IssueDate,
                    Status = p.Status,
                    PatientName = p.Consultation!.Appointment!.MedicalPatient!.Name,
                    PatientIdentification = p.Consultation!.Appointment!.MedicalPatient!.Identification
                });

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLowerInvariant();
                query = query.Where(x =>
                    x.PatientName.ToLower().Contains(term) ||
                    x.PatientIdentification.ToLower().Contains(term));
            }

            if (from.HasValue) query = query.Where(x => x.IssueDate >= from.Value);
            if (to.HasValue) query = query.Where(x => x.IssueDate <= to.Value);

            var total = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return Ok(new { total, items });
        }

        // =========================
        // GET: /api/Prescriptions/{id}/items
        // =========================
        [HttpGet("{id:int}/items")]
        public async Task<IActionResult> GetItems(int id, CancellationToken ct)
        {
            var items = await _db.PrescriptionMedicine
                .AsNoTracking()
                .Where(x => x.MedicalPrescriptionId == id)
                .Include(x => x.Medicine)
                .Select(x => new
                {
                    x.Id,
                    x.MedicalPrescriptionId,
                    x.MedicineInventoryId,
                    x.DailyDose,
                    x.Frequency,
                    x.TreatmentDurationDays,
                    x.ItemObservation,
                    x.QuantityTotal,
                    Medicine = x.Medicine == null ? null : new
                    {
                        x.Medicine.Id,
                        x.Medicine.NameMedicine,
                        x.Medicine.TypePresentation,
                        x.Medicine.Concentration
                    }
                })
                .ToListAsync(ct);

            return Ok(items);
        }
    }
}
