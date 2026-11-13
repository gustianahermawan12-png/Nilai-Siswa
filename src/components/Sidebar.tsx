import React from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  CalendarDays,
  FileCheck2,
  Award,
  Wallet,
  HeartHandshake,
  ClipboardList,
  Mail,
  Coins,
  Bell,
  Printer,
  Settings,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'students'
  | 'wali_accounts'
  | 'subjects'
  | 'schedules'
  | 'daily_grades'
  | 'pts_grades'
  | 'pas_grades'
  | 'savings'
  | 'infak'
  | 'attendance'
  | 'excuse_letters'
  | 'fees'
  | 'announcements'
  | 'reports'
  | 'workspace'
  | 'settings';

interface MenuItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number;
}

interface SidebarProps {
  currentUser: User;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingLettersCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  pendingLettersCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const { settings } = dbService.getSnapshot();

  const adminMenu: MenuItem[] = [
    { key: 'dashboard' as TabKey, label: 'Dasbor Utama', icon: LayoutDashboard },
    { key: 'students' as TabKey, label: 'Data Siswa & Kelas', icon: Users },
    { key: 'wali_accounts' as TabKey, label: 'Akun Login Wali Murid', icon: UserCheck, highlight: true },
    { key: 'subjects' as TabKey, label: 'Mata Pelajaran', icon: BookOpen },
    { key: 'schedules' as TabKey, label: 'Jadwal & Waktu Jam', icon: CalendarDays },
    { key: 'daily_grades' as TabKey, label: 'Nilai Harian / Bab', icon: FileCheck2 },
    { key: 'pts_grades' as TabKey, label: 'Nilai PTS (Tengah Sem.)', icon: Award },
    { key: 'pas_grades' as TabKey, label: 'Nilai PAS (Akhir Sem.)', icon: Award },
    { key: 'savings' as TabKey, label: 'Tabungan Siswa', icon: Wallet },
    { key: 'infak' as TabKey, label: 'Infak Bulanan', icon: HeartHandshake },
    { key: 'attendance' as TabKey, label: 'Daftar Hadir / Absensi', icon: ClipboardList },
    {
      key: 'excuse_letters' as TabKey,
      label: 'Surat Izin & Sakit',
      icon: Mail,
      badge: pendingLettersCount > 0 ? pendingLettersCount : undefined,
    },
    { key: 'fees' as TabKey, label: 'Iuran Tambahan', icon: Coins },
    { key: 'announcements' as TabKey, label: 'Pengumuman Madrasah', icon: Bell },
    { key: 'reports' as TabKey, label: 'Cetak Laporan & PDF', icon: Printer },
    { key: 'workspace' as TabKey, label: 'Google Sheets & Drive', icon: FileSpreadsheet },
    { key: 'settings' as TabKey, label: 'Pengaturan Madrasah', icon: Settings },
  ];

  const waliMenu: MenuItem[] = [
    { key: 'dashboard' as TabKey, label: 'Dasbor Ananda', icon: LayoutDashboard },
    { key: 'daily_grades' as TabKey, label: 'Nilai Harian Dirilis', icon: FileCheck2 },
    { key: 'pts_grades' as TabKey, label: 'Nilai PTS Dirilis', icon: Award },
    { key: 'pas_grades' as TabKey, label: 'Nilai PAS Dirilis', icon: Award },
    { key: 'schedules' as TabKey, label: 'Jadwal Pelajaran', icon: CalendarDays },
    { key: 'savings' as TabKey, label: 'Buku Tabungan', icon: Wallet },
    { key: 'infak' as TabKey, label: 'Riwayat Infak', icon: HeartHandshake },
    { key: 'attendance' as TabKey, label: 'Rekap Kehadiran', icon: ClipboardList },
    { key: 'excuse_letters' as TabKey, label: 'Kirim Surat Izin / Sakit', icon: Mail },
    { key: 'fees' as TabKey, label: 'Iuran Tambahan', icon: Coins },
    { key: 'announcements' as TabKey, label: 'Pengumuman Madrasah', icon: Bell },
    { key: 'reports' as TabKey, label: 'Cetak Rapor & Laporan', icon: Printer },
  ];

  const currentMenu = isAdmin ? adminMenu : waliMenu;

  const content = (
    <div className="flex flex-col h-full bg-emerald-900 text-white select-none">
      {/* Mobile close button */}
      <div className="p-4 flex lg:hidden items-center justify-between border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
            alt="Logo"
            className="w-8 h-8 rounded-lg object-cover border border-amber-300 bg-white"
          />
          <span className="font-bold text-sm text-white">MI NURUL FALAH</span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-3 bg-emerald-950/60 border-b border-emerald-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">
            {isAdmin ? 'Portal Administrasi Guru' : 'Portal Wali Murid'}
          </span>
          <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
            {isAdmin ? 'GURU' : 'WALI'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {currentMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onSelectTab(item.key);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-400 text-emerald-950 shadow-md font-bold'
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-amber-400/50 bg-emerald-800/40' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-950' : 'text-amber-300'
                  }`}
                />
                <span className="truncate text-left">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? 'bg-red-600 text-white' : 'bg-red-500 text-white animate-bounce'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="p-3 bg-emerald-950/80 border-t border-emerald-800/80 text-center">
        <p className="text-[10px] text-emerald-300 font-medium">
          TP {settings.academicYear} &bull; Semester {settings.semester}
        </p>
        <p className="text-[9px] text-emerald-400/80">MI Nurul Falah</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-5rem)] sticky top-20 shadow-lg border-r border-emerald-800 print:hidden">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
