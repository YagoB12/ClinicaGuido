using System;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;

namespace ProyectoClinica.SeleniumTests
{
    [TestClass]
    public class LoginUiTests
    {
        private IWebDriver _driver = null!;
        private WebDriverWait _wait = null!;

      
        private const string BaseUrl = "http://localhost:5173/login";

      
        private const string AdminEmail = "admin@clinica.com";
        private const string AdminPassword = "Admin123";

        [TestInitialize]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.AddArgument("--start-maximized");

            _driver = new ChromeDriver(options);
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
        }

        [TestCleanup]
        public void TearDown()
        {
            _driver.Quit();
        }

        // Helper para hacer login
        private void DoLogin(string email, string password)
        {
            _driver.Navigate().GoToUrl(BaseUrl);

            var emailInput = _driver.FindElement(By.Id("email"));
            var passwordInput = _driver.FindElement(By.Id("password"));
            var submitBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));

            emailInput.Clear();
            emailInput.SendKeys(email);

            passwordInput.Clear();
            passwordInput.SendKeys(password);

            submitBtn.Click();
        }

        // 1) Login OK con Admin → debe ir a /users
        [TestMethod]
        public void Login_Admin_Should_Navigate_To_Users()
        {
            DoLogin(AdminEmail, AdminPassword);

            // Espera a que cambie de ruta
            _wait.Until(d => d.Url.Contains("/users") || d.Url.EndsWith("/users/"));

            StringAssert.Contains(_driver.Url, "/users", "Después del login de Admin no se redirigió a /users.");
        }

        // 2) Credenciales inválidas → debe mostrar el SweetAlert de error
        [TestMethod]
        public void Login_InvalidPassword_Should_Show_ErrorAlert()
        {
            DoLogin(AdminEmail, "Contraseña_Incorrecta_123!");

            // Esperar al popup de SweetAlert2
            var popup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );

            var text = popup.Text;
            StringAssert.Contains(
                text,
                "Correo o contraseña incorrectos",
                "No se mostró el mensaje de error esperado."
            );
        }

        // 3) Debe requerir email (campo requerido)
        [TestMethod]
        public void Login_Should_Require_Email()
        {
            _driver.Navigate().GoToUrl(BaseUrl);

            var emailInput = _driver.FindElement(By.Id("email"));
            var passwordInput = _driver.FindElement(By.Id("password"));
            var submitBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));

            // Solo llenamos password
            passwordInput.SendKeys("algo");
            submitBtn.Click();

            // Navegadores con HTML5 exponen validationMessage
            var validationMsg = emailInput.GetAttribute("validationMessage");

            Assert.IsFalse(
                string.IsNullOrWhiteSpace(validationMsg),
                "El campo email no mostró mensaje de validación (debería ser requerido)."
            );
        }

        // 4) Debe requerir password (campo requerido)
        [TestMethod]
        public void Login_Should_Require_Password()
        {
            _driver.Navigate().GoToUrl(BaseUrl);

            var emailInput = _driver.FindElement(By.Id("email"));
            var passwordInput = _driver.FindElement(By.Id("password"));
            var submitBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));

            // Solo llenamos email
            emailInput.SendKeys("user@clinica.com");
            submitBtn.Click();

            var validationMsg = passwordInput.GetAttribute("validationMessage");

            Assert.IsFalse(
                string.IsNullOrWhiteSpace(validationMsg),
                "El campo contraseña no mostró mensaje de validación (debería ser requerido)."
            );
        }

        // 5) El campo email debe ser de tipo email (HTML5)
        [TestMethod]
        public void Login_Email_Field_Should_Be_Type_Email()
        {
            _driver.Navigate().GoToUrl(BaseUrl);

            var emailInput = _driver.FindElement(By.Id("email"));
            var type = emailInput.GetAttribute("type");

            Assert.AreEqual(
                "email",
                type,
                "El input de correo electrónico no es de tipo 'email'."
            );
        }
    }
}
