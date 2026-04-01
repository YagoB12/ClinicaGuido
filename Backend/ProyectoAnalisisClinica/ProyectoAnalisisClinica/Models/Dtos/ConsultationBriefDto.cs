namespace ProyectoAnalisisClinica.Models.Dtos.Consultations
{
    public class ConsultationBriefDto
    {
        public int Id { get; set; }                         // Consultation.Id
        public string PatientName { get; set; } = string.Empty;
        public string PatientIdentification { get; set; } = string.Empty;
        public string AppointmentDate { get; set; } = string.Empty; // "yyyy-MM-dd"
        public string AppointmentTime { get; set; } = string.Empty; // "HH:mm"
        public string OfficeNumber { get; set; } = "—";
        public string ReasonConsultation { get; set; } = string.Empty;
    }
}
