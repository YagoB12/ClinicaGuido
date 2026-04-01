using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Dtos.Medicines;
using ProyectoAnalisisClinica.Models.Entities;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ProyectoAnalisisClinica.Tests
{
    public class MedicinesControllerTest
    {

        private sealed class ErrorsPayload
        {
            public List<string> errors { get; set; } = new();
        }
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

        private MedicineInventory SeedMedicine(ProyClinicaGuidoDbContext ctx, int id, string name = "Ibuprofeno", int qty = 50)
        {
            var med = new MedicineInventory
            {
                Id = id,
                NameMedicine = name,
                Description = "Analgésico",
                TypePresentation = "Tableta",
                AvailableQuantity = qty,
                PreparationDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                ExpirationDate = DateOnly.FromDateTime(DateTime.Today.AddDays(30)),
                Concentration = 500
            };
            ctx.MedicineInventory.Add(med);
            ctx.SaveChanges();
            return med;
        }

        // =========================
        // CREATE
        // =========================
        [Fact]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            var ctx = GetCtx();
            var ctrl = new MedicinesController(ctx);
            ctrl.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

            var dto = new MedicineCreateDto
            {
                NameMedicine = "Paracetamol",
                Description = "Analgesico y antipirético",
                TypePresentation = "Tableta",
                AvailableQuantity = 100,
                PreparationDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-5)),
                ExpirationDate = DateOnly.FromDateTime(DateTime.Today.AddDays(180)),
                Concentration = 500
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var created = Assert.IsType<CreatedAtActionResult>(res);
            var result = Assert.IsType<MedicineDto>(created.Value);

            Assert.Equal("Paracetamol", result.NameMedicine);
            Assert.Equal(100, result.AvailableQuantity);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenInvalidDates()
        {
            var ctx = GetCtx();
            var ctrl = new MedicinesController(ctx);

            var dto = new MedicineCreateDto
            {
                NameMedicine = "Aspirina",
                PreparationDate = DateOnly.FromDateTime(DateTime.Today),
                ExpirationDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-5)) // inválida
            };

            var res = await ctrl.Create(dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);

            var json = JsonSerializer.Serialize(bad.Value);
            var payload = JsonSerializer.Deserialize<ErrorsPayload>(json)!;

            Assert.Contains(payload.errors, e =>
                e.Contains("expiración", StringComparison.OrdinalIgnoreCase));
        }

        // =========================
        // GET ALL
        // =========================
        private class ListPayload
        {
            public int total { get; set; }
            public List<MedicineBriefDto> items { get; set; } = new();
        }

        [Fact]
        public async Task GetAll_ReturnsList_AndFilters()
        {
            var ctx = GetCtx();
            SeedMedicine(ctx, 1, "Ibuprofeno");
            SeedMedicine(ctx, 2, "Paracetamol");
            SeedMedicine(ctx, 3, "Omeprazol", 0); // sin stock

            var ctrl = new MedicinesController(ctx);
            var res = await ctrl.GetAll("para", onlyAvailable: true, onlyNotExpired: true, page: 1, pageSize: 10, ct: CancellationToken.None);
            var ok = Assert.IsType<OkObjectResult>(res);

            var json = JsonSerializer.Serialize(ok.Value);
            var payload = JsonSerializer.Deserialize<ListPayload>(json)!;

            Assert.True(payload.total >= 1);
            Assert.All(payload.items, x => Assert.False(string.IsNullOrWhiteSpace(x.NameMedicine)));
        }

        // =========================
        // UPDATE
        // =========================
        [Fact]
        public async Task Update_ReturnsNoContent_WhenValid()
        {
            var ctx = GetCtx();
            var med = SeedMedicine(ctx, 10);
            var ctrl = new MedicinesController(ctx);

            var dto = new MedicineUpdateDto
            {
                NameMedicine = "Ibuprofeno 400mg",
                Description = "Analgésico modificado",
                TypePresentation = "Cápsula",
                AvailableQuantity = 80,
                PreparationDate = med.PreparationDate,
                ExpirationDate = med.ExpirationDate,
                Concentration = 400
            };

            var res = await ctrl.Update(med.Id, dto, CancellationToken.None);
            Assert.IsType<NoContentResult>(res);

            var updated = ctx.MedicineInventory.First(m => m.Id == med.Id);
            Assert.Equal("Ibuprofeno 400mg", updated.NameMedicine);
            Assert.Equal(400, updated.Concentration);
        }

        [Fact]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new MedicinesController(ctx);

            var dto = new MedicineUpdateDto { NameMedicine = "X" };
            var res = await ctrl.Update(999, dto, CancellationToken.None);
            Assert.IsType<NotFoundResult>(res);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_WhenNegativeQuantity()
        {
            var ctx = GetCtx();
            var med = SeedMedicine(ctx, 20);
            var ctrl = new MedicinesController(ctx);

            var dto = new MedicineUpdateDto
            {
                NameMedicine = "TestMed",
                AvailableQuantity = -5, // inválido
                PreparationDate = med.PreparationDate,
                ExpirationDate = med.ExpirationDate,
                Concentration = 100
            };

            var res = await ctrl.Update(med.Id, dto, CancellationToken.None);
            var bad = Assert.IsType<BadRequestObjectResult>(res);

            // Deserializar el payload devuelto por el controlador
            var json = JsonSerializer.Serialize(bad.Value);
            var payload = JsonSerializer.Deserialize<ErrorsPayload>(json)!;

            // Buscar el mensaje "negativa" dentro de los errores
            Assert.Contains(payload.errors, e =>
                e.Contains("negativa", StringComparison.OrdinalIgnoreCase));
        }

        // =========================
        // DELETE
        // =========================
        [Fact]
        public async Task Delete_ReturnsNoContent_WhenExists()
        {
            var ctx = GetCtx();
            var med = SeedMedicine(ctx, 30);
            var ctrl = new MedicinesController(ctx);

            var res = await ctrl.Delete(med.Id, CancellationToken.None);
            Assert.IsType<NoContentResult>(res);

            Assert.False(ctx.MedicineInventory.Any(m => m.Id == med.Id));
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            var ctx = GetCtx();
            var ctrl = new MedicinesController(ctx);

            var res = await ctrl.Delete(999, CancellationToken.None);
            Assert.IsType<NotFoundResult>(res);
        }
    }
}
