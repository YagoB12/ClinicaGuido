// Models/Dtos/Prescriptions/CreatePrescriptionDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Prescriptions
{
    public class CreatePrescriptionDto
    {
        [Required]
        public int ConsultationId { get; set; }
        public string? Observation { get; set; }
        public string? AdditionalInstructions { get; set; }

        public List<CreatePrescriptionItemDto>? Items { get; set; }
    }
}
