import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import {
  signInWithGoogle,
  signOutGoogle,
  getGoogleAccessToken,
  initGoogleAuth,
  exportGradesToGoogleSheets,
  backupDatabaseToGoogleDrive,
} from '../services/googleWorkspace';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ExternalLink,
  X,
  Sparkles,
  Database,
  Lock,
} from 'lucide-react';

interface GoogleIntegrationModalProps {
  onClose: () => void;
}

export const GoogleIntegrationModal: React.FC<GoogleIntegrationModalProps> = ({ onClose }) => {
  const db = dbService.getSnapshot();
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [sheetResult, setSheetResult] = useState<{ spreadsheetUrl: string } | null>(null);
  const [driveResult, setDriveResult] = useState<{ fileName: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const result = await signInWithGoogle();
      if (result) {
        setGoogleUser(result.user);
        setStatusMessage('Berhasil terhubung dengan Akun Google!');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal login dengan Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExportSheets = async () => {
    setIsExportingSheets(true);
    setErrorMessage('');
    setSheetResult(null);
    try {
      const res = await exportGradesToGoogleSheets(db, 'cls-1');
      setSheetResult(res);
      setStatusMessage('Spreadsheet nilai siswa MI Nurul Falah berhasil dibuat di Google Drive Anda!');
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal mengekspor ke Google Sheets.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleBackupDrive = async () => {
    setIsBackingUpDrive(true);
    setErrorMessage('');
    setDriveResult(null);
    try {
      const res = await backupDatabaseToGoogleDrive(db);
      setDriveResult(res);
      setStatusMessage(`Cadangan database berhasil disimpan ke Google Drive (${res.fileName})!`);
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal membuat cadangan ke Google Drive.');
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const handleDownloadLocalBackup = () => {
    const jsonStr = dbService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MI_Nurul_Falah_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Cadangan data lokal (JSON) berhasil diunduh ke komputer!');
  };

  const handleImportLocalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const ok = dbService.importDatabase(content);
          if (ok) {
            setStatusMessage('Database berhasil dipulihkan dari file cadangan!');
          } else {
            setErrorMessage('Format file cadangan tidak valid.');
          }
        } catch (err: any) {
          setErrorMessage('Gagal memproses file cadangan.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border-t-4 border-amber-400 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">Google Workspace & Cadangan Data</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Account Connection Status */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-950 uppercase">Akun Google Terhubung</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {googleUser
                    ? `Terhubung sebagai: ${googleUser.displayName || googleUser.email}`
                    : 'Belum terhubung. Masuk dengan akun Google untuk mengaktifkan sinkronisasi otomatis.'}
                </p>
              </div>

              {!googleUser ? (
                /* Official Sign in with Google Button Styling */
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 shadow-sm transition-all flex items-center gap-2 shrink-0 hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={signOutGoogle}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                >
                  Putus Sambungan
                </button>
              )}
            </div>
          </div>

          {/* Features: Sheets & Drive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Sheets */}
            <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Google Sheets</h4>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Ekspor rekap nilai akademik siswa, rata-rata, dan status ketuntasan langsung ke Google Spreadsheet baru di Drive Anda.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleExportSheets}
                  disabled={!googleUser || isExportingSheets}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isExportingSheets ? 'Mengekspor...' : 'Ekspor ke Google Sheets'}</span>
                </button>
                {sheetResult && (
                  <a
                    href={sheetResult.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Google Drive Backup */}
            <div className="p-4 rounded-2xl border-2 border-amber-100 bg-white hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Google Drive</h4>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Simpan cadangan lengkap database MI Nurul Falah (data siswa, nilai, tabungan, infak, absensi) ke folder Google Drive pribadi.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleBackupDrive}
                  disabled={!googleUser || isBackingUpDrive}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isBackingUpDrive ? 'Menyimpan...' : 'Cadangkan ke Google Drive'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Local JSON Backup / Restore (Always available offline) */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Cadangan Lokal Mandiri (Unduh & Pulihkan JSON)</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Unduh cadangan data dalam format file JSON atau pulihkan data dari file yang telah diunduh sebelumnya.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadLocalBackup}
                className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Unduh File Cadangan (JSON)</span>
              </button>

              <label className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Pulihkan dari File JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportLocalBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
