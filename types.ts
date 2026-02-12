
export enum DayOfWeek {
  SENIN = 'SENIN',
  SELASA = 'SELASA',
  RABU = 'RABU',
  KAMIS = 'KAMIS',
  JUMAT = 'JUMAT',
}

export const TIME_SLOTS = [
  "07:00 - 08:40",
  "08:50 - 10:30",
  "10:40 - 12:20",
  "13:00 - 14:40",
  "14:50 - 16:30",
  "16:40 - 18:20",
];

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  coordinatorId?: string;
}

export interface Lecturer {
  id: string;
  nip: string;
  name: string;
  position?: string;
  expertise?: string;
  password?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  location?: string;
}

export interface ClassName {
  id: string;
  name: string;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  lecturerIds?: string[];
  pjmkLecturerId?: string;
  roomId: string;
  className: string;
  day: DayOfWeek;
  timeSlot: string;
  isLocked?: boolean; // New Field: Status Kunci Admin
}

export interface TeachingLog {
  id: string;
  scheduleId: string;
  lecturerId: string;
  week: number;
  timestamp: string;
  date?: string;
}

export type UserRole = 'admin' | 'lecturer' | 'guest';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type ViewState = 'dashboard' | 'schedule' | 'courses' | 'lecturers' | 'rooms' | 'classes' | 'monitoring' | 'attendance' | 'honor' | 'portal' | 'lecturer_monitoring' | 'settings';

export interface AppSetting {
  id: string;
  key: string;
  value: string;
}

// --- Arsip Types ---
export enum ArchiveCategory {
  SK = 'SK Rektor',
  SURAT_TUGAS = 'Surat Tugas',
  AKADEMIK = 'Dokumen Akademik',
  LAPORAN = 'Laporan Kegiatan',
  LAINNYA = 'Lainnya'
}

export interface Folder {
  id: string;
  label: string;
  parentId?: string | null;
  visibility?: 'public' | 'private';
}

export interface ArchiveDocument {
  id: string;
  nomorDokumen: string;
  judul: string;
  deskripsi: string;
  kategori: string; 
  tahun: string;
  tanggalUpload?: string;
  tags: string[];
  fileSize?: string;
  fileUrl?: string; 
  folderId?: string;
  visibility?: 'public' | 'private';
}

export interface AIParsedData {
  nomor_dokumen?: string;
  judul: string;
  kategori: string;
  tahun: string;
  deskripsi: string;
  tags?: string[];
}
