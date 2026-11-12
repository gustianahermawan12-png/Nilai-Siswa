import React, { useState } from 'react';
import { User, Student } from '../types';
import { dbService } from '../services/db';
import { hashPassword } from '../utils/security';
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
  Lock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Power,
} from 'lucide-react';

interface WaliMuridAccountsProps {
  initialStudentId?: string;
}

export const WaliMuridAccounts: React.FC<WaliMuridAccountsProps> = ({ initialStudentId }) => {
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
  const [password, setPassword] = useState('wali123');
  const [phone, setPhone] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('Nama ibu kandung?');
  const [securityAnswer, setSecurityAnswer] = useState('Fatimah');

  // Deletion
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAddForStudent = (stdId?: string) => {
    setEditingUser(null);
    const chosenStd = students.find((s) => s.id === (stdId || targetStudentId)) || students[0];
    setTargetStudentId(chosenStd.id);
    setParentName(chosenStd.parentName || `Wali dari ${chosenStd.name}`);
    setPhone(chosenStd.phone || '');
    const clean = chosenStd.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    setUsername(`wali_${clean || 'siswa'}`);
    setPassword('wali123');
    setSecurityQuestion('Nama ibu kandung?');
    setSecurityAnswer('Ibu');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setTargetStudentId(user.linkedStudentId || '');
    setParentName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setPhone(user.phone || '');
    setSecurityQuestion(user.securityQuestion || 'Nama ibu kandung?');
    setSecurityAnswer(user.securityAnswer || '');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Nama pengguna dan kata sandi wajib diisi!');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const hashedPassword = password.startsWith('sha256:')
      ? password
      : await hashPassword(password.trim());

    // Check duplicate username if adding new
    if (!editingUser) {
      const exists = db.users.some((u) => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        showToast('Nama pengguna sudah digunakan. Gunakan nama pengguna lain!');
        return;
      }

      const newUser = dbService.addUser({
        username: cleanUsername,
        password: hashedPassword,
        role: 'wali_murid',
        name: parentName.trim() || 'Wali Murid',
        title: `Wali Murid - ${students.find((s) => s.id === targetStudentId)?.name || 'Siswa'}`,
        linkedStudentId: targetStudentId,
        phone: phone.trim(),
        securityQuestion,
        securityAnswer,
        status: 'aktif',
      });

      // Update student's linked waliMuridId
      if (targetStudentId) {
        dbService.updateStudent(targetStudentId, { waliMuridId: newUser.id });
      }

      showToast(`Akun wali murid "${cleanUsername}" berhasil dibuat dan tersimpan ke cloud!`);
    } else {
      // Check duplicate username if username changed
      if (cleanUsername !== editingUser.username.toLowerCase()) {
        const exists = db.users.some(
          (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
        );
        if (exists) {
          showToast('Nama pengguna sudah digunakan.');
          return;
        }
      }

      dbService.updateUser(editingUser.id, {
        username: cleanUsername,
        password: hashedPassword,
        name: parentName.trim(),
        linkedStudentId: targetStudentId,
        phone: phone.trim(),
        securityQuestion,
        securityAnswer,
      });

      if (targetStudentId) {
        dbService.updateStudent(targetStudentId, { waliMuridId: editingUser.id });
      }

      showToast(`Akun wali murid "${cleanUsername}" berhasil diperbarui!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (account: User) => {
    dbService.toggleUserStatus(account.id);
    const nextStatus = account.status === 'nonaktif' ? 'Aktif' : 'Nonaktif';
    showToast(`Status akun "${account.username}" diubah menjadi: ${nextStatus.toUpperCase()}`);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    const name = userToDelete.name;
    const success = dbService.deleteUser(userToDelete.id);
    if (success) {
      showToast(`Akun "${name}" berhasil dihapus.`);
    }
    setUserToDelete(null);
  };

  const handleCopyCredentials = (user: User, stdName: string) => {
    const rawPass = user.password.startsWith('sha256:')
      ? '(Gunakan kata sandi yang telah ditentukan madrasah)'
      : user.password;
    const text = `*PORTAL NILAI SISWA – MI NURUL FALAH*\n\nAssalamu'alaikum Wr. Wb.\nBapak/Ibu Wali Murid dari *${stdName}*, berikut akses login aplikasi:\n\n• Website: ${window.location.origin}\n• Username: *${user.username}*\n• Password: *${rawPass}*\n\nSilakan masuk untuk melihat rapor, tabungan, absensi, dan infak ananda. Terima kasih.`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    showToast('Akses login disalin ke clipboard! Siap dikirim via WhatsApp.');
    setTimeout(() => setCopiedId(null), 2500);
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
          <Check className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Fitur Utama: Akses Login Wali Murid
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-700" />
            <span>Manajemen Akun & Sandi Wali Murid</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Buat nama pengguna (username) dan kata sandi (password) untuk setiap wali murid agar dapat memantau perkembangan ananda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddForStudent()}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Buat Akun Wali Baru</span>
        </button>
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
                studentRows.map((std, idx) => {
                  const account = users.find((u) => u.linkedStudentId === std.id);
                  const cls = classes.find((c) => c.id === std.classId);

                  return (
                    <tr key={std.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">{std.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">NIS: {std.nis}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[11px]">
                          {cls?.name || 'Kelas 1A'}
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
                            title={account.password.startsWith('sha256:') ? 'Kata sandi tersimpan secara terenkripsi aman' : 'Kata sandi akun'}
                          >
                            {account.password.startsWith('sha256:') ? '•••••••• (Aman)' : account.password}
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
                              title="Salin pesan login untuk WhatsApp"
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
                              title={account.status === 'nonaktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun (Wali tidak dapat login)'}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-t-4 border-emerald-700 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900 z-10">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <span>{editingUser ? 'Edit Akun Wali Murid' : 'Buat Akun Wali Murid'}</span>
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

            <form onSubmit={handleSaveAccount} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
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
                      const clean = chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
                      setUsername(`wali_${clean}`);
                    }
                  }}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {students.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls?.name || 'Kelas'}) - NIS: {s.nis}
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
                  placeholder="Contoh: Bpk. Ridwan Kamil"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Pengguna (Username Login) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="wali_ahmad"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Gunakan huruf kecil tanpa spasi.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Kata Sandi (Password Login) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="wali123"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Dapat diganti oleh admin kapan saja.</p>
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
                  <span>{editingUser ? 'Simpan Perubahan' : 'Simpan Akun Wali'}</span>
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
