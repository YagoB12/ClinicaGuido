namespace ProyectoAnalisisClinica.Models.Dtos.Consultations
{
    public class ConsultationCreateDto
    {
        public int AppointmentId { get; set; }

        public string ReasonConsultation { get; set; } = string.Empty;
        public string? Diagnostic { get; set; }
        public string? Notes { get; set; }
        public string? TreatmentPlan { get; set; }

        public int? Temperature { get; set; }
        public double? BloodPressure { get; set; }
        public double? HeartRate { get; set; }

        public double? Weight { get; set; }   // Peso en kg
        public double? Height { get; set; }   // Altura en m o cm
    }

    public class ConsultationUpdateDto
    {
        public string ReasonConsultation { get; set; } = string.Empty;
        public string? Diagnostic { get; set; }
        public string? Notes { get; set; }
        public string? TreatmentPlan { get; set; }

        public int? Temperature { get; set; }
        public double? BloodPressure { get; set; }
        public double? HeartRate { get; set; }

        public double? Weight { get; set; }
        public double? Height { get; set; }
    }
}
