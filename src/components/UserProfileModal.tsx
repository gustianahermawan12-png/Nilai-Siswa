import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { X, User as UserIcon, Check, Camera, Shield, Phone, Key } from 'lucide-react';

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
  const [title, setTitle] = useState(currentUser.title || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedPartial: Partial<User> = {
      name: name.trim(),
      title: title.trim(),
      phone: phone.trim(),
      password: password.trim(),
      avatarUrl,
    };

    dbService.updateUser(currentUser.id, updatedPartial);
    const updatedUser: User = { ...currentUser, ...updatedPartial };
    onUserUpdated(updatedUser);

    setSuccessMsg('Profil berhasil diperbarui!');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-600 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">Ubah Profil Pengguna</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
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

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi akun"
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Gunakan kata sandi yang mudah diingat.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
