using Xunit;

namespace ProyectoClinica.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Sumar_DosNumeros_RetornaResultadoCorrecto()
        {
            // Arrange
            int a = 2, b = 3;

            // Act
            int resultado = a + b;

            // Assert
            Assert.Equal(5, resultado);
        }
    }
}
