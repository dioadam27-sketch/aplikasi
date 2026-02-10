export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  isAvailable: boolean;
}

export interface Student {
  name: string;
  nim: string;
  pdbClass: string;
  subject: string;
  contact: string;
}

export type BookingStatus = 'APPROVED';

export interface Booking {
  id: string;
  room: Room;
  student: Student;
  date: string;
  timeSlot: string;
  timestamp: number;
  status: BookingStatus;
  aiMessage?: string;
}

export enum AppState {
  HOME = 'HOME',
  BOOKING = 'BOOKING',
  TICKET = 'TICKET'
}

export type UserRole = 'GUEST' | 'STUDENT' | 'ADMIN';
