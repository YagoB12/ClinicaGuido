// Utils/Security.cs
namespace ProyectoAnalisisClinica.Utils
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Doctora = "Doctor/a";   
        public const string Secretaria = "Secretario/a";
    }

    public static class Perms
    {
        // Pacientes
        public const string Patients_View = "patients.view";
        public const string Patients_Create = "patients.create";
        public const string Patients_Update = "patients.update";
        public const string Patients_View_Administrative = "patients.view.administrative"; // solo datos administrativos

        // Citas
        public const string Appointments_View_All = "appointments.view.all";
        public const string Appointments_View_Mine = "appointments.view.mine";
        public const string Appointments_Create = "appointments.create";
        public const string Appointments_Update = "appointments.update";
        public const string Appointments_Cancel = "appointments.cancel";

        // Clínico
        public const string Consultations_View_Mine = "consultations.view.mine";
        public const string Consultations_Update_Mine = "consultations.update.mine";
        public const string Prescriptions_Create = "prescriptions.create";
        public const string Records_View_Mine = "records.view.mine";
        public const string Records_Update_Mine = "records.update.mine";
        public const string Exams_View_Mine = "exams.view.mine";
        public const string Diseases_View = "diseases.view";
        public const string Diseases_Manage = "diseases.manage";

        // Inventario
        public const string Inventory_View = "inventory.view";
        public const string Inventory_Manage = "inventory.manage";

        // Usuarios
        public const string Users_Manage = "users.manage";
    }
}
