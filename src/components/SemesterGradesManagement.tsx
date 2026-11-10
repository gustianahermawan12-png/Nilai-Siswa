import React, { useState } from 'react';
import { SemesterGrade, User } from '../types';
import { dbService } from '../services/db';
import { calculateStatus, calculateAverage } from '../utils/gradeCalculations';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Search,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SemesterGradesManagementProps {
  currentUser: User;
  type: 'PTS' | 'PAS';
  onNavigateToPrint?: () => void;
}

export const SemesterGradesManagement: React.FC<SemesterGradesManagementProps> = ({
  currentUser,
  type,
  onNavigateToPrint,
}) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const subjects = db.subjects;
  const semesterGrades = db.semesterGrades;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sbj-1');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk edit matrix states (stores score inputs for each student)
  const [scoresDraft, setScoresDraft] = useState<Record<string, { score: number | ''; notes: string }>>({});
  const [isMatrixMode, setIsMatrixMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<SemesterGrade | null>(null);

  // Modal input state
  const [modalStudentId, setModalStudentId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalScore, setModalScore] = useState<number>(80);
  const [modalNotes, setModalNotes] = useState('');
  const [modalReleased, setModalReleased] = useState(true);

  // Deletion
  const [gradeToDelete, setGradeToDelete] = useState<SemesterGrade | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const activeKkm = currentSubjectObj?.kkm || db.settings.defaultKkm;

  const studentsInClass = students.filter(
    (s) => s.classId === selectedClassId && s.status === 'aktif'
  );

  // Get or initialize draft score for a student
  const getDraftForStudent = (stdId: string): { score: number | ''; notes: string } => {
    if (scoresDraft[stdId] !== undefined) {
      return scoresDraft[stdId];
    }
    const existing = semesterGrades.find(
      (g) =>
        g.studentId === stdId &&
        g.subjectId === selectedSubjectId &&
        g.type === type &&
        g.academicYear === db.settings.academicYear &&
        g.semester === db.settings.semester
    );
    return {
      score: existing ? existing.score : '',
      notes: existing?.notes || '',
    };
  };

  const handleScoreChange = (stdId: string, val: string) => {
    const num: number | '' = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setScoresDraft((prev) => ({
      ...prev,
      [stdId]: {
        score: num,
        notes: prev[stdId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (stdId: string, notes: string) => {
    setScoresDraft((prev) => ({
      ...prev,
      [stdId]: {
        score: prev[stdId]?.score !== undefined ? prev[stdId].score : getDraftForStudent(stdId).score,
        notes,
      },
    }));
  };

  const handleSaveAllScores = () => {
    let savedCount = 0;
    studentsInClass.forEach((std) => {
      const draft = scoresDraft[std.id] || getDraftForStudent(std.id);
      if (draft.score !== '' && typeof draft.score === 'number') {
        dbService.saveSemesterGrade({
          studentId: std.id,
          subjectId: selectedSubjectId,
          classId: selectedClassId,
          type,
          academicYear: db.settings.academicYear,
          semester: db.settings.semester,
          score: draft.score,
          notes: draft.notes,
          isReleased: true,
        });
        savedCount++;
      }
    });

    setScoresDraft({});
    showToast(`Berhasil menyimpan ${savedCount} nilai ${type} untuk kelas ini!`);
  };

  const handleToggleReleaseClass = (release: boolean) => {
    const classGrades = semesterGrades.filter(
      (g) =>
        g.classId === selectedClassId &&
        g.subjectId === selectedSubjectId &&
        g.type === type &&
        g.academicYear === db.settings.academicYear &&
        g.semester === db.settings.semester
    );

    const ids = classGrades.map((g) => g.id);
    if (ids.length === 0) {
      showToast(`Belum ada nilai tersimpan untuk dirilis.`);
      return;
    }

    dbService.bulkReleaseSemesterGrades(ids, release);
    showToast(
      release
        ? `Semua nilai ${type} mata pelajaran ini telah DIRILIS ke wali murid!`
        : `Nilai ${type} ditarik ke status Draft (disembunyikan dari wali murid).`
    );
  };

  const handleDeleteConfirm = () => {
    if (!gradeToDelete) return;
    const success = dbService.deleteSemesterGrade(gradeToDelete.id);
    if (success) {
      showToast(`Nilai ${type} berhasil dihapus.`);
    }
    setGradeToDelete(null);
  };

  // Class statistics for current subject
  const currentSubjectGrades = semesterGrades.filter(
    (g) =>
      g.classId === selectedClassId &&
      g.subjectId === selectedSubjectId &&
      g.type === type &&
      g.academicYear === db.settings.academicYear &&
      g.semester === db.settings.semester
  );

  const numericScores = currentSubjectGrades.map((g) => g.score);
  const classAvg = calculateAverage(numericScores);
  const tuntasCount = currentSubjectGrades.filter((g) => g.status === 'TUNTAS').length;
  const perbaikanCount = currentSubjectGrades.filter((g) => g.status === 'PERBAIKAN').length;

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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black text-[10px] uppercase mb-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            {type === 'PTS' ? 'Penilaian Tengah Semester (PTS)' : 'Penilaian Akhir Semester (PAS)'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>Nilai {type} Siswa – MI Nurul Falah</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? `Standar KKM: ${activeKkm}. Nilai ≥ ${activeKkm} otomatis TUNTAS, nilai < ${activeKkm} otomatis PERBAIKAN.`
              : `Hasil penilaian ${type} ananda yang telah resmi dirilis madrasah.`}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllScores}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 border-b-2 border-emerald-950"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Simpan Semua Nilai</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleReleaseClass(true)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Rilis ke Wali</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards for Class */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Rata-rata Kelas</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">
              {classAvg > 0 ? classAvg : '-'}
            </div>
            <p className="text-[10px] text-gray-400">Dari {currentSubjectGrades.length} nilai tersimpan</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Tuntas (≥ {activeKkm})</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">
              {tuntasCount} <span className="text-xs font-normal text-emerald-700">siswa</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold">Tuntas Sesuai KKM</p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase">Perbaikan (&lt; {activeKkm})</span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">
              {perbaikanCount} <span className="text-xs font-normal text-amber-700">siswa</span>
            </div>
            <p className="text-[10px] text-amber-700 font-semibold">Perlu Tindak Remedial</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Batas Minimal KKM</span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{activeKkm}</div>
            <p className="text-[10px] text-gray-400">Dapat diatur di Pengaturan</p>
          </div>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setScoresDraft({});
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
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-700">Mata Pelajaran:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setScoresDraft({});
              }}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - KKM: {s.kkm}
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
            placeholder="Cari nama siswa..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* ADMIN MATRIX TABLE VIEW */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-900 text-white flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm">
                Input Nilai {type} - {currentSubjectObj?.name} (KKM: {activeKkm})
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span>Semester {db.settings.semester} &bull; TP {db.settings.academicYear}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4 w-32">Input Nilai (0-100)</th>
                  <th className="py-3 px-4">Keterangan Sistem</th>
                  <th className="py-3 px-4">Catatan Evaluasi / Remedial</th>
                  <th className="py-3 px-4 text-center">Status Rilis</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsInClass.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Tidak ada siswa aktif di kelas ini.
                    </td>
                  </tr>
                ) : (
                  studentsInClass
                    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((std, idx) => {
                      const existing = semesterGrades.find(
                        (g) =>
                          g.studentId === std.id &&
                          g.subjectId === selectedSubjectId &&
                          g.type === type &&
                          g.academicYear === db.settings.academicYear &&
                          g.semester === db.settings.semester
                      );

                      const draft = scoresDraft[std.id] || {
                        score: existing ? existing.score : '',
                        notes: existing?.notes || '',
                      };

                      const currentScoreNum =
                        typeof draft.score === 'number'
                          ? draft.score
                          : existing
                          ? existing.score
                          : null;

                      const status =
                        currentScoreNum !== null ? calculateStatus(currentScoreNum, activeKkm) : null;

                      return (
                        <tr key={std.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                              {std.name}
                            </span>
                            <span className="text-[10px] text-gray-500">{std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600 font-semibold">{std.nis}</td>
                          <td className="py-3.5 px-4">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={draft.score}
                              onChange={(e) => handleScoreChange(std.id, e.target.value)}
                              placeholder="0 - 100"
                              className="w-24 px-3 py-1.5 text-sm font-black border-2 border-gray-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-emerald-950 font-mono"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            {status === 'TUNTAS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                TUNTAS
                              </span>
                            )}
                            {status === 'PERBAIKAN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                PERBAIKAN
                              </span>
                            )}
                            {!status && <span className="text-gray-400 italic text-[11px]">Belum diinput</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={draft.notes}
                              onChange={(e) => handleNotesChange(std.id, e.target.value)}
                              placeholder="Catatan nilai / perbaikan..."
                              className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {existing ? (
                              existing.isReleased ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                  <Eye className="w-3 h-3" /> Dirilis
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                  <EyeOff className="w-3 h-3" /> Draft
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {existing && (
                              <button
                                type="button"
                                onClick={() => setGradeToDelete(existing)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus nilai siswa ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              Ketentuan: Nilai 75 - 100 otomatis TUNTAS, nilai di bawah 75 otomatis PERBAIKAN.
            </span>
            <button
              type="button"
              onClick={handleSaveAllScores}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Simpan Perubahan Nilai</span>
            </button>
          </div>
        </div>
      )}

      {/* WALI MURID VIEW: ONLY RELEASED GRADES FOR LINKED CHILD */}
      {!isAdmin && linkedStudent && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
            <div>
              <h3 className="font-bold text-sm">
                Rekap Hasil Nilai {type} Ananda {linkedStudent.name}
              </h3>
              <p className="text-[11px] text-emerald-200">
                Semester {db.settings.semester} &bull; Tahun Ajaran {db.settings.academicYear}
              </p>
            </div>
            <span className="bg-amber-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
              RESMI
            </span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subj) => {
                const grade = semesterGrades.find(
                  (g) =>
                    g.studentId === linkedStudent.id &&
                    g.subjectId === subj.id &&
                    g.type === type &&
                    g.isReleased
                );

                const kkm = subj.kkm || 75;

                return (
                  <div
                    key={subj.id}
                    className="p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-emerald-300 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{subj.name}</h4>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          Kode: {subj.code} &bull; KKM: {kkm}
                        </span>
                      </div>
                      {grade ? (
                        <div
                          className={`px-3 py-1 rounded-xl font-black text-lg ${
                            grade.score >= kkm
                              ? 'bg-emerald-100 text-emerald-950'
                              : 'bg-amber-100 text-amber-950'
                          }`}
                        >
                          {grade.score}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Belum dirilis</span>
                      )}
                    </div>

                    {grade && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            grade.status === 'TUNTAS'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {grade.status}
                        </span>
                        <span className="text-[11px] text-gray-500 italic truncate max-w-[150px]">
                          {grade.notes || 'Nilai Resmi'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Nilai {type}</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus nilai {type} untuk siswa{' '}
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
