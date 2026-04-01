export interface AppointmentBrief {
  id?: number;
  patientName?: string;
  patientIdentification?: string;
  dateAppointment: string; // formato "YYYY-MM-DD"
  hourAppointment: string; // formato "HH:mm:ss"
  reasonAppointment?: string;
  priority?: string;
  officeNumber?: string;
  status?: string;
  medicalPatientId: number;
}
