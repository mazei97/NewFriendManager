import { Friend } from '../types/Friend';

export const sampleFriends: Omit<Friend, 'id'>[] = [
  {
    name: '장정환',
    gender: '남',
    age: 5,
    birthDate: '2025-07-20',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-11-18',
  },
  {
    name: '민율',
    gender: '남',
    age: 5,
    birthDate: '2025-06-08',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-09-30',
  },
  {
    name: '이시아',
    gender: '여',
    age: 6,
    birthDate: '2025-05-18',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-11-18',
  },
  {
    name: '김서현',
    gender: '여',
    age: 5,
    birthDate: '2025-04-20',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-09-30',
  },
  {
    name: '김영인',
    gender: '남',
    age: 5,
    birthDate: '2025-03-30',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-08-05',
  },
  {
    name: '하린',
    gender: '여',
    age: 7,
    birthDate: '2024-09-27',
    education: {
      week1: true,
      week2: false,
      week3: false,
      week4: false,
    },
  },
  {
    name: '박시후',
    gender: '남',
    age: 7,
    birthDate: '2024-09-08',
    education: {
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
    completionDate: '2025-04-15',
  },
];
