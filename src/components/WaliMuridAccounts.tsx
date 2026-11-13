import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { hashPassword } from '../utils/security';
import {
  validateCredentialsInput,
  getShareableAppUrl,
  formatPasswordDisplay,
} from '../utils/dbSanitizer';
import {
  UserCheck,
  Plus,
  KeyRound,
  Copy,
  Check,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Search,
  Share2,
  Sparkles,
  AlertCircle,
  Power,
  Cloud,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

interface WaliMuridAccountsProps {
  initialStudentId?: string;
  onOpenGoogleWorkspace?: () => void;
}

export const WaliMuridAccounts: React.FC<WaliMuridAccountsProps> = ({
  initialStudentId,
  onOpenGoogleWorkspace,
}) => {
  const db = dbService.getSnapshot();
  const students = db.students;
  const users = db.users.filter((u) => u.role === 'wali_murid');
  const classes = db.classes;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for creating / editing Wali account
  const [targetStudentId, setTargetStudentId] = useState(initialStudentId || students[0]?.id || '');
  const [parentName, setParentName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [phone, setPhone] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('Nama ibu kandung?');
  const [securityAnswer, setSecurityAnswer] = useState('Ibu');
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [recentPlainPasswords, setRecentPlainPasswords] = useState<Record<string, string>>({});

  // Deletion & copy states
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const shareUrl =
    typeof window !== 'undefined' ? getShareableAppUrl(window.location.origin) : '';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleOpenAddForStudent = (stdId?: string) => {
    if (students.length === 0) {
      showToast('Belum ada data siswa. Silakan tambahkan data siswa terlebih dahulu di menu Siswa.');
      return;
    }
    setEditingUser(null);
    setModalError('');
    const unlinkedStd = students.find((s) => !users.some((u) => u.linkedStudentId === s.id));
    const chosenStd =
      (stdId ? students.find((s) => s.id === stdId) : undefined) ||
      unlinkedStd ||
      students[0];
    setTargetStudentId(chosenStd.id);
    setParentName(chosenStd.parentName || `Wali dari ${chosenStd.name}`);
    setPhone(chosenStd.phone || '');
    const clean = chosenStd.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    setUsername(`wali_${clean || 'siswa'}`);
    setPassword('');
    setShowPassword(true);
    setSecurityQuestion('Nama ibu kandung?');
    setSecurityAnswer('Ibu');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setModalError('');
    setTargetStudentId(user.linkedStudentId || students[0]?.id || '');
    setParentName(user.name);
    setUsername(user.username);
    setPassword('');
    setShowPassword(false);
    setPhone(user.phone || '');
    setSecurityQuestion(user.securityQuestion || 'Nama ibu kandung?');
    setSecurityAnswer(user.securityAnswer || '');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!editingUser && !targetStudentId) {
      setModalError('Pilih siswa yang akan dihubungkan dengan akun wali murid ini.');
      return;
    }

    const validation = validateCredentialsInput({
      username,
      password,
      requirePassword: !editingUser,
      minPasswordLength: 4,
    });

    if (!validation.valid) {
      setModalError(validation.error || 'Format username atau password tidak valid.');
      return;
    }

    const { cleanUsername, cleanPassword } = validation;
    const isAvail = dbService.checkUsernameAvailable(cleanUsername, editingUser?.id);
    if (!isAvail) {
      setModalError(`Nama pengguna "${cleanUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    setIsSaving(true);
    try {
      const hashedPassword = cleanPassword
        ? await hashPassword(cleanPassword)
        : editingUser?.password || (await hashPassword('wali123'));

      let savedUserId = editingUser?.id || '';

      if (!editingUser) {
        const chosenStudent = students.find((s) => s.id === targetStudentId);
        const newUser = dbService.addUser({
          username: cleanUsername,
          password: hashedPassword,
          role: 'wali_murid',
          name: parentName.trim() || `Wali dari ${chosenStudent?.name || 'Siswa'}`,
          title: `Wali Murid - ${chosenStudent?.name || 'Siswa'}`,
          linkedStudentId: targetStudentId,
          phone: phone.trim(),
          securityQuestion,
          securityAnswer,
          status: 'aktif',
        });
        savedUserId = newUser.id;

        if (targetStudentId) {
          dbService.updateStudent(targetStudentId, { waliMuridId: newUser.id });
        }
      } else {
        const chosenStudent = students.find((s) => s.id === targetStudentId);
        dbService.updateUser(editingUser.id, {
          username: cleanUsername,
          password: hashedPassword,
          name: parentName.trim() || editingUser.name,
          title: chosenStudent ? `Wali Murid - ${chosenStudent.name}` : editingUser.title,
          linkedStudentId: targetStudentId || editingUser.linkedStudentId,
          phone: phone.trim(),
          securityQuestion,
          securityAnswer,
        });

        if (targetStudentId) {
          dbService.updateStudent(targetStudentId, { waliMuridId: editingUser.id });
        }
      }

      if (cleanPassword && savedUserId) {
        setRecentPlainPasswords((prev) => ({
          ...prev,
          [savedUserId]: cleanPassword,
        }));
      }

      const syncResult = await dbService.saveAndSyncNow();
      if (!syncResult.ok) {
        setModalError(
          `Tersimpan lokal, namun gagal sinkron ke Cloud: ${syncResult.error || 'Periksa koneksi internet Anda.'}`
        );
        return;
      }

      showToast(
        editingUser
          ? `Akun "${cleanUsername}" berhasil disimpan & disinkronkan ke Cloud!`
          : `Akun "${cleanUsername}" berhasil dibuat & tersambung ke portal wali!`
      );
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan akun.';
      setModalError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (account: User) => {
    dbService.toggleUserStatus(account.id);
    await dbService.saveAndSyncNow();
    const nextStatus = account.status === 'nonaktif' ? 'Aktif' : 'Nonaktif';
    showToast(`Status akun "${account.username}" diubah menjadi: ${nextStatus.toUpperCase()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const name = userToDelete.name;
    const success = dbService.deleteUser(userToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast(`Akun "${name}" berhasil dihapus.`);
    }
    setUserToDelete(null);
  };

  const handleSyncAllCloud = async () => {
    setIsSyncingAll(true);
    const res = await dbService.saveAndSyncNow();
    setIsSyncingAll(false);
    if (res.ok) {
      showToast('Seluruh akun & data berhasil disimpan dan disinkronkan ke Cloud!');
    } else {
      showToast(`Gagal sinkron Cloud: ${res.error || 'Cek koneksi internet'}`);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Link portal aplikasi siap share berhasil disalin!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast(`Salin link ini secara manual: ${shareUrl}`);
    }
  };

  const handleCopyCredentials = async (user: User, stdName: string) => {
    const rawPass =
      recentPlainPasswords[user.id] ||
      (user.password.startsWith('sha256:')
        ? '(Gunakan kata sandi yang telah diberikan / atur ulang via Edit)'
        : user.password);
    const text = `*PORTAL NILAI SISWA – MI NURUL FALAH*\n\nAssalamu'alaikum Wr. Wb.\nBapak/Ibu Wali Murid dari *${stdName}*, berikut akses login aplikasi:\n\n• Link Aplikasi: ${shareUrl}\n• Username: *${user.username}*\n• Password: *${rawPass}*\n\nSilakan masuk untuk melihat rapor, tabungan, absensi, dan infak ananda. Terima kasih.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(user.id);
      showToast('Pesan login & link siap share disalin ke clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Gagal menyalin otomatis. Silakan salin dari tombol Edit akun.');
    }
  };

  // Combine list: show all students, whether they have account or not
  const studentRows = students.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.nis.includes(searchTerm) ||
      (std.parentName && std.parentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClass === 'all' || std.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Terhubung Online & Siap Share
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-700" />
            <span>Manajemen Akun & Sandi Wali Murid</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Buat username dan kata sandi custom untuk wali murid. Semua akun tersambung langsung ke data siswa dan siap login dari HP/PC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncAllCloud}
            disabled={isSyncingAll}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Simpan & sinkronkan semua akun ke database cloud"
          >
            {isSyncingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <Save className="w-4 h-4 text-emerald-700" />
            )}
            <span>{isSyncingAll ? 'Menyimpan...' : 'Simpan & Sync Cloud'}</span>
          </button>

          {onOpenGoogleWorkspace && (
            <button
              type="button"
              onClick={onOpenGoogleWorkspace}
              className="px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cadangkan database & akun ke Google Drive"
            >
              <Cloud className="w-4 h-4 text-amber-700" />
              <span>Simpan ke Drive</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Salin link aplikasi untuk dibagikan ke wali murid"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Share2 className="w-4 h-4 text-blue-600" />
            )}
            <span>{copiedLink ? 'Link Disalin!' : 'Salin Link Siap Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddForStudent()}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Buat Akun Wali Baru</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari siswa atau wali murid..."
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
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students & Accounts */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-amber-400">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Nama Wali Murid</th>
                <th className="py-3.5 px-4">Username Login</th>
                <th className="py-3.5 px-4">Kata Sandi</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-center">Aksi & Bagikan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              ) : (
                studentRows.flatMap((std, idx) => {
                  const linkedAccounts = users
                    .filter((u) => u.linkedStudentId === std.id)
                    .sort((a, b) =>
                      a.id === std.waliMuridId ? -1 : b.id === std.waliMuridId ? 1 : 0
                    );
                  const rowsToRender: Array<{ account: User | undefined; subIndex: number }> =
                    linkedAccounts.length > 0
                      ? linkedAccounts.map((acc, subIndex) => ({ account: acc, subIndex }))
                      : [{ account: undefined, subIndex: 0 }];
                  const cls = classes.find((c) => c.id === std.classId);

                  return rowsToRender.map(({ account, subIndex }) => {
                    const recentPass = account ? recentPlainPasswords[account.id] : undefined;

                    return (
                      <tr
                        key={account ? `${std.id}-${account.id}` : std.id}
                        className="hover:bg-emerald-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-gray-500">
                          {subIndex === 0 ? idx + 1 : `${idx + 1}.${subIndex + 1}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">{std.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            NIS: {std.nis}
                            {subIndex > 0 && (
                              <span className="ml-1.5 text-emerald-700 font-semibold">(Akun Tambahan)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[11px]">
                            {cls?.name || 'Kelas'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-900">
                            {account ? account.name : std.parentName || '-'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {account?.phone || std.phone || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {account ? (
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200">
                              {account.username}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Belum dibuat</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {account ? (
                            <span
                              className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-200"
                              title="Kata sandi disimpan aman dengan enkripsi SHA-256"
                            >
                              {recentPass
                                ? `${recentPass} (Baru)`
                                : formatPasswordDisplay(account.password)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {account ? (
                            account.status === 'nonaktif' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                                <ShieldAlert className="w-3 h-3 text-gray-500" />
                                Nonaktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-green-600" />
                                Aktif
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Perlu Akun
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {account ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(account, std.name)}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Salin pesan login & link siap share untuk WhatsApp"
                              >
                                {copiedId === account.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(account)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  account.status === 'nonaktif'
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title={
                                  account.status === 'nonaktif'
                                    ? 'Aktifkan Akun'
                                    : 'Nonaktifkan Akun (Wali tidak dapat login)'
                                }
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(account)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Ubah username atau password"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToDelete(account)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Hapus akun login wali"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAddForStudent(std.id)}
                              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-[11px] rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Buat Akun</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border-t-4 border-emerald-700 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 border-b border-emerald-900 z-10">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <KeyRound className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">
                  {editingUser ? 'Edit Akun Wali Murid' : 'Buat Akun Wali Murid'}
                </span>
              </h3>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                title="Tutup (Esc)"
              >
                &times; Tutup
              </button>
            </div>

            <form
              onSubmit={handleSaveAccount}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 flex items-start gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Hubungkan dengan Siswa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => {
                      setTargetStudentId(e.target.value);
                      const chosen = students.find((s) => s.id === e.target.value);
                      if (chosen && !editingUser) {
                        setParentName(chosen.parentName || `Wali dari ${chosen.name}`);
                        setPhone(chosen.phone || '');
                        const clean = chosen.name
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '')
                          .slice(0, 12);
                        setUsername(`wali_${clean || 'siswa'}`);
                      }
                    }}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium disabled:bg-gray-100"
                  >
                    {students.map((s) => {
                      const cls = classes.find((c) => c.id === s.classId);
                      const hasAcc = users.some((u) => u.linkedStudentId === s.id);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({cls?.name || 'Kelas'}) •{' '}
                          {hasAcc ? 'Sudah punya akun' : 'Belum ada akun'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Lengkap Orang Tua / Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Bpk. Ridwan"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Pengguna (Username Login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="wali_ahmad"
                    autoComplete="off"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Minimal 3 karakter, huruf kecil tanpa spasi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Kata Sandi (Password Login){' '}
                    {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        editingUser
                          ? 'Kosongkan jika tidak mengubah sandi (min. 4 karakter)'
                          : 'Ketik sandi custom (min. 4 karakter)'
                      }
                      autoComplete="new-password"
                      className="w-full pl-3 pr-10 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700"
                      title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Disimpan aman dengan enkripsi SHA-256 & siap digunakan login dari semua perangkat.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nomor WhatsApp Wali Murid
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="085711223344"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 z-10">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950 disabled:opacity-60"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>
                    {isSaving
                      ? 'Menyimpan ke Cloud...'
                      : editingUser
                      ? 'Simpan Perubahan'
                      : 'Simpan Akun Wali'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Working safely! */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Akun Wali Murid</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun wali murid{' '}
              <span className="font-bold text-gray-900">"{userToDelete.username}"</span>? Data nilai dan absensi siswa tidak akan terpengaruh.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
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
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
