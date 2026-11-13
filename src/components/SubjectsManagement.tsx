import React, { useState } from 'react';
import { Subject, ClassGroup, User } from '../types';
import { dbService } from '../services/db';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  School,
} from 'lucide-react';

interface SubjectsManagementProps {
  currentUser: User;
}

export const SubjectsManagement: React.FC<SubjectsManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const subjects = db.subjects;
  const classes = db.classes;

  const [activeTab, setActiveTab] = useState<'subjects' | 'classes'>('subjects');
  const [searchTerm, setSearchTerm] = useState('');

  // Subject Modal
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjClassId, setSubjClassId] = useState('cls-1');
  const [subjTeacher, setSubjTeacher] = useState('');
  const [subjKkm, setSubjKkm] = useState<number>(75);

  // Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [className, setClassName] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [academicYear, setAcademicYear] = useState(db.settings.academicYear || '2024/2025');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(db.settings.semester || 'Ganjil');

  // Deletion modals
  const [subjToDelete, setSubjToDelete] = useState<Subject | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAddSubj = () => {
    setEditingSubj(null);
    setSubjCode('');
    setSubjName('');
    setSubjClassId(classes[0]?.id || 'cls-1');
    setSubjTeacher('Gustiana Hermawan, S.Pd.');
    setSubjKkm(75);
    setIsSubjModalOpen(true);
  };

  const handleOpenEditSubj = (s: Subject) => {
    setEditingSubj(s);
    setSubjCode(s.code);
    setSubjName(s.name);
    setSubjClassId(s.classId);
    setSubjTeacher(s.teacherName);
    setSubjKkm(s.kkm);
    setIsSubjModalOpen(true);
  };

  const handleSaveSubj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim() || !subjCode.trim()) {
      showToast('Kode dan nama mata pelajaran wajib diisi!');
      return;
    }

    if (editingSubj) {
      dbService.updateSubject(editingSubj.id, {
        code: subjCode.trim().toUpperCase(),
        name: subjName.trim(),
        classId: subjClassId,
        teacherName: subjTeacher.trim(),
        kkm: Number(subjKkm) || 75,
      });
      await dbService.saveAndSyncNow();
      showToast('Mata pelajaran berhasil diperbarui.');
    } else {
      dbService.addSubject({
        code: subjCode.trim().toUpperCase(),
        name: subjName.trim(),
        classId: subjClassId,
        teacherName: subjTeacher.trim(),
        kkm: Number(subjKkm) || 75,
      });
      await dbService.saveAndSyncNow();
      showToast('Mata pelajaran baru berhasil ditambahkan.');
    }

    setIsSubjModalOpen(false);
  };

  const handleDeleteSubjConfirm = async () => {
    if (!subjToDelete) return;
    const success = dbService.deleteSubject(subjToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast('Mata pelajaran berhasil dihapus.');
    }
    setSubjToDelete(null);
  };

  // Class Handlers
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassName(`Kelas ${classes.length + 1}`);
    setHomeroomTeacher('Gustiana Hermawan, S.Pd.');
    setAcademicYear(db.settings.academicYear || '2024/2025');
    setSemester(db.settings.semester || 'Ganjil');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: ClassGroup) => {
    setEditingClass(c);
    setClassName(c.name);
    setHomeroomTeacher(c.homeroomTeacher);
    setAcademicYear(c.academicYear);
    setSemester(c.semester);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    if (editingClass) {
      dbService.updateClass(editingClass.id, {
        name: className.trim(),
        homeroomTeacher: homeroomTeacher.trim(),
        academicYear,
        semester,
      });
      await dbService.saveAndSyncNow();
      showToast('Data kelas berhasil diperbarui.');
    } else {
      dbService.addClass({
        name: className.trim(),
        homeroomTeacher: homeroomTeacher.trim(),
        academicYear,
        semester,
      });
      await dbService.saveAndSyncNow();
      showToast('Kelas baru berhasil ditambahkan.');
    }

    setIsClassModalOpen(false);
  };

  const handleDeleteClassConfirm = async () => {
    if (!classToDelete) return;
    const success = dbService.deleteClass(classToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast('Kelas berhasil dihapus.');
    }
    setClassToDelete(null);
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <BookOpen className="w-6 h-6 text-emerald-700" />
            <span>Manajemen Mata Pelajaran & Kelas</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola kurikulum madrasah, penetapan KKM minimal (standar 75), guru pengampu, dan rombongan belajar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'subjects' ? (
            <button
              type="button"
              onClick={handleOpenAddSubj}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Kelas Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'subjects'
              ? 'bg-amber-400 text-emerald-950 shadow'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mata Pelajaran ({subjects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-amber-400 text-emerald-950 shadow'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Rombongan Belajar / Kelas ({classes.length})
        </button>
      </div>

      {/* SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Kode</th>
                  <th className="py-3.5 px-4">Nama Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Guru Pengampu</th>
                  <th className="py-3.5 px-4 text-center">Batas KKM</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubjects.map((s, idx) => {
                  const cls = classes.find((c) => c.id === s.classId);

                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{s.code}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 text-sm">{s.name}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{s.teacherName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-950 font-black rounded-lg text-xs font-mono">
                          {s.kkm}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{cls?.name || 'Semua Kelas'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubj(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit mapel"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubjToDelete(s)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus mapel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLASSES TAB */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Nama Rombel / Kelas</th>
                  <th className="py-3.5 px-4">Wali Kelas</th>
                  <th className="py-3.5 px-4">Tahun Pelajaran</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">Jumlah Siswa</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((c, idx) => {
                  const count = db.students.filter((s) => s.classId === c.id).length;

                  return (
                    <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">{c.name}</td>
                      <td className="py-3.5 px-4 font-medium text-emerald-950">{c.homeroomTeacher}</td>
                      <td className="py-3.5 px-4 font-mono text-gray-700">{c.academicYear}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[11px]">
                          {c.semester}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">{count} siswa</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(c)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit kelas"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setClassToDelete(c)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus kelas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Subject */}
      {isSubjModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubjModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">{editingSubj ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <form onSubmit={handleSaveSubj} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value)}
                      placeholder="QH"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nama Mapel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subjName}
                      onChange={(e) => setSubjName(e.target.value)}
                      placeholder="Al-Qur'an Hadits"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Guru Pengampu
                  </label>
                  <input
                    type="text"
                    value={subjTeacher}
                    onChange={(e) => setSubjTeacher(e.target.value)}
                    placeholder="Ustadz / Ustadzah..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Batas KKM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      required
                      value={subjKkm}
                      onChange={(e) => setSubjKkm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Nilai &ge; KKM otomatis Tuntas</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Terapkan pada Kelas
                    </label>
                    <select
                      value={subjClassId}
                      onChange={(e) => setSubjClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="semua">Semua Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Simpan Mapel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Class */}
      {isClassModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClassModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <School className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">{editingClass ? 'Edit Rombongan Belajar' : 'Tambah Kelas Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Contoh: Kelas 1C / Kelas 4"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Wali Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={homeroomTeacher}
                    onChange={(e) => setHomeroomTeacher(e.target.value)}
                    placeholder="Nama Ustadz / Ustadzah"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[
                      'Gustiana Hermawan, S.Pd.',
                      'Nurhayati, S.Pd.I',
                      'Ahmad Fauzi, S.Pd.',
                      'Siti Maryam, S.Pd.I',
                      'Ustadz Hasan Basri, S.Pd.I',
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setHomeroomTeacher(t)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          homeroomTeacher === t
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Tahun Pelajaran
                    </label>
                    <input
                      type="text"
                      required
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="2024/2025"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Simpan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {subjToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Mata Pelajaran</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran{' '}
              <span className="font-bold text-gray-900">"{subjToDelete.name}"</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setSubjToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubjConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Mapel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Rombel / Kelas</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus rombongan belajar{' '}
              <span className="font-bold text-gray-900">"{classToDelete.name}"</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteClassConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
