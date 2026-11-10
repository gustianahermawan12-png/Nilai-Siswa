import React, { useState } from 'react';
import { AttendanceRecord, User } from '../types';
import { dbService } from '../services/db';
import { calculateAttendanceSummary } from '../utils/gradeCalculations';
import {
  ClipboardList,
  CheckCircle2,
  Calendar,
  Save,
  Check,
  Search,
  Filter,
  Sparkles,
  Users,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface AttendanceManagementProps {
  currentUser: User;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const attendance = db.attendance;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Daily draft states: { [studentId]: { status, notes } }
  const [dailyDraft, setDailyDraft] = useState<Record<string, { status: AttendanceRecord['status']; notes: string }>>({});
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const studentsInClass = students.filter(
    (s) => s.classId === selectedClassId && s.status === 'aktif'
  );

  // Helper to get status for student on selectedDate
  const getStudentStatus = (stdId: string): { status: AttendanceRecord['status']; notes: string } => {
    if (dailyDraft[stdId]) {
      return dailyDraft[stdId];
    }
    const existing = attendance.find((a) => a.studentId === stdId && a.date === selectedDate);
    if (existing) {
      return { status: existing.status, notes: existing.notes || '' };
    }
    return { status: 'hadir', notes: '' };
  };

  const handleSetStatus = (stdId: string, status: AttendanceRecord['status']) => {
    setDailyDraft((prev) => ({
      ...prev,
      [stdId]: {
        status,
        notes: prev[stdId]?.notes || '',
      },
    }));
  };

  const handleSetNotes = (stdId: string, notes: string) => {
    setDailyDraft((prev) => ({
      ...prev,
      [stdId]: {
        status: prev[stdId]?.status || getStudentStatus(stdId).status,
        notes,
      },
    }));
  };

  const handleMarkAllHadir = () => {
    const updated: Record<string, { status: AttendanceRecord['status']; notes: string }> = {};
    studentsInClass.forEach((s) => {
      updated[s.id] = { status: 'hadir', notes: 'Hadir tepat waktu' };
    });
    setDailyDraft(updated);
    showToast('Semua siswa di kelas ditandai "Hadir"!');
  };

  const handleSaveAttendance = () => {
    const recordsToSave = studentsInClass.map((std) => {
      const d = dailyDraft[std.id] || getStudentStatus(std.id);
      return {
        studentId: std.id,
        date: selectedDate,
        status: d.status,
        notes: d.notes,
      };
    });

    dbService.bulkRecordAttendance(recordsToSave);
    setDailyDraft({});
    showToast(`Daftar hadir tanggal ${selectedDate} berhasil disimpan.`);
  };

  // Summary for selected date & class
  const dayRecords = attendance.filter(
    (a) =>
      a.date === selectedDate &&
      studentsInClass.some((s) => s.id === a.studentId)
  );
  const daySummary = calculateAttendanceSummary(dayRecords);

  // Child specific attendance history (for Wali Murid)
  const childAttendanceHistory = linkedStudent
    ? attendance
        .filter((a) => a.studentId === linkedStudent.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const childTotalSummary = calculateAttendanceSummary(childAttendanceHistory);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-emerald-700" />
            <span>Daftar Hadir / Absensi Siswa</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Input absensi harian (Hadir, Sakit, Izin, Alfa). Sistem otomatis mencegah duplikasi absensi tanggal yang sama.'
              : `Catatan rekap kehadiran ananda ${linkedStudent?.name}.`}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllHadir}
              className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Tandai Semua Hadir</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 border-b-2 border-emerald-950"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Simpan Absensi</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Hadir</span>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">
            {isAdmin ? daySummary.hadir : childTotalSummary.hadir}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold">Tepat Waktu</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-blue-800 uppercase">Sakit</span>
          <div className="text-2xl font-black text-blue-900 mt-0.5">
            {isAdmin ? daySummary.sakit : childTotalSummary.sakit}
          </div>
          <p className="text-[10px] text-blue-600 font-semibold">Dengan Keterangan</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Izin</span>
          <div className="text-2xl font-black text-amber-900 mt-0.5">
            {isAdmin ? daySummary.izin : childTotalSummary.izin}
          </div>
          <p className="text-[10px] text-amber-600 font-semibold">Disetujui Guru</p>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-red-800 uppercase">Alfa (Tanpa Keterangan)</span>
          <div className="text-2xl font-black text-red-900 mt-0.5">
            {isAdmin ? daySummary.alfa : childTotalSummary.alfa}
          </div>
          <p className="text-[10px] text-red-600 font-semibold">Tidak Hadir</p>
        </div>
      </div>

      {/* Date & Class Selectors */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDailyDraft({});
                }}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setDailyDraft({});
                }}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {isAdmin ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm">
                Absensi {classes.find((c) => c.id === selectedClassId)?.name} &bull; Tanggal: {selectedDate}
              </h3>
            </div>
            <span className="text-xs text-emerald-200 font-medium">
              {studentsInClass.length} Siswa Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4 text-center">Status Kehadiran</th>
                  <th className="py-3 px-4">Keterangan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsInClass.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Tidak ada siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  studentsInClass
                    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((std, idx) => {
                      const cur = getStudentStatus(std.id);

                      return (
                        <tr key={std.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                              {std.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-gray-600">{std.nis}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleSetStatus(std.id, 'hadir')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  cur.status === 'hadir'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-emerald-800'
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(std.id, 'sakit')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  cur.status === 'sakit'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-blue-800'
                                }`}
                              >
                                Sakit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(std.id, 'izin')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  cur.status === 'izin'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-amber-800'
                                }`}
                              >
                                Izin
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(std.id, 'alfa')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  cur.status === 'alfa'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-red-800'
                                }`}
                              >
                                Alfa
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={cur.notes}
                              onChange={(e) => handleSetNotes(std.id, e.target.value)}
                              placeholder="Catatan kehadiran..."
                              className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Simpan Absensi Hari Ini</span>
            </button>
          </div>
        </div>
      ) : (
        /* WALI MURID VIEW: HISTORY FOR LINKED CHILD */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
            <div>
              <h3 className="font-bold text-sm">
                Riwayat Absensi Ananda {linkedStudent?.name}
              </h3>
              <p className="text-[11px] text-emerald-200">
                Persentase Kehadiran: <span className="font-bold text-amber-300">{childTotalSummary.percentageHadir}%</span>
              </p>
            </div>
            <span className="bg-amber-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
              REKAP
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status Kehadiran</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {childAttendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      Belum ada catatan kehadiran.
                    </td>
                  </tr>
                ) : (
                  childAttendanceHistory.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-800">{rec.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            rec.status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-900'
                              : rec.status === 'sakit'
                              ? 'bg-blue-100 text-blue-900'
                              : rec.status === 'izin'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{rec.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
