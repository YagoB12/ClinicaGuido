using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Models.Dtos;

namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicalPatientController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _db;
        public MedicalPatientController(ProyClinicaGuidoDbContext db) => _db = db;

        // GET: api/medicalpatient
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var patients = await _db.MedicalPatient.AsNoTracking().OrderByDescending(x => x.Id).ToListAsync();
            return Ok(patients);
        }

        // GET: api/medicalpatient/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var patient = await _db.MedicalPatient.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return patient is null ? NotFound() : Ok(patient);
        }

        // POST: api/medicalpatient
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MedicalPatientCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Identification) || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { error = "Campos obligatorios faltantes." });

            var entity = new MedicalPatient
            {
                Name = dto.Name,
                Identification = dto.Identification,
                Email = dto.Email,
                Phone = dto.Phone,
             //   Gender = dto.Gender,
                IsActive = true,
                BirthDate = dto.BirthDate,
                Address = dto.Address,
                MaritalStatus = dto.MaritalStatus,
                Disability = dto.Disability,
                Photo = dto.Photo,
                EmergencyContactName = dto.EmergencyContactName,
                EmergencyContactNumber = dto.EmergencyContactNumber
            };

            _db.MedicalPatient.Add(entity);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        // PUT: api/medicalpatient/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] MedicalPatientCreateDto dto)
        {
            var entity = await _db.MedicalPatient.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Identification) || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { error = "Campos obligatorios faltantes." });

            entity.Name = dto.Name;
            entity.Identification = dto.Identification;
            entity.Email = dto.Email;
            entity.Phone = dto.Phone;
          //  entity.Gender = dto.Gender;
            entity.BirthDate = dto.BirthDate;
            entity.Address = dto.Address;
            entity.MaritalStatus = dto.MaritalStatus;
            entity.Disability = dto.Disability;
            entity.Photo = dto.Photo;
            entity.EmergencyContactName = dto.EmergencyContactName;
            entity.EmergencyContactNumber = dto.EmergencyContactNumber;

            await _db.SaveChangesAsync();
            return Ok(entity);
        }

        // DELETE: api/medicalpatient/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.MedicalPatient.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return NotFound();

            _db.MedicalPatient.Remove(entity);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
