namespace ProyectoAnalisisClinica.Models.DTOs
{
    public class DiseaseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? TypeDisease { get; set; }
        public string? Description { get; set; }
        public string? LevelSeverity { get; set; }
        public string? Symptoms { get; set; }
        public string? Causes { get; set; }
        public bool IsContagious { get; set; }
    }

    // Para crear una nueva enfermedad
    public class CreateDiseaseDto
    {
        public string Name { get; set; } = string.Empty;
        public string? TypeDisease { get; set; }
        public string? Description { get; set; }
        public string? LevelSeverity { get; set; }
        public string? Symptoms { get; set; }
        public string? Causes { get; set; }
        public bool IsContagious { get; set; }
    }

    // Para editar
    public class UpdateDiseaseDto : CreateDiseaseDto
    {
        public int Id { get; set; }
    }
}
