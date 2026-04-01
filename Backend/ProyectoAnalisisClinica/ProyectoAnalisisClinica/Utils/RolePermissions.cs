using System.Collections.Generic;

namespace ProyectoAnalisisClinica.Utils
{
    public static class RolePermissions
    {
        public static readonly Dictionary<string, string[]> Map = new()
        {
            [Roles.Admin] = new[]
            {
                // Admin: todo
                Perms.Patients_View, Perms.Patients_Create, Perms.Patients_Update, Perms.Patients_View_Administrative,
                Perms.Appointments_View_All, Perms.Appointments_View_Mine, Perms.Appointments_Create, Perms.Appointments_Update, Perms.Appointments_Cancel,
                Perms.Consultations_View_Mine, Perms.Consultations_Update_Mine, Perms.Prescriptions_Create,
                Perms.Records_View_Mine, Perms.Records_Update_Mine,
                Perms.Exams_View_Mine,
                Perms.Diseases_View, Perms.Diseases_Manage,
                Perms.Inventory_View, Perms.Inventory_Manage,
                Perms.Users_Manage
            },

            [Roles.Doctora] = new[]
            {
                // Doctora: todo clínico propio, puede ver y gestionar inventario; NO maneja usuarios
                Perms.Patients_View, Perms.Patients_Update,
                Perms.Appointments_View_Mine, Perms.Appointments_Create, Perms.Appointments_Update, Perms.Appointments_Cancel, Perms.Appointments_View_All,
                Perms.Consultations_View_Mine, Perms.Consultations_Update_Mine, Perms.Prescriptions_Create,
                Perms.Records_View_Mine, Perms.Records_Update_Mine,
                Perms.Exams_View_Mine,
                Perms.Diseases_View,
                Perms.Inventory_View,      // Puede ver inventario
                Perms.Inventory_Manage,     // Puede crear/editar/eliminar inventario
                Perms.Diseases_View, Perms.Diseases_Manage,
                Perms.Inventory_View
            },

            [Roles.Secretaria] = new[]
            {
                // Secretaria: citas, pacientes y gestión de inventario
                Perms.Patients_View, Perms.Patients_View_Administrative, Perms.Patients_Create, Perms.Patients_Update,
                Perms.Appointments_View_All, Perms.Appointments_Create, Perms.Appointments_Update, Perms.Appointments_Cancel,
                Perms.Inventory_View,       // Puede ver inventario
                Perms.Inventory_Manage      // Puede crear/editar/eliminar inventario
            }
        };
    }
}
