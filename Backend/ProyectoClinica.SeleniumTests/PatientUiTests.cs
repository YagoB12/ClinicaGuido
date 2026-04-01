using System;
using System.Threading;
using System.IO;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;

namespace ProyectoClinica.SeleniumTests
{
    [TestClass]
    public class PatientUiTests
    {
        private IWebDriver _driver = null!;
        private WebDriverWait _wait = null!;

        private const string BaseRoot = "http://localhost:5173";
        private const string LoginUrl = BaseRoot + "/login";
        private const string PatientsUrl = BaseRoot + "/patients";

        private const string AdminEmail = "admin@clinica.com";
        private const string AdminPassword = "Admin123";

        [TestInitialize]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.AddArgument("--start-maximized");

            _driver = new ChromeDriver(options);
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(15));
        }

        [TestCleanup]
        public void TearDown()
        {
            _driver.Quit();
        }

        private void DoLoginAdmin()
        {
            _driver.Navigate().GoToUrl(LoginUrl);

            var emailInput = _wait.Until(ExpectedConditions.ElementIsVisible(By.Id("email")));
            var passwordInput = _driver.FindElement(By.Id("password"));
            var submitBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));

            emailInput.Clear();
            emailInput.SendKeys(AdminEmail);

            passwordInput.Clear();
            passwordInput.SendKeys(AdminPassword);

            submitBtn.Click();

            // Esperar a que la UI muestre navegación/tabla indicando login exitoso
            _wait.Until(d => !d.Url.Contains("/login"));
        }

        // Input después de un label (helper)
        private IWebElement InputAfterLabel(string labelText)
        {
            var label = _wait.Until(d => d.FindElement(By.XPath($"//label[normalize-space()='{labelText}']")));
            return label.FindElement(By.XPath("following::input[1]"));
        }

        private IWebElement TextareaAfterLabel(string labelText)
        {
            var label = _wait.Until(d => d.FindElement(By.XPath($"//label[normalize-space()='{labelText}']")));
            return label.FindElement(By.XPath("following::textarea[1]"));
        }

        private void SelectAfterLabel(string labelText, string optionText)
        {
            var select = _wait.Until(d => d.FindElement(By.XPath($"//label[normalize-space()='{labelText}']/following::select[1]")));
            var option = select.FindElement(By.XPath($".//option[normalize-space()='{optionText}']"));
            option.Click();
        }

        private IWebElement FindPatientRowByName(string name)
        {
            // Buscar fila por nombre dentro de la tabla de pacientes.
            // Usar un XPath más tolerante y un wait más largo porque la lista puede tardar en cargarse.
            var waitLong = new WebDriverWait(_driver, TimeSpan.FromSeconds(30));
            var xpath = $"//table//tbody//tr[.//td[contains(normalize-space(.), '{name}')]]";
            return waitLong.Until(d => d.FindElement(By.XPath(xpath)));
        }

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

        private string CreateTestPatient()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(PatientsUrl);

            // Abrir formulario de agregar (botón con texto)
            var addBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[normalize-space()='Agregar Paciente']")));
            addBtn.Click();

            var suffix = Guid.NewGuid().ToString("N")[..6];
            string uniqueName = "Paciente Selenium " + suffix;
            // Identification must be 9-12 digits (validation). Generate a 10-digit numeric id.
            var rnd = new Random();
            string uniqueId = string.Concat(Enumerable.Range(0, 10).Select(_ => rnd.Next(0, 10).ToString()));

            InputAfterLabel("Nombre *").SendKeys(uniqueName);
            InputAfterLabel("Identificación *").SendKeys(uniqueId);
            InputAfterLabel("Correo *").SendKeys($"{suffix}@example.com");
            InputAfterLabel("Teléfono *").SendKeys("12345678");

            // Estado civil (select) - requerido
            try { SelectAfterLabel("Estado civil *", "Soltero/a"); } catch { }

            // Contacto de emergencia (requerido)
            try { InputAfterLabel("Nombre contacto de emergencia *").SendKeys("Contacto Test"); } catch { }
            try { InputAfterLabel("Teléfono de emergencia *").SendKeys("87654321"); } catch { }

            // Fecha de nacimiento si existe un input
            try
            {
                var bd = _driver.FindElement(By.XPath("//label[normalize-space()='Fecha de nacimiento *']//following::input[1]"));
                var today = DateTime.Today.AddYears(-30).ToString("yyyy-MM-dd");
                SetReactDateInputValue(bd, today);
            }
            catch { }

            // Descripción / dirección
            try { TextareaAfterLabel("Dirección *").SendKeys("Calle Falsa 123"); } catch { }

            // Subir una foto de prueba (archivo temporal PNG 1x1)
            string tmpPath = null;
            try
            {
                var pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
                tmpPath = Path.Combine(Path.GetTempPath(), $"patient_photo_{suffix}.png");
                File.WriteAllBytes(tmpPath, Convert.FromBase64String(pngBase64));
                try
                {
                    // Prefer input with name 'photo' if present
                    var fileInput = _driver.FindElements(By.CssSelector("input[type='file'][name='photo']")).FirstOrDefault();
                    if (fileInput == null)
                    {
                        fileInput = _driver.FindElement(By.XPath("//label[normalize-space()='Foto']/following::input[@type='file'][1]"));
                    }
                    fileInput.SendKeys(tmpPath);
                }
                catch (Exception fe)
                {
                    Console.WriteLine("DEBUG: Failed to set file input: " + fe.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("DEBUG: Failed to create/upload temp photo: " + e.Message);
            }

            // Enviar
            var submit = _driver.FindElement(By.CssSelector("button[type='submit']"));
            submit.Click();

            // Esperar popup de confirmación (SweetAlert)
            var popup = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));

            // Verificar que el popup indica éxito; si no, volcar información y fallar la prueba temprano.
            try
            {
                var popupText = popup.Text ?? "";
                var hasSuccessIcon = popup.FindElements(By.CssSelector(".swal2-icon-success")).Count > 0;
                var isSuccess = hasSuccessIcon || popupText.Contains("Paciente creado correctamente") || popupText.Contains("Éxito");
                if (!isSuccess)
                {
                    Console.WriteLine("DEBUG: SweetAlert indicates failure or unexpected content:\n" + popupText);
                    try
                    {
                        var bodyTextOnFail = ((IJavaScriptExecutor)_driver).ExecuteScript("return document.body.innerText") as string ?? "";
                        Console.WriteLine("DEBUG: BODY_ON_FAIL_SNIPPET:\n" + (bodyTextOnFail.Length > 2000 ? bodyTextOnFail.Substring(0, 2000) : bodyTextOnFail));
                    }
                    catch { }
                    throw new Exception("Patient creation failed according to SweetAlert: " + popupText);
                }
            }
            catch (Exception ex)
            {
                // Rethrow to fail the test with diagnostic info
                throw;
            }

            // Aceptar el popup de éxito
            var ok = popup.FindElement(By.CssSelector(".swal2-confirm"));
            ok.Click();

            // Volver a la lista y buscar por nombre
            _wait.Until(d => d.Url.Contains("/patients"));

            // Asegurar que la lista se cargue: intentar activar la pestaña "Lista de Pacientes"
            try
            {
                var listTab = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[normalize-space()='Lista de Pacientes']")));
                listTab.Click();
            }
            catch
            {
                // Si no existe la pestaña (la vista ya muestra la lista), forzar recarga como fallback
                try { _driver.Navigate().Refresh(); } catch { }
            }

            // Esperar y retornar nombre único para aserciones posteriores
            // Debug: dump table HTML and page body to help diagnose missing row
            try
            {
                Console.WriteLine("DEBUG: Current URL => " + _driver.Url);
                try
                {
                    var table = _driver.FindElement(By.CssSelector("table.patient-table"));
                    var html = table.GetAttribute("outerHTML");
                    Console.WriteLine("DEBUG: TABLE_HTML_START\n" + html + "\nDEBUG: TABLE_HTML_END");
                }
                catch (Exception te)
                {
                    Console.WriteLine("DEBUG: TABLE_HTML_NOT_FOUND: " + te.Message);
                }

                try
                {
                    var bodyText = ((IJavaScriptExecutor)_driver).ExecuteScript("return document.body.innerText") as string ?? "";
                    var snippet = bodyText.Length > 2000 ? bodyText.Substring(0, 2000) : bodyText;
                    Console.WriteLine("DEBUG: BODY_TEXT_SNIPPET:\n" + snippet);
                }
                catch (Exception be)
                {
                    Console.WriteLine("DEBUG: BODY_TEXT_FAILED: " + be.Message);
                }
            }
            catch { }

            // Cleanup: remove temporary photo file if it was created
            try
            {
                if (!string.IsNullOrEmpty(tmpPath) && File.Exists(tmpPath))
                {
                    File.Delete(tmpPath);
                }
            }
            catch (Exception de)
            {
                Console.WriteLine("DEBUG: Failed to delete temp photo: " + de.Message);
            }

            return uniqueName;
        }

        [TestMethod]
        public void Create_Patient_Should_Show_Success_And_Appear_In_List()
        {
            var uniqueName = CreateTestPatient();

            var row = FindPatientRowByName(uniqueName);
            Assert.IsNotNull(row, "El paciente recién creado no aparece en la lista.");
        }

        [TestMethod]
        public void Create_Patient_Without_Name_Should_Show_Validation_Warning()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(PatientsUrl);

            var addBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[normalize-space()='Agregar Paciente']")));
            addBtn.Click();

            // Rellenar sólo identificación y enviar
            InputAfterLabel("Identificación *").SendKeys("X12345");
            var submit = _driver.FindElement(By.CssSelector("button[type='submit']"));
            submit.Click();

            // Esperar popup de validación
            var popup = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));
            StringAssert.Contains(popup.Text, "El nombre es requerido", "No se mostró el mensaje de validación para nombre requerido.");
        }

        [TestMethod]
        public void Edit_Patient_Should_Update_Fields_And_Show_Success()
        {
            var uniqueName = CreateTestPatient();

            // Buscar fila y hacer clic en Editar
            var row = FindPatientRowByName(uniqueName);
            var editBtn = row.FindElement(By.XPath(".//button[contains(., 'Editar') or contains(., 'Editar Paciente')]"));
            editBtn.Click();

            // Esperar modal/form de edición
            var nameInput = _wait.Until(d => d.FindElement(By.XPath("//label[normalize-space()='Nombre']/following::input[1]")));
            nameInput.Clear();
            string newName = uniqueName + " Editado";
            nameInput.SendKeys(newName);

            var saveBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));
            saveBtn.Click();

            var popup = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));
            var ok = popup.FindElement(By.CssSelector(".swal2-confirm"));
            ok.Click();

            // Volver a buscar la fila con nuevo nombre
            var updatedRow = FindPatientRowByName(newName);
            Assert.IsNotNull(updatedRow, "El paciente no aparece con el nombre editado.");
        }

        [TestMethod]
        public void Delete_Patient_Should_Remove_Row_From_List()
        {
            var uniqueName = CreateTestPatient();

            var row = FindPatientRowByName(uniqueName);
            var deleteBtn = row.FindElement(By.XPath(".//button[contains(., 'Eliminar')]"));
            deleteBtn.Click();

            // Confirmar la acción en el primer SweetAlert
            var confirm = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));
            confirm.FindElement(By.CssSelector(".swal2-confirm")).Click();

            // Esperar al popup de resultado (éxito) y cerrarlo, si aparece
            try
            {
                var resultPopup = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));
                // Si hay un mensaje de éxito, cerrarlo
                var okBtn = resultPopup.FindElements(By.CssSelector(".swal2-confirm")).FirstOrDefault();
                if (okBtn != null) okBtn.Click();
                // Esperar que desaparezcan los popups
                _wait.Until(ExpectedConditions.InvisibilityOfElementLocated(By.CssSelector(".swal2-popup")));
            }
            catch
            {
                // Si no aparece un popup de resultado, continuar (el popup podría cerrarse automáticamente)
            }

            // Dar tiempo corto para que la lista se actualice y luego verificar que la fila ya no exista
            Thread.Sleep(500);
            var remaining = _driver.FindElements(By.XPath($"//table//tbody//tr[.//td[contains(normalize-space(.), '{uniqueName}')]]"));
            Assert.AreEqual(0, remaining.Count, "El paciente no fue eliminado de la lista.");
        }

        [TestMethod]
        public void Create_Patient_Without_Identification_Should_Show_Validation_Warning()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(PatientsUrl);

            var addBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[normalize-space()='Agregar Paciente']")));
            addBtn.Click();

            // Rellenar nombre y correo, omitir identificación
            InputAfterLabel("Nombre *").SendKeys("Paciente Sin ID");
            InputAfterLabel("Correo *").SendKeys("noid@example.com");

            var submit = _driver.FindElement(By.CssSelector("button[type='submit']"));
            submit.Click();

            // Esperar popup de validación
            var popup = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector(".swal2-popup")));
            StringAssert.Contains(popup.Text, "La identificación es requerida", "No se mostró el mensaje de validación para identificación requerida.");
        }
    }
}
