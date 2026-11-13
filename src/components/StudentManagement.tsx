import React, { useState } from 'react';
import { Student, ClassGroup } from '../types';
import { dbService } from '../services/db';
import { hashPassword } from '../utils/security';
import { compressImageFile } from '../utils/imageHelper';
import {
  validateCredentialsInput,
  formatPasswordDisplay,
} from '../utils/dbSanitizer';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Camera,
  Check,
  X,
  Phone,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  School,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface StudentManagementProps {
  onOpenWaliAccountForStudent?: (studentId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  onOpenWaliAccountForStudent,
}) => {
  const db = dbService.getSnapshot();
  const students = db.students;
  const classes = db.classes;
  const users = db.users;

  // Main Tab: 'students' | 'classes'
  const [activeMainTab, setActiveMainTab] = useState<'students' | 'classes'>('students');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states (Student)
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classId, setClassId] = useState(classes[0]?.id || 'cls-1');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [createWaliLogin, setCreateWaliLogin] = useState(true);
  const [waliUsername, setWaliUsername] = useState('');
  const [waliPassword, setWaliPassword] = useState('');
  const [showWaliPassword, setShowWaliPassword] = useState(true);
  const [studentFormError, setStudentFormError] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Delete student confirmation
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Class Management states & handlers
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [homeroomTeacherInput, setHomeroomTeacherInput] = useState('Gustiana Hermawan, S.Pd.');
  const [academicYearInput, setAcademicYearInput] = useState('2024/2025');
  const [semesterInput, setSemesterInput] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);

  const teacherSuggestions = [
    'Gustiana Hermawan, S.Pd.',
    'Nurhayati, S.Pd.I',
    'Ahmad Fauzi, S.Pd.',
    'Siti Maryam, S.Pd.I',
    'Ustadz Hasan Basri, S.Pd.I',
    'Ustadzah Halimah, S.Ag',
    'Ustadz Farhan, Lc.',
    'Agus Setiawan, S.Pd.',
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameInput(`Kelas ${classes.length + 1}`);
    setHomeroomTeacherInput('Gustiana Hermawan, S.Pd.');
    setAcademicYearInput(db.settings.academicYear || '2024/2025');
    setSemesterInput(db.settings.semester || 'Ganjil');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassGroup) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setHomeroomTeacherInput(cls.homeroomTeacher);
    setAcademicYearInput(cls.academicYear);
    setSemesterInput(cls.semester);
    setIsClassModalOpen(true);
  };

  const handleOpenQuickEditWaliKelas = (cls: ClassGroup) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setHomeroomTeacherInput(cls.homeroomTeacher);
    setAcademicYearInput(cls.academicYear);
    setSemesterInput(cls.semester);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim() || !homeroomTeacherInput.trim()) return;

    if (editingClass) {
      dbService.updateClass(editingClass.id, {
        name: classNameInput.trim(),
        homeroomTeacher: homeroomTeacherInput.trim(),
        academicYear: academicYearInput.trim(),
        semester: semesterInput,
      });
      await dbService.saveAndSyncNow();
      showToast(`Data kelas & Wali Kelas ${classNameInput.trim()} berhasil diperbarui!`);
    } else {
      dbService.addClass({
        name: classNameInput.trim(),
        homeroomTeacher: homeroomTeacherInput.trim(),
        academicYear: academicYearInput.trim(),
        semester: semesterInput,
      });
      await dbService.saveAndSyncNow();
      showToast(
        `Kelas ${classNameInput.trim()} dengan Wali Kelas ${homeroomTeacherInput.trim()} berhasil ditambahkan!`
      );
    }
    setIsClassModalOpen(false);
  };

  const handleDeleteClassConfirm = async () => {
    if (!classToDelete) return;
    const clsName = classToDelete.name;
    const success = dbService.deleteClass(classToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast(`Kelas ${clsName} berhasil dihapus.`);
    }
    setClassToDelete(null);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentFormError('');
    setName('');
    setNis(String(24000 + students.length + 1));
    setNisn(String(3125678900 + students.length + 1));
    setGender('L');
    setClassId(classes[0]?.id || 'cls-1');
    setParentName('');
    setPhone('');
    setAddress('');
    setPhotoUrl('/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg');
    setStatus('aktif');
    setCreateWaliLogin(true);
    setWaliUsername(`wali_siswa${students.length + 1}`);
    setWaliPassword('wali123');
    setShowWaliPassword(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (std: Student) => {
    setEditingStudent(std);
    setStudentFormError('');
    setName(std.name);
    setNis(std.nis);
    setNisn(std.nisn);
    setGender(std.gender);
    setClassId(std.classId);
    setParentName(std.parentName);
    setPhone(std.phone);
    setAddress(std.address);
    setPhotoUrl(std.photoUrl || '');
    setStatus(std.status);
    setCreateWaliLogin(false);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 420, 0.72);
      setPhotoUrl(compressed);
    } catch {
      setStudentFormError('Gagal memproses foto dari galeri. Coba gambar lain.');
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError('');
    if (!name.trim()) {
      setStudentFormError('Nama lengkap siswa wajib diisi.');
      return;
    }

    // Validate wali credentials BEFORE creating student so there is no partial orphan student
    let validatedCreds: { cleanUsername: string; cleanPassword: string } | null = null;
    if (!editingStudent && createWaliLogin) {
      const check = validateCredentialsInput({
        username: waliUsername,
        password: waliPassword,
        requirePassword: true,
        minPasswordLength: 4,
      });
      if (!check.valid) {
        setStudentFormError(check.error || 'Username atau kata sandi wali murid tidak valid.');
        return;
      }
      const isAvail = dbService.checkUsernameAvailable(check.cleanUsername);
      if (!isAvail) {
        setStudentFormError(
          `Nama pengguna "${check.cleanUsername}" sudah terpakai. Silakan ganti username wali murid.`
        );
        return;
      }
      validatedCreds = {
        cleanUsername: check.cleanUsername,
        cleanPassword: check.cleanPassword,
      };
    }

    setIsSavingStudent(true);
    try {
      if (editingStudent) {
        dbService.updateStudent(editingStudent.id, {
          name: name.trim(),
          nis: nis.trim(),
          nisn: nisn.trim(),
          gender,
          classId,
          parentName: parentName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          photoUrl,
          status,
        });
      } else {
        const newStudent = dbService.addStudent({
          name: name.trim(),
          nis: nis.trim(),
          nisn: nisn.trim(),
          gender,
          classId,
          parentName: parentName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          photoUrl,
          status,
        });

        if (validatedCreds) {
          const hashed = await hashPassword(validatedCreds.cleanPassword);
          const newWaliUser = dbService.addUser({
            username: validatedCreds.cleanUsername,
            password: hashed,
            role: 'wali_murid',
            name: parentName.trim() || `Wali dari ${name.trim()}`,
            title: `Wali Murid - ${name.trim()}`,
            linkedStudentId: newStudent.id,
            phone: phone.trim(),
            securityQuestion: 'Nama ibu kandung?',
            securityAnswer: 'Ibu',
            status: 'aktif',
          });
          dbService.updateStudent(newStudent.id, { waliMuridId: newWaliUser.id });
        }
      }

      const syncRes = await dbService.saveAndSyncNow();
      if (!syncRes.ok) {
        setStudentFormError(
          `Data tersimpan lokal, tetapi gagal sinkron ke Cloud: ${syncRes.error || 'Coba lagi.'}`
        );
        return;
      }

      showToast(
        editingStudent
          ? `Data siswa "${name.trim()}" berhasil diperbarui & tersimpan ke Cloud!`
          : `Siswa "${name.trim()}"${validatedCreds ? ` beserta akun "${validatedCreds.cleanUsername}"` : ''} berhasil didaftarkan!`
      );
      setIsModalOpen(false);
    } catch (err: unknown) {
      setStudentFormError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data siswa.'
      );
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    const deletedName = studentToDelete.name;
    const success = dbService.deleteStudent(studentToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast(`Siswa "${deletedName}" berhasil dihapus.`);
    }
    setStudentToDelete(null);
  };

  const filteredStudents = students.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.nis.includes(searchTerm) ||
      std.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || std.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

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
            {activeMainTab === 'students' ? (
              <>
                <Users className="w-6 h-6 text-emerald-700" />
                <span>Manajemen Data Siswa</span>
              </>
            ) : (
              <>
                <School className="w-6 h-6 text-emerald-700" />
                <span>Rombongan Belajar & Wali Kelas</span>
              </>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {activeMainTab === 'students'
              ? 'Kelola data siswa, foto profil, penetapan kelas, dan akun login wali murid MI Nurul Falah.'
              : 'Tambah rombel baru, tetapkan serta ubah wali kelas untuk setiap kelas, dan kelola kelas madrasah.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeMainTab === 'students' ? (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Siswa Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Tambah Kelas & Wali Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher Pills */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveMainTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'students'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Siswa ({students.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'classes'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Rombel & Wali Kelas ({classes.length})</span>
        </button>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeMainTab === 'students' && (
        <>
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa, NIS, atau wali..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-600 shrink-0">Filter Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="all">Semua Kelas ({students.length})</option>
                {classes.map((cls) => {
                  const count = students.filter((s) => s.classId === cls.id).length;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({count} siswa)
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={() => setActiveMainTab('classes')}
                className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1 rounded bg-emerald-50 border border-emerald-200"
                title="Kelola & Ubah Wali Kelas"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Ubah Wali Kelas</span>
              </button>
            </div>
          </div>

      {/* Student Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Foto & Siswa</th>
                <th className="py-3.5 px-4">NIS / NISN</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Orang Tua / Wali</th>
                <th className="py-3.5 px-4">Akun Login Wali</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  const cls = classes.find((c) => c.id === std.classId);
                  const waliAccount = users.find((u) => u.linkedStudentId === std.id);

                  return (
                    <tr key={std.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {std.photoUrl ? (
                            <img
                              src={std.photoUrl}
                              alt={std.name}
                              className="w-10 h-10 rounded-xl object-cover border border-amber-300 shadow-xs bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                              {std.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                              {std.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'} &bull; {std.address || 'Alamat belum diisi'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        <div>{std.nis}</div>
                        <div className="text-[10px] text-gray-400">{std.nisn}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-lg text-[11px]">
                          {cls?.name || 'Kelas 1A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{std.parentName || '-'}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{std.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {waliAccount ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              {waliAccount.username}
                            </span>
                            <div className="text-[10px] text-gray-500 font-mono">
                              Sandi: {formatPasswordDisplay(waliAccount.password)}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenWaliAccountForStudent?.(std.id)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Buat Akun Wali
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            std.status === 'aktif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {std.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(std)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit data siswa"
                            aria-label={`Edit ${std.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(std)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus data siswa"
                            aria-label={`Hapus ${std.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {/* TAB 2: ROMBONGAN BELAJAR & WALI KELAS */}
  {activeMainTab === 'classes' && (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <School className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <p className="font-extrabold text-sm sm:text-base text-emerald-950">
              Manajemen Rombel & Penugasan Wali Kelas
            </p>
            <p className="text-gray-600 text-xs mt-0.5">
              Admin dapat menambah kelas baru, mengubah nama kelas, menetapkan/mengubah nama wali kelas, serta menghapus kelas. Setiap perubahan otomatis tersinkronisasi ke seluruh sistem & cetak rapor.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAddClass}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const studentsInClass = students.filter((s) => s.classId === cls.id);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                {/* Header: Class Name & Academic Year */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm border border-emerald-200">
                      {cls.name.replace(/[^0-9A-Za-z]/g, '').slice(0, 3) || 'KLS'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">{cls.name}</h3>
                      <span className="text-[10px] text-gray-500 font-mono">
                        TP {cls.academicYear} &bull; {cls.semester}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200">
                    {studentsInClass.length} Siswa
                  </span>
                </div>

                {/* Wali Kelas Section - PROMINENT & DIRECTLY EDITABLE */}
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Wali Kelas / Guru Pengampu:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickEditWaliKelas(cls)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors flex items-center gap-1"
                      title="Klik untuk mengubah nama wali kelas"
                    >
                      <Edit2 className="w-3 h-3 text-blue-600" />
                      <span>Ubah Wali</span>
                    </button>
                  </div>
                  <p className="font-extrabold text-xs sm:text-sm text-emerald-950 truncate">
                    {cls.homeroomTeacher || 'Belum Ditentukan'}
                  </p>
                </div>

                {/* Student Preview List */}
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                    Siswa Terdaftar ({studentsInClass.length}):
                  </p>
                  {studentsInClass.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Belum ada siswa di kelas ini</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {studentsInClass.slice(0, 5).map((s) => (
                        <span
                          key={s.id}
                          className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[130px]"
                        >
                          {s.name}
                        </span>
                      ))}
                      {studentsInClass.length > 5 && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">
                          +{studentsInClass.length - 5} lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditClass(cls)}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Edit Rombel & Wali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClassToDelete(cls)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                  title="Hapus kelas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Table Overview */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            Tabel Rombongan Belajar & Wali Kelas
          </h3>
          <span className="text-xs text-gray-500 font-medium">Total {classes.length} Kelas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4">Tahun Pelajaran</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Jumlah Siswa</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((cls, idx) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                return (
                  <tr key={cls.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{cls.name}</td>
                    <td className="py-3 px-4 font-medium text-emerald-950 flex items-center justify-between gap-2">
                      <span>{cls.homeroomTeacher}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickEditWaliKelas(cls)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200"
                        title="Ubah Wali Kelas"
                      >
                        Ubah Wali
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{cls.academicYear}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px]">
                        {cls.semester}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-700">{count} siswa</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit kelas & wali kelas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassToDelete(cls)}
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
    </div>
  )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingStudent) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <Users className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</span>
              </h3>
              <button
                type="button"
                disabled={isSavingStudent}
                onClick={() => setIsModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                {studentFormError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 flex items-start gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{studentFormError}</span>
                  </div>
                )}

                {/* Photo picker */}
                <div className="flex items-center gap-4 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60">
                  <div className="relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Pratinjau"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-600 bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xl">
                        Foto
                      </div>
                    )}
                    <label
                      htmlFor="student-photo"
                      className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-emerald-950 rounded-full shadow cursor-pointer hover:scale-110 transition-transform"
                      title="Pilih foto dari galeri HP/PC"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        id="student-photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Foto Siswa</p>
                    <p className="text-[11px] text-gray-500">
                      Pilih file foto siswa langsung dari galeri HP atau komputer.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nama Lengkap Siswa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingStudent && createWaliLogin) {
                          const simple = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (simple) setWaliUsername(`wali_${simple.slice(0, 12)}`);
                        }
                      }}
                      placeholder="Contoh: Ahmad Zaki Pratama"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kelas <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Wali: {c.homeroomTeacher})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nomor Induk Siswa (NIS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="24001"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      NISN (Nomor Nasional)
                    </label>
                    <input
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="3125678901"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === 'L'}
                          onChange={() => setGender('L')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Laki-laki (L)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === 'P'}
                          onChange={() => setGender('P')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Perempuan (P)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Status Siswa
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Non-aktif / Pindah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Contoh: Bpk. Ridwan"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nomor WhatsApp / HP Orang Tua
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Alamat Tempat Tinggal
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap siswa..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Automatic Wali Murid Account Creation for new students */}
                {!editingStudent && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createWaliLogin}
                        onChange={(e) => setCreateWaliLogin(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        Buat Akun Login Wali Murid Secara Otomatis
                      </span>
                    </label>

                    {createWaliLogin && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                            Nama Pengguna (Username)
                          </label>
                          <input
                            type="text"
                            required={createWaliLogin}
                            value={waliUsername}
                            onChange={(e) => setWaliUsername(e.target.value)}
                            placeholder="wali_ahmad"
                            className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                            Kata Sandi (Password)
                          </label>
                          <div className="relative">
                            <input
                              type={showWaliPassword ? 'text' : 'password'}
                              required={createWaliLogin}
                              value={waliPassword}
                              onChange={(e) => setWaliPassword(e.target.value)}
                              placeholder="Minimal 4 karakter"
                              className="w-full pl-3 pr-9 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowWaliPassword(!showWaliPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-900"
                            >
                              {showWaliPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingStudent}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950 disabled:opacity-60"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>
                    {isSavingStudent
                      ? 'Menyimpan...'
                      : editingStudent
                      ? 'Simpan Perubahan'
                      : 'Simpan & Daftarkan Siswa'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Working safely! */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Konfirmasi Hapus Siswa</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa{' '}
              <span className="font-bold text-gray-900">"{studentToDelete.name}"</span>? Akun login wali murid yang terhubung juga akan dinonaktifkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
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
                <span>Ya, Hapus Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Add / Edit Class & Wali Kelas */}
      {isClassModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClassModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <School className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">
                  {editingClass ? 'Ubah Rombel & Wali Kelas' : 'Tambah Rombel & Wali Kelas Baru'}
                </span>
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
                    Nama Kelas / Rombel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="Contoh: Kelas 1C / Kelas 4 / Kelas 2B"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Nama Wali Kelas / Guru Pengampu <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400">Dapat diketik atau pilih saran</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={homeroomTeacherInput}
                    onChange={(e) => setHomeroomTeacherInput(e.target.value)}
                    placeholder="Contoh: Gustiana Hermawan, S.Pd."
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-950 bg-emerald-50/30"
                  />

                  {/* Suggestions chips */}
                  <div className="mt-2">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Pilihan Cepat Guru Madrasah:</p>
                    <div className="flex flex-wrap gap-1">
                      {teacherSuggestions.map((tName) => (
                        <button
                          key={tName}
                          type="button"
                          onClick={() => setHomeroomTeacherInput(tName)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                            homeroomTeacherInput === tName
                              ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                              : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-900 border-gray-200'
                          }`}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
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
                      value={academicYearInput}
                      onChange={(e) => setAcademicYearInput(e.target.value)}
                      placeholder="2024/2025"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Semester
                    </label>
                    <select
                      value={semesterInput}
                      onChange={(e) => setSemesterInput(e.target.value as 'Ganjil' | 'Genap')}
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
                  <span>{editingClass ? 'Simpan Perubahan' : 'Simpan & Tambah Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Konfirmasi Hapus Kelas</h3>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-900">"{classToDelete.name}"</span> (Wali Kelas: {classToDelete.homeroomTeacher})?
            </p>
            {students.filter((s) => s.classId === classToDelete.id).length > 0 && (
              <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-[11px] text-amber-900 font-semibold">
                  Peringatan: Terdapat {students.filter((s) => s.classId === classToDelete.id).length} siswa di kelas ini. Siswa akan otomatis dialihkan ke kelas utama lain agar nilai dan absensi tidak hilang.
                </p>
              </div>
            )}
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
                <span>Ya, Hapus Kelas Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
