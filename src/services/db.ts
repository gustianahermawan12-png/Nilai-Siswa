import { AppDatabase, SchoolSettings, User, Student, ClassGroup, Subject, ScheduleItem, DailyGrade, SemesterGrade, SavingsTransaction, InfakPayment, AttendanceRecord, ExcuseLetter, FeeItem, FeePayment, Announcement } from '../types';
import { calculateStatus, getDateRangeArray } from '../utils/gradeCalculations';
import { stripUndefined, normalizeUsername } from '../utils/dbSanitizer';
import { firestore, doc, setDoc, onSnapshot, getDoc, getDocFromServer } from './firebase';

const STORAGE_KEY = 'minurulfalah_db_v1';

export const INITIAL_SETTINGS: SchoolSettings = {
  schoolName: 'MI NURUL FALAH',
  npsn: '60721234',
  nsm: '111232010045',
  address: 'Jl. Pesantren No. 12, Kel. Cisaranten, Kec. Arcamanik, Kota Bandung, Jawa Barat',
  headmasterName: 'Drs. H. Miftahudin, M.Ag.',
  academicYear: '2024/2025',
  semester: 'Ganjil',
  defaultKkm: 75,
  phone: '(022) 7891234 / 081234567890',
  email: 'minurulfalah.resmi@gmail.com',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Gustiana Hermawan, S.Pd.',
    title: 'Guru & Wali Kelas 1A',
    phone: '081234567890',
    avatarUrl: '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg',
    securityQuestion: 'Nama ibu kandung?',
    securityAnswer: 'Siti',
    status: 'aktif',
    createdAt: '2024-07-01T08:00:00Z',
  },
  {
    id: 'usr-wali-1',
    username: 'wali_ahmad',
    password: 'wali123',
    role: 'wali_murid',
    name: 'Bpk. Ridwan Kamil',
    title: 'Wali Murid - Ahmad Zaki Pratama',
    linkedStudentId: 'std-1',
    phone: '085711223344',
    securityQuestion: 'Makanan favorit?',
    securityAnswer: 'Nasi Goreng',
    status: 'aktif',
    createdAt: '2024-07-10T08:00:00Z',
  },
  {
    id: 'usr-wali-2',
    username: 'wali_fatimah',
    password: 'wali123',
    role: 'wali_murid',
    name: 'Ibu Siti Aminah',
    title: 'Wali Murid - Fatimah Azzahra',
    linkedStudentId: 'std-2',
    phone: '085788990011',
    securityQuestion: 'Kota kelahiran?',
    securityAnswer: 'Bandung',
    status: 'aktif',
    createdAt: '2024-07-10T08:00:00Z',
  },
];

const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'cls-1', name: 'Kelas 1A', homeroomTeacher: 'Gustiana Hermawan, S.Pd.', academicYear: '2024/2025', semester: 'Ganjil' },
  { id: 'cls-2', name: 'Kelas 1B', homeroomTeacher: 'Nurhayati, S.Pd.I', academicYear: '2024/2025', semester: 'Ganjil' },
  { id: 'cls-3', name: 'Kelas 2A', homeroomTeacher: 'Ahmad Fauzi, S.Pd.', academicYear: '2024/2025', semester: 'Ganjil' },
  { id: 'cls-4', name: 'Kelas 3', homeroomTeacher: 'Siti Maryam, S.Pd.I', academicYear: '2024/2025', semester: 'Ganjil' },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sbj-1', code: 'QH', name: "Al-Qur'an Hadits", classId: 'cls-1', teacherName: 'Ustadz Hasan Basri, S.Pd.I', kkm: 75 },
  { id: 'sbj-2', code: 'AA', name: 'Aqidah Akhlak', classId: 'cls-1', teacherName: 'Ustadzah Halimah, S.Ag', kkm: 75 },
  { id: 'sbj-3', code: 'FK', name: 'Fikih', classId: 'cls-1', teacherName: 'Gustiana Hermawan, S.Pd.', kkm: 75 },
  { id: 'sbj-4', code: 'BA', name: 'Bahasa Arab', classId: 'cls-1', teacherName: 'Ustadz Farhan, Lc.', kkm: 75 },
  { id: 'sbj-5', code: 'MTK', name: 'Matematika', classId: 'cls-1', teacherName: 'Gustiana Hermawan, S.Pd.', kkm: 75 },
  { id: 'sbj-6', code: 'BIN', name: 'Bahasa Indonesia', classId: 'cls-1', teacherName: 'Nurhayati, S.Pd.I', kkm: 75 },
  { id: 'sbj-7', code: 'PPKN', name: 'Pendidikan Pancasila', classId: 'cls-1', teacherName: 'Nurhayati, S.Pd.I', kkm: 75 },
  { id: 'sbj-8', code: 'PJOK', name: 'PJOK (Olahraga)', classId: 'cls-1', teacherName: 'Agus Setiawan, S.Pd.', kkm: 75 },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    nis: '24001',
    nisn: '3125678901',
    name: 'Ahmad Zaki Pratama',
    gender: 'L',
    classId: 'cls-1',
    waliMuridId: 'usr-wali-1',
    parentName: 'Bpk. Ridwan Kamil',
    phone: '085711223344',
    address: 'Jl. Melati No. 4, Cisaranten Kulon, Bandung',
    photoUrl: '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg',
    status: 'aktif',
    birthPlace: 'Bandung',
    birthDate: '2017-04-12',
  },
  {
    id: 'std-2',
    nis: '24002',
    nisn: '3125678902',
    name: 'Fatimah Azzahra',
    gender: 'P',
    classId: 'cls-1',
    waliMuridId: 'usr-wali-2',
    parentName: 'Ibu Siti Aminah',
    phone: '085788990011',
    address: 'Jl. Sukajadi No. 18, Arcamanik, Bandung',
    photoUrl: '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg',
    status: 'aktif',
    birthPlace: 'Bandung',
    birthDate: '2017-08-20',
  },
  {
    id: 'std-3',
    nis: '24003',
    nisn: '3125678903',
    name: 'Muhammad Rayhan Pratama',
    gender: 'L',
    classId: 'cls-1',
    parentName: 'Bpk. Dedi Mulyadi',
    phone: '081399887766',
    address: 'Jl. Anggrek No. 9, Bandung',
    status: 'aktif',
    birthPlace: 'Bandung',
    birthDate: '2017-02-15',
  },
  {
    id: 'std-4',
    nis: '24004',
    nisn: '3125678904',
    name: 'Aisyah Nur Humaira',
    gender: 'P',
    classId: 'cls-1',
    parentName: 'Bpk. Ahmad Sujana',
    phone: '081277665544',
    address: 'Komplek Permata Biru Blok C-10, Bandung',
    status: 'aktif',
    birthPlace: 'Cimahi',
    birthDate: '2017-11-05',
  },
  {
    id: 'std-5',
    nis: '24005',
    nisn: '3125678905',
    name: 'Bilal Ramadhan',
    gender: 'L',
    classId: 'cls-2',
    parentName: 'Bpk. Syarif Hidayat',
    phone: '082144332211',
    address: 'Jl. Cisaranten Wetan No. 31, Bandung',
    status: 'aktif',
    birthPlace: 'Bandung',
    birthDate: '2017-06-01',
  },
];

