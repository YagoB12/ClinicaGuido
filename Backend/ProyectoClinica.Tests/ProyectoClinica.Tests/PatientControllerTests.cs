using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos;
using ProyectoAnalisisClinica.Models.Entities;
using Xunit;

namespace ProyectoClinica.Tests
{
    public class PatientControllerTests
    {
        // Helper: crea un contexto en memoria nuevo para cada test
        private ProyClinicaGuidoDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
                .Options;

            var context = new ProyClinicaGuidoDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        [Fact]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            using var context = GetInMemoryDbContext();
            var controller = new MedicalPatientController(context);

            var dto = new MedicalPatientCreateDto
            {
                Name = "Ana",
                Identification = "ABC123",
                Email = "ana@example.com",
                Phone = 12345678,
                BirthDate = DateOnly.FromDateTime(DateTime.Today.AddYears(-30))
            };

            var result = await controller.Create(dto);
            var created = Assert.IsType<CreatedAtActionResult>(result);
            var returned = Assert.IsType<MedicalPatient>(created.Value);

            Assert.Equal("Ana", returned.Name);
            Assert.Equal("ABC123", returned.Identification);
            Assert.Equal("ana@example.com", returned.Email);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenMissingRequired()
        {
            using var context = GetInMemoryDbContext();
            var controller = new MedicalPatientController(context);

            var dto = new MedicalPatientCreateDto
            {
                // faltan campos obligatorios: Name, Identification, Email
                Phone = 0
            };

            var result = await controller.Create(dto);
            var bad = Assert.IsType<BadRequestObjectResult>(result);

            var json = JsonSerializer.Serialize(bad.Value);
            Assert.Contains("Campos obligatorios", json, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetAll_ReturnsList()
        {
            using var context = GetInMemoryDbContext();
            context.MedicalPatient.Add(new MedicalPatient { Id = 1, Name = "Paciente 1", Identification = "ID1", Email = "p1@ex.com" });
            context.MedicalPatient.Add(new MedicalPatient { Id = 2, Name = "Paciente 2", Identification = "ID2", Email = "p2@ex.com" });
            await context.SaveChangesAsync();

            var controller = new MedicalPatientController(context);
            var result = await controller.GetAll();
            var ok = Assert.IsType<OkObjectResult>(result);

            var json = JsonSerializer.Serialize(ok.Value);
            Assert.Contains("Paciente 1", json);
            Assert.Contains("Paciente 2", json);
        }

        [Fact]
        public async Task GetById_ReturnsOk_WhenExists()
        {
            using var context = GetInMemoryDbContext();
            context.MedicalPatient.Add(new MedicalPatient { Id = 5, Name = "Luis", Identification = "L5", Email = "luis@ex.com" });
            await context.SaveChangesAsync();

            var controller = new MedicalPatientController(context);
            var result = await controller.GetById(5);
            var ok = Assert.IsType<OkObjectResult>(result);
            var patient = Assert.IsType<MedicalPatient>(ok.Value);

            Assert.Equal("Luis", patient.Name);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            using var context = GetInMemoryDbContext();
            var controller = new MedicalPatientController(context);

            var result = await controller.GetById(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenValid()
        {
            using var context = GetInMemoryDbContext();
            context.MedicalPatient.Add(new MedicalPatient { Id = 11, Name = "Old", Identification = "OLD", Email = "old@ex.com" });
            await context.SaveChangesAsync();

            var controller = new MedicalPatientController(context);
            var dto = new MedicalPatientCreateDto
            {
                Name = "Nuevo",
                Identification = "NEW",
                Email = "new@ex.com",
                Phone = 555
            };

            var result = await controller.Update(11, dto);
            var ok = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<MedicalPatient>(ok.Value);

            Assert.Equal("Nuevo", updated.Name);
            Assert.Equal("NEW", updated.Identification);
        }

        [Fact]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            using var context = GetInMemoryDbContext();
            var controller = new MedicalPatientController(context);

            var dto = new MedicalPatientCreateDto { Name = "X", Identification = "X", Email = "x@ex.com" };
            var result = await controller.Update(999, dto);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_ReturnsNoContent_WhenExists()
        {
            using var context = GetInMemoryDbContext();
            context.MedicalPatient.Add(new MedicalPatient { Id = 21, Name = "ToDelete", Identification = "TD", Email = "td@ex.com" });
            await context.SaveChangesAsync();

            var controller = new MedicalPatientController(context);
            var result = await controller.Delete(21);
            Assert.IsType<NoContentResult>(result);

            Assert.False(context.MedicalPatient.Any(x => x.Id == 21));
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            using var context = GetInMemoryDbContext();
            var controller = new MedicalPatientController(context);

            var result = await controller.Delete(999);
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
