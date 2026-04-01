namespace ProyectoAnalisisClinica.Models.Dtos.Appointments
{
    public record AppointmentBriefDto(
        int Id,
        string PatientName,
        string PatientIdentification,
        DateOnly DateAppointment,
        TimeOnly HourAppointment,
        string? OfficeNumber,
        string? Status
    );
}
