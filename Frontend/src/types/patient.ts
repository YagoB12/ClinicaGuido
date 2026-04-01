export interface MedicalPatient {
  id?: number;
  name: string;
  identification: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  birthDate?: string; // formato "yyyy-MM-dd"
  address?: string;
  maritalStatus?: string;
  disability?: string;
  photo?: string | null;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
}
