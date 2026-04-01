using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Threading;

namespace ProyectoClinica.SeleniumTests
{
    [TestClass]
    public class ClinicUiTests
    {
        private IWebDriver _driver;


        private const string BaseUrl = "http://localhost:5173";

        [TestInitialize]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.PageLoadStrategy = PageLoadStrategy.Normal;

            _driver = new ChromeDriver(options);
            _driver.Manage().Window.Maximize();
        }

        [TestCleanup]
        public void TearDown()
        {
            _driver?.Quit();
            _driver?.Dispose();
        }

        [TestMethod]
        public void HomePage_Should_Show_Title_Clinic()
        {
            // 1. Navegar al frontend
            _driver.Navigate().GoToUrl(BaseUrl);

            // 2. Esperar mientras carga (solo para pruebas simples)
            Thread.Sleep(2000);

            // 3. Verificar el título de la página
            string title = _driver.Title;

            // Ajustá el texto exacto según tu aplicación
            StringAssert.Contains(title, "proyectanalisis", "El título de la página no contiene 'Clinica'.");
        }
    }
}
