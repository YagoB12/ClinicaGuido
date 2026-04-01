using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Prescriptions
{
    public class UpdatePrescriptionDto
    {
        public string? Observation { get; set; }
        public string? AdditionalInstructions { get; set; }

        // Nuevo: permitir modificar estado
        [MaxLength(50)]
        public string? Status { get; set; }
    }
}
