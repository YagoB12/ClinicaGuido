namespace ProyectoAnalisisClinica.Models.Dtos.Medicines
{
    public class MedicineBriefDto
    {
        public int Id { get; set; }
        public string NameMedicine { get; set; } = string.Empty;
        public string? TypePresentation { get; set; }
        public double? Concentration { get; set; }
        public int AvailableQuantity { get; set; }
        public DateOnly? ExpirationDate { get; set; }
        public string? Description { get; set; }
    }
}
