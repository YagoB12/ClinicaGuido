using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Medicines;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;
using System.Globalization;

namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MedicinesController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _db;

        public MedicinesController(ProyClinicaGuidoDbContext db) => _db = db;

        // ===== Utilidades internas =====
        private static bool ContainsEmojiOrControl(string? input)
        {
            if (string.IsNullOrEmpty(input)) return false;
            foreach (char ch in input)
            {
                int code = ch;
                if (
                    (code >= 0x1F300 && code <= 0x1FAFF) || // emojis
                    (code >= 0x1F1E6 && code <= 0x1F1FF) || // flags
                    (code >= 0x2600 && code <= 0x27BF) ||   // misc symbols
                    (code >= 0xFE00 && code <= 0xFE0F) ||   // variation selectors
                    (code >= 0x1F900 && code <= 0x1F9FF) || // supplemental emojis
                    (code <= 0x1F && code != 9 && code != 10 && code != 13) // control chars
                )
                    return true;
            }
            return false;
        }

        private static string CleanString(string? s, int max = 1000)
        {
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            var clean = s.Trim();
            clean = System.Text.RegularExpressions.Regex.Replace(clean, @"\s+", " ");
            return clean.Length > max ? clean.Substring(0, max) : clean;
        }

        // ===== GET ALL =====
        [HttpGet]
        [Authorize(Policy = Perms.Inventory_View)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? q,
            [FromQuery] bool? onlyAvailable,
            [FromQuery] bool? onlyNotExpired,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15,
            CancellationToken ct = default)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 50) pageSize = 15;

            var query = _db.MedicineInventory.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(m =>
                    m.NameMedicine.ToLower().Contains(term) ||
                    (m.Description != null && m.Description.ToLower().Contains(term)) ||
                    (m.TypePresentation != null && m.TypePresentation.ToLower().Contains(term)) ||
                    (m.Concentration != null && m.Concentration.ToString()!.ToLower().Contains(term)));
            }

            if (onlyAvailable == true)
                query = query.Where(m => m.AvailableQuantity > 0);

            if (onlyNotExpired == true)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                query = query.Where(m => m.ExpirationDate == null || m.ExpirationDate >= today);
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderBy(m => m.NameMedicine)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new MedicineBriefDto
                {
                    Id = m.Id,
                    NameMedicine = m.NameMedicine,
                    TypePresentation = m.TypePresentation,
                    Concentration = m.Concentration,
                    AvailableQuantity = m.AvailableQuantity,
                    ExpirationDate = m.ExpirationDate,
                    Description = m.Description
                })
                .ToListAsync(ct);

            return Ok(new { items, total });
        }

        // ===== GET BY ID =====
        [HttpGet("{id:int}")]
        [Authorize(Policy = Perms.Inventory_View)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var m = await _db.MedicineInventory
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (m is null) return NotFound();

            var dto = new MedicineDto
            {
                Id = m.Id,
                NameMedicine = m.NameMedicine,
                Description = m.Description,
                TypePresentation = m.TypePresentation,
                AvailableQuantity = m.AvailableQuantity,
                PreparationDate = m.PreparationDate,
                ExpirationDate = m.ExpirationDate,
                Concentration = m.Concentration
            };

            return Ok(dto);
        }

        // ===== CREATE =====
        [HttpPost]
        [Authorize(Policy = Perms.Inventory_Manage)]
        public async Task<IActionResult> Create([FromBody] MedicineCreateDto dto, CancellationToken ct)
        {
            // ===================== Errores de ModelState =====================
            if (!ModelState.IsValid)
            {
                var modelErrors = ModelState
                    .Where(e => e.Value is not null && e.Value.Errors.Count > 0)
                    .SelectMany(e => e.Value!.Errors.Select(err => $"{e.Key}: {err.ErrorMessage}"))
                    .ToList();

                // Devolvemos 400 con la lista de errores
                return BadRequest(new { errors = modelErrors });
            }

            // ===================== Validaciones personalizadas =====================
            var errors = new List<string>();

            // Validar caracteres no permitidos
            if (ContainsEmojiOrControl(dto.NameMedicine))
                errors.Add("El nombre contiene caracteres no válidos (emojis o símbolos).");
            if (ContainsEmojiOrControl(dto.Description))
                errors.Add("La descripción contiene caracteres no válidos.");
            if (ContainsEmojiOrControl(dto.TypePresentation))
                errors.Add("La presentación contiene caracteres no válidos.");

            // Validar fechas
            if (dto.ExpirationDate < dto.PreparationDate)
                errors.Add("La fecha de expiración no puede ser anterior a la fecha de preparación.");

            // Validar numéricos
            if (dto.AvailableQuantity < 0)
                errors.Add("La cantidad disponible no puede ser negativa.");
            if (dto.Concentration < 0)
                errors.Add("La concentración no puede ser negativa.");

            if (errors.Count > 0)
                return BadRequest(new { errors });

            // ===================== Crear entidad =====================
            var entity = new MedicineInventory
            {
                NameMedicine = CleanString(dto.NameMedicine),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : CleanString(dto.Description),
                TypePresentation = string.IsNullOrWhiteSpace(dto.TypePresentation) ? null : CleanString(dto.TypePresentation),
                AvailableQuantity = dto.AvailableQuantity,
                PreparationDate = dto.PreparationDate,
                ExpirationDate = dto.ExpirationDate,
                Concentration = dto.Concentration
            };

            _db.MedicineInventory.Add(entity);
            await _db.SaveChangesAsync(ct);

            var result = new MedicineDto
            {
                Id = entity.Id,
                NameMedicine = entity.NameMedicine,
                Description = entity.Description,
                TypePresentation = entity.TypePresentation,
                AvailableQuantity = entity.AvailableQuantity,
                PreparationDate = entity.PreparationDate,
                ExpirationDate = entity.ExpirationDate,
                Concentration = entity.Concentration
            };

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, result);
        }


        // ===== UPDATE =====
        [HttpPut("{id:int}")]
        [Authorize(Policy = Perms.Inventory_Manage)]
        public async Task<IActionResult> Update(int id, [FromBody] MedicineUpdateDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var entity = await _db.MedicineInventory.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            var errors = new List<string>();

            if (ContainsEmojiOrControl(dto.NameMedicine))
                errors.Add("El nombre contiene caracteres no válidos (emojis o símbolos).");
            if (ContainsEmojiOrControl(dto.Description))
                errors.Add("La descripción contiene caracteres no válidos.");
            if (ContainsEmojiOrControl(dto.TypePresentation))
                errors.Add("La presentación contiene caracteres no válidos.");
            if (dto.ExpirationDate < dto.PreparationDate)
                errors.Add("La fecha de expiración no puede ser anterior a la de preparación.");
            if (dto.AvailableQuantity < 0)
                errors.Add("La cantidad disponible no puede ser negativa.");
            if (dto.Concentration < 0)
                errors.Add("La concentración no puede ser negativa.");

            if (errors.Count > 0)
                return BadRequest(new { errors });

            entity.NameMedicine = CleanString(dto.NameMedicine);
            entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : CleanString(dto.Description);
            entity.TypePresentation = string.IsNullOrWhiteSpace(dto.TypePresentation) ? null : CleanString(dto.TypePresentation);
            entity.AvailableQuantity = dto.AvailableQuantity;
            entity.PreparationDate = dto.PreparationDate;
            entity.ExpirationDate = dto.ExpirationDate;
            entity.Concentration = dto.Concentration;

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // ===== DELETE =====
        [HttpDelete("{id:int}")]
        [Authorize(Policy = Perms.Inventory_Manage)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.MedicineInventory.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            _db.MedicineInventory.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
