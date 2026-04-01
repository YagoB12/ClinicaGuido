export interface Consultation {
  id: number;
  reasonConsultation: string;
  diagnostic?: string | null;
  notes?: string | null;
  treatmentPlan?: string | null;
  temperature?: number | null;
  bloodPressure?: number | null;
  heartRate?: number | null;
  weight?: number | null;
  height?: number | null;
  appointmentId: number;
}

/** DTO usado al crear una nueva consulta */
export interface ConsultationCreateDto {
  appointmentId: number;
  reasonConsultation: string;
  diagnostic?: string | null;
  notes?: string | null;
  treatmentPlan?: string | null;
  temperature?: number | null;
  bloodPressure?: number | null;
  heartRate?: number | null;
  weight?: number | null;
  height?: number | null;
}

/** DTO usado al actualizar una consulta existente */
export interface ConsultationUpdateDto {
  reasonConsultation: string;
  diagnostic?: string | null;
  notes?: string | null;
  treatmentPlan?: string | null;
  temperature?: number | null;
  bloodPressure?: number | null;
  heartRate?: number | null;
  weight?: number | null;
  height?: number | null;
}
