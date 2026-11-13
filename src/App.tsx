/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User } from './types';
import { dbService } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';

const StudentManagement = lazy(() =>
  import('./components/StudentManagement').then((m) => ({ default: m.StudentManagement }))
);
const WaliMuridAccounts = lazy(() =>
  import('./components/WaliMuridAccounts').then((m) => ({ default: m.WaliMuridAccounts }))
);
const ScheduleManagement = lazy(() =>
  import('./components/ScheduleManagement').then((m) => ({ default: m.ScheduleManagement }))
);
const DailyGradesManagement = lazy(() =>
  import('./components/DailyGradesManagement').then((m) => ({ default: m.DailyGradesManagement }))
);
const SemesterGradesManagement = lazy(() =>
  import('./components/SemesterGradesManagement').then((m) => ({
    default: m.SemesterGradesManagement,
  }))
);
const SavingsManagement = lazy(() =>
  import('./components/SavingsManagement').then((m) => ({ default: m.SavingsManagement }))
);
const InfakManagement = lazy(() =>
  import('./components/InfakManagement').then((m) => ({ default: m.InfakManagement }))
);
const AttendanceManagement = lazy(() =>
  import('./components/AttendanceManagement').then((m) => ({ default: m.AttendanceManagement }))
);
const ExcuseLettersManagement = lazy(() =>
  import('./components/ExcuseLettersManagement').then((m) => ({
    default: m.ExcuseLettersManagement,
  }))
);
const FeesManagement = lazy(() =>
  import('./components/FeesManagement').then((m) => ({ default: m.FeesManagement }))
);
const AnnouncementsManagement = lazy(() =>
  import('./components/AnnouncementsManagement').then((m) => ({
    default: m.AnnouncementsManagement,
  }))
);
const SubjectsManagement = lazy(() =>
  import('./components/SubjectsManagement').then((m) => ({ default: m.SubjectsManagement }))
);
const ReportPrinting = lazy(() =>
  import('./components/ReportPrinting').then((m) => ({ default: m.ReportPrinting }))
);
const SchoolSettingsView = lazy(() =>
  import('./components/SchoolSettingsView').then((m) => ({ default: m.SchoolSettingsView }))
);
const GoogleIntegrationModal = lazy(() =>
  import('./components/GoogleIntegrationModal').then((m) => ({
    default: m.GoogleIntegrationModal,
  }))
);
const UserProfileModal = lazy(() =>
  import('./components/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
import {
  LayoutDashboard,
  FileCheck2,
  Wallet,
  ClipboardList,
  Mail,
  Printer,
  CalendarDays,
  Award,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [targetStudentForWali, setTargetStudentForWali] = useState<string | undefined>();
  const [lastSavedText, setLastSavedText] = useState('Tersimpan Otomatis');
  const [, setDbVersion] = useState(0);

  // Subscribe to dbService changes for live reactivity
  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      setDbVersion((v) => v + 1);
      setLastSavedText('Tersimpan Otomatis');
      // If current user was updated in db, sync it
      if (currentUser) {
        const freshUser = dbService.getUsers().find((u) => u.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Restore user session securely across browser tabs and reloads + sync latest from Cloud
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUserId =
      localStorage.getItem('minurulfalah_current_user_id') ||
      sessionStorage.getItem('minurulfalah_current_user_id');

    if (storedUserId) {
      const found = dbService.getUsers().find((u) => u.id === storedUserId);
      if (found && found.status !== 'nonaktif') {
        setCurrentUser(found);
      } else {
        localStorage.removeItem('minurulfalah_current_user_id');
        sessionStorage.removeItem('minurulfalah_current_user_id');
      }
    }

    dbService.syncWithCloudNow().then((synced) => {
      if (synced && storedUserId) {
        const fresh = dbService.getUsers().find((u) => u.id === storedUserId);
        if (fresh && fresh.status !== 'nonaktif') {
          setCurrentUser(fresh);
        } else if (fresh && fresh.status === 'nonaktif') {
          setCurrentUser(null);
          localStorage.removeItem('minurulfalah_current_user_id');
          sessionStorage.removeItem('minurulfalah_current_user_id');
        }
      }
    });
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    try {
      localStorage.setItem('minurulfalah_current_user_id', user.id);
      sessionStorage.setItem('minurulfalah_current_user_id', user.id);
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('minurulfalah_current_user_id');
      sessionStorage.removeItem('minurulfalah_current_user_id');
    } catch (e) {}
  };

  const handleOpenWaliAccountForStudent = (studentId: string) => {
    setTargetStudentForWali(studentId);
    setActiveTab('wali_accounts');
  };

  const pendingLettersCount = dbService
    .getExcuseLetters()
    .filter((l) => l.status === 'pending').length;

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-900 selection:bg-amber-400 selection:text-emerald-950 print:bg-white print:min-h-0">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenGoogleWorkspace={() => setIsGoogleModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        lastSavedText={lastSavedText}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto print:block print:max-w-none">
        {/* Responsive Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingLettersCount={pendingLettersCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content View */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8 print:p-0 print:overflow-visible">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-emerald-100 shadow-xs text-xs font-bold text-emerald-800">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Memuat halaman...</span>
                </div>
              </div>
            }
          >
          {activeTab === 'dashboard' && (
            <Dashboard currentUser={currentUser} onNavigate={setActiveTab} />
          )}

          {activeTab === 'students' && isAdmin && (
            <StudentManagement onOpenWaliAccountForStudent={handleOpenWaliAccountForStudent} />
          )}

          {activeTab === 'wali_accounts' && isAdmin && (
            <WaliMuridAccounts
              initialStudentId={targetStudentForWali}
              onOpenGoogleWorkspace={() => setIsGoogleModalOpen(true)}
            />
          )}

          {activeTab === 'subjects' && isAdmin && (
            <SubjectsManagement currentUser={currentUser} />
          )}

          {activeTab === 'schedules' && (
            <ScheduleManagement currentUser={currentUser} />
          )}

          {activeTab === 'daily_grades' && (
            <DailyGradesManagement currentUser={currentUser} />
          )}

          {activeTab === 'pts_grades' && (
            <SemesterGradesManagement
              currentUser={currentUser}
              type="PTS"
              onNavigateToPrint={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'pas_grades' && (
            <SemesterGradesManagement
              currentUser={currentUser}
              type="PAS"
              onNavigateToPrint={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsManagement
              currentUser={currentUser}
              onNavigateToPrint={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'infak' && <InfakManagement currentUser={currentUser} />}

          {activeTab === 'attendance' && (
            <AttendanceManagement currentUser={currentUser} />
          )}

          {activeTab === 'excuse_letters' && (
            <ExcuseLettersManagement currentUser={currentUser} />
          )}

          {activeTab === 'fees' && <FeesManagement currentUser={currentUser} />}

          {activeTab === 'announcements' && (
            <AnnouncementsManagement currentUser={currentUser} />
          )}

          {activeTab === 'reports' && (
            <ReportPrinting
              currentUser={currentUser}
              onClose={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'workspace' && isAdmin && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-emerald-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Google Sheets & Cadangan Google Drive
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Kelola ekspor spreadsheet penilaian resmi madrasah dan cadangan data cloud otomatis.
                </p>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-2"
                >
                  Buka Panel Sinkronisasi Google
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <SchoolSettingsView
              currentUser={currentUser}
              onClose={() => setActiveTab('dashboard')}
              onOpenGoogleWorkspace={() => setIsGoogleModalOpen(true)}
            />
          )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (For fast thumb access on phones) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-emerald-900 border-t-2 border-amber-400 text-white px-2 py-1.5 flex justify-around items-center z-40 shadow-2xl print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-amber-300' : 'text-emerald-200 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(isAdmin ? 'pts_grades' : 'daily_grades')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'pts_grades' || activeTab === 'daily_grades'
              ? 'text-amber-300'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4 mb-0.5" />
          <span>Nilai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('savings')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'savings' ? 'text-amber-300' : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span>Tabungan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'attendance' ? 'text-amber-300' : 'text-emerald-200 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4 mb-0.5" />
          <span>Absensi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('excuse_letters')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold relative ${
            activeTab === 'excuse_letters' ? 'text-amber-300' : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 mb-0.5" />
          <span>Surat Izin</span>
          {isAdmin && pendingLettersCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'reports' ? 'text-amber-300' : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Printer className="w-4 h-4 mb-0.5" />
          <span>Cetak</span>
        </button>
      </nav>

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <Suspense fallback={null}>
          <UserProfileModal
            currentUser={currentUser}
            onClose={() => setIsProfileModalOpen(false)}
            onUserUpdated={(updated) => setCurrentUser(updated)}
          />
        </Suspense>
      )}

      {/* Google Workspace Modal */}
      {isGoogleModalOpen && (
        <Suspense fallback={null}>
          <GoogleIntegrationModal onClose={() => setIsGoogleModalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
