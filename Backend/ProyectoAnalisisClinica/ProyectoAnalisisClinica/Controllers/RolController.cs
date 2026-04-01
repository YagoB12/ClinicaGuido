using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProyectoAnalisisClinica.Data;
using ProyectoAnalisisClinica.Models.Entities;

namespace ProyectoAnalisisClinica.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolController : ControllerBase
    {
        private readonly ProyClinicaGuidoDbContext _context;

        public RolController(ProyClinicaGuidoDbContext context)
        {
            _context = context;
        }

        //GET: api/rol
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Rol>>> GetRoles()
        {
            var roles = await _context.Rol.ToListAsync();
            return Ok(roles);
        }
    }
}
