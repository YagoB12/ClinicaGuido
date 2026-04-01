// Utils/JwtUtil.cs
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProyectoAnalisisClinica.Models.Entities;
using ProyectoAnalisisClinica.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProyectoAnalisisClinica.Utils
{
    public class JwtUtil
    {
        private readonly IConfiguration _configuration;

        public JwtUtil(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            if (user.Rol == null || string.IsNullOrWhiteSpace(user.Rol.Nombre))
                throw new InvalidOperationException("El usuario no tiene rol asignado.");

            var jwtSection = _configuration.GetSection("Jwt");
            var issuer = jwtSection["Issuer"];
            var audience = jwtSection["Audience"];
            var keyRaw = jwtSection["Key"];
            var expireMinutes = Convert.ToDouble(jwtSection["ExpireMinutes"]);

            if (string.IsNullOrWhiteSpace(keyRaw))
                throw new InvalidOperationException("Jwt:Key no está configurado.");

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyRaw));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, user.Rol.Nombre),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            if (RolePermissions.Map.TryGetValue(user.Rol.Nombre, out var perms))
            {
                foreach (var p in perms.Distinct())
                    claims.Add(new Claim("perm", p));
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
