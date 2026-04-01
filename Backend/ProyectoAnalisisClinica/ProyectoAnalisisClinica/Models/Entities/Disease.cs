using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("Disease")]
    public class Disease
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? TypeDisease { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(30)]
        public string? LevelSeverity { get; set; }

        [MaxLength(400)]
        public string? Symptoms { get; set; }

        [MaxLength(400)]
        public string? Causes { get; set; }

        public bool IsContagious { get; set; }

        // 🔹 Relación N:M
        public ICollection<MedicalPatientDisease> MedicalPatientDiseases { get; set; } = new List<MedicalPatientDisease>();
    }
}
