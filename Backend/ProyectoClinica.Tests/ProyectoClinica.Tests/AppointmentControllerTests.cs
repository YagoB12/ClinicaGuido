using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Models.Dtos.Appointments;
using System.Text.RegularExpressions;

namespace ProyectoClinica.Tests
{
    public class AppointmentControllerTests
    {
        //  Helper: crea un contexto en memoria nuevo para cada test
        private ProyClinicaGuidoDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_" + System.Guid.NewGuid())
                .Options;

            var context = new ProyClinicaGuidoDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        //  Helper opcional: normaliza texto JSON para facilitar comparaciones
        private static string Normalize(string text)
        {
            return Regex.Unescape(System.Text.Json.JsonSerializer.Serialize(text));
        }

        //  Test: Crear cita válida
        [Fact]
        [Trait("Category", "Citas")]
        public async Task AddAppointment_ReturnsCreated_WhenValid()
        {
            using var context = GetInMemoryDbContext();

            var patient = new MedicalPatient { Id = 1, Name = "Juan Pérez", Identification = "123456" };
            context.MedicalPatient.Add(patient);
            await context.SaveChangesAsync();

            var controller = new AppointmentsController(context);

            var dto = new AppointmentCreateDto
            {
                DateAppointment = DateOnly.FromDateTime(DateTime.Now.AddDays(1)), // mañana
                HourAppointment = new TimeOnly(10, 0),
                ReasonAppointment = "Consulta general",
                Priority = "Alta",
                OfficeNumber = "A1",
                Status = "Programada",
                MedicalPatientId = 1
            };

            var result = await controller.AddAppointment(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(201, created.StatusCode);

            var json = System.Text.Json.JsonSerializer.Serialize(created.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Cita creada correctamente.", normalized);
        }

        //  Test: Paciente no existe
        [Fact]
        [Trait("Category", "Citas")]
        public async Task AddAppointment_ReturnsNotFound_WhenPatientDoesNotExist()
        {
            using var context = GetInMemoryDbContext();
            var controller = new AppointmentsController(context);

            var dto = new AppointmentCreateDto
            {
                DateAppointment = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                HourAppointment = new TimeOnly(9, 0),
                ReasonAppointment = "Control general",
                Priority = "Media",
                OfficeNumber = "B2",
                Status = "Programada",
                MedicalPatientId = 999 // no existe
            };

            var result = await controller.AddAppointment(dto);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(404, notFound.StatusCode);

            var json = System.Text.Json.JsonSerializer.Serialize(notFound.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("El paciente no existe.", normalized);
        }

        //  Test: Hora fuera del horario laboral
        [Fact]
        [Trait("Category", "Citas")]
        public async Task AddAppointment_ReturnsBadRequest_WhenOutsideWorkingHours()
        {
            using var context = GetInMemoryDbContext();

            context.MedicalPatient.Add(new MedicalPatient { Id = 1, Name = "Juan Pérez", Identification = "123" });
            await context.SaveChangesAsync();

            var controller = new AppointmentsController(context);

            var dto = new AppointmentCreateDto
            {
                DateAppointment = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                HourAppointment = new TimeOnly(6, 30), // antes de 7am
                ReasonAppointment = "Chequeo",
                Priority = "Alta",
                OfficeNumber = "A2",
                Status = "Programada",
                MedicalPatientId = 1
            };

            var result = await controller.AddAppointment(dto);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequest.StatusCode);

            var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("La cita debe programarse entre las 07:00 y las 18:00 horas.", normalized);
        }

        //  Test: Intentar eliminar cita inexistente
        [Fact]
        [Trait("Category", "Citas")]
        public async Task DeleteAppointment_ReturnsNotFound_WhenAppointmentDoesNotExist()
        {
            using var context = GetInMemoryDbContext();
            var controller = new AppointmentsController(context);

            var result = await controller.DeleteAppointment(999);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);

            var json = System.Text.Json.JsonSerializer.Serialize(notFound.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("La cita no existe.", normalized);
        }

        //  Test: Eliminar cita correctamente
        [Fact]
        [Trait("Category", "Citas")]
        public async Task DeleteAppointment_ReturnsOk_WhenDeletedSuccessfully()
        {
            using var context = GetInMemoryDbContext();

            var appointment = new Appointment
            {
                Id = 1,
                DateAppointment = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                HourAppointment = new TimeOnly(9, 0),
                ReasonAppointment = "Chequeo",
                Priority = "Media",
                OfficeNumber = "B1",
                Status = "Programada",
                MedicalPatientId = 1
            };

            context.Appointment.Add(appointment);
            await context.SaveChangesAsync();

            var controller = new AppointmentsController(context);
            var result = await controller.DeleteAppointment(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Cita eliminada correctamente.", normalized);
        }
    }
}
