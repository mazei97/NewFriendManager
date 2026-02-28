export interface Friend {
  id: string;
  name: string;
  gender: '남' | '여';
  age: number;
  birthDate: string; // YYYY-MM-DD
  photoUrl?: string;
  education: {
    week1: boolean;
    week2: boolean;
    week3: boolean;
    week4: boolean;
  };
  completionDate?: string; // YYYY-MM-DD
  parentName?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}