const INITIAL_SCHEDULES: ScheduleItem[] = [
  { id: 'sch-1', classId: 'cls-1', day: 'Senin', startTime: '07:15', endTime: '07:45', subjectId: 'sbj-1', teacherName: 'Ustadz Hasan Basri', room: 'Ruang 1A' },
  { id: 'sch-2', classId: 'cls-1', day: 'Senin', startTime: '07:45', endTime: '09:00', subjectId: 'sbj-1', teacherName: 'Ustadz Hasan Basri', room: 'Ruang 1A' },
  { id: 'sch-3', classId: 'cls-1', day: 'Senin', startTime: '09:30', endTime: '11:00', subjectId: 'sbj-5', teacherName: 'Gustiana Hermawan, S.Pd.', room: 'Ruang 1A' },
  { id: 'sch-4', classId: 'cls-1', day: 'Senin', startTime: '11:00', endTime: '12:00', subjectId: 'sbj-6', teacherName: 'Nurhayati, S.Pd.I', room: 'Ruang 1A' },
  { id: 'sch-5', classId: 'cls-1', day: 'Selasa', startTime: '07:15', endTime: '08:30', subjectId: 'sbj-3', teacherName: 'Gustiana Hermawan, S.Pd.', room: 'Ruang 1A' },
  { id: 'sch-6', classId: 'cls-1', day: 'Selasa', startTime: '08:30', endTime: '10:00', subjectId: 'sbj-4', teacherName: 'Ustadz Farhan, Lc.', room: 'Ruang 1A' },
  { id: 'sch-7', classId: 'cls-1', day: 'Rabu', startTime: '07:15', endTime: '08:45', subjectId: 'sbj-2', teacherName: 'Ustadzah Halimah, S.Ag', room: 'Ruang 1A' },
  { id: 'sch-8', classId: 'cls-1', day: 'Kamis', startTime: '07:15', endTime: '09:00', subjectId: 'sbj-8', teacherName: 'Agus Setiawan, S.Pd.', room: 'Lapangan' },
  { id: 'sch-9', classId: 'cls-1', day: 'Jumat', startTime: '07:15', endTime: '08:30', subjectId: 'sbj-7', teacherName: 'Nurhayati, S.Pd.I', room: 'Ruang 1A' },
];

const INITIAL_DAILY_GRADES: DailyGrade[] = [
  { id: 'dg-1', studentId: 'std-1', subjectId: 'sbj-1', classId: 'cls-1', chapterTitle: 'Bab 1: Surah Al-Fatihah & Huruf Hijaiyah', assessmentDate: '2024-08-15', score: 92, notes: 'Makharijul huruf sangat fasih dan lancar', isReleased: true, updatedAt: '2024-08-16T10:00:00Z' },
  { id: 'dg-2', studentId: 'std-1', subjectId: 'sbj-1', classId: 'cls-1', chapterTitle: 'Bab 2: Surah An-Nas & Al-Falaq', assessmentDate: '2024-09-02', score: 88, notes: 'Hafalan baik, tajwid diperhatikan', isReleased: true, updatedAt: '2024-09-03T10:00:00Z' },
  { id: 'dg-3', studentId: 'std-1', subjectId: 'sbj-5', classId: 'cls-1', chapterTitle: 'Bab 1: Mengenal Bilangan 1 sampai 20', assessmentDate: '2024-08-20', score: 85, notes: 'Penjumlahan dasar sangat teliti', isReleased: true, updatedAt: '2024-08-21T10:00:00Z' },
  { id: 'dg-4', studentId: 'std-1', subjectId: 'sbj-3', classId: 'cls-1', chapterTitle: 'Bab 1: Thaharah & Rukun Wudhu', assessmentDate: '2024-09-10', score: 95, notes: 'Praktik wudhu tertib dan sempurna', isReleased: true, updatedAt: '2024-09-11T10:00:00Z' },
  { id: 'dg-5', studentId: 'std-1', subjectId: 'sbj-4', classId: 'cls-1', chapterTitle: 'Bab 1: Mufradat Anggota Tubuh', assessmentDate: '2024-09-18', score: 72, notes: 'Perlu pengulangan hafalan kosakata', isReleased: true, updatedAt: '2024-09-19T10:00:00Z' },
  // Unreleased grade example
  { id: 'dg-6', studentId: 'std-1', subjectId: 'sbj-6', classId: 'cls-1', chapterTitle: 'Bab 3: Membaca Kalimat Sederhana', assessmentDate: '2024-10-05', score: 90, notes: 'Draft belum dirilis ke wali murid', isReleased: false, updatedAt: '2024-10-06T10:00:00Z' },
  // Grades for Fatimah
  { id: 'dg-7', studentId: 'std-2', subjectId: 'sbj-1', classId: 'cls-1', chapterTitle: 'Bab 1: Surah Al-Fatihah & Huruf Hijaiyah', assessmentDate: '2024-08-15', score: 96, notes: 'Sangat istimewa, tajwid tepat', isReleased: true, updatedAt: '2024-08-16T10:00:00Z' },
  { id: 'dg-8', studentId: 'std-2', subjectId: 'sbj-5', classId: 'cls-1', chapterTitle: 'Bab 1: Mengenal Bilangan 1 sampai 20', assessmentDate: '2024-08-20', score: 90, notes: 'Tuntas dengan cepat', isReleased: true, updatedAt: '2024-08-21T10:00:00Z' },
];

