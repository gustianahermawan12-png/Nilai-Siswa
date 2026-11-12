import React, { useState } from 'react';
import { DailyGrade, User } from '../types';
import { dbService } from '../services/db';
import {
  FileCheck2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';

interface DailyGradesManagementProps {
  currentUser: User;
}

export const DailyGradesManagement: React.FC<DailyGradesManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const subjects = db.subjects;
  const dailyGrades = db.dailyGrades;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<DailyGrade | null>(null);

  // Form states
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [chapterTitle, setChapterTitle] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState<number>(85);
  const [notes, setNotes] = useState('');
  const [isReleased, setIsReleased] = useState(true);

  // Deletion
  const [gradeToDelete, setGradeToDelete] = useState<DailyGrade | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingGrade(null);
    const firstInClass = students.find((s) => s.classId === selectedClassId) || students[0];
    setStudentId(firstInClass?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setChapterTitle('Bab 1: ');
    setAssessmentDate(new Date().toISOString().slice(0, 10));
    setScore(85);
    setNotes('Tuntas dengan baik');
    setIsReleased(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grade: DailyGrade) => {
    setEditingGrade(grade);
    setStudentId(grade.studentId);
    setSubjectId(grade.subjectId);
    setChapterTitle(grade.chapterTitle);
    setAssessmentDate(grade.assessmentDate);
    setScore(grade.score);
    setNotes(grade.notes || '');
    setIsReleased(grade.isReleased);
    setIsModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || score === undefined || score < 0 || score > 100) {
      showToast('Harap isi judul materi bab dan nilai valid (0-100)!');
      return;
    }

    const std = students.find((s) => s.id === studentId);
    const classIdToUse = std?.classId || selectedClassId;

    if (editingGrade) {
      dbService.updateDailyGrade(editingGrade.id, {
        studentId,
        subjectId,
        classId: classIdToUse,
        chapterTitle: chapterTitle.trim(),
        assessmentDate,
        score: Number(score),
        notes: notes.trim(),
        isReleased,
      });
      showToast('Nilai harian berhasil diperbarui.');
    } else {
      dbService.addDailyGrade({
        studentId,
        subjectId,
        classId: classIdToUse,
        chapterTitle: chapterTitle.trim(),
        assessmentDate,
        score: Number(score),
        notes: notes.trim(),
        isReleased,
      });
      showToast('Nilai harian baru berhasil disimpan.');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!gradeToDelete) return;
    const success = dbService.deleteDailyGrade(gradeToDelete.id);
    if (success) {
      showToast('Nilai harian berhasil dihapus.');
    }
    setGradeToDelete(null);
  };

  const handleToggleRelease = (grade: DailyGrade) => {
    dbService.toggleReleaseDailyGrade(grade.id);
    showToast(
      grade.isReleased
        ? 'Nilai disembunyikan dari wali murid (status Draf).'
        : 'Nilai berhasil dirilis ke wali murid!'
    );
  };

  // Filter daily grades
  const filteredGrades = dailyGrades.filter((g) => {
    // If Wali Murid, only show linked child's grades that are RELEASED!
    if (!isAdmin) {
      if (!linkedStudent || g.studentId !== linkedStudent.id || !g.isReleased) {
        return false;
      }
    } else {
      if (g.classId !== selectedClassId) return false;
    }

    if (selectedSubjectId !== 'all' && g.subjectId !== selectedSubjectId) {
      return false;
    }

    const std = students.find((s) => s.id === g.studentId);
    const subj = subjects.find((s) => s.id === g.subjectId);
    const matchesSearch =
      (std && std.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subj && subj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      g.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const studentsInClass = students.filter((s) => s.classId === selectedClassId);

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
            <FileCheck2 className="w-6 h-6 text-emerald-700" />
            <span>Nilai Harian / Nilai Bab Siswa</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Kelola penilaian per materi bab harian, tanggal penilaian, catatan evaluasi, dan rilis nilai ke wali murid.'
              : `Daftar nilai harian dan bab ananda yang telah resmi dirilis oleh wali kelas.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Input Nilai Harian</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-700">Mata Pelajaran:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
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
            placeholder="Cari siswa atau bab..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Bab / Materi Penilaian</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4 text-center">Nilai</th>
                <th className="py-3.5 px-4">Status & Catatan</th>
                {isAdmin && <th className="py-3.5 px-4 text-center">Rilis & Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-gray-400">
                    Belum ada data nilai harian yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade, idx) => {
                  const std = students.find((s) => s.id === grade.studentId);
                  const subj = subjects.find((s) => s.id === grade.subjectId);
                  const kkm = subj?.kkm || db.settings.defaultKkm;
                  const isTuntas = grade.score >= kkm;

                  return (
                    <tr key={grade.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                          {std?.name || 'Siswa'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">NIS: {std?.nis}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-950 block">{subj?.name || '-'}</span>
                        <span className="text-[10px] text-gray-500 font-semibold">KKM: {kkm}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800 max-w-xs">
                        {grade.chapterTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {grade.assessmentDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`inline-block px-3 py-1 rounded-xl font-black text-sm sm:text-base ${
                            isTuntas
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {grade.score}
                        </div>
                        <div className="text-[10px] font-bold mt-0.5 uppercase">
                          {isTuntas ? (
                            <span className="text-emerald-700">Tuntas</span>
                          ) : (
                            <span className="text-amber-700">Remedial</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-700 text-xs">{grade.notes || '-'}</div>
                        {isAdmin && (
                          <div className="mt-1">
                            {grade.isReleased ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                <Eye className="w-3 h-3" /> Dirilis ke Wali
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                <Lock className="w-3 h-3" /> Draft (Tersimpan)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleRelease(grade)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                grade.isReleased
                                  ? 'text-green-700 hover:bg-green-100'
                                  : 'text-amber-700 hover:bg-amber-100'
                              }`}
                              title={grade.isReleased ? 'Tarik kembali ke Draft' : 'Rilis ke Wali Murid'}
                            >
                              {grade.isReleased ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(grade)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit nilai"
                              aria-label="Edit nilai"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setGradeToDelete(grade)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus nilai"
                              aria-label="Hapus nilai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Grade */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-t-4 border-emerald-700 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900 z-10">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-300" />
                <span>{editingGrade ? 'Edit Nilai Harian' : 'Input Nilai Harian Siswa'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-2 py-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 text-xs font-bold transition-colors border border-emerald-600/80 cursor-pointer"
                title="Tutup (Esc)"
              >
                &times; Tutup
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Siswa <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {studentsInClass.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (KKM: {s.kkm})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tanggal Penilaian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Bab atau Materi Penilaian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Contoh: Bab 2: Surah An-Nas & Al-Falaq"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nilai Angka (0 - 100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-950"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    KKM:{' '}
                    {subjects.find((s) => s.id === subjectId)?.kkm || db.settings.defaultKkm}.{' '}
                    {score >= (subjects.find((s) => s.id === subjectId)?.kkm || 75)
                      ? 'Status: TUNTAS'
                      : 'Status: PERBAIKAN'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Status Rilis Nilai
                  </label>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isReleased}
                      onChange={(e) => setIsReleased(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      Rilis langsung ke Wali Murid
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Catatan Guru / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Makharijul huruf fasih, tajwid sangat baik..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingGrade ? 'Simpan Perubahan' : 'Simpan Nilai Harian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Working safely! */}
      {gradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Nilai Harian</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data nilai{' '}
              <span className="font-bold text-gray-900">"{gradeToDelete.chapterTitle}"</span> untuk{' '}
              <span className="font-bold text-gray-900">
                {students.find((s) => s.id === gradeToDelete.studentId)?.name}
              </span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setGradeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
