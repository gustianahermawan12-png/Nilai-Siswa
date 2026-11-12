export type UserRole = 'admin' | 'guru' | 'wali_murid';

export interface User {
  id: string;
  username: string;
  password: string; // Stored securely
  role: UserRole;
  name: string;
  title?: string; // e.g. "Wali Kelas 1A", "Kepala Madrasah", "Wali dari Ahmad"
  linkedStudentId?: string; // For wali_murid accounts
  phone?: string;
  avatarUrl?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  status?: 'aktif' | 'nonaktif';
  createdAt: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  waliMuridId?: string;
  parentName: string;
  phone: string;
  address: string;
  photoUrl?: string; // Data URL or asset path
  status: 'aktif' | 'nonaktif';
  birthPlace?: string;
  birthDate?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "Kelas 1A"
  homeroomTeacher: string; // Wali kelas
  academicYear: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  classId: string; // or 'semua'
  teacherName: string;
  kkm: number;
}

export interface ScheduleItem {
  id: string;
  classId: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  startTime: string; // e.g. "07:15"
  endTime: string;   // e.g. "08:30"
  subjectId: string;
  teacherName: string;
  room?: string;
}

export interface DailyGrade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  chapterTitle: string; // Nama bab / materi
  assessmentDate: string;
  score: number;
  notes?: string;
  isReleased: boolean;
  updatedAt: string;
}

export interface SemesterGrade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  type: 'PTS' | 'PAS';
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  score: number;
  status: 'TUNTAS' | 'PERBAIKAN';
  notes?: string;
  isReleased: boolean;
  updatedAt: string;
}

export interface SavingsTransaction {
  id: string;
  studentId: string;
  date: string;
  type: 'masuk' | 'keluar';
  amount: number;
  notes?: string;
  recordedBy: string;
}

export interface InfakPayment {
  id: string;
  studentId: string;
  month: string; // e.g. "Januari", "November"
  year: number;
  date: string;
  amount: number;
  notes?: string;
  recordedBy: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  notes?: string;
}

export interface ExcuseLetter {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'sakit' | 'izin';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  attachmentUrl?: string; // photo/file
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FeeItem {
  id: string;
  title: string;
  targetClassId: string; // 'semua' or classId
  nominal: number;
  dueDate: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  feeId: string;
  studentId: string;
  amountPaid: number;
  isPaid: boolean;
  paidAt?: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetClassId: string; // 'semua' or classId
  attachmentUrl?: string;
  authorName: string;
}

export interface SchoolSettings {
  schoolName: string;
  npsn: string;
  nsm: string;
  address: string;
  headmasterName: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  defaultKkm: number;
  phone: string;
  email: string;
}

export interface AppDatabase {
  users: User[];
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  schedules: ScheduleItem[];
  dailyGrades: DailyGrade[];
  semesterGrades: SemesterGrade[];
  savings: SavingsTransaction[];
  infak: InfakPayment[];
  attendance: AttendanceRecord[];
  excuseLetters: ExcuseLetter[];
  fees: FeeItem[];
  feePayments: FeePayment[];
  announcements: Announcement[];
  settings: SchoolSettings;
  lastSync?: string;
}
