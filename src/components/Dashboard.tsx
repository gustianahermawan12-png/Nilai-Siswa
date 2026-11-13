import React, { useState } from 'react';
import { User, Student } from '../types';
import { dbService } from '../services/db';
import {
  calculateSavingsBalance,
  calculateInfakTotal,
  calculateAttendanceSummary,
  calculateAverage,
  formatIDR,
} from '../utils/gradeCalculations';
import { ACADEMIC_YEAR_PRESETS, validateAcademicYearInput } from '../utils/dbSanitizer';
import {
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Wallet,
  HeartHandshake,
  ClipboardList,
  Mail,
  Coins,
  Bell,
  Award,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
  School,
  AlertTriangle,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { TabKey } from './Sidebar';

interface DashboardProps {
  currentUser: User;
  onNavigate: (tab: TabKey) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';

  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [academicYearInput, setAcademicYearInput] = useState(db.settings.academicYear);
  const [semesterInput, setSemesterInput] = useState<'Ganjil' | 'Genap'>(db.settings.semester);
  const [applyToClasses, setApplyToClasses] = useState(true);
  const [academicError, setAcademicError] = useState('');
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleOpenAcademicModal = () => {
    setAcademicYearInput(db.settings.academicYear);
    setSemesterInput(db.settings.semester);
    setApplyToClasses(true);
    setAcademicError('');
    setIsAcademicModalOpen(true);
  };

  const handleSaveAcademicPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcademicError('');
    const check = validateAcademicYearInput(academicYearInput);
    if (!check.valid) {
      setAcademicError(check.error || 'Format tahun ajaran tidak valid.');
      return;
    }

    setIsSavingAcademic(true);
    try {
      dbService.updateAcademicPeriod(check.cleanYear, semesterInput, applyToClasses);
      const syncRes = await dbService.saveAndSyncNow();
      if (!syncRes.ok) {
        setAcademicError(
          `Tersimpan lokal, namun gagal sinkron ke Cloud: ${syncRes.error || 'Periksa koneksi.'}`
        );
        return;
      }
      setIsAcademicModalOpen(false);
      setToastMsg(`Tahun Ajaran diubah ke ${check.cleanYear} • Semester ${semesterInput}!`);
      setTimeout(() => setToastMsg(''), 3500);
    } finally {
      setIsSavingAcademic(false);
    }
  };

  // Wali Murid Child Context
  const linkedStudent: Student | undefined = !isAdmin
    ? db.students.find((s) => s.id === currentUser.linkedStudentId) || db.students[0]
    : undefined;

  // --- STATS COMPUTATION ---
  // 1. General counts
  const totalStudents = db.students.filter((s) => s.status === 'aktif').length;
  const totalWaliAccounts = db.users.filter((u) => u.role === 'wali_murid').length;
  const totalClasses = db.classes.length;
  const totalSubjects = db.subjects.length;
  const pendingExcuseLetters = db.excuseLetters.filter((e) => e.status === 'pending');

  // 2. Savings summary
  const savingsSummary = calculateSavingsBalance(db.savings);

  // 3. Infak summary
  const totalInfak = calculateInfakTotal(db.infak);

  // 4. Attendance today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = db.attendance.filter((a) => a.date === todayStr);
  const todayAttendance = calculateAttendanceSummary(todayRecords);

  // 5. Active fees
  const activeFees = db.fees.filter((f) => f.isActive);

  // 6. Child Specific Calculations (for Wali Murid)
  const childClass = linkedStudent ? db.classes.find((c) => c.id === linkedStudent.classId) : undefined;
  const childDailyGrades = linkedStudent
    ? db.dailyGrades.filter((g) => g.studentId === linkedStudent.id && g.isReleased)
    : [];
  const childSemesterGrades = linkedStudent
    ? db.semesterGrades.filter((g) => g.studentId === linkedStudent.id && g.isReleased)
    : [];
  const childAllScores = [
    ...childDailyGrades.map((g) => g.score),
    ...childSemesterGrades.map((g) => g.score),
  ];
  const childAverageScore = calculateAverage(childAllScores);
  const childTuntasCount = childSemesterGrades.filter((g) => g.status === 'TUNTAS').length;
  const childPerbaikanCount = childSemesterGrades.filter((g) => g.status === 'PERBAIKAN').length;

  const childSavings = linkedStudent
    ? calculateSavingsBalance(db.savings.filter((s) => s.studentId === linkedStudent.id))
    : { totalMasuk: 0, totalKeluar: 0, balance: 0 };

  const childInfak = linkedStudent
    ? calculateInfakTotal(db.infak.filter((i) => i.studentId === linkedStudent.id))
    : 0;

  const childAttendance = linkedStudent
    ? calculateAttendanceSummary(db.attendance.filter((a) => a.studentId === linkedStudent.id))
    : { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0, percentageHadir: 0 };

  // Child's today schedule
  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = daysMap[new Date().getDay()];
  const childTodaySchedule = childClass
    ? db.schedules.filter((sch) => sch.classId === childClass.id && sch.day === todayDayName)
    : [];

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-4 border-amber-400">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/90 text-emerald-950 font-black text-xs uppercase tracking-wider shadow">
              <School className="w-3.5 h-3.5" />
              <span>Tahun Ajaran {db.settings.academicYear} &bull; Semester {db.settings.semester}</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAcademicModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white border border-amber-300/60 font-bold text-xs transition-colors cursor-pointer"
                title="Ubah Tahun Ajaran & Semester Aktif"
              >
                <Edit3 className="w-3 h-3 text-amber-300" />
                <span>Ubah Tahun Ajaran</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            {isAdmin ? `Assalamu'alaikum, ${currentUser.name}` : `Assalamu'alaikum, ${currentUser.name}`}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 leading-relaxed">
            {isAdmin
              ? 'Selamat datang di panel kontrol terpadu MI Nurul Falah. Seluruh data akademik, keuangan, absensi, dan komunikasi tersinkronisasi otomatis.'
              : `Selamat datang di portal informasi ananda ${linkedStudent?.name || 'Siswa'}. Pantau perkembangan nilai, tabungan, infak, dan absensi secara langsung.`}
          </p>

          {/* Quick Shortcuts for Admin */}
          {isAdmin && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('daily_grades')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl shadow hover:bg-emerald-50 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                Input Nilai Harian
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pts_grades')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow hover:bg-amber-300 transition-colors"
              >
                <Award className="w-4 h-4 text-emerald-950" />
                Input PTS / PAS
              </button>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-500 transition-colors border border-emerald-400/50"
              >
                <ClipboardList className="w-4 h-4 text-amber-300" />
                Absensi Hari Ini
              </button>
              <button
                type="button"
                onClick={() => onNavigate('savings')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950/70 text-emerald-100 font-bold text-xs rounded-xl shadow hover:bg-emerald-900 transition-colors border border-emerald-600/40"
              >
                <Wallet className="w-4 h-4 text-amber-300" />
                Catat Tabungan
              </button>
            </div>
          )}
        </div>

        {/* School Logo overlay */}
        <div className="absolute right-4 -bottom-6 opacity-20 lg:opacity-40 pointer-events-none transform rotate-6">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
            alt="Watermark Logo"
            className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-3xl"
          />
        </div>
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {isAdmin && (
        <>
          {/* Pending Permission Alert if any */}
          {pendingExcuseLetters.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    {pendingExcuseLetters.length} Pengajuan Surat Izin / Sakit Menunggu Persetujuan
                  </h4>
                  <p className="text-xs text-amber-800">
                    Wali murid telah mengirim permohonan izin baru. Menyetujui surat akan otomatis mencatat absensi siswa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('excuse_letters')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Tinjau Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Primary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Siswa */}
            <div
              onClick={() => onNavigate('students')}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Siswa</span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalStudents}</div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">Siswa Aktif Terdaftar &rarr;</p>
            </div>

            {/* Wali Murid */}
            <div
              onClick={() => onNavigate('wali_accounts')}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Akun Wali</span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalWaliAccounts}</div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">Kelola Akun & Sandi &rarr;</p>
            </div>

            {/* Kelas & Mapel */}
            <div
              onClick={() => onNavigate('subjects')}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-teal-100 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas & Mapel</span>
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {totalClasses} <span className="text-xs font-normal text-gray-500">Kls</span> &bull; {totalSubjects} <span className="text-xs font-normal text-gray-500">Mpl</span>
              </div>
              <p className="text-[11px] text-teal-700 font-semibold mt-1">KKM Standar: {db.settings.defaultKkm}</p>
            </div>

            {/* Total Tabungan */}
            <div
              onClick={() => onNavigate('savings')}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-green-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Tabungan</span>
                <div className="p-2 rounded-xl bg-green-100 text-green-800 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 truncate">
                {formatIDR(savingsSummary.balance)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Masuk: {formatIDR(savingsSummary.totalMasuk)}
              </p>
            </div>
          </div>

          {/* Secondary Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rekap Kehadiran Hari Ini */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-700" />
                  Kehadiran Hari Ini ({todayStr})
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('attendance')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Kelola
                </button>
              </div>

              {todayRecords.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">Belum ada absensi diinput untuk hari ini.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('attendance')}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                  >
                    Input Absensi Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-base sm:text-lg font-black text-emerald-800">{todayAttendance.hadir}</div>
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Hadir</div>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                      <div className="text-base sm:text-lg font-black text-blue-800">{todayAttendance.sakit}</div>
                      <div className="text-[10px] font-bold text-blue-700 uppercase">Sakit</div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <div className="text-base sm:text-lg font-black text-amber-800">{todayAttendance.izin}</div>
                      <div className="text-[10px] font-bold text-amber-700 uppercase">Izin</div>
                    </div>
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <div className="text-base sm:text-lg font-black text-red-800">{todayAttendance.alfa}</div>
                      <div className="text-[10px] font-bold text-red-700 uppercase">Alfa</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center font-medium">
                    Persentase kehadiran: <span className="font-bold text-emerald-800">{todayAttendance.percentageHadir}%</span> ({todayAttendance.hadir} dari {totalStudents} siswa aktif)
                  </div>
                </div>
              )}
            </div>

            {/* Ringkasan Infak & Iuran Aktif */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  Infak & Iuran Aktif
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('infak')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Detail
                </button>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">Total Infak Terkumpul</p>
                  <p className="text-lg font-black text-emerald-950">{formatIDR(totalInfak)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('infak')}
                  className="p-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-xs font-bold"
                >
                  Catat Infak
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase mb-2">
                  <span>Iuran Aktif ({activeFees.length})</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('fees')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Kelola Iuran &rarr;
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activeFees.map((fee) => (
                    <div key={fee.id} className="p-2 bg-gray-50 rounded-lg text-xs flex justify-between items-center">
                      <span className="font-medium text-gray-800 truncate max-w-[170px]">{fee.title}</span>
                      <span className="font-bold text-emerald-800">{formatIDR(fee.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pengumuman Terbaru */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    Pengumuman Madrasah
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('announcements')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Semua
                  </button>
                </div>

                <div className="space-y-2.5">
                  {db.announcements.slice(0, 2).map((ann) => (
                    <div key={ann.id} className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                      <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{ann.title}</h4>
                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{ann.content}</p>
                      <div className="text-[10px] text-amber-800 font-semibold mt-1">
                        {ann.date} &bull; {ann.authorName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('announcements')}
                className="mt-3 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-200 text-center transition-colors"
              >
                + Buat Pengumuman Baru
              </button>
            </div>
          </div>
        </>
      )}

      {/* WALI MURID DASHBOARD VIEW */}
      {!isAdmin && linkedStudent && (
        <div className="space-y-6">
          {/* Child Profile Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative">
                {linkedStudent.photoUrl ? (
                  <img
                    src={linkedStudent.photoUrl}
                    alt={linkedStudent.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-amber-400 shadow-lg bg-white"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-3xl border-4 border-amber-400">
                    {linkedStudent.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-2 -right-1 bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase shadow">
                  {linkedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {linkedStudent.name}
                    </h2>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      NIS: {linkedStudent.nis} &bull; NISN: {linkedStudent.nisn}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs">
                    <span>{childClass?.name || 'Kelas 1A'}</span>
                    <span className="text-amber-600">&bull;</span>
                    <span>Wali: {childClass?.homeroomTeacher || 'Ustadz'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Rata-rata Nilai</span>
                    <div className="text-lg font-black text-emerald-900">
                      {childAverageScore > 0 ? childAverageScore : '-'}
                    </div>
                  </div>

                  <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Saldo Tabungan</span>
                    <div className="text-sm sm:text-base font-black text-green-900 truncate">
                      {formatIDR(childSavings.balance)}
                    </div>
                  </div>

                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Total Infak</span>
                    <div className="text-sm sm:text-base font-black text-amber-900 truncate">
                      {formatIDR(childInfak)}
                    </div>
                  </div>

                  <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Kehadiran</span>
                    <div className="text-lg font-black text-teal-900">
                      {childAttendance.percentageHadir}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wali Murid Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Rapor Nilai Dirilis */}
            <div
              onClick={() => onNavigate('daily_grades')}
              className="bg-white rounded-2xl p-5 border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Nilai Akademik</h3>
                  <p className="text-[11px] text-gray-500">Nilai Harian, PTS & PAS</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Tuntas: <span className="font-bold text-emerald-700">{childTuntasCount}</span> &bull; Remedial:{' '}
                <span className="font-bold text-amber-700">{childPerbaikanCount}</span>
              </p>
              <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Lihat Buku Nilai</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Kirim Surat Izin / Sakit */}
            <div
              onClick={() => onNavigate('excuse_letters')}
              className="bg-white rounded-2xl p-5 border-2 border-amber-100 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Kirim Surat Izin / Sakit</h3>
                  <p className="text-[11px] text-gray-500">Pemberitahuan resmi madrasah</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Ajukan izin secara online dengan lampiran foto surat dokter jika sakit.
              </p>
              <div className="mt-3 text-xs font-bold text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Ajukan Surat Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cetak Rapor */}
            <div
              onClick={() => onNavigate('reports')}
              className="bg-white rounded-2xl p-5 border-2 border-teal-100 hover:border-teal-400 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-teal-100 rounded-xl text-teal-800 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Cetak Rapor & Laporan</h3>
                  <p className="text-[11px] text-gray-500">Format Resmi MI Nurul Falah</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Unduh PDF atau cetak rapor nilai, buku tabungan, dan riwayat absensi ananda.
              </p>
              <div className="mt-3 text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Menu Cetak</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Today's Schedule for Child */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Jadwal Pelajaran Hari Ini ({todayDayName}) - {childClass?.name}
            </h3>

            {childTodaySchedule.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                Tidak ada kegiatan belajar terjadwal untuk hari ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {childTodaySchedule.map((sch) => {
                  const subj = db.subjects.find((s) => s.id === sch.subjectId);
                  return (
                    <div
                      key={sch.id}
                      className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {sch.startTime} - {sch.endTime}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{subj?.name || 'Mata Pelajaran'}</h4>
                      <p className="text-[11px] text-gray-600 mt-0.5">Guru: {sch.teacherName}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Edit Academic Year & Semester Modal (Admin) */}
      {isAcademicModalOpen && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingAcademic) setIsAcademicModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border-t-4 border-emerald-700 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 border-b border-emerald-900 z-10">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">Ubah Tahun Ajaran &amp; Semester</span>
              </h3>
              <button
                type="button"
                disabled={isSavingAcademic}
                onClick={() => setIsAcademicModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <form
              onSubmit={handleSaveAcademicPeriod}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                {academicError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 flex items-start gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{academicError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tahun Ajaran Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYearInput}
                    onChange={(e) => setAcademicYearInput(e.target.value)}
                    placeholder="Contoh: 2025/2026"
                    className="w-full px-3 py-2.5 text-sm border-2 border-emerald-300 bg-emerald-50/40 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-emerald-950"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ACADEMIC_YEAR_PRESETS.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setAcademicYearInput(yr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-colors cursor-pointer ${
                          academicYearInput === yr
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-emerald-50'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Semester Aktif <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={semesterInput}
                    onChange={(e) => setSemesterInput(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <label className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyToClasses}
                    onChange={(e) => setApplyToClasses(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>
                    Terapkan otomatis ke seluruh kelas/rombel aktif agar seragam di Rapor, Absensi, &amp; Dasbor.
                  </span>
                </label>
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 z-10">
                <button
                  type="button"
                  disabled={isSavingAcademic}
                  onClick={() => setIsAcademicModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  disabled={isSavingAcademic}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950 disabled:opacity-60"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{isSavingAcademic ? 'Menyimpan...' : 'Simpan Tahun Ajaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
