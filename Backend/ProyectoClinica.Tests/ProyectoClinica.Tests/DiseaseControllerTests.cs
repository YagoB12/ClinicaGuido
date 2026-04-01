using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Models.DTOs;
using System.Text.RegularExpressions;

namespace ProyectoClinica.Tests
{
    public class DiseaseControllerTests
    {
        // Helper para generar base de datos en memoria
        private ProyClinicaGuidoDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase("TestDb_" + Guid.NewGuid())
                .Options;

            var context = new ProyClinicaGuidoDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        //  Helper para normalizar cadenas JSON
        private static string Normalize(string text)
        {
            return Regex.Unescape(System.Text.Json.JsonSerializer.Serialize(text));
        }

        //Crear enfermedad correctamente
        [Fact]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            using var context = GetInMemoryDbContext();
            var controller = new DiseaseController(context);

            var dto = new CreateDiseaseDto
            {
                Name = "Gripe",
                TypeDisease = "Viral",
                Description = "Infección respiratoria leve",
                LevelSeverity = "Baja",
                Symptoms = "Fiebre, tos",
                Causes = "Virus",
                IsContagious = true
            };

            var result = await controller.Create(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(201, created.StatusCode);

            var json = System.Text.Json.JsonSerializer.Serialize(created.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Gripe", normalized);
        }

        //  Intentar obtener enfermedad que no existe
        [Fact]
        public async Task GetById_ReturnsNotFound_WhenDiseaseDoesNotExist()
        {
            using var context = GetInMemoryDbContext();
            var controller = new DiseaseController(context);

            var result = await controller.GetById(99);
            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);

            var json = System.Text.Json.JsonSerializer.Serialize(notFound.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Enfermedad no encontrada", normalized);
        }

        // Obtener enfermedad existente por ID
        [Fact]
        public async Task GetById_ReturnsOk_WhenDiseaseExists()
        {
            using var context = GetInMemoryDbContext();
            context.Diseases.Add(new Disease
            {
                Id = 1,
                Name = "Covid-19",
                TypeDisease = "Viral",
                Description = "Enfermedad respiratoria",
                LevelSeverity = "Alta",
                Symptoms = "Fiebre, tos, fatiga",
                Causes = "SARS-CoV-2",
                IsContagious = true
            });
            await context.SaveChangesAsync();

            var controller = new DiseaseController(context);
            var result = await controller.GetById(1);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Covid-19", normalized);
        }

        // Obtener todas las enfermedades
        [Fact]
        public async Task GetAll_ReturnsAllDiseases()
        {
            using var context = GetInMemoryDbContext();
            context.Diseases.AddRange(
                new Disease { Name = "Gripe", TypeDisease = "Viral", LevelSeverity = "Baja" },
                new Disease { Name = "Covid-19", TypeDisease = "Viral", LevelSeverity = "Alta" }
            );
            await context.SaveChangesAsync();

            var controller = new DiseaseController(context);
            var result = await controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var list = Assert.IsAssignableFrom<IEnumerable<DiseaseDto>>(ok.Value);
            Assert.Equal(2, list.Count());
        }

        // Actualizar enfermedad inexistente
        [Fact]
        public async Task Update_ReturnsNotFound_WhenDiseaseDoesNotExist()
        {
            using var context = GetInMemoryDbContext();
            var controller = new DiseaseController(context);

            var dto = new UpdateDiseaseDto
            {
                Id = 5,
                Name = "Actualizada",
                TypeDisease = "Bacteriana"
            };

            var result = await controller.Update(5, dto);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);

            var json = System.Text.Json.JsonSerializer.Serialize(notFound.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Enfermedad no encontrada", normalized);
        }

        //  ID inconsistente en actualización
        [Fact]
        public async Task Update_ReturnsBadRequest_WhenIdMismatch()
        {
            using var context = GetInMemoryDbContext();
            var controller = new DiseaseController(context);

            var dto = new UpdateDiseaseDto
            {
                Id = 2,
                Name = "Gripe Actualizada"
            };

            var result = await controller.Update(1, dto);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);

            var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("ID inconsistente", normalized);
        }

        //  Actualización exitosa
        [Fact]
        public async Task Update_ReturnsNoContent_WhenUpdatedSuccessfully()
        {
            using var context = GetInMemoryDbContext();
            var disease = new Disease
            {
                Id = 1,
                Name = "Gripe",
                TypeDisease = "Viral",
                Description = "Fiebre común",
                LevelSeverity = "Baja",
                Symptoms = "Fiebre, tos",
                Causes = "Virus",
                IsContagious = true
            };
            context.Diseases.Add(disease);
            await context.SaveChangesAsync();

            var controller = new DiseaseController(context);
            var dto = new UpdateDiseaseDto
            {
                Id = 1,
                Name = "Gripe Actualizada",
                TypeDisease = "Viral",
                Description = "Actualizada",
                LevelSeverity = "Media",
                Symptoms = "Tos leve",
                Causes = "Virus",
                IsContagious = false
            };

            var result = await controller.Update(1, dto);
            Assert.IsType<NoContentResult>(result);
        }

        //  Eliminar enfermedad inexistente
        [Fact]
        public async Task Delete_ReturnsNotFound_WhenDiseaseDoesNotExist()
        {
            using var context = GetInMemoryDbContext();
            var controller = new DiseaseController(context);

            var result = await controller.Delete(10);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);

            var json = System.Text.Json.JsonSerializer.Serialize(notFound.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Enfermedad no encontrada", normalized);
        }

        //  Eliminar enfermedad correctamente
        [Fact]
        public async Task Delete_ReturnsOk_WhenDeletedSuccessfully()
        {
            using var context = GetInMemoryDbContext();
            context.Diseases.Add(new Disease
            {
                Id = 1,
                Name = "Gripe",
                TypeDisease = "Viral"
            });
            await context.SaveChangesAsync();

            var controller = new DiseaseController(context);
            var result = await controller.Delete(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
            var normalized = Regex.Unescape(json);
            Assert.Contains("Enfermedad eliminada correctamente", normalized);
        }
    }
}
