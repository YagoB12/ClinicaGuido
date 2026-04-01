using System.Security.Cryptography;
using System.Text;

namespace ProyectoAnalisisClinica.Utils
{
    public static class PasswordHasher
    {
        /// Genera un hash SHA256 a partir de la contraseña.
        public static string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("La contraseña no puede estar vacía.", nameof(password));

            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        
        /// Verifica si una contraseña sin cifrar coincide con su hash almacenado.
        public static bool VerifyPassword(string enteredPassword, string storedHash)
        {
            if (string.IsNullOrWhiteSpace(enteredPassword) || string.IsNullOrWhiteSpace(storedHash))
                return false;

            var hashedEntered = HashPassword(enteredPassword);
            return hashedEntered == storedHash;
        }
    }
}
