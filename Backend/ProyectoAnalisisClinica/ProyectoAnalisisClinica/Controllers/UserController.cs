using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;
using ProyectoAnalisisClinica.Utils.Validators;


namespace ProyectoAnalisisClinica.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = Perms.Users_Manage)] // SOLO Admin (según tu RolePermissions)
    public class UserController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _context;

        public UserController(ProyClinicaGuidoDbContext context)
        {
            _context = context;
        }

        // GET: api/user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDetailDto>>> GetUsers(CancellationToken ct)
        {
            var users = await _context.User
                .AsNoTracking()
                .Include(u => u.Rol)
                .Where(u => u.IsActive) // solo activos
                .Select(u => new UserDetailDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Identification = u.Identification,
                    Phone = u.Phone,
                    Gender = u.Gender,
                    RolId = u.RolId,
                    IsActive = u.IsActive,
                    RolNombre = u.Rol != null ? u.Rol.Nombre : null
                })
                .ToListAsync(ct);

            return Ok(users);
        }

        // GET: api/user/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserDetailDto>> GetUser(int id, CancellationToken ct)
        {
            var user = await _context.User
                .AsNoTracking()
                .Include(u => u.Rol)
                .Where(u => u.Id == id)
                .Select(u => new UserDetailDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Identification = u.Identification,
                    Phone = u.Phone,
                    Gender = u.Gender,
                    IsActive = u.IsActive,
                    RolId = u.RolId,
                    RolNombre = u.Rol != null ? u.Rol.Nombre : null
                })
                .FirstOrDefaultAsync(ct);

            if (user is null) return NotFound();
            return Ok(user);
        }

        // POST: api/user
        [HttpPost]
        public async Task<ActionResult<UserDetailDto>> CreateUser([FromBody] UserCreateDto dto, CancellationToken ct)
        {
            if (dto is null)
                return BadRequest(new { message = "Solicitud inválida." });

            // Validación centralizada
            var validationError = UserValidator.ValidateCreate(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            //Validar que el rol exista
            var rolExists = await _context.Rol.AnyAsync(r => r.Id == dto.RolId, ct);
            if (!rolExists)
                return BadRequest(new { message = "Rol inválido." });

            // Normalizar correo
            var email = dto.Email.Trim().ToLowerInvariant();

            // Verificar duplicado de correo
            var emailTaken = await _context.User.AnyAsync(u => u.Email.ToLower() == email, ct);
            if (emailTaken)
                return Conflict(new { message = "El correo ya está registrado." });

            //  Crear usuario
            var user = new User
            {
                Name = dto.Name.Trim(),
                Identification = dto.Identification.Trim(),
                Email = email,
                Phone = dto.Phone,
                Gender = dto.Gender.Trim(),
                IsActive = true,
                RolId = dto.RolId,
                Password = PasswordHasher.HashPassword(dto.Password)
            };

            _context.User.Add(user);
            await _context.SaveChangesAsync(ct);

            //  Preparar respuesta
            var result = new UserDetailDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Identification = user.Identification,
                Phone = user.Phone,
                Gender = user.Gender,
                IsActive = dto.IsActive,
                RolId = user.RolId,
                RolNombre = await _context.Rol
                    .Where(r => r.Id == user.RolId)
                    .Select(r => r.Nombre)
                    .FirstOrDefaultAsync(ct)
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, result);
        }


        // PUT: api/user/5
        // Actualiza datos generales y rol. Si viene Password no vacía, la re-hasheo.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateDto dto, CancellationToken ct)
        {
            if (dto is null)
                return BadRequest(new { message = "Solicitud inválida." });

            if (id != dto.Id)
                return BadRequest(new { message = "El ID no coincide." });

            //  Validación centralizada
            var validationError = UserValidator.ValidateUpdate(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            // Buscar usuario
            var user = await _context.User.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (user is null)
                return NotFound();

            //  Correo: validar duplicado si cambia
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var newEmail = dto.Email.Trim().ToLowerInvariant();

                if (!newEmail.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
                {
                    var taken = await _context.User.AnyAsync(u => u.Email.ToLower() == newEmail && u.Id != id, ct);
                    if (taken)
                        return Conflict(new { message = "El correo ya está registrado." });

                    user.Email = newEmail;
                }
            }

            //  Rol: validar que exista si se modifica
            if (dto.RolId.HasValue && dto.RolId.Value != user.RolId)
            {
                var rolExists = await _context.Rol.AnyAsync(r => r.Id == dto.RolId.Value, ct);
                if (!rolExists)
                    return BadRequest(new { message = "Rol inválido." });

                user.RolId = dto.RolId.Value;
            }

            //  Campos generales
            if (!string.IsNullOrWhiteSpace(dto.Name))
                user.Name = dto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Identification))
                user.Identification = dto.Identification.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Gender))
                user.Gender = dto.Gender.Trim();

            if (dto.Phone.HasValue)
                user.Phone = dto.Phone.Value;

            if (dto.IsActive.HasValue)
                user.IsActive = dto.IsActive.Value;

            // Contraseña (opcional)
            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.Password = PasswordHasher.HashPassword(dto.Password);

            await _context.SaveChangesAsync(ct);

            return Ok(new { message = "Usuario actualizado correctamente." });
        }


        // DELETE: api/user/5
        // Borrado lógico (IsActive = false)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
        {
            var user = await _context.User.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (user is null) return NotFound();

            if (!user.IsActive) return NoContent(); // ya está inactivo

            user.IsActive = false;
            await _context.SaveChangesAsync(ct);
            return NoContent();
        }
    }

    // ===================== DTOs =====================

    public class UserListDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Identification { get; set; }
        public string? Email { get; set; }
        public int Phone { get; set; }
        public string? Gender { get; set; }
        public int RolId { get; set; }
        public string? RolNombre { get; set; }



    }

    public class UserDetailDto : UserListDto
    {
        public bool IsActive { get; set; }
    }

    public class UserCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Identification { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Phone { get; set; }
        public string Gender { get; set; } = string.Empty;
        public int RolId { get; set; }
        public string Password { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class UserUpdateDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Identification { get; set; }
        public string? Email { get; set; }
        public int? Phone { get; set; }
        public string? Gender { get; set; }
        public bool? IsActive { get; set; }
        public int? RolId { get; set; }
        public string? Password { get; set; } // si viene, la re-hasheo
    }
}
