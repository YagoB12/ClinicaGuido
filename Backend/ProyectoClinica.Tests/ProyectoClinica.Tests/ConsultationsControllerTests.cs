using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Consultations;
using ProyectoAnalisisClinica.Models.Entities;
using Xunit;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ProyectoAnalisisClinica.Tests
{
    public class ConsultationsControllerCrudTests
    {
        // =========================
        // Helpers
        // =========================
        private ProyClinicaGuidoDbContext GetCtx()
        {
            var opts = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase("TestDb_" + Guid.NewGuid())
                .Options;

            var ctx = new ProyClinicaGuidoDbContext(opts);
            ctx.Database.EnsureCreated();
            return ctx;
        }

      
        private Appointment SeedAppointment(ProyClinicaGuidoDbContext ctx, int id, string status = "Programada")
        {
            var ap = new Appointment
            {
                Id = id,
                Status = status,
                DateAppointment = DateOnly.FromDateTime(DateTime.Today),
                HourAppointment = new TimeOnly(9, 0),
                OfficeNumber = "101",
                MedicalPatient = new MedicalPatient
                {
                    Id = id, 
                    Name = "Paciente " + id,
                    Identification = "ID-" + id
                }
            };
            ctx.Appointment.Add(ap);
            ctx.SaveChanges();
            return ap;
        }

        // ==============================
        // LISTAR (GET /api/consultations)
        // ==============================
        [Fact]
        public async Task GetAll_ReturnsAll_WhenNoFilter()
        {
            var ctx = GetCtx();
            var a1 = SeedAppointment(ctx, 100);
            var a2 = SeedAppointment(ctx, 101);

            ctx.Consultation.AddRange(
                new Consultation { Id = 1, AppointmentId = a1.Id, ReasonConsultation = "Dolor" },
                new Consultation { Id = 2, AppointmentId = a2.Id, ReasonConsultation = "Chequeo" }
            );
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.GetAll(null, CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);
            var items = Assert.IsAssignableFrom<IEnumerable<Consultation>>(ok.Value);

            int count = 0; foreach (var _ in items) count++;
            Assert.Equal(2, count);
        }

        [Fact]
        public async Task GetAll_FiltersByAppointmentId()
        {
            var ctx = GetCtx();
            var a1 = SeedAppointment(ctx, 200);
            var a2 = SeedAppointment(ctx, 201);

            // Respeta 1:1 (una consulta por cita)
            ctx.Consultation.AddRange(
                new Consultation { Id = 1, AppointmentId = a1.Id, ReasonConsultation = "A" },
                new Consultation { Id = 2, AppointmentId = a2.Id, ReasonConsultation = "B" }
            );
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.GetAll(a1.Id, CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);
            var items = Assert.IsAssignableFrom<IEnumerable<Consultation>>(ok.Value);

            int count = 0; foreach (var _ in items) count++;
            Assert.Equal(1, count);
        }


        // ==============================
        // OBTENER POR ID (GET /api/consultations/{id})
        // ==============================
        [Fact]
        public async Task GetById_ReturnsOk_WhenExists()
        {
            var ctx = GetCtx();
            var a = SeedAppointment(ctx, 300);

            ctx.Consultation.Add(new Consultation { Id = 10, AppointmentId = a.Id, ReasonConsultation = "Migraña" });
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.GetById(10, CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);
            var item = Assert.IsType<Consultation>(ok.Value);
            Assert.Equal(10, item.Id);
            Assert.Equal("Migraña", item.ReasonConsultation);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.GetById(999, CancellationToken.None);
            Assert.IsType<NotFoundResult>(res);
        }

        // ==============================
        // CREAR (POST /api/consultations)
        // ==============================
        [Fact]
        public async Task Create_ReturnsBadRequest_WhenModelStateInvalid()
        {
            var ctx = GetCtx();
            var ctrl = new ConsultationsController(ctx);
            ctrl.ModelState.AddModelError("Temperature", "Valor inválido"); // fuerza ModelState inválido

            var dto = new ConsultationCreateDto
            {
                AppointmentId = 1,
                ReasonConsultation = "X"
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);
            Assert.Contains("Errores de validación", bad.Value!.ToString());
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenAppointmentDoesNotExist()
        {
            var ctx = GetCtx();
            var ctrl = new ConsultationsController(ctx);

            var dto = new ConsultationCreateDto
            {
                AppointmentId = 999,
                ReasonConsultation = "Dolor abdominal"
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);
            Assert.Contains("no existe", bad.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Create_ReturnsConflict_WhenAppointmentAlreadyHasConsultation()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 400, "Programada");

            ctx.Consultation.Add(new Consultation { AppointmentId = ap.Id, ReasonConsultation = "Prev" });
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var dto = new ConsultationCreateDto
            {
                AppointmentId = ap.Id,
                ReasonConsultation = "Nueva"
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var conflict = Assert.IsType<ConflictObjectResult>(res);
            Assert.Contains("ya tiene una consulta", conflict.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenAppointmentStatusInvalid()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 401, "Cancelada"); // estado inválido según tu controller
            var ctrl = new ConsultationsController(ctx);

            var dto = new ConsultationCreateDto
            {
                AppointmentId = ap.Id,
                ReasonConsultation = "X"
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);
            Assert.Contains("no está disponible", bad.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 402, "Programada");
            var ctrl = new ConsultationsController(ctx);

            var dto = new ConsultationCreateDto
            {
                AppointmentId = ap.Id,
                ReasonConsultation = "Dolor torácico",
                Temperature = 36,
                BloodPressure = 110,
                HeartRate = 80,
                Weight = 70,
                Height = 1.75
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var created = Assert.IsType<CreatedAtActionResult>(res);
            var entity = Assert.IsType<Consultation>(created.Value);
            Assert.Equal(ap.Id, entity.AppointmentId);
            Assert.Equal("Atendida", ap.Status); // el POST la cambia a Atendida
        }

        // ==============================
        // EDITAR (PUT /api/consultations/{id})
        // ==============================
        [Fact]
        public async Task Update_ReturnsOk_WhenValid()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 500);
            ctx.Consultation.Add(new Consultation { Id = 20, AppointmentId = ap.Id, ReasonConsultation = "Fiebre" });
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var dto = new ConsultationUpdateDto
            {
                ReasonConsultation = "Fiebre alta",
                Temperature = 37,
                BloodPressure = 120,
                HeartRate = 75,
                Weight = 68,
                Height = 1.70
            };

            var res = await ctrl.Update(20, dto, CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);
            var entity = Assert.IsType<Consultation>(ok.Value);
            Assert.Equal("Fiebre alta", entity.ReasonConsultation);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_WhenValidationFails()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 501);
            ctx.Consultation.Add(new Consultation { Id = 21, AppointmentId = ap.Id, ReasonConsultation = "X" });
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            // ReasonConsultation requerido → vacío produce 400 por tu ValidateText
            var dto = new ConsultationUpdateDto { ReasonConsultation = "" };

            var res = await ctrl.Update(21, dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);
            Assert.Contains("Errores de validación", bad.Value!.ToString());
        }

        // ==============================
        // ELIMINAR (DELETE /api/consultations/{id})
        // ==============================
        [Fact]
        public async Task Delete_ReturnsNoContent_WhenExists()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 600, "Atendida");
            ctx.Consultation.Add(new Consultation { Id = 30, AppointmentId = ap.Id, ReasonConsultation = "Chequeo" });
            await ctx.SaveChangesAsync();

            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.Delete(30, CancellationToken.None);
            Assert.IsType<NoContentResult>(res);

            // la cita vuelve a "Programada"
            Assert.Equal("Programada", ap.Status);
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new ConsultationsController(ctx);

            var res = await ctrl.Delete(999, CancellationToken.None);
            Assert.IsType<NotFoundResult>(res);
        }
    }
}
