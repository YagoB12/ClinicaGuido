export interface Disease {
  id: number;
  name: string;
  typeDisease?: string;
  description?: string;
  levelSeverity?: string;
  symptoms?: string;
  causes?: string;
  isContagious: boolean;
}

export interface CreateDisease {
  name: string;
  typeDisease?: string;
  description?: string;
  levelSeverity?: string;
  symptoms?: string;
  causes?: string;
  isContagious: boolean;
}
