using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("MedicalPatientDisease")]
    public class MedicalPatientDisease
    {
        public int MedicalPatientId { get; set; }
        public MedicalPatient? MedicalPatient { get; set; }

        public int DiseaseId { get; set; }
        public Disease? Disease { get; set; }
    }
}
