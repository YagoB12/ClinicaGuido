using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Prescriptions;
using ProyectoAnalisisClinica.Models.Entities;

using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProyectoAnalisisClinica.Tests
{
    public class PrescriptionsControllerCrudTests
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

        // 🔹 Mock para evitar NullReference en TryValidateModel()
        private class DummyObjectValidator : IObjectModelValidator
        {
            public void Validate(ActionContext actionContext,
                                 ValidationStateDictionary validationState,
                                 string prefix,
                                 object model)
            {
                // No hace nada, evita NRE.
            }
        }

        private static void PrepareControllerForTryValidate(ControllerBase ctrl)
        {
            ctrl.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            ctrl.ObjectValidator = new DummyObjectValidator();
        }

        private MedicalPatient SeedPatient(ProyClinicaGuidoDbContext ctx, int id, string name = "Paciente")
        {
            var p = new MedicalPatient
            {
                Id = id,
                Name = $"{name} {id}",
                Identification = $"ID-{id}"
            };
            ctx.MedicalPatient.Add(p);
            ctx.SaveChanges();
            return p;
        }

        private Appointment SeedAppointment(ProyClinicaGuidoDbContext ctx, int id, string status = "Programada", string patientName = "Paciente")
        {
            var pat = SeedPatient(ctx, id, patientName);
            var ap = new Appointment
            {
                Id = id,
                Status = status,
                DateAppointment = DateOnly.FromDateTime(DateTime.Today),
                HourAppointment = new TimeOnly(9, 0),
                OfficeNumber = "101",
                MedicalPatientId = pat.Id,
                MedicalPatient = pat
            };
            ctx.Appointment.Add(ap);
            ctx.SaveChanges();
            return ap;
        }

        private Consultation SeedConsultation(ProyClinicaGuidoDbContext ctx, int id, Appointment appt)
        {
            var c = new Consultation
            {
                Id = id,
                AppointmentId = appt.Id,
                ReasonConsultation = "Motivo"
            };
            ctx.Consultation.Add(c);
            ctx.SaveChanges();
            return c;
        }

        private MedicineInventory SeedMedicine(ProyClinicaGuidoDbContext ctx, int id, int stock = 50)
        {
            var m = new MedicineInventory
            {
                Id = id,
                NameMedicine = "Med",
                TypePresentation = "Tabs",
                Concentration = 500,
                AvailableQuantity = stock
            };
            ctx.MedicineInventory.Add(m);
            ctx.SaveChanges();
            return m;
        }

        // =========================
        // CREATE (POST /api/Prescriptions)
        // =========================
        [Fact]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 100, "Programada");
            var cons = SeedConsultation(ctx, 200, ap);
            var med = SeedMedicine(ctx, 300, stock: 100);

            var ctrl = new PrescriptionsController(ctx);
            PrepareControllerForTryValidate(ctrl);

            var dto = new CreatePrescriptionDto
            {
                ConsultationId = cons.Id,
                Observation = " Observación ok ",
                AdditionalInstructions = " Instrucciones ok ",
                Items = new List<CreatePrescriptionItemDto>
                {
                    new CreatePrescriptionItemDto
                    {
                        MedicineInventoryId = med.Id,
                        DailyDose = "1 tableta",
                        Frequency = "cada 8 horas",
                        TreatmentDurationDays = 7,
                        QuantityTotal = 21
                    }
                }
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var created = Assert.IsType<CreatedAtActionResult>(res);
            var entity = Assert.IsType<MedicalPrescription>(created.Value);

            Assert.Equal(cons.Id, entity.ConsultationId);
            Assert.Single(entity.Items!);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenConsultationDoesNotExist()
        {
            var ctx = GetCtx();
            var ctrl = new PrescriptionsController(ctx);
            PrepareControllerForTryValidate(ctrl);

            var dto = new CreatePrescriptionDto
            {
                ConsultationId = 999
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);
            Assert.Contains("no existe", bad.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        // =========================
        // EDITAR (PUT)
        // =========================
        [Fact]
        public async Task Update_ReturnsOk_WhenValid()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 110, "Atendida");
            var cons = SeedConsultation(ctx, 210, ap);

            var pres = new MedicalPrescription
            {
                ConsultationId = cons.Id,
                IssueDate = DateOnly.FromDateTime(DateTime.Today),
                Status = "Emitida"
            };
            ctx.MedicalPrescription.Add(pres);
            await ctx.SaveChangesAsync();

            var ctrl = new PrescriptionsController(ctx);

            var dto = new UpdatePrescriptionDto
            {
                Observation = "Obs editada",
                AdditionalInstructions = "Instr editadas",
                Status = "Entregada"
            };

            var res = await ctrl.Update(pres.Id, dto, CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);
            var entity = Assert.IsType<MedicalPrescription>(ok.Value);

            Assert.Equal("Entregada", entity.Status);
            Assert.Equal("Obs editada", entity.Observation);
        }

        [Fact]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new PrescriptionsController(ctx);

            var dto = new UpdatePrescriptionDto { Observation = "X" };
            var res = await ctrl.Update(999, dto, CancellationToken.None);

            Assert.IsType<NotFoundResult>(res);
        }

        // =========================
        // ELIMINAR (DELETE)
        // =========================
        [Fact]
        public async Task Delete_ReturnsNoContent_WhenExists()
        {
            var ctx = GetCtx();
            var ap = SeedAppointment(ctx, 120, "Atendida");
            var cons = SeedConsultation(ctx, 220, ap);

            var pres = new MedicalPrescription
            {
                ConsultationId = cons.Id,
                IssueDate = DateOnly.FromDateTime(DateTime.Today),
                Status = "Emitida"
            };
            ctx.MedicalPrescription.Add(pres);
            await ctx.SaveChangesAsync();

            var ctrl = new PrescriptionsController(ctx);
            var res = await ctrl.Delete(pres.Id, CancellationToken.None);

            Assert.IsType<NoContentResult>(res);
            Assert.False(ctx.MedicalPrescription.Any(x => x.Id == pres.Id));
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new PrescriptionsController(ctx);

            var res = await ctrl.Delete(999, CancellationToken.None);
            Assert.IsType<NotFoundResult>(res);
        }
    }
}
