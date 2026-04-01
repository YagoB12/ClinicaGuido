using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Appointments;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;
using ProyectoAnalisisClinica.Utils.Validators;


namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _db;
        public AppointmentsController(ProyClinicaGuidoDbContext db) => _db = db;

        // GET: /api/appointments/brief
        [HttpGet("brief")]
        public async Task<ActionResult<IEnumerable<AppointmentBriefDto>>> GetBrief()
        {
            var list = await _db.Appointment
                .AsNoTracking()
                .Include(a => a.MedicalPatient  )
                .Where(a => a.Status == "Programada")
                .OrderBy(a => a.DateAppointment)
                .ThenBy(a => a.HourAppointment)
                .Select(a => new AppointmentBriefDto(
                    a.Id,
                    a.MedicalPatient.Name,
                    a.MedicalPatient.Identification,
                    a.DateAppointment,
                    a.HourAppointment,
                    a.OfficeNumber,
                    a.Status
                 
                ))
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/appointments/brief-by-ids?ids=1&ids=2&ids=3
        [HttpGet("brief-by-ids")]
        public async Task<ActionResult<IEnumerable<AppointmentBriefDto>>> GetBriefByIds([FromQuery] int[] ids)
        {
            if (ids == null || ids.Length == 0) return Ok(Array.Empty<AppointmentBriefDto>());

            var set = ids.Distinct().ToArray();

            var list = await _db.Appointment
                .AsNoTracking()
                .Include(a => a.MedicalPatient)
                .Where(a => set.Contains(a.Id))
                .Select(a => new AppointmentBriefDto(
                    a.Id, a.MedicalPatient.Name,a.MedicalPatient.Identification, a.DateAppointment, a.HourAppointment,
                    a.OfficeNumber, a.Status
                ))
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("add")]
        [Authorize(Policy = Perms.Appointments_Create)]
        public async Task<IActionResult> AddAppointment([FromBody] AppointmentCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Llamar al validador centralizado
            var error = await AppointmentValidator.ValidateAsync(dto, _db);
            if (error != null)
                return BadRequest(new { message = error });

            // Verificar que el paciente exista
            var patient = await _db.MedicalPatient.FindAsync(dto.MedicalPatientId);
            if (patient == null)
                return NotFound(new { message = "El paciente no existe." });

            // Crea cita
            var appointment = new Appointment
            {
                DateAppointment = dto.DateAppointment,
                HourAppointment = dto.HourAppointment,
                ReasonAppointment = dto.ReasonAppointment,
                Priority = dto.Priority,
                OfficeNumber = dto.OfficeNumber,
                Status = dto.Status ?? "Programada",
                MedicalPatientId = dto.MedicalPatientId
            };

            _db.Appointment.Add(appointment);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBriefByIds), new { ids = new[] { appointment.Id } }, new
            {
                message = "Cita creada correctamente.",
                appointment.Id,
                appointment.DateAppointment,
                appointment.HourAppointment,
                appointment.Status
            });
        }



        //Listar todas las citas - Solo quien tenga permiso de ver todas las citas (admin/secretaria)
        [HttpGet("list")]
        [Authorize(Policy = Perms.Appointments_View_All)]
        public async Task<ActionResult<IEnumerable<AppointmentCreateDto>>> GetAllAppointments()
        {
            var list = await _db.Appointment
                .AsNoTracking()
                .Include(a => a.MedicalPatient)
                .OrderByDescending(a => a.DateAppointment)
                .ThenBy(a => a.HourAppointment)
                .Select(a => new AppointmentCreateDto
                {
                    Id = a.Id,
                    DateAppointment = a.DateAppointment,
                    HourAppointment = a.HourAppointment,
                    ReasonAppointment = a.ReasonAppointment,
                    Priority = a.Priority,
                    OfficeNumber = a.OfficeNumber,
                    Status = a.Status,
                    MedicalPatientId = a.MedicalPatientId,
                    PatientName = a.MedicalPatient.Name
                })
                .ToListAsync();

            return Ok(list);
        }

        // DELETE: /api/appointments/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = Perms.Appointments_Cancel)]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var appointment = await _db.Appointment.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "La cita no existe." });

            _db.Appointment.Remove(appointment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cita eliminada correctamente." });
        }


        // GET: /api/appointments/calendar
        [HttpGet("calendar")]
        [Authorize] // opcionalmente podés poner una política, ej: Perms.Appointments_View_All
        public async Task<ActionResult<IEnumerable<AppointmentCalendarDto>>> GetAppointmentsForCalendar()
        {
            var list = await _db.Appointment
                .AsNoTracking()
                .Include(a => a.MedicalPatient)
                .OrderBy(a => a.DateAppointment)
                .ThenBy(a => a.HourAppointment)
                .Select(a => new AppointmentCalendarDto
                {
                    Id = a.Id,
                    PatientName = a.MedicalPatient.Name,
                    DateAppointment = a.DateAppointment,
                    HourAppointment = a.HourAppointment,
                    OfficeNumber = a.OfficeNumber,
                    Status = a.Status,
                    Priority = a.Priority
                })
                .ToListAsync();

            return Ok(list);
        }


        // PUT: /api/appointments/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = Perms.Appointments_Update)]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] AppointmentCreateDto dto)
        {
            var appointment = await _db.Appointment.FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null)
                return NotFound(new { message = "La cita no existe." });

            // Validar con exclusión del registro actual
            var error = await AppointmentValidator.ValidateAsync(dto, _db, isUpdate: true, currentId: id);
            if (error != null)
                return BadRequest(new { message = error });

            // Actualizar
            appointment.DateAppointment = dto.DateAppointment;
            appointment.HourAppointment = dto.HourAppointment;
            appointment.ReasonAppointment = dto.ReasonAppointment;
            appointment.Priority = dto.Priority;
            appointment.OfficeNumber = dto.OfficeNumber;
            appointment.Status = dto.Status;
            appointment.MedicalPatientId = dto.MedicalPatientId;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Cita actualizada correctamente." });
        }




    }

}
