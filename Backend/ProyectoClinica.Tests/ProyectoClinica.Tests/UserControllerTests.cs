using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Controllers;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils.Validators;
using Xunit;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ProyectoAnalisisClinica.Tests
{
    public class UserControllerTests
    {
        private ProyClinicaGuidoDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_" + System.Guid.NewGuid())
                .Options;

            var context = new ProyClinicaGuidoDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        // ==============================|dxcf
        // GET ALL USERS
        // ==============================
        [Fact]
        public async Task GetUsers_ReturnsActiveUsers()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.Rol.Add(new Rol { Id = 1, Nombre = "Admin" });
            context.User.AddRange(
                new User { Id = 1, Name = "Juan", Email = "juan@correo.com", RolId = 1, IsActive = true },
                new User { Id = 2, Name = "Ana", Email = "ana@correo.com", RolId = 1, IsActive = false }
            );
            await context.SaveChangesAsync();

            var controller = new UserController(context);

            // Act
            var result = await controller.GetUsers(CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var users = Assert.IsAssignableFrom<IEnumerable<UserDetailDto>>(okResult.Value);

            // Assert
            Assert.Single(users); // solo 1 activo
        }

        // ==============================
        // GET USER BY ID
        // ==============================
        [Fact]
        public async Task GetUser_ReturnsUser_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.Rol.Add(new Rol { Id = 1, Nombre = "Admin" });
            context.User.Add(new User { Id = 1, Name = "Carlos", Email = "carlos@correo.com", RolId = 1 });
            await context.SaveChangesAsync();
            var controller = new UserController(context);

            // Act
            var result = await controller.GetUser(1, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var user = Assert.IsType<UserDetailDto>(okResult.Value);

            // Assert
            Assert.Equal("Carlos", user.Name);
        }

        [Fact]
        public async Task GetUser_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var controller = new UserController(context);

            // Act
            var result = await controller.GetUser(999, CancellationToken.None);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        // ==============================
        //  CREATE USER
        // ==============================
        [Fact]
        public async Task CreateUser_ReturnsCreatedUser_WhenValid()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.Rol.Add(new Rol { Id = 1, Nombre = "Admin" });
            await context.SaveChangesAsync();

            var controller = new UserController(context);

            var dto = new UserCreateDto
            {
                Name = "Pedro",
                Identification = "123456",
                Email = "pedro@correo.com",
                Phone = 88888888,
                Gender = "Masculino",
                RolId = 1,
                Password = "abc12345"
            };

            // Act
            var result = await controller.CreateUser(dto, CancellationToken.None);

            // Debug: muestra información si no se crea correctamente
            if (result.Result is BadRequestObjectResult bad)
            {
                var message = System.Text.Json.JsonSerializer.Serialize(bad.Value);
                throw new Xunit.Sdk.XunitException($"BadRequest recibido: {message}");
            }
            else if (result.Result is ConflictObjectResult conflict)
            {
                var message = System.Text.Json.JsonSerializer.Serialize(conflict.Value);
                throw new Xunit.Sdk.XunitException($"Conflict recibido: {message}");
            }

            // Assert
            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var user = Assert.IsType<UserDetailDto>(created.Value);

            Assert.Equal("Pedro", user.Name);
        }


        [Fact]
        public void ValidateCreate_ReturnsError_WhenPasswordTooShort()
        {
            var dto = new UserCreateDto
            {
                Name = "Ana",
                Identification = "123",
                Email = "ana@test.com",
                Phone = 88888888,
                Gender = "Femenino",
                RolId = 1,
                Password = "123"
            };

            var result = UserValidator.ValidateCreate(dto);

            Assert.Equal("La contraseña debe tener al menos 8 caracteres.", result);
        }

        [Fact]
        public async Task CreateUser_ReturnsConflict_WhenEmailAlreadyExists()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ProyClinicaGuidoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            using var context = new ProyClinicaGuidoDbContext(options);

            // Crear rol válido
            var rol = new Rol { Id = 1, Nombre = "Admin" };
            context.Rol.Add(rol);
            await context.SaveChangesAsync();

            // Usuario existente con ese correo
            context.User.Add(new User
            {
                Name = "Juan",
                Identification = "12345",
                Email = "correo@existente.com",
                Phone = 88888888,
                Gender = "Masculino",
                RolId = 1,
                Password = "hashpassword",
                IsActive = true
            });
            await context.SaveChangesAsync();

            var controller = new UserController(context);

            // Nuevo usuario con el mismo correo (debe causar conflicto)
            var dto = new UserCreateDto
            {
                Name = "Pedro",
                Identification = "54321",
                Email = "correo@existente.com", //MISMO CORREO
                Phone = 88887777,
                Gender = "Masculino",
                RolId = 1,
                Password = "Password1"
            };

            // Act
            var result = await controller.CreateUser(dto, CancellationToken.None);

            // Assert
            var conflictResult = Assert.IsType<ConflictObjectResult>(result.Result);
            Assert.Equal(409, conflictResult.StatusCode);

            // Convertir el objeto anónimo a JSON
            var json = System.Text.Json.JsonSerializer.Serialize(conflictResult.Value);

            //  Normalizar acentos escapados (\u00E1 → á)
            var normalized = System.Text.RegularExpressions.Regex.Unescape(json);

            // Verificar que el mensaje esperado esté dentro del texto
            Assert.Contains("El correo ya está registrado.", normalized);
        }


        // ==============================
        //  UPDATE USER
        // ==============================
        [Fact]
        public async Task UpdateUser_ReturnsOk_WhenUserUpdated()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.Rol.Add(new Rol { Id = 1, Nombre = "Admin" });
            context.User.Add(new User
            {
                Id = 1,
                Name = "Sofia",
                Email = "sofia@correo.com",
                RolId = 1,
                Password = "123",
                IsActive = true
            });
            await context.SaveChangesAsync();

            var controller = new UserController(context);

            var dto = new UserUpdateDto
            {
                Id = 1,
                Name = "Sofia Actualizada",
                Email = "sofia@correo.com",
                RolId = 1,
                IsActive = true
            };

            // Act
            var result = await controller.UpdateUser(1, dto, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        // ==============================
        // DELETE USER
        // ==============================
        [Fact]
        public async Task DeleteUser_ReturnsNoContent_WhenSuccess()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.User.Add(new User { Id = 10, Name = "Mario", Email = "mario@correo.com", RolId = 1, IsActive = true });
            await context.SaveChangesAsync();

            var controller = new UserController(context);

            // Act
            var result = await controller.DeleteUser(10, CancellationToken.None);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteUser_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var controller = new UserController(context);

            // Act
            var result = await controller.DeleteUser(999, CancellationToken.None);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
