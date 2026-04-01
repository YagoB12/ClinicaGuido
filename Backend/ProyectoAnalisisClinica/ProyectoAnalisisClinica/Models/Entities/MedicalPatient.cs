using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("MedicalPatient")]
    public class MedicalPatient : Person
    {
        public DateOnly? BirthDate { get; set; }

        public string? Address { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Disability { get; set; }
        public byte[]? Photo { get; set; }
        public string? EmergencyContactName { get; set; }
        public int EmergencyContactNumber { get; set; }
        public string? EmergencyContactRelationship { get; set; }

        // Relación N:M (Pacientes ↔ Enfermedades)
        public ICollection<MedicalPatientDisease> MedicalPatientDiseases { get; set; } = new List<MedicalPatientDisease>();

        // Quitado: public ICollection<Consultation> Consultations { get; set; } = new();
        // Si más adelante querés modelar citas del paciente, podés agregar:
        // public ICollection<Appointment> Appointments { get; set; } = new();
    }
}
