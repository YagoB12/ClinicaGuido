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
    public class MedicineUiTests
    {
        private IWebDriver _driver = null!;
        private WebDriverWait _wait = null!;

        private const string BaseRoot = "http://localhost:5173";
        private const string LoginUrl = BaseRoot + "/login";
        private const string MedicinesUrl = BaseRoot + "/medicines";

        private const string AdminEmail = "admin@clinica.com";
        private const string AdminPassword = "Admin123";

        [TestInitialize]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.AddArgument("--start-maximized");

            _driver = new ChromeDriver(options);

            // Timeout más alto para Jenkins
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(25));
        }

        [TestCleanup]
        public void TearDown()
        {
            _driver.Quit();
        }

        private void DoLoginAdmin()
        {
            _driver.Navigate().GoToUrl(LoginUrl);

            var emailInput = _driver.FindElement(By.Id("email"));
            var passwordInput = _driver.FindElement(By.Id("password"));
            var submitBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));

            emailInput.Clear();
            emailInput.SendKeys(AdminEmail);

            passwordInput.Clear();
            passwordInput.SendKeys(AdminPassword);

            submitBtn.Click();

            _wait.Until(d => !d.Url.Contains("/login"));

            Assert.IsFalse(
                _driver.Url.Contains("/login"),
                "El login no fue exitoso; el navegador sigue en la página de inicio de sesión."
            );
        }

        // ========= Helpers de UI =========

        // Input después de un label
        private IWebElement InputAfterLabel(string labelText)
        {
            var label = _driver.FindElement(
                By.XPath($"//label[normalize-space()='{labelText}']")
            );
            return label.FindElement(By.XPath("following::input[1]"));
        }

        // Textarea después de un label
        private IWebElement TextareaAfterLabel(string labelText)
        {
            var label = _driver.FindElement(
                By.XPath($"//label[normalize-space()='{labelText}']")
            );
            return label.FindElement(By.XPath("following::textarea[1]"));
        }

        // Input de búsqueda de la tabla de medicinas
        private IWebElement SearchInput()
        {
            return _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    // placeholder comienza con "Nombre, presentación..."
                    By.CssSelector("input[placeholder^='Nombre, presentación']")
                )
            );
        }

        // Aplica filtro por nombre en el buscador
        private void FilterMedicineByName(string name)
        {
            var search = SearchInput();
            search.Clear();
            search.SendKeys(name);

            // pequeño delay por si el front tiene debounce
            Thread.Sleep(500);
        }

        // Busca y devuelve la fila que contiene ese nombre (usando el buscador)
        private IWebElement FindMedicineRowByName(string name)
        {
            FilterMedicineByName(name);

            return _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    By.XPath($"//table//tbody//tr[td/div[contains(., '{name}')]]")
                )
            );
        }

        // ========= Flujo común: crear medicina =========

        private string CreateTestMedicine()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(MedicinesUrl);

            _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    By.XPath("//h1[contains(., 'Inventario de Medicamentos')]")
                )
            );

            var addTab = _wait.Until(
                ExpectedConditions.ElementToBeClickable(
                    By.XPath("//button[normalize-space()='Agregar Medicamento']")
                )
            );
            addTab.Click();

            var nameInput = InputAfterLabel("Nombre *");
            var suffix = Guid.NewGuid().ToString("N")[..8]; // 8 chars
            string uniqueName = $"Ibuprofeno Selenium {suffix}";
            nameInput.Clear();
            nameInput.SendKeys(uniqueName);

            var presInput = InputAfterLabel("Presentación");
            presInput.Clear();
            presInput.SendKeys("Tabletas");

            var qtyInput = InputAfterLabel("Cantidad disponible *");
            qtyInput.Clear();
            qtyInput.SendKeys("50");

            var concInput = InputAfterLabel("Concentración");
            concInput.Clear();
            concInput.SendKeys("400");

            var today = DateTime.Today;
            string prep = today.ToString("yyyy-MM-dd");
            string exp = today.AddMonths(6).ToString("yyyy-MM-dd");

            var prepInput = InputAfterLabel("Preparación");
            var expInput = InputAfterLabel("Expiración");

            SetReactDateInputValue(prepInput, prep);
            SetReactDateInputValue(expInput, exp);

            var descArea = TextareaAfterLabel("Descripción");
            descArea.Clear();
            descArea.SendKeys("Medicamento de prueba automatizada.");

            var submitBtn = _driver.FindElement(By.CssSelector("button.btn-primary[type='submit']"));
            submitBtn.Click();

            var popup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );

            Assert.IsTrue(
                popup.Text.Contains("Medicamento registrado"),
                "No apareció el mensaje de éxito esperado. Texto actual: " + popup.Text
            );

            var okBtn = _driver.FindElement(By.CssSelector(".swal2-confirm"));
            okBtn.Click();

            _wait.Until(d => d.Url.Contains("/medicines"));

            // Ahora usamos el buscador para encontrar la fila, sin depender de la página
            FindMedicineRowByName(uniqueName);

            return uniqueName;
        }

        // ========= Tests =========

        [TestMethod]
        public void Create_Medicine_Should_Show_Success_And_Appear_In_List()
        {
            var uniqueName = CreateTestMedicine();

            var row = FindMedicineRowByName(uniqueName);

            Assert.IsNotNull(row, "El medicamento recién creado no aparece en la lista.");
        }

        [TestMethod]
        public void Create_Medicine_Without_Name_Should_Show_Validation_Warning()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(MedicinesUrl);

            var addTab = _driver.FindElement(By.XPath("//button[normalize-space()='Agregar Medicamento']"));
            addTab.Click();

            var qtyInput = InputAfterLabel("Cantidad disponible *");
            qtyInput.SendKeys("10");

            var submitBtn = _driver.FindElement(By.CssSelector("button.btn-primary[type='submit']"));
            submitBtn.Click();

            var popup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );

            StringAssert.Contains(
                popup.Text,
                "El nombre es requerido",
                "No se mostró el mensaje de validación para nombre requerido."
            );
        }

        [TestMethod]
        public void Create_Medicine_Without_Quantity_Should_Show_Validation_Warning()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(MedicinesUrl);

            var addTab = _driver.FindElement(By.XPath("//button[normalize-space()='Agregar Medicamento']"));
            addTab.Click();

            var nameInput = InputAfterLabel("Nombre *");
            nameInput.SendKeys("Medicamento sin cantidad Selenium");

            var submitBtn = _driver.FindElement(By.CssSelector("button.btn-primary[type='submit']"));
            submitBtn.Click();

            var popup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );

            StringAssert.Contains(
                popup.Text,
                "La cantidad disponible es requerida",
                "No se mostró el mensaje de validación para cantidad requerida."
            );
        }

        [TestMethod]
        public void Edit_Medicine_Should_Update_Fields_And_Show_Success()
        {
            var uniqueName = CreateTestMedicine();

            // Buscar la fila a través del buscador
            var row = FindMedicineRowByName(uniqueName);

            var editBtn = row.FindElement(By.XPath(".//button[contains(., 'Editar')]"));
            editBtn.Click();

            _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    By.XPath("//div[contains(@class,'modal')]//h2[contains(., 'Editar Medicamento')]")
                )
            );

            var qtyInput = InputAfterLabel("Cantidad disponible *");
            qtyInput.Clear();
            qtyInput.SendKeys("75");

            var concInput = InputAfterLabel("Concentración");
            concInput.Clear();
            concInput.SendKeys("600");

            var saveBtn = _driver.FindElement(
                By.XPath("//div[contains(@class,'modal')]//button[@type='submit' and normalize-space()='Guardar cambios']")
            );
            saveBtn.Click();

            var confirmPopup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );
            Assert.IsTrue(
                confirmPopup.Text.Contains("Se guardarán los cambios de este medicamento."),
                "No apareció el Swal de confirmación esperado. Texto: " + confirmPopup.Text
            );

            var confirmBtn = _driver.FindElement(By.CssSelector(".swal2-confirm"));
            confirmBtn.Click();

            var successPopup = _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    By.XPath("//div[contains(@class,'swal2-popup') and contains(., 'Medicamento actualizado correctamente.')]")
                )
            );
            Assert.IsTrue(
                successPopup.Text.Contains("Medicamento actualizado correctamente."),
                "No apareció el mensaje de éxito esperado al actualizar. Texto: " + successPopup.Text
            );

            var successOk = _driver.FindElement(By.CssSelector(".swal2-confirm"));
            successOk.Click();

            _wait.Until(d => d.Url.Contains("/medicines"));

            // Volvemos a buscar la fila (por si cambió de página)
            var updatedRow = FindMedicineRowByName(uniqueName);

            var qtyText = updatedRow.FindElement(By.XPath("./td[3]")).Text.Trim();
            var concText = updatedRow.FindElement(By.XPath("./td[4]")).Text.Trim();

            Assert.AreEqual("75", qtyText, "La cantidad no se actualizó en la tabla.");
            Assert.AreEqual("600", concText, "La concentración no se actualizó en la tabla.");
        }

        [TestMethod]
        public void Delete_Medicine_Should_Remove_Row_From_List()
        {
            var uniqueName = CreateTestMedicine();

            // Buscar la fila usando el buscador
            var row = FindMedicineRowByName(uniqueName);

            var deleteBtn = row.FindElement(By.XPath(".//button[contains(., 'Eliminar')]"));
            deleteBtn.Click();

            var confirmPopup = _wait.Until(
                ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup"))
            );
            Assert.IsTrue(
                confirmPopup.Text.Contains("¿Deseas eliminar este medicamento?"),
                "No apareció el Swal de confirmación de eliminación. Texto: " + confirmPopup.Text
            );

            var confirmBtn = _driver.FindElement(By.CssSelector(".swal2-confirm"));
            confirmBtn.Click();

            var successPopup = _wait.Until(
                ExpectedConditions.ElementIsVisible(
                    By.XPath("//div[contains(@class,'swal2-popup') and contains(., 'Medicamento eliminado correctamente.')]")
                )
            );
            Assert.IsTrue(
                successPopup.Text.Contains("Medicamento eliminado correctamente."),
                "No apareció el mensaje de éxito esperado al eliminar. Texto: " + successPopup.Text
            );

            var successOk = _driver.FindElement(By.CssSelector(".swal2-confirm"));
            successOk.Click();

            _wait.Until(
                ExpectedConditions.InvisibilityOfElementLocated(By.CssSelector(".swal2-popup"))
            );

            // Verificamos que, al filtrar por el nombre, ya no exista ninguna fila
            _wait.Until(d =>
            {
                FilterMedicineByName(uniqueName);
                var remaining = d.FindElements(
                    By.XPath($"//table//tbody//tr[td/div[contains(., '{uniqueName}')]]")
                );
                return remaining.Count == 0;
            });

            var finalRemaining = _driver.FindElements(
                By.XPath($"//table//tbody//tr[td/div[contains(., '{uniqueName}')]]")
            );
            Assert.AreEqual(0, finalRemaining.Count, "El medicamento no fue eliminado de la lista.");
        }

        // ========= Helper para inputs date controlados por React =========

        private void SetReactDateInputValue(IWebElement input, string value)
        {
            var js = (IJavaScriptExecutor)_driver;
            js.ExecuteScript(@"
                var input = arguments[0];
                var newValue = arguments[1];
                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                nativeInputValueSetter.call(input, newValue);
                var event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            ", input, value);
        }
    }
}