const INITIAL_SEMESTER_GRADES: SemesterGrade[] = [
  // PTS
  { id: 'sg-1', studentId: 'std-1', subjectId: 'sbj-1', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 90, status: 'TUNTAS', notes: 'Sangat memuaskan', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  { id: 'sg-2', studentId: 'std-1', subjectId: 'sbj-2', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 88, status: 'TUNTAS', notes: 'Budi pekerti santun', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  { id: 'sg-3', studentId: 'std-1', subjectId: 'sbj-3', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 92, status: 'TUNTAS', notes: 'Pemahaman materi ibadah sangat baik', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  { id: 'sg-4', studentId: 'std-1', subjectId: 'sbj-4', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 70, status: 'PERBAIKAN', notes: 'Remedial tanggal 15 Oktober 2024', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  { id: 'sg-5', studentId: 'std-1', subjectId: 'sbj-5', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 84, status: 'TUNTAS', notes: 'Teliti menghitung', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  // PAS
  { id: 'sg-6', studentId: 'std-1', subjectId: 'sbj-1', classId: 'cls-1', type: 'PAS', academicYear: '2024/2025', semester: 'Ganjil', score: 94, status: 'TUNTAS', notes: 'Pertahankan prestasi', isReleased: true, updatedAt: '2024-12-10T08:00:00Z' },
  { id: 'sg-7', studentId: 'std-1', subjectId: 'sbj-3', classId: 'cls-1', type: 'PAS', academicYear: '2024/2025', semester: 'Ganjil', score: 90, status: 'TUNTAS', notes: 'Alhamdulillah tuntas', isReleased: true, updatedAt: '2024-12-10T08:00:00Z' },
  // Fatimah
  { id: 'sg-8', studentId: 'std-2', subjectId: 'sbj-1', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 95, status: 'TUNTAS', notes: 'Sangat baik', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
  { id: 'sg-9', studentId: 'std-2', subjectId: 'sbj-5', classId: 'cls-1', type: 'PTS', academicYear: '2024/2025', semester: 'Ganjil', score: 92, status: 'TUNTAS', notes: 'Tuntas cemerlang', isReleased: true, updatedAt: '2024-10-01T08:00:00Z' },
];

const INITIAL_SAVINGS: SavingsTransaction[] = [
  { id: 'sav-1', studentId: 'std-1', date: '2024-08-05', type: 'masuk', amount: 50000, notes: 'Setoran awal tahun ajaran baru', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'sav-2', studentId: 'std-1', date: '2024-08-19', type: 'masuk', amount: 30000, notes: 'Setoran tabungan mingguan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'sav-3', studentId: 'std-1', date: '2024-09-02', type: 'masuk', amount: 50000, notes: 'Setoran tabungan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'sav-4', studentId: 'std-1', date: '2024-09-20', type: 'keluar', amount: 25000, notes: 'Beli buku tulis & pensil warna', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'sav-5', studentId: 'std-1', date: '2024-10-07', type: 'masuk', amount: 45000, notes: 'Setoran tabungan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  // Fatimah
  { id: 'sav-6', studentId: 'std-2', date: '2024-08-05', type: 'masuk', amount: 100000, notes: 'Setoran awal', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'sav-7', studentId: 'std-2', date: '2024-09-02', type: 'masuk', amount: 50000, notes: 'Setoran tabungan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
];

const INITIAL_INFAK: InfakPayment[] = [
  { id: 'inf-1', studentId: 'std-1', month: 'Juli', year: 2024, date: '2024-07-15', amount: 20000, notes: 'Infak bulanan madrasah', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'inf-2', studentId: 'std-1', month: 'Agustus', year: 2024, date: '2024-08-10', amount: 20000, notes: 'Infak bulanan madrasah', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'inf-3', studentId: 'std-1', month: 'September', year: 2024, date: '2024-09-08', amount: 25000, notes: 'Infak bulanan & pembangunan mushalla', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'inf-4', studentId: 'std-1', month: 'Oktober', year: 2024, date: '2024-10-10', amount: 20000, notes: 'Infak bulanan madrasah', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  // Fatimah
  { id: 'inf-5', studentId: 'std-2', month: 'Agustus', year: 2024, date: '2024-08-10', amount: 25000, notes: 'Infak bulanan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
  { id: 'inf-6', studentId: 'std-2', month: 'September', year: 2024, date: '2024-09-08', amount: 25000, notes: 'Infak bulanan', recordedBy: 'Gustiana Hermawan, S.Pd.' },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', studentId: 'std-1', date: '2024-11-04', status: 'hadir', notes: 'Tepat waktu' },
  { id: 'att-2', studentId: 'std-1', date: '2024-11-05', status: 'hadir', notes: 'Tepat waktu' },
  { id: 'att-3', studentId: 'std-1', date: '2024-11-06', status: 'sakit', notes: 'Demam & batuk flu' },
  { id: 'att-4', studentId: 'std-1', date: '2024-11-07', status: 'sakit', notes: 'Demam' },
  { id: 'att-5', studentId: 'std-1', date: '2024-11-08', status: 'hadir', notes: 'Tepat waktu' },
  { id: 'att-6', studentId: 'std-1', date: '2024-11-09', status: 'hadir', notes: 'Tepat waktu' },
  // Fatimah
  { id: 'att-7', studentId: 'std-2', date: '2024-11-04', status: 'hadir', notes: 'Tepat waktu' },
  { id: 'att-8', studentId: 'std-2', date: '2024-11-05', status: 'hadir', notes: 'Tepat waktu' },
  { id: 'att-9', studentId: 'std-2', date: '2024-11-06', status: 'hadir', notes: 'Tepat waktu' },
];

const INITIAL_EXCUSE_LETTERS: ExcuseLetter[] = [
  {
    id: 'exc-1',
    studentId: 'std-1',
    studentName: 'Ahmad Zaki Pratama',
    className: 'Kelas 1A',
    type: 'sakit',
    startDate: '2024-11-06',
    endDate: '2024-11-07',
    reason: 'Ananda mengalami demam tinggi dan flu, beristirahat sesuai anjuran dokter Puskesmas.',
    attachmentUrl: '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg',
    status: 'approved',
    adminNotes: 'Izin disetujui. Semoga lekas sembuh ananda Zaki.',
    submittedAt: '2024-11-06T06:45:00Z',
    reviewedAt: '2024-11-06T07:10:00Z',
    reviewedBy: 'Gustiana Hermawan, S.Pd.',
  },
  {
    id: 'exc-2',
    studentId: 'std-3',
    studentName: 'Muhammad Rayhan Pratama',
    className: 'Kelas 1A',
    type: 'izin',
    startDate: '2024-11-12',
    endDate: '2024-11-13',
    reason: 'Menghadiri acara pernikahan paman di Garut bersama keluarga.',
    status: 'pending',
    submittedAt: '2024-11-10T08:00:00Z',
  },
];

const INITIAL_FEES: FeeItem[] = [
  {
    id: 'fee-1',
    title: 'Iuran Peringatan Maulid Nabi Muhammad SAW 1446 H',
    targetClassId: 'semua',
    nominal: 35000,
    dueDate: '2024-09-25',
    description: 'Untuk konsumsi, santunan anak yatim, dan dekorasi panggung peringatan Maulid Nabi di madrasah.',
    isActive: true,
    createdAt: '2024-09-01T08:00:00Z',
  },
  {
    id: 'fee-2',
    title: 'Seragam Olahraga & Kaos Madrasah Baru',
    targetClassId: 'cls-1',
    nominal: 120000,
    dueDate: '2024-10-30',
    description: 'Satu stel seragam olahraga madrasah bahan katun combed berkualitas untuk siswa baru Kelas 1A.',
    isActive: true,
    createdAt: '2024-08-10T08:00:00Z',
  },
  {
    id: 'fee-3',
    title: 'Outing Class & Kunjungan Edukasi Puspa Iptek',
    targetClassId: 'cls-1',
    nominal: 75000,
    dueDate: '2024-11-28',
    description: 'Transportasi bus pariwisata, tiket masuk sains anak, pemandu dan snack makan siang.',
    isActive: true,
    createdAt: '2024-10-20T08:00:00Z',
  },
];

const INITIAL_FEE_PAYMENTS: FeePayment[] = [
  { id: 'fp-1', feeId: 'fee-1', studentId: 'std-1', amountPaid: 35000, isPaid: true, paidAt: '2024-09-12T09:30:00Z', notes: 'Lunas dititipkan siswa' },
  { id: 'fp-2', feeId: 'fee-2', studentId: 'std-1', amountPaid: 120000, isPaid: true, paidAt: '2024-09-28T10:00:00Z', notes: 'Lunas via transfer' },
  { id: 'fp-3', feeId: 'fee-3', studentId: 'std-1', amountPaid: 0, isPaid: false, notes: 'Belum dibayar' },
  // Fatimah
  { id: 'fp-4', feeId: 'fee-1', studentId: 'std-2', amountPaid: 35000, isPaid: true, paidAt: '2024-09-15T09:30:00Z', notes: 'Lunas' },
  { id: 'fp-5', feeId: 'fee-2', studentId: 'std-2', amountPaid: 120000, isPaid: true, paidAt: '2024-09-20T10:00:00Z', notes: 'Lunas' },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Pelaksanaan Penilaian Akhir Semester (PAS) Gasal TP 2024/2025',
    content: 'Diberitahukan kepada seluruh wali murid bahwa Penilaian Akhir Semester (PAS) Gasal akan diselenggarakan mulai tanggal 2 s/d 9 Desember 2024. Mohon bimbingan ananda di rumah untuk mengulang materi hafalan dan pelajaran harian.',
    date: '2024-11-08',
    targetClassId: 'semua',
    authorName: 'Gustiana Hermawan, S.Pd.',
    attachmentUrl: '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg',
  },
  {
    id: 'ann-2',
    title: 'Program Pembiasaan Sholat Dhuha dan Tahsin Al-Qur\'an Pagi',
    content: 'Mulai pekan ini, siswa-siswi kelas 1 s/d 6 diharapkan hadir di madrasah paling lambat pukul 07.10 WIB dengan membawa mukena / sarung dan Al-Qur\'an / Iqro masing-masing untuk pembiasaan ibadah bersama.',
    date: '2024-10-15',
    targetClassId: 'semua',
    authorName: 'Kepala Madrasah',
  },
  {
    id: 'ann-3',
    title: 'Jadwal Pertemuan Paguyuban Orang Tua Siswa Kelas 1A',
    content: 'Undangan silaturahmi evaluasi tengah semester dan persiapan kegiatan outing class pada hari Sabtu, 23 November 2024 pukul 09.00 WIB bertempat di Ruang Kelas 1A.',
    date: '2024-11-01',
    targetClassId: 'cls-1',
    authorName: 'Gustiana Hermawan, S.Pd.',
  },
];

export function getInitialDatabase(): AppDatabase {
  return {
    users: INITIAL_USERS,
    students: INITIAL_STUDENTS,
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    schedules: INITIAL_SCHEDULES,
    dailyGrades: INITIAL_DAILY_GRADES,
    semesterGrades: INITIAL_SEMESTER_GRADES,
    savings: INITIAL_SAVINGS,
    infak: INITIAL_INFAK,
    attendance: INITIAL_ATTENDANCE,
    excuseLetters: INITIAL_EXCUSE_LETTERS,
    fees: INITIAL_FEES,
    feePayments: INITIAL_FEE_PAYMENTS,
    announcements: INITIAL_ANNOUNCEMENTS,
    settings: INITIAL_SETTINGS,
    lastSync: new Date().toISOString(),
  };
}

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

class DatabaseService {
  private db: AppDatabase;
  private listeners: Set<() => void> = new Set();
  private syncStatus: SyncStatus = 'syncing';
  private syncStatusListeners: Set<(status: SyncStatus) => void> = new Set();
  private hasInitializedCloud = false;
  private unsubscribeFirestore: (() => void) | null = null;
  private lastCloudPushPromise: Promise<{ ok: boolean; error?: string }> | null = null;

  constructor() {
    this.db = this.loadFromStorage();
    if (typeof window !== 'undefined') {
      this.initOnlineSync();
    }
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  private setSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.syncStatusListeners.forEach((fn) => fn(status));
  }

  public subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
    this.syncStatusListeners.add(listener);
    listener(this.syncStatus);
    return () => {
      this.syncStatusListeners.delete(listener);
    };
  }

  public initOnlineSync(): void {
    if (this.hasInitializedCloud) return;
    this.hasInitializedCloud = true;

    try {
      const docRef = doc(firestore, 'school_data', 'main');

      // Validate Firestore server connectivity on boot per Firebase integration guideline
      getDocFromServer(docRef)
        .then((serverSnap) => {
          if (serverSnap.exists()) {
            const remoteData = serverSnap.data() as AppDatabase;
            if (remoteData && Array.isArray(remoteData.students) && Array.isArray(remoteData.users)) {
              this.db = {
                ...getInitialDatabase(),
                ...remoteData,
                settings: { ...INITIAL_SETTINGS, ...(remoteData.settings || {}) },
              };
              this.persistToLocalStorage(this.db);
              this.setSyncStatus('connected');
              this.listeners.forEach((fn) => fn());
            }
          }
        })
        .catch((err) => {
          if (err instanceof Error && err.message.includes('the client is offline')) {
            console.warn('Firestore server connection notice: client appears offline.');
          }
        });

      this.unsubscribeFirestore = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data() as AppDatabase;
            if (remoteData && Array.isArray(remoteData.students) && Array.isArray(remoteData.users)) {
              this.db = {
                ...getInitialDatabase(),
                ...remoteData,
                settings: { ...INITIAL_SETTINGS, ...(remoteData.settings || {}) },
              };
              this.persistToLocalStorage(this.db);
              this.setSyncStatus('connected');
              this.listeners.forEach((fn) => fn());
            }
          } else {
            // First time setup on cloud: upload clean initial database seed
            this.pushToCloud(this.db);
          }
        },
        (error) => {
          console.warn('Real-time cloud sync notice:', error);
          this.setSyncStatus('offline');
          this.listeners.forEach((fn) => fn());
        }
      );
    } catch (err) {
      console.warn('Could not initialize cloud sync listener:', err);
      this.setSyncStatus('offline');
    }
  }

  private loadFromStorage(): AppDatabase {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.users)) {
            return {
              ...getInitialDatabase(),
              ...parsed,
              settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse database from storage:', e);
    }
    const fresh = getInitialDatabase();
    this.persistToLocalStorage(fresh);
    return fresh;
  }

  private persistToLocalStorage(data: AppDatabase) {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  }

  private async pushToCloud(data: AppDatabase): Promise<{ ok: boolean; error?: string }> {
    const previous = this.lastCloudPushPromise || Promise.resolve({ ok: true });
    const snapshotToPush = stripUndefined(data);
    const run = previous.then(async (): Promise<{ ok: boolean; error?: string }> => {
      try {
        this.setSyncStatus('syncing');
        const docRef = doc(firestore, 'school_data', 'main');
        await setDoc(docRef, snapshotToPush);
        this.setSyncStatus('connected');
        return { ok: true };
      } catch (err: any) {
        const message = err?.message || 'Gagal menyinkronkan data ke database cloud.';
        console.error('Push to cloud error:', err);
        this.setSyncStatus('error');
        return { ok: false, error: message };
      }
    });
    this.lastCloudPushPromise = run;
    return run;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.db.lastSync = new Date().toISOString();
    this.db = stripUndefined(this.db);
    this.persistToLocalStorage(this.db);
    this.pushToCloud(this.db);
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Forces an immediate, awaitable save to localStorage and Cloud Firestore.
   * Use on explicit Save buttons (Accounts, Settings, Profiles) so users get verified persistence.
   */
  public async saveAndSyncNow(): Promise<{ ok: boolean; error?: string }> {
    this.db.lastSync = new Date().toISOString();
    this.db = stripUndefined(this.db);
    this.persistToLocalStorage(this.db);
    const result = await this.pushToCloud(this.db);
    this.listeners.forEach((fn) => fn());
    return result;
  }

  public async syncWithCloudNow(): Promise<boolean> {
    try {
      this.setSyncStatus('syncing');
      const docRef = doc(firestore, 'school_data', 'main');
      let snap;
      try {
        snap = await getDocFromServer(docRef);
      } catch {
        snap = await getDoc(docRef);
      }
      if (snap.exists()) {
        const remoteData = snap.data() as AppDatabase;
        if (remoteData && Array.isArray(remoteData.students) && Array.isArray(remoteData.users)) {
          this.db = {
            ...getInitialDatabase(),
            ...remoteData,
            settings: { ...INITIAL_SETTINGS, ...(remoteData.settings || {}) },
          };
          this.persistToLocalStorage(this.db);
          this.setSyncStatus('connected');
          this.listeners.forEach((fn) => fn());
          return true;
        }
      } else {
        const res = await this.pushToCloud(this.db);
        return res.ok;
      }
    } catch (e) {
      console.warn('Manual sync failed:', e);
      this.setSyncStatus('offline');
    }
    return false;
  }

  public getSnapshot(): AppDatabase {
    return this.db;
  }

  public resetToDefault(): void {
    this.db = getInitialDatabase();
    this.notify();
  }

  public importDatabase(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.users)) {
        this.db = {
          ...getInitialDatabase(),
          ...parsed,
          lastSync: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('Import database failed:', e);
    }
    return false;
  }

  public exportDatabaseJSON(): string {
    return JSON.stringify(this.db, null, 2);
  }

  // --- SETTINGS ---
  public updateSettings(partial: Partial<SchoolSettings>) {
    this.db.settings = { ...this.db.settings, ...partial };
    this.notify();
  }

  public updateAcademicPeriod(
    academicYear: string,
    semester: 'Ganjil' | 'Genap',
    applyToClasses = true
  ) {
    const cleanYear = academicYear.trim();
    if (!cleanYear) return;
    this.db.settings = {
      ...this.db.settings,
      academicYear: cleanYear,
      semester,
    };
    if (applyToClasses) {
      this.db.classes = this.db.classes.map((cls) => ({
        ...cls,
        academicYear: cleanYear,
        semester,
      }));
    }
    this.notify();
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    return this.db.users;
  }

  public addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.users = [...this.db.users, newUser];
    this.notify();
    return newUser;
  }

  public updateUser(id: string, partial: Partial<User>): boolean {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...partial };
      this.db.users = [...this.db.users];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    if (this.db.users.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }

  public toggleUserStatus(id: string): boolean {
    const user = this.db.users.find((u) => u.id === id);
    if (user) {
      const newStatus = user.status === 'nonaktif' ? 'aktif' : 'nonaktif';
      return this.updateUser(id, { status: newStatus });
    }
    return false;
  }

  public checkUsernameAvailable(username: string, excludeUserId?: string): boolean {
    const clean = normalizeUsername(username);
    return !this.db.users.some(
      (u) => normalizeUsername(u.username) === clean && u.id !== excludeUserId
    );
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.db.students;
  }

  public addStudent(student: Omit<Student, 'id'>): Student {
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.students = [...this.db.students, newStudent];
    this.notify();
    return newStudent;
  }

  public updateStudent(id: string, partial: Partial<Student>): boolean {
    const idx = this.db.students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.db.students[idx] = { ...this.db.students[idx], ...partial };
      this.db.students = [...this.db.students];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteStudent(id: string): boolean {
    const initialLen = this.db.students.length;
    this.db.students = this.db.students.filter((s) => s.id !== id);
    if (this.db.students.length !== initialLen) {
      // Unbind any wali murid account cleanly without leaving `undefined` keys (Firestore rejects undefined!)
      this.db.users = this.db.users.map((u) => {
        if (u.linkedStudentId === id) {
          const { linkedStudentId: _removed, ...rest } = u;
          return rest;
        }
        return u;
      });
      this.notify();
      return true;
    }
    return false;
  }

  // --- CLASSES ---
  public getClasses(): ClassGroup[] {
    return this.db.classes;
  }

  public addClass(cls: Omit<ClassGroup, 'id'>): ClassGroup {
    const newCls: ClassGroup = {
      ...cls,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.classes = [...this.db.classes, newCls];
    this.notify();
    return newCls;
  }

  public updateClass(id: string, partial: Partial<ClassGroup>): boolean {
    const idx = this.db.classes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.db.classes[idx] = { ...this.db.classes[idx], ...partial };
      this.db.classes = [...this.db.classes];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteClass(id: string): boolean {
    const len = this.db.classes.length;
    this.db.classes = this.db.classes.filter((c) => c.id !== id);
    if (this.db.classes.length !== len) {
      const fallbackClassId = this.db.classes[0]?.id || '';
      if (fallbackClassId) {
        this.db.students = this.db.students.map((s) =>
          s.classId === id ? { ...s, classId: fallbackClassId } : s
        );
      }
      this.notify();
      return true;
    }
    return false;
  }

  // --- SUBJECTS ---
  public getSubjects(): Subject[] {
    return this.db.subjects;
  }

  public addSubject(subj: Omit<Subject, 'id'>): Subject {
    const newSubj: Subject = {
      ...subj,
      id: `sbj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.subjects = [...this.db.subjects, newSubj];
    this.notify();
    return newSubj;
  }

  public updateSubject(id: string, partial: Partial<Subject>): boolean {
    const idx = this.db.subjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.db.subjects[idx] = { ...this.db.subjects[idx], ...partial };
      this.db.subjects = [...this.db.subjects];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteSubject(id: string): boolean {
    const len = this.db.subjects.length;
    this.db.subjects = this.db.subjects.filter((s) => s.id !== id);
    if (this.db.subjects.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- SCHEDULES (JADWAL PELAJARAN) ---
  public getSchedules(): ScheduleItem[] {
    return this.db.schedules;
  }

  public addSchedule(item: Omit<ScheduleItem, 'id'>): ScheduleItem {
    const newItem: ScheduleItem = {
      ...item,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.schedules = [...this.db.schedules, newItem];
    this.notify();
    return newItem;
  }

  public updateSchedule(id: string, partial: Partial<ScheduleItem>): boolean {
    const idx = this.db.schedules.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.db.schedules[idx] = { ...this.db.schedules[idx], ...partial };
      this.db.schedules = [...this.db.schedules];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteSchedule(id: string): boolean {
    const len = this.db.schedules.length;
    this.db.schedules = this.db.schedules.filter((s) => s.id !== id);
    if (this.db.schedules.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- DAILY GRADES ---
  public getDailyGrades(): DailyGrade[] {
    return this.db.dailyGrades;
  }

  public addDailyGrade(grade: Omit<DailyGrade, 'id' | 'updatedAt'>): DailyGrade {
    const newGrade: DailyGrade = {
      ...grade,
      id: `dg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    this.db.dailyGrades = [...this.db.dailyGrades, newGrade];
    this.notify();
    return newGrade;
  }

  public updateDailyGrade(id: string, partial: Partial<DailyGrade>): boolean {
    const idx = this.db.dailyGrades.findIndex((g) => g.id === id);
    if (idx !== -1) {
      this.db.dailyGrades[idx] = {
        ...this.db.dailyGrades[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      this.db.dailyGrades = [...this.db.dailyGrades];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteDailyGrade(id: string): boolean {
    const len = this.db.dailyGrades.length;
    this.db.dailyGrades = this.db.dailyGrades.filter((g) => g.id !== id);
    if (this.db.dailyGrades.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  public toggleReleaseDailyGrade(id: string): boolean {
    const item = this.db.dailyGrades.find((g) => g.id === id);
    if (item) {
      return this.updateDailyGrade(id, { isReleased: !item.isReleased });
    }
    return false;
  }

  public bulkReleaseDailyGrades(ids: string[], release: boolean): void {
    this.db.dailyGrades = this.db.dailyGrades.map((g) => {
      if (ids.includes(g.id)) {
        return { ...g, isReleased: release, updatedAt: new Date().toISOString() };
      }
      return g;
    });
    this.notify();
  }

  // --- SEMESTER GRADES (PTS & PAS) ---
  public getSemesterGrades(): SemesterGrade[] {
    return this.db.semesterGrades;
  }

  public saveSemesterGrade(gradeData: {
    studentId: string;
    subjectId: string;
    classId: string;
    type: 'PTS' | 'PAS';
    academicYear: string;
    semester: 'Ganjil' | 'Genap';
    score: number;
    notes?: string;
    isReleased?: boolean;
  }): SemesterGrade {
    const kkm = this.db.subjects.find((s) => s.id === gradeData.subjectId)?.kkm || this.db.settings.defaultKkm;
    const status = calculateStatus(gradeData.score, kkm);

    const existingIdx = this.db.semesterGrades.findIndex(
      (g) =>
        g.studentId === gradeData.studentId &&
        g.subjectId === gradeData.subjectId &&
        g.type === gradeData.type &&
        g.academicYear === gradeData.academicYear &&
        g.semester === gradeData.semester
    );

    if (existingIdx !== -1) {
      const updated: SemesterGrade = {
        ...this.db.semesterGrades[existingIdx],
        score: gradeData.score,
        status,
        notes: gradeData.notes ?? this.db.semesterGrades[existingIdx].notes,
        isReleased: gradeData.isReleased ?? this.db.semesterGrades[existingIdx].isReleased,
        updatedAt: new Date().toISOString(),
      };
      this.db.semesterGrades[existingIdx] = updated;
      this.db.semesterGrades = [...this.db.semesterGrades];
      this.notify();
      return updated;
    } else {
      const newGrade: SemesterGrade = {
        id: `sg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...gradeData,
        status,
        isReleased: gradeData.isReleased ?? false,
        updatedAt: new Date().toISOString(),
      };
      this.db.semesterGrades = [...this.db.semesterGrades, newGrade];
      this.notify();
      return newGrade;
    }
  }

  public updateSemesterGrade(id: string, partial: Partial<SemesterGrade>): boolean {
    const idx = this.db.semesterGrades.findIndex((g) => g.id === id);
    if (idx !== -1) {
      let status = this.db.semesterGrades[idx].status;
      if (partial.score !== undefined) {
        const kkm = this.db.subjects.find((s) => s.id === this.db.semesterGrades[idx].subjectId)?.kkm || this.db.settings.defaultKkm;
        status = calculateStatus(partial.score, kkm);
      }
      this.db.semesterGrades[idx] = {
        ...this.db.semesterGrades[idx],
        ...partial,
        status,
        updatedAt: new Date().toISOString(),
      };
      this.db.semesterGrades = [...this.db.semesterGrades];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteSemesterGrade(id: string): boolean {
    const len = this.db.semesterGrades.length;
    this.db.semesterGrades = this.db.semesterGrades.filter((g) => g.id !== id);
    if (this.db.semesterGrades.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  public bulkReleaseSemesterGrades(ids: string[], release: boolean): void {
    this.db.semesterGrades = this.db.semesterGrades.map((g) => {
      if (ids.includes(g.id)) {
        return { ...g, isReleased: release, updatedAt: new Date().toISOString() };
      }
      return g;
    });
    this.notify();
  }

  // --- SAVINGS (TABUNGAN) ---
  public getSavings(): SavingsTransaction[] {
    return this.db.savings;
  }

  public addSavingsTransaction(tx: Omit<SavingsTransaction, 'id'>): SavingsTransaction {
    const newTx: SavingsTransaction = {
      ...tx,
      id: `sav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.savings = [newTx, ...this.db.savings];
    this.notify();
    return newTx;
  }

  public deleteSavingsTransaction(id: string): boolean {
    const len = this.db.savings.length;
    this.db.savings = this.db.savings.filter((s) => s.id !== id);
    if (this.db.savings.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- INFAK ---
  public getInfak(): InfakPayment[] {
    return this.db.infak;
  }

  public addInfakPayment(payment: Omit<InfakPayment, 'id'>): InfakPayment {
    const newPayment: InfakPayment = {
      ...payment,
      id: `inf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.infak = [newPayment, ...this.db.infak];
    this.notify();
    return newPayment;
  }

  public deleteInfakPayment(id: string): boolean {
    const len = this.db.infak.length;
    this.db.infak = this.db.infak.filter((p) => p.id !== id);
    if (this.db.infak.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- ATTENDANCE (ABSENSI) ---
  public getAttendance(): AttendanceRecord[] {
    return this.db.attendance;
  }

  public recordAttendance(record: { studentId: string; date: string; status: 'hadir' | 'sakit' | 'izin' | 'alfa'; notes?: string }): AttendanceRecord {
    // Check if attendance already exists for this student and date
    const existingIdx = this.db.attendance.findIndex((a) => a.studentId === record.studentId && a.date === record.date);

    if (existingIdx !== -1) {
      this.db.attendance[existingIdx] = {
        ...this.db.attendance[existingIdx],
        status: record.status,
        notes: record.notes,
      };
      this.db.attendance = [...this.db.attendance];
      this.notify();
      return this.db.attendance[existingIdx];
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: record.studentId,
        date: record.date,
        status: record.status,
        notes: record.notes,
      };
      this.db.attendance = [...this.db.attendance, newRec];
      this.notify();
      return newRec;
    }
  }

  public bulkRecordAttendance(records: { studentId: string; date: string; status: 'hadir' | 'sakit' | 'izin' | 'alfa'; notes?: string }[]): void {
    records.forEach((rec) => {
      const idx = this.db.attendance.findIndex((a) => a.studentId === rec.studentId && a.date === rec.date);
      if (idx !== -1) {
        this.db.attendance[idx] = { ...this.db.attendance[idx], status: rec.status, notes: rec.notes };
      } else {
        this.db.attendance.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          studentId: rec.studentId,
          date: rec.date,
          status: rec.status,
          notes: rec.notes,
        });
      }
    });
    this.db.attendance = [...this.db.attendance];
    this.notify();
  }

  public deleteAttendance(id: string): boolean {
    const len = this.db.attendance.length;
    this.db.attendance = this.db.attendance.filter((a) => a.id !== id);
    if (this.db.attendance.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- EXCUSE LETTERS (SURAT IZIN / SAKIT) ---
  public getExcuseLetters(): ExcuseLetter[] {
    return this.db.excuseLetters;
  }

  public submitExcuseLetter(letter: Omit<ExcuseLetter, 'id' | 'status' | 'submittedAt'>): ExcuseLetter {
    const newLetter: ExcuseLetter = {
      ...letter,
      id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.db.excuseLetters = [newLetter, ...this.db.excuseLetters];
    this.notify();
    return newLetter;
  }

  /**
   * Approving excuse letter automatically inserts/updates attendance records for each date in range!
   */
  public reviewExcuseLetter(id: string, decision: 'approved' | 'rejected', adminNotes: string, reviewerName: string): boolean {
    const letter = this.db.excuseLetters.find((l) => l.id === id);
    if (!letter) return false;

    letter.status = decision;
    letter.adminNotes = adminNotes;
    letter.reviewedAt = new Date().toISOString();
    letter.reviewedBy = reviewerName;

    if (decision === 'approved') {
      const dates = getDateRangeArray(letter.startDate, letter.endDate);
      const attendanceStatus = letter.type === 'sakit' ? 'sakit' : 'izin';

      dates.forEach((dateStr) => {
        const existingIdx = this.db.attendance.findIndex((a) => a.studentId === letter.studentId && a.date === dateStr);
        const reasonNote = `Surat ${letter.type === 'sakit' ? 'Sakit' : 'Izin'}: ${letter.reason}`;

        if (existingIdx !== -1) {
          this.db.attendance[existingIdx] = {
            ...this.db.attendance[existingIdx],
            status: attendanceStatus,
            notes: reasonNote,
          };
        } else {
          this.db.attendance.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            studentId: letter.studentId,
            date: dateStr,
            status: attendanceStatus,
            notes: reasonNote,
          });
        }
      });
      this.db.attendance = [...this.db.attendance];
    }

    this.db.excuseLetters = [...this.db.excuseLetters];
    this.notify();
    return true;
  }

  public deleteExcuseLetter(id: string): boolean {
    const len = this.db.excuseLetters.length;
    this.db.excuseLetters = this.db.excuseLetters.filter((l) => l.id !== id);
    if (this.db.excuseLetters.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- ADDITIONAL FEES (IURAN TAMBAHAN) ---
  public getFees(): FeeItem[] {
    return this.db.fees;
  }

  public addFee(fee: Omit<FeeItem, 'id' | 'createdAt'>): FeeItem {
    const newFee: FeeItem = {
      ...fee,
      id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.fees = [...this.db.fees, newFee];
    this.notify();
    return newFee;
  }

  public updateFee(id: string, partial: Partial<FeeItem>): boolean {
    const idx = this.db.fees.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.db.fees[idx] = { ...this.db.fees[idx], ...partial };
      this.db.fees = [...this.db.fees];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteFee(id: string): boolean {
    // We de-activate or soft delete/archive to preserve payment history as required
    const idx = this.db.fees.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.db.fees = this.db.fees.filter((f) => f.id !== id);
      this.notify();
      return true;
    }
    return false;
  }

  public getFeePayments(): FeePayment[] {
    return this.db.feePayments;
  }

  public recordFeePayment(payment: { feeId: string; studentId: string; amountPaid: number; isPaid: boolean; notes?: string }): FeePayment {
    const existingIdx = this.db.feePayments.findIndex((fp) => fp.feeId === payment.feeId && fp.studentId === payment.studentId);
    if (existingIdx !== -1) {
      this.db.feePayments[existingIdx] = {
        ...this.db.feePayments[existingIdx],
        amountPaid: payment.amountPaid,
        isPaid: payment.isPaid,
        paidAt: payment.isPaid ? new Date().toISOString() : undefined,
        notes: payment.notes,
      };
      this.db.feePayments = [...this.db.feePayments];
      this.notify();
      return this.db.feePayments[existingIdx];
    } else {
      const newPayment: FeePayment = {
        id: `fp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        feeId: payment.feeId,
        studentId: payment.studentId,
        amountPaid: payment.amountPaid,
        isPaid: payment.isPaid,
        paidAt: payment.isPaid ? new Date().toISOString() : undefined,
        notes: payment.notes,
      };
      this.db.feePayments = [...this.db.feePayments, newPayment];
      this.notify();
      return newPayment;
    }
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(): Announcement[] {
    return this.db.announcements;
  }

  public addAnnouncement(ann: Omit<Announcement, 'id'>): Announcement {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.db.announcements = [newAnn, ...this.db.announcements];
    this.notify();
    return newAnn;
  }

  public updateAnnouncement(id: string, partial: Partial<Announcement>): boolean {
    const idx = this.db.announcements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.db.announcements[idx] = { ...this.db.announcements[idx], ...partial };
      this.db.announcements = [...this.db.announcements];
      this.notify();
      return true;
    }
    return false;
  }

  public deleteAnnouncement(id: string): boolean {
    const len = this.db.announcements.length;
    this.db.announcements = this.db.announcements.filter((a) => a.id !== id);
    if (this.db.announcements.length !== len) {
      this.notify();
      return true;
    }
    return false;
  }
}

export const dbService = new DatabaseService();
