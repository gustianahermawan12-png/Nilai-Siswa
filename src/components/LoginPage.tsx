import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { verifyPassword, hashPassword } from '../utils/security';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Forgot password states
  const [forgotUsername, setForgotUsername] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const users = dbService.getUsers();
      const cleanUsername = username.trim().toLowerCase();
      const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

      if (!user) {
        setErrorMsg('Nama pengguna tidak terdaftar di sistem madrasah.');
        setIsLoading(false);
        return;
      }

      if (user.status === 'nonaktif') {
        setErrorMsg('Akun ini sedang dinonaktifkan oleh Administrator Madrasah. Silakan hubungi pihak madrasah.');
        setIsLoading(false);
        return;
      }

      const isMatch = await verifyPassword(password.trim(), user.password);
      if (isMatch) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan periksa kembali!');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setErrorMsg('Gagal memproses autentikasi. Silakan periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckForgotUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    const users = dbService.getUsers();
    const user = users.find((u) => u.username.toLowerCase() === forgotUsername.trim().toLowerCase());
    if (user) {
      setFoundUser(user);
    } else {
      setForgotError('Nama pengguna tidak ditemukan di sistem madrasah.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;

    if (foundUser.securityAnswer) {
      if (securityAnswer.trim().toLowerCase() !== foundUser.securityAnswer.toLowerCase()) {
        setForgotError('Jawaban pemulihan keamanan salah.');
        return;
      }
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setForgotError('Kata sandi baru minimal 4 karakter.');
      return;
    }

    const hashed = await hashPassword(newPassword.trim());
    dbService.updateUser(foundUser.id, { password: hashed });
    setForgotSuccess('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
    setTimeout(() => {
      setIsForgotOpen(false);
      setFoundUser(null);
      setPassword(newPassword.trim());
      setUsername(foundUser.username);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 flex flex-col justify-center items-center p-4 selection:bg-amber-400 selection:text-emerald-950">
      {/* Decorative background glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-400 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-6 sm:p-8 text-center relative border-b-4 border-amber-400">
          <div className="inline-block relative mb-3">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
              alt="Logo Resmi MI Nurul Falah"
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl object-cover border-4 border-amber-300 shadow-xl bg-white"
            />
            <span className="absolute -bottom-2 -right-2 bg-amber-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              RESMI
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
            NILAI SISWA
          </h1>
          <p className="text-amber-300 font-bold text-sm sm:text-base tracking-wide">
            MI NURUL FALAH
          </p>
          <p className="text-emerald-100 text-xs mt-1">
            Portal Penilaian Akademik, Keuangan, Absensi & Komunikasi Madrasah
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau wali_ahmad"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-700/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base border-b-2 border-emerald-900 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-amber-300" />
                  <span>Masuk ke Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Official Portal Notice */}
          <div className="pt-3 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Silakan masuk menggunakan nama pengguna dan kata sandi yang telah didaftarkan oleh administrator atau wali kelas madrasah.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center text-[11px] text-gray-500">
          MI Nurul Falah Bandung &bull; Sistem Terpadu Madrasah
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsForgotOpen(false);
              setFoundUser(null);
              setForgotError('');
              setForgotSuccess('');
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-t-4 border-amber-400 max-h-[90dvh] overflow-y-auto my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-gray-900">Pemulihan Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setFoundUser(null);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {!foundUser ? (
              <form onSubmit={handleCheckForgotUsername} className="space-y-3">
                <p className="text-xs text-gray-600">
                  Masukkan nama pengguna Anda untuk memeriksa opsi pemulihan kata sandi.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Nama Pengguna
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    placeholder="Contoh: admin atau wali_ahmad"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                  >
                    Periksa Akun
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs">
                  <p className="font-bold text-emerald-900">{foundUser.name}</p>
                  <p className="text-emerald-700 text-[11px]">Peran: {foundUser.role.toUpperCase()}</p>
                </div>

                {foundUser.securityQuestion && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Pertanyaan Keamanan: {foundUser.securityQuestion}
                    </label>
                    <input
                      type="text"
                      required
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Ketik jawaban"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFoundUser(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                  >
                    Ubah Kata Sandi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
