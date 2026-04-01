// src/types/medicine.ts

// DTO completo del backend (MedicineDto)
export interface Medicine {
  id: number;
  nameMedicine: string;
  description?: string;
  typePresentation?: string;
  availableQuantity: number;
  preparationDate?: string; // formato "YYYY-MM-DD"
  expirationDate?: string;  // formato "YYYY-MM-DD"
  concentration?: number;
}

// DTO resumido (MedicineBriefDto)
export interface MedicineBrief {
  id: number;
  nameMedicine: string;
  typePresentation?: string;
  concentration?: number;
  availableQuantity: number;
  expirationDate?: string; // formato "YYYY-MM-DD"
  description?: string;
}

// DTOs para creación y actualización
export interface MedicineCreate {
  nameMedicine: string;
  description?: string;
  typePresentation?: string;
  availableQuantity: number;
  preparationDate?: string; // formato "YYYY-MM-DD"
  expirationDate?: string;  // formato "YYYY-MM-DD"
  concentration?: number;
}

export type MedicineUpdate = MedicineCreate;
