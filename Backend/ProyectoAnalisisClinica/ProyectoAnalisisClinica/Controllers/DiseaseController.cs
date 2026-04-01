using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.DTOs;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;

namespace ProyectoAnalisisClinica.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DiseaseController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _context;

        public DiseaseController(ProyClinicaGuidoDbContext context)
        {
            _context = context;
        }

        // 🔹 GET: api/Disease
        [HttpGet]
        [Authorize(Policy = Perms.Diseases_View)]
        public async Task<ActionResult<IEnumerable<DiseaseDto>>> GetAll()
        {
            var diseases = await _context.Diseases
                .Select(d => new DiseaseDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    TypeDisease = d.TypeDisease,
                    Description = d.Description,
                    LevelSeverity = d.LevelSeverity,
                    Symptoms = d.Symptoms,
                    Causes = d.Causes,
                    IsContagious = d.IsContagious
                })
                .ToListAsync();

            return Ok(diseases);
        }

        // 🔹 GET: api/Disease/5
        [HttpGet("{id}")]
        [Authorize(Policy = Perms.Diseases_View)]
        public async Task<ActionResult<DiseaseDto>> GetById(int id)
        {
            var disease = await _context.Diseases.FindAsync(id);
            if (disease == null)
                return NotFound(new { message = "Enfermedad no encontrada" });

            return Ok(new DiseaseDto
            {
                Id = disease.Id,
                Name = disease.Name,
                TypeDisease = disease.TypeDisease,
                Description = disease.Description,
                LevelSeverity = disease.LevelSeverity,
                Symptoms = disease.Symptoms,
                Causes = disease.Causes,
                IsContagious = disease.IsContagious
            });
        }

        // POST: api/Disease
        [HttpPost]
        [Authorize(Policy = Perms.Diseases_Manage)]
        public async Task<ActionResult> Create([FromBody] CreateDiseaseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var disease = new Disease
            {
                Name = dto.Name,
                TypeDisease = dto.TypeDisease,
                Description = dto.Description,
                LevelSeverity = dto.LevelSeverity,
                Symptoms = dto.Symptoms,
                Causes = dto.Causes,
                IsContagious = dto.IsContagious
            };

            _context.Diseases.Add(disease);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = disease.Id }, dto);
        }

        // PUT: api/Disease/5
        [HttpPut("{id}")]
        [Authorize(Policy = Perms.Diseases_Manage)]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateDiseaseDto dto)
        {
            if (id != dto.Id)
                return BadRequest(new { message = "ID inconsistente" });

            var disease = await _context.Diseases.FindAsync(id);
            if (disease == null)
                return NotFound(new { message = "Enfermedad no encontrada" });

            disease.Name = dto.Name;
            disease.TypeDisease = dto.TypeDisease;
            disease.Description = dto.Description;
            disease.LevelSeverity = dto.LevelSeverity;
            disease.Symptoms = dto.Symptoms;
            disease.Causes = dto.Causes;
            disease.IsContagious = dto.IsContagious;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Disease/5
        [HttpDelete("{id}")]
        [Authorize(Policy = Perms.Diseases_Manage)]
        public async Task<ActionResult> Delete(int id)
        {
            var disease = await _context.Diseases.FindAsync(id);
            if (disease == null)
                return NotFound(new { message = "Enfermedad no encontrada" });

            _context.Diseases.Remove(disease);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enfermedad eliminada correctamente" });
        }
    }
}
