namespace ProyectoAnalisisClinica.Models.Dtos.Prescriptions
{
    public class PrescriptionListItemDto
    {
        public int Id { get; set; }                       // por si querés linkear Ver/Editar
        public string PatientName { get; set; } = "";
        public string PatientIdentification { get; set; } = "";
        public DateOnly IssueDate { get; set; }
        public string Status { get; set; } = "Emitida";
    }
}
