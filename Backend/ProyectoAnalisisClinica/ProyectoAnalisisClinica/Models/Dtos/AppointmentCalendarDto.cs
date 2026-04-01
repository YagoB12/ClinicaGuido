namespace ProyectoAnalisisClinica.Models.Dtos.Appointments
{
    public class AppointmentCalendarDto
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateOnly DateAppointment { get; set; }
        public TimeOnly HourAppointment { get; set; }
        public string? OfficeNumber { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
    }
}
