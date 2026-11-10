import React, { useState } from 'react';
import { SchoolSettings, User } from '../types';
import { dbService } from '../services/db';
import {
  Settings,
  Save,
  Check,
  RefreshCcw,
  School,
  Award,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SchoolSettingsViewProps {
  currentUser: User;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const [settings, setSettings] = useState<SchoolSettings>(db.settings);
  const [toastMsg, setToastMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings(settings);
    showToast('Pengaturan madrasah berhasil disimpan dan diperbarui!');
  };

  const handleResetData = () => {
    dbService.resetToDefault();
    setSettings(dbService.getSnapshot().settings);
    setShowResetConfirm(false);
    showToast('Database berhasil direset ke data awal bawaan MI Nurul Falah.');
  };

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
            <Settings className="w-6 h-6 text-emerald-700" />
            <span>Pengaturan Madrasah & KKM</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Konfigurasi profil madrasah, batas nilai minimal ketuntasan (KKM), tahun ajaran, dan semester aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
        >
          <Save className="w-4 h-4 text-amber-300" />
          <span>Simpan Semua Pengaturan</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Identitas Madrasah */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <School className="w-4 h-4 text-emerald-700" />
            <span>Identitas Resmi Madrasah</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Madrasah
              </label>
              <input
                type="text"
                required
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Kepala Madrasah
              </label>
              <input
                type="text"
                required
                value={settings.headmasterName}
                onChange={(e) => setSettings({ ...settings, headmasterName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nomor Statistik Madrasah (NSM)
              </label>
              <input
                type="text"
                value={settings.nsm}
                onChange={(e) => setSettings({ ...settings, nsm: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                NPSN
              </label>
              <input
                type="text"
                value={settings.npsn}
                onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alamat Lengkap Madrasah
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Email Resmi Madrasah
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Kurikulum & KKM */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Kriteria Ketuntasan Minimal (KKM) & Kalender</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Batas Nilai Minimal (KKM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={50}
                max={100}
                required
                value={settings.defaultKkm}
                onChange={(e) => setSettings({ ...settings, defaultKkm: Number(e.target.value) })}
                className="w-full px-3 py-2 text-base font-black border-2 border-amber-300 bg-amber-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-emerald-950"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Standar saat ini: <strong>{settings.defaultKkm}</strong>. Nilai &ge; {settings.defaultKkm} = TUNTAS, &lt; {settings.defaultKkm} = PERBAIKAN.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tahun Pelajaran Aktif
              </label>
              <input
                type="text"
                required
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                placeholder="2024/2025"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Semester Aktif
              </label>
              <select
                value={settings.semester}
                onChange={(e) =>
                  setSettings({ ...settings, semester: e.target.value as 'Ganjil' | 'Genap' })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Data Bawaan</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Konfirmasi Reset Database</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Tindakan ini akan mengembalikan seluruh data (siswa, nilai, tabungan, jadwal, dan akun) ke data awal resmi MI Nurul Falah. Anda dapat mengunduh file cadangan terlebih dahulu jika diperlukan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
