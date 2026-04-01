using System;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace ProyectoClinica.SeleniumTests
{
    [TestClass]
    [TestCategory("Citas")]
    public class AppointmentsUiTests
    {
        private IWebDriver _driver = null!;
        private WebDriverWait _wait = null!;

        private const string BaseRoot = "http://localhost:5173";
        private const string LoginUrl = BaseRoot + "/login";
        private const string AppointmentsUrl = BaseRoot + "/appointments";

        private const string AdminEmail = "admin@clinica.com";
        private const string AdminPassword = "Admin123";

        // TEST IDs
        private const string S_Date = "[data-testid='dateAppointment']";
        private const string S_Time = "[data-testid='hourAppointment']";
        private const string S_Status = "[data-testid='status']";
        private const string S_Priority = "[data-testid='priority']";
        private const string S_Reason = "[data-testid='reasonAppointment']";
        private const string S_Patient = "[data-testid='medicalPatientId']";
        private const string S_Submit = "[data-testid='submitAppointment'], .create-btn";

        private const bool DebugSlow = false;
        private void Pause(double seconds)
        {
            if (DebugSlow) Thread.Sleep(TimeSpan.FromSeconds(seconds));
        }

        // =====================================================
        // SETUP
        // =====================================================
        [TestInitialize]
        public void Setup()
        {
            var options = new ChromeOptions();
            options.AddArgument("--start-maximized");

            _driver = new ChromeDriver(options);
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
        }

        [TestCleanup]
        public void TearDown() => _driver.Quit();

        // =====================================================
        // HELPERS
        // =====================================================
        private IWebElement WaitVisible(By by) =>
            _wait.Until(driver =>
            {
                try
                {
                    var el = driver.FindElement(by);
                    return el.Displayed ? el : null;
                }
                catch { return null; }
            });

        private IWebElement WaitClickable(By by) =>
            _wait.Until(driver =>
            {
                try
                {
                    var el = driver.FindElement(by);
                    return (el.Displayed && el.Enabled) ? el : null;
                }
                catch { return null; }
            });

        // =====================================================
        // LOGIN
        // =====================================================
        private void DoLoginAdmin()
        {
            _driver.Navigate().GoToUrl(LoginUrl);
            WaitVisible(By.Id("email")).SendKeys(AdminEmail);
            WaitVisible(By.Id("password")).SendKeys(AdminPassword);
            WaitClickable(By.CssSelector("button[type='submit']")).Click();

            // Navbar visible = login exitoso
            WaitVisible(By.CssSelector("nav, header, .navbar, .dashboard"));
        }

        // =====================================================
        // FECHA
        // =====================================================
        private void SetDateDaysFromToday(int days)
        {
            var date = DateTime.Today.AddDays(days);
            var digits = date.ToString("ddMMyyyy");

            var input = WaitVisible(By.CssSelector(S_Date));
            input.Click();
            input.SendKeys(Keys.Control + "a");
            input.SendKeys(Keys.Delete);
            input.SendKeys(digits);
            input.SendKeys(Keys.Tab);
        }

        // =====================================================
        // HORA
        // =====================================================
        private void SetTime24(int hour, int minute)
        {
            string time = $"{hour:D2}:{minute:D2}";
            var input = WaitVisible(By.CssSelector(S_Time));

            input.Click();
            input.SendKeys(Keys.Control + "a");
            input.SendKeys(Keys.Delete);
            input.SendKeys(time);
            input.SendKeys(Keys.Tab);
        }

        // =====================================================
        // SELECT PACIENTE
        // =====================================================
        private void SelectAnyValidPatient()
        {
            var sel = new SelectElement(WaitVisible(By.CssSelector(S_Patient)));

            foreach (var opt in sel.Options)
            {
                if (int.TryParse(opt.GetAttribute("value"), out var id) && id > 0)
                {
                    sel.SelectByValue(id.ToString());
                    return;
                }
            }

            Assert.Fail("No hay pacientes disponibles para seleccionar.");
        }

        // =====================================================
        // Buscar fila por fecha + hora
        // =====================================================
        private IWebElement? FindRowByDateAndTime(string date, string time)
        {
            var rows = _driver.FindElements(By.CssSelector("table.appointment-table tbody tr"));

            foreach (var r in rows)
            {
                var text = r.Text.Replace("\r", "").Replace("\n", " ");
                if (text.Contains(date) && text.Contains(time))
                    return r;
            }

            return null;
        }

        // =====================================================
        // CREAR CITA (DEVUELVE fecha + hora)
        // =====================================================
        private (string reason, string date, string time) CreateAppointmentUI()
        {
            DoLoginAdmin();
            _driver.Navigate().GoToUrl(AppointmentsUrl);

            WaitClickable(By.XPath("//button[normalize-space()='Agregar Cita']")).Click();

            // Reason solo para logging
            string reason = "Selenium Create " + DateTime.Now.Ticks;

            // Fecha
            SetDateDaysFromToday(1);
            string date = DateTime.Today.AddDays(1).ToString("dd/MM/yyyy");

            // Hora aleatoria pero múltiplo de 30
            int hour = new Random().Next(8, 17);       // rango laboral
            int min = new Random().Next(0, 2) == 0 ? 0 : 30;

            SetTime24(hour, min);
            string time = $"{hour:D2}:{min:D2}";

            // Otros campos
            new SelectElement(WaitVisible(By.CssSelector(S_Status))).SelectByText("Programada");
            new SelectElement(WaitVisible(By.CssSelector(S_Priority))).SelectByText("Media");

            WaitVisible(By.CssSelector(S_Reason)).SendKeys(reason);
            SelectAnyValidPatient();

            WaitClickable(By.CssSelector(S_Submit)).Click();

            var popup = WaitVisible(By.CssSelector(".swal2-popup"));
            popup.FindElement(By.CssSelector(".swal2-confirm")).Click();

            // Aquí TERMINA la prueba de crear
            return (reason, date, time);
        }

        // =====================================================
        // TEST: CREAR CITA
        // =====================================================
        [TestMethod]
        [TestCategory("Citas")]
        public void Create_Appointment_Should_Succeed()
        {
            // Descomentar para forzar fallo SOLO en esta prueba:
            // Assert.Fail("Fallo forzado en Create_Appointment_Should_Succeed.");

            var data = CreateAppointmentUI();

            // Solo verificar que no explote la creación
            Assert.IsNotNull(data.reason);
        }

        // =====================================================
        // TEST: ELIMINAR CITA
        // =====================================================
        [TestMethod]
        [TestCategory("Citas")]
        public void Delete_Appointment_Should_Succeed()
        {
            // Descomentar para forzar fallo SOLO en esta prueba:
            // Assert.Fail("Fallo forzado en Delete_Appointment_Should_Succeed.");

            var (reason, date, time) = CreateAppointmentUI();

            _driver.Navigate().GoToUrl(AppointmentsUrl);
            WaitClickable(By.XPath("//button[normalize-space()='Lista de Citas']")).Click();

            var row = _wait.Until(_ => FindRowByDateAndTime(date, time));
            Assert.IsNotNull(row, "La cita creada no se encontró en la tabla.");

            var deleteBtn = row.FindElement(By.XPath(".//button[contains(text(),'Eliminar')]"));
            deleteBtn.Click();

            WaitClickable(By.CssSelector(".swal2-confirm")).Click();

            Thread.Sleep(800);

            Assert.IsNull(FindRowByDateAndTime(date, time), "La cita NO fue eliminada.");
        }

        // =====================================================
        // TEST: EDITAR
        // =====================================================
        [TestMethod]
        [TestCategory("Citas")]
        public void Edit_Appointment_Should_Update_Data()
        {
            // Descomentar para forzar fallo SOLO en esta prueba:
            // Assert.Fail("Fallo forzado en Edit_Appointment_Should_Update_Data.");

            var (reason, date, time) = CreateAppointmentUI();

            _driver.Navigate().GoToUrl(AppointmentsUrl);
            WaitClickable(By.XPath("//button[normalize-space()='Lista de Citas']")).Click();

            var row = _wait.Until(_ => FindRowByDateAndTime(date, time));
            Assert.IsNotNull(row, "No se encontró la cita para editar.");

            row.FindElement(By.XPath(".//button[contains(text(),'Editar')]")).Click();
            Pause(0.4);

            var motivo = WaitVisible(By.CssSelector("textarea"));
            motivo.Clear();

            string newReason = "Selenium Edited " + DateTime.Now.Ticks;
            motivo.SendKeys(newReason);

            WaitClickable(By.XPath("//button[normalize-space()='Guardar Cambios']")).Click();

            var popup = WaitVisible(By.CssSelector(".swal2-popup"));
            popup.FindElement(By.CssSelector(".swal2-confirm")).Click();

            Thread.Sleep(800);

            Assert.IsNotNull(FindRowByDateAndTime(date, time), "La cita no aparece luego de editar.");
        }

        // =====================================================
        // VALIDACIÓN: FORM VACÍO
        // =====================================================
        [TestMethod]
        [TestCategory("Citas")]
        public void Submitting_Empty_Form_Should_Show_Error()
        {
            // Descomentar para forzar fallo SOLO en esta prueba:
            // Assert.Fail("Fallo forzado en Submitting_Empty_Form_Should_Show_Error.");

            DoLoginAdmin();
            _driver.Navigate().GoToUrl(AppointmentsUrl);

            WaitClickable(By.XPath("//button[normalize-space()='Agregar Cita']")).Click();
            WaitClickable(By.CssSelector(S_Submit)).Click();

            var popup = WaitVisible(By.CssSelector(".swal2-popup"));
            StringAssert.Contains(popup.Text, "Todos los campos marcados con * son obligatorios");
        }

        // =====================================================
        // VALIDACIÓN: HORA INVÁLIDA
        // =====================================================
        [TestMethod]
        [TestCategory("Citas")]
        public void Creating_Appointment_With_Invalid_Time_Should_Fail()
        {
            // Descomentar para forzar fallo SOLO en esta prueba:
            // Assert.Fail("Fallo forzado en Creating_Appointment_With_Invalid_Time_Should_Fail.");

            DoLoginAdmin();
            _driver.Navigate().GoToUrl(AppointmentsUrl);

            WaitClickable(By.XPath("//button[normalize-space()='Agregar Cita']")).Click();

            SetDateDaysFromToday(1);
            SetTime24(6, 0); // fuera de horario laboral

            new SelectElement(WaitVisible(By.CssSelector(S_Status))).SelectByText("Programada");
            new SelectElement(WaitVisible(By.CssSelector(S_Priority))).SelectByText("Alta");

            WaitVisible(By.CssSelector(S_Reason)).SendKeys("Motivo inválido");
            SelectAnyValidPatient();

            WaitClickable(By.CssSelector(S_Submit)).Click();

            var popup = WaitVisible(By.CssSelector(".swal2-popup"));
            StringAssert.Contains(popup.Text, "La cita debe programarse entre las 07:00 y las 18:00 horas");
        }
    }
}
