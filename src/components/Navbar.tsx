import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService, SyncStatus } from '../services/db';
import {
  LogOut,
  User as UserIcon,
  CheckCircle2,
  FileSpreadsheet,
  Cloud,
  Edit3,
  Menu,
  ShieldCheck,
  GraduationCap,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenGoogleWorkspace: () => void;
  onToggleMobileMenu: () => void;
  lastSavedText: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenProfile,
  onOpenGoogleWorkspace,
  onToggleMobileMenu,
  lastSavedText,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => dbService.getSyncStatus());

  useEffect(() => {
    return dbService.subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b-4 border-amber-400 print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left Brand Identity */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
                  alt="Logo MI Nurul Falah"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-amber-300 shadow-sm bg-white"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-xl tracking-tight text-white drop-shadow-sm">
                      NILAI SISWA
                    </span>
                    <span className="bg-amber-400 text-emerald-950 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      MI NF
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-medium text-emerald-200 tracking-wide">
                    MI NURUL FALAH
                  </p>
                </div>
              </div>
            </div>

            {/* Right Controls & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cloud Firestore Online Sync status badge */}
              <div
                className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-200 border-emerald-600/70'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-950/80 text-amber-200 border-amber-500/70'
                    : syncStatus === 'offline'
                    ? 'bg-gray-800/80 text-gray-300 border-gray-600'
                    : 'bg-red-950/80 text-red-200 border-red-500'
                }`}
                title="Status sinkronisasi data online Firestore dengan seluruh perangkat (HP, iPhone, Laptop)"
              >
                {syncStatus === 'connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-semibold text-[11px]">Database Cloud: Terhubung</span>
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    <span className="font-semibold text-[11px]">Menyinkronkan ke Cloud...</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-[11px]">Offline (Penyimpanan Lokal)</span>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="font-semibold text-[11px]">Koneksi Cloud Terputus</span>
                  </>
                )}
              </div>

              {/* Google Workspace Cloud Sync button (Admin only) */}
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={onOpenGoogleWorkspace}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
                  title="Simpan ke Google Drive, Ekspor Sheets & Link Siap Share"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-900 hidden sm:inline" />
                  <Cloud className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-900" />
                  <span className="hidden sm:inline">Google Sheets & Drive</span>
                  <span className="sm:hidden font-bold text-[11px]">Drive</span>
                </button>
              )}

              {/* User Profile Bar - Clickable to Edit Display Name */}
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-700/70">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-emerald-700/60 transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-amber-300"
                  title="Klik untuk mengubah nama tampilan & data profil"
                >
                  <div className="relative">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-amber-300 bg-white"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 border border-amber-300 flex items-center justify-center text-amber-300">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-emerald-800 rounded-full" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 transition-colors truncate max-w-[140px] sm:max-w-[180px]">
                        {currentUser.name}
                      </span>
                      <Edit3 className="w-3 h-3 text-emerald-300 opacity-60 group-hover:opacity-100" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5" /> Guru / Admin
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-2.5 h-2.5" /> Wali Murid
                        </>
                      )}
                    </span>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300"
                  title="Keluar dari akun"
                  aria-label="Keluar dari akun"
                >
                  <LogOut className="w-5 h-5 text-amber-200 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin keluar dari akun <span className="font-semibold text-emerald-800">{currentUser.name}</span>? Seluruh data yang telah diinput tetap tersimpan aman.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
