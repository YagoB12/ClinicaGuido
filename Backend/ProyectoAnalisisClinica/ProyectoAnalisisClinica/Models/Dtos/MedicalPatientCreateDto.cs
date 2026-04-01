using ProyectoAnalisisClinica.Models.Entities;

namespace ProyectoAnalisisClinica.Models.Dtos
{
    public class MedicalPatientCreateDto 
    {

        public string Name { get; set; }

        public string LastName { get; set; }

        public string Identification { get; set; }

        public string Email { get; set; }

        public int Phone { get; set; }

        public bool Gender { get; set; }
        public DateOnly? BirthDate { get; set; }

        public string? Address { get; set; }

        public string? MaritalStatus { get; set; }

        public string? Disability { get; set; }

        public byte[]? Photo { get; set; }

        public string? EmergencyContactName { get; set; }

        public int EmergencyContactNumber { get; set; }

    }
}
