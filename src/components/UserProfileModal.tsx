import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { hashPassword } from '../utils/security';
import { validateCredentialsInput } from '../utils/dbSanitizer';
import { compressImageFile } from '../utils/imageHelper';
import {
  X,
  User as UserIcon,
  Check,
  Camera,
  Shield,
  Phone,
  Key,
  AtSign,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onUserUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [title, setTitle] = useState(currentUser.title || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setAvatarUrl(compressed);
      } catch {
        setErrorMsg('Gagal memproses file foto profil.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    const validation = validateCredentialsInput({
      username,
      password,
      requirePassword: false,
      minPasswordLength: 4,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Kredensial tidak valid.');
      return;
    }

    if (!dbService.checkUsernameAvailable(validation.cleanUsername, currentUser.id)) {
      setErrorMsg('Nama pengguna sudah digunakan oleh akun lain.');
      return;
    }

    setIsSaving(true);

    try {
      const updatedPartial: Partial<User> = {
        name: name.trim(),
        username: validation.cleanUsername,
        title: title.trim(),
        phone: phone.trim(),
        avatarUrl,
      };

      if (validation.cleanPassword) {
        updatedPartial.password = await hashPassword(validation.cleanPassword);
      }

      dbService.updateUser(currentUser.id, updatedPartial);
      const syncRes = await dbService.saveAndSyncNow();
      const updatedUser: User = { ...currentUser, ...updatedPartial };
      onUserUpdated(updatedUser);

      if (syncRes.ok) {
        setSuccessMsg('Profil dan kredensial berhasil disimpan ke Cloud!');
      } else {
        setSuccessMsg('Profil disimpan secara lokal. Sinkronisasi cloud akan dicoba ulang.');
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMsg('Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-t-4 border-emerald-600 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Pinned Modal Header: Always visible at the top */}
        <div className="shrink-0 px-4 sm:px-5 py-3 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900 shadow-xs z-10">
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon className="w-5 h-5 text-amber-300 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">Ganti Nama di Bar Atas & Profil</h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 truncate">Perbarui identitas & kredensial login</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600/90 hover:bg-red-600 transition-colors flex items-center gap-1 border border-red-400/50 cursor-pointer shadow-xs shrink-0 ml-2"
            aria-label="Tutup modal ganti nama"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Modal Form with scrollable body and pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body: Easily scrolls up and down on all phones */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain touch-pan-y">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Avatar Photo picker */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-600 shadow-md bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border-4 border-emerald-600 font-bold text-xl">
                    {name.charAt(0) || 'U'}
                  </div>
                )}
                <label
                  htmlFor="avatar-input"
                  className="absolute bottom-0 right-0 p-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="Ganti foto profil"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-500">Pilih foto dari galeri HP atau komputer</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nama Lengkap di Bar Atas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Contoh: Gustiana Hermawan, S.Pd."
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
              />
              <p className="text-[11px] text-gray-500 mt-1">Nama ini akan langsung tampil di bar atas aplikasi.</p>
            </div>

            {/* Kredensial Login: Username & Password */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 border-b border-emerald-200 pb-1.5">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>Kredensial Login Akun</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Pengguna (Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium bg-white"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Digunakan saat masuk ke aplikasi.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Kata Sandi Baru (Password)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah sandi"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Minimal 4 karakter. Disimpan secara terenkripsi aman.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Jabatan / Keterangan Peran
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Guru & Wali Kelas 1A / Wali Murid"
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp / Telepon
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pinned Modal Footer: Always visible at the bottom */}
          <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 shadow-xs z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Tutup tanpa menyimpan perubahan"
            >
              <X className="w-4 h-4" />
              <span>Tutup (Batal)</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-60 cursor-pointer border-b-2 border-emerald-950 shrink-0"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Nama & Sandi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
