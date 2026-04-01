export interface User {
  id?: number;
  name: string;
  identification: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  rolId: number;
  isActive?: boolean;
   rolNombre?: string;
}
