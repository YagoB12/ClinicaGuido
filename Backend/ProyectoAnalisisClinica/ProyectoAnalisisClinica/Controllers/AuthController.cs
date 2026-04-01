using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;

namespace ProyectoAnalisisClinica.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _context;
        private readonly JwtUtil _jwtUtil;

        public AuthController(ProyClinicaGuidoDbContext context, JwtUtil jwtUtil)
        {
            _context = context;
            _jwtUtil = jwtUtil;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest model, CancellationToken ct)
        {
            if (model is null || string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Correo y contraseña son requeridos." });

            var email = model.Email.Trim().ToLowerInvariant();

            // Solo lectura → AsNoTracking
            var user = await _context.User
                .AsNoTracking()
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

            if (user is null)
                return Unauthorized(new { message = "Correo o contraseña incorrectos." });

            // Verificación de contraseña (hash)
            if (!PasswordHasher.VerifyPassword(model.Password, user.Password))
                return Unauthorized(new { message = "Correo o contraseña incorrectos." });

            if (!user.IsActive)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "La cuenta está inactiva." });

            if (user.Rol is null || string.IsNullOrWhiteSpace(user.Rol.Nombre))
                return StatusCode(StatusCodes.Status409Conflict, new { message = "El usuario no tiene un rol asignado." });

            var token = _jwtUtil.GenerateToken(user);

         
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    rol = user.Rol.Nombre
                }
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
