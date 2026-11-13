import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import {
  calculateSavingsBalance,
  calculateInfakTotal,
  calculateAttendanceSummary,
  formatIDR,
} from '../utils/gradeCalculations';
import { formatPasswordDisplay } from '../utils/dbSanitizer';
import { buildReportDocumentData, downloadReportPdf } from '../utils/pdfExport';
import {
  Printer,
  Download,
  X,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ReportPrintingProps {
  currentUser: User;
  onClose?: () => void;
}

export type ReportType =
  | 'rapor_pts_pas'
  | 'nilai_harian'
  | 'tabungan'
  | 'infak'
  | 'absensi'
  | 'iuran'
  | 'data_siswa';

export const ReportPrinting: React.FC<ReportPrintingProps> = ({ currentUser, onClose }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const subjects = db.subjects;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [reportType, setReportType] = useState<ReportType>('rapor_pts_pas');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    linkedStudent ? linkedStudent.id : students[0]?.id || ''
  );
  const [semesterType, setSemesterType] = useState<'PTS' | 'PAS'>('PTS');

  const studentsInClass = useMemo(() => {
    return isAdmin
      ? students.filter((s) => s.classId === selectedClassId)
      : linkedStudent
      ? [linkedStudent]
      : [];
  }, [students, isAdmin, selectedClassId, linkedStudent]);

  const currentStudentObj = useMemo(() => {
    if (!isAdmin && linkedStudent) return linkedStudent;
    if (selectedStudentId) {
      const match = studentsInClass.find((s) => s.id === selectedStudentId);
      if (match) return match;
    }
    return studentsInClass[0] || undefined;
  }, [isAdmin, linkedStudent, selectedStudentId, studentsInClass]);

  const currentClassObj =
    classes.find((c) => c.id === (currentStudentObj?.classId || selectedClassId)) || classes[0];

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [printStatusMsg, setPrintStatusMsg] = useState('');
  const [printBlockedNotice, setPrintBlockedNotice] = useState(false);

  const reportDoc = useMemo(
    () =>
      buildReportDocumentData({
        db,
        reportType,
        isAdmin,
        student: currentStudentObj,
        classObj: currentClassObj,
        semesterType,
      }),
    [db, reportType, isAdmin, currentStudentObj, currentClassObj, semesterType]
  );

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setPrintStatusMsg('');
    setPrintBlockedNotice(false);
    try {
      await downloadReportPdf(reportDoc);
      setPrintStatusMsg(`Berkas PDF "${reportDoc.filename}" berhasil diunduh!`);
      setTimeout(() => setPrintStatusMsg(''), 4000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPrintBlockedNotice(true);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    setPrintBlockedNotice(false);
    setPrintStatusMsg('');
    let didTriggerPrintDialog = false;
    const onBeforePrint = () => {
      didTriggerPrintDialog = true;
    };
    window.addEventListener('beforeprint', onBeforePrint, { once: true });

    try {
      window.focus();
      window.print();
    } catch {
      didTriggerPrintDialog = false;
    }

    setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      if (!didTriggerPrintDialog) {
        setPrintBlockedNotice(true);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Configuration bar (Hidden when printing via CSS @media print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <Printer className="w-6 h-6 text-emerald-700" />
              <span>Cetak Laporan & Unduh Berkas PDF</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Format cetak rapi berstandar resmi MI Nurul Falah dengan Kop Surat, data identitas, dan tanda tangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 border border-red-200 cursor-pointer"
                title="Tutup halaman cetak dan kembali ke dasbor"
              >
                <X className="w-4 h-4 text-red-600" />
                <span>Tutup Cetak</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-amber-600 cursor-pointer disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Membuat PDF...' : 'UNDUH BERKAS PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>CETAK LANGSUNG</span>
            </button>
          </div>
        </div>

        {printStatusMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{printStatusMsg}</span>
          </div>
        )}

        {printBlockedNotice && (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 px-4 py-3.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Dialog cetak browser tidak terbuka di tampilan ini (misal preview HP/iPhone).</p>
                <p className="text-amber-900 mt-0.5">
                  Gunakan tombol <strong>Unduh Berkas PDF</strong> untuk langsung menyimpan dokumen A4 siap cetak ke HP atau komputer Anda.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Unduh PDF Sekarang</span>
            </button>
          </div>
        )}

        {/* Report Type Selectors */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-700 mr-2">Pilih Laporan:</span>
            <button
              type="button"
              onClick={() => setReportType('rapor_pts_pas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'rapor_pts_pas'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rapor Nilai PTS & PAS
            </button>
            <button
              type="button"
              onClick={() => setReportType('nilai_harian')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'nilai_harian'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rekap Nilai Harian / Bab
            </button>
            <button
              type="button"
              onClick={() => setReportType('tabungan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'tabungan'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buku Tabungan Siswa
            </button>
            <button
              type="button"
              onClick={() => setReportType('infak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'infak'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bukti Pembayaran Infak
            </button>
            <button
              type="button"
              onClick={() => setReportType('absensi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'absensi'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rekap Daftar Hadir
            </button>
            <button
              type="button"
              onClick={() => setReportType('iuran')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'iuran'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Laporan Iuran Tambahan
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setReportType('data_siswa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reportType === 'data_siswa'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Data Siswa & Akun Wali
              </button>
            )}
          </div>

          {/* Student & Class Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            {isAdmin && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700">Kelas:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      setSelectedClassId(newClassId);
                      const first = students.find((s) => s.classId === newClassId);
                      setSelectedStudentId(first ? first.id : '');
                    }}
                    className="px-3 py-1 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700">Siswa:</span>
                  <select
                    value={currentStudentObj?.id || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={studentsInClass.length === 0}
                    className="px-3 py-1 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none max-w-[220px] disabled:opacity-60"
                  >
                    {studentsInClass.length === 0 ? (
                      <option value="">(Belum ada siswa di kelas ini)</option>
                    ) : (
                      studentsInClass.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (NIS: {s.nis})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </>
            )}

            {reportType === 'rapor_pts_pas' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700">Jenis Penilaian:</span>
                <select
                  value={semesterType}
                  onChange={(e) => setSemesterType(e.target.value as 'PTS' | 'PAS')}
                  className="px-3 py-1 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="PTS">Penilaian Tengah Semester (PTS)</option>
                  <option value="PAS">Penilaian Akhir Semester (PAS)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT CANVAS */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-gray-200 shadow-xl max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Kop Surat Resmi Madrasah */}
        <div className="flex items-center justify-between border-b-4 border-double border-emerald-950 pb-4 mb-6">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
            alt="Logo Madrasah"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-amber-400 bg-white shadow-xs shrink-0"
          />

          <div className="flex-1 text-center px-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-900">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </h4>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight uppercase">
              {db.settings.schoolName}
            </h1>
            <p className="text-xs font-bold text-amber-700 mt-0.5">
              NSM: {db.settings.nsm} &bull; NPSN: {db.settings.npsn}
            </p>
            <p className="text-[11px] text-gray-600 mt-1 leading-tight">
              {db.settings.address}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              Telp: {db.settings.phone} | Email: {db.settings.email}
            </p>
          </div>

          <div className="hidden sm:flex shrink-0 items-center justify-end">
            <span className="text-[10px] font-black uppercase text-emerald-900 bg-amber-200/80 px-2.5 py-1 rounded whitespace-nowrap">
              AKREDITASI B
            </span>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-gray-900 underline underline-offset-4">
            {reportType === 'rapor_pts_pas' && `LAPORAN HASIL PENILAIAN ${semesterType}`}
            {reportType === 'nilai_harian' && 'REKAPITULASI NILAI HARIAN / BAB'}
            {reportType === 'tabungan' && 'BUKU TABUNGAN & REKAP KEUANGAN SISWA'}
            {reportType === 'infak' && 'BUKTI & RIWAYAT PEMBAYARAN INFAK BULANAN'}
            {reportType === 'absensi' && 'REKAPITULASI DAFTAR HADIR SISWA'}
            {reportType === 'iuran' && 'LAPORAN REKAP PEMBAYARAN IURAN TAMBAHAN'}
            {reportType === 'data_siswa' && 'BUKU INDUK & DATA AKUN LOGIN SISWA'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-semibold">
            Tahun Pelajaran {db.settings.academicYear} &bull; Semester {db.settings.semester}
          </p>
        </div>

        {/* Student Metadata Box (if applicable) */}
        {reportType !== 'data_siswa' && currentStudentObj && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-gray-500 block">Nama Siswa:</span>
              <strong className="text-gray-900 text-sm">{currentStudentObj.name}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">NIS / NISN:</span>
              <strong className="text-gray-900 font-mono">
                {currentStudentObj.nis} / {currentStudentObj.nisn}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Kelas / Wali:</span>
              <strong className="text-gray-900">
                {currentClassObj?.name || 'Kelas 1A'} ({currentClassObj?.homeroomTeacher || '-'})
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Tanggal Cetak:</span>
              <strong className="text-gray-900 font-mono">
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>
        )}

        {/* Fallback when no student exists for selected class */}
        {reportType !== 'data_siswa' && !currentStudentObj && (
          <div className="py-12 px-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 mb-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              !
            </div>
            <h4 className="text-sm font-bold text-gray-800">Data Siswa Tidak Tersedia</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Belum ada siswa yang terdaftar pada kelas ini atau belum ada siswa yang dipilih untuk dicetak laporannya.
              Silakan pilih kelas lain atau tambahkan siswa pada menu Siswa &amp; Rombel.
            </p>
          </div>
        )}

        {/* --- REPORT TABLES BASED ON TYPE --- */}

        {/* 1. RAPOR NILAI PTS / PAS */}
        {reportType === 'rapor_pts_pas' && currentStudentObj && (
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                  <th className="py-2.5 px-3 border border-gray-300">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-16">KKM</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-20">Nilai Angka</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-28">Keterangan</th>
                  <th className="py-2.5 px-3 border border-gray-300">Catatan Guru</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const classSubjects = subjects.filter(
                    (s) => !s.classId || s.classId === currentClassObj?.id
                  );
                  const list = classSubjects.length > 0 ? classSubjects : subjects;
                  return list.map((subj, idx) => {
                    const g = db.semesterGrades.find(
                      (sg) =>
                        sg.studentId === currentStudentObj?.id &&
                        sg.subjectId === subj.id &&
                        sg.type === semesterType &&
                        (isAdmin || sg.isReleased)
                    );
                    const kkm = subj.kkm || db.settings.defaultKkm || 75;

                    return (
                      <tr key={subj.id} className="border-b border-gray-200">
                        <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-semibold text-gray-900">
                          {subj.name}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-center font-mono">{kkm}</td>
                        <td className="py-2 px-3 border border-gray-300 text-center font-mono font-bold text-sm">
                          {g ? g.score : '-'}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                          {g ? (
                            <span className={g.status === 'TUNTAS' ? 'text-emerald-800' : 'text-amber-800'}>
                              {g.status}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-gray-700 italic">
                          {g?.notes || '-'}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. NILAI HARIAN */}
        {reportType === 'nilai_harian' && currentStudentObj && (
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                  <th className="py-2.5 px-3 border border-gray-300">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 border border-gray-300">Bab / Materi Penilaian</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center">Tanggal</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-20">Nilai</th>
                  <th className="py-2.5 px-3 border border-gray-300">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {db.dailyGrades
                  .filter((g) => g.studentId === currentStudentObj?.id && (isAdmin || g.isReleased))
                  .map((g, idx) => {
                    const subj = subjects.find((s) => s.id === g.subjectId);
                    return (
                      <tr key={g.id} className="border-b border-gray-200">
                        <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-semibold">{subj?.name}</td>
                        <td className="py-2 px-3 border border-gray-300">{g.chapterTitle}</td>
                        <td className="py-2 px-3 border border-gray-300 text-center font-mono">
                          {g.assessmentDate}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-center font-mono font-bold">
                          {g.score}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-gray-600">{g.notes || '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. TABUNGAN SISWA */}
        {reportType === 'tabungan' && currentStudentObj && (
          <div className="space-y-4 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                    <th className="py-2.5 px-3 border border-gray-300">Tanggal</th>
                    <th className="py-2.5 px-3 border border-gray-300">Uang Masuk (Setoran)</th>
                    <th className="py-2.5 px-3 border border-gray-300">Uang Keluar (Penarikan)</th>
                    <th className="py-2.5 px-3 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {db.savings
                    .filter((s) => s.studentId === currentStudentObj?.id)
                    .map((tx, idx) => (
                      <tr key={tx.id} className="border-b border-gray-200">
                        <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-mono">{tx.date}</td>
                        <td className="py-2 px-3 border border-gray-300 font-mono text-emerald-800 font-bold">
                          {tx.type === 'masuk' ? formatIDR(tx.amount) : '-'}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-mono text-amber-800 font-bold">
                          {tx.type === 'keluar' ? formatIDR(tx.amount) : '-'}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-gray-700">{tx.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Total Balance Card */}
            {(() => {
              const b = calculateSavingsBalance(
                db.savings.filter((s) => s.studentId === currentStudentObj?.id)
              );
              return (
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 text-xs flex justify-between font-bold">
                  <div>Total Setoran: {formatIDR(b.totalMasuk)}</div>
                  <div>Total Penarikan: {formatIDR(b.totalKeluar)}</div>
                  <div className="text-emerald-950 font-black">
                    SALDO AKHIR: {formatIDR(b.balance)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. INFAK */}
        {reportType === 'infak' && currentStudentObj && (
          <div className="space-y-4 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                    <th className="py-2.5 px-3 border border-gray-300">Bulan & Tahun</th>
                    <th className="py-2.5 px-3 border border-gray-300">Tanggal Bayar</th>
                    <th className="py-2.5 px-3 border border-gray-300 text-right">Nominal Infak</th>
                    <th className="py-2.5 px-3 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {db.infak
                    .filter((i) => i.studentId === currentStudentObj?.id)
                    .map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-bold">
                          {item.month} {item.year}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-mono">{item.date}</td>
                        <td className="py-2 px-3 border border-gray-300 text-right font-mono font-bold text-emerald-800">
                          {formatIDR(item.amount)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-gray-700">{item.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs font-bold text-right text-emerald-950">
              TOTAL INFAK TERCATAT:{' '}
              {formatIDR(
                calculateInfakTotal(db.infak.filter((i) => i.studentId === currentStudentObj?.id))
              )}
            </div>
          </div>
        )}

        {/* 5. ABSENSI */}
        {reportType === 'absensi' && currentStudentObj && (
          <div className="space-y-4 mb-8">
            {(() => {
              const atts = db.attendance.filter((a) => a.studentId === currentStudentObj?.id);
              const sum = calculateAttendanceSummary(atts);

              return (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="font-bold text-emerald-800">{sum.hadir} Hari</div>
                      <div className="text-[10px] text-gray-500">Hadir</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="font-bold text-blue-800">{sum.sakit} Hari</div>
                      <div className="text-[10px] text-gray-500">Sakit</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="font-bold text-amber-800">{sum.izin} Hari</div>
                      <div className="text-[10px] text-gray-500">Izin</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="font-bold text-red-800">{sum.alfa} Hari</div>
                      <div className="text-[10px] text-gray-500">Alfa</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-300">
                      <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                          <th className="py-2.5 px-3 border border-gray-300">Tanggal</th>
                          <th className="py-2.5 px-3 border border-gray-300">Status Kehadiran</th>
                          <th className="py-2.5 px-3 border border-gray-300">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atts.map((a, idx) => (
                          <tr key={a.id} className="border-b border-gray-200">
                            <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 border border-gray-300 font-mono">{a.date}</td>
                            <td className="py-2 px-3 border border-gray-300 font-bold uppercase">
                              {a.status}
                            </td>
                            <td className="py-2 px-3 border border-gray-300 text-gray-700">
                              {a.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 6. IURAN TAMBAHAN */}
        {reportType === 'iuran' && currentStudentObj && (
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                  <th className="py-2.5 px-3 border border-gray-300">Nama Iuran</th>
                  <th className="py-2.5 px-3 border border-gray-300">Nominal Tagihan</th>
                  <th className="py-2.5 px-3 border border-gray-300">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 border border-gray-300 text-center">Status Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {db.fees.map((f, idx) => {
                  const p = db.feePayments.find(
                    (fp) => fp.feeId === f.id && fp.studentId === currentStudentObj?.id
                  );
                  const isPaid = p?.isPaid || false;

                  return (
                    <tr key={f.id} className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 font-semibold">{f.title}</td>
                      <td className="py-2 px-3 border border-gray-300 font-mono font-bold">
                        {formatIDR(f.nominal)}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 font-mono">{f.dueDate}</td>
                      <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                        {isPaid ? (
                          <span className="text-emerald-800 uppercase">Lunas</span>
                        ) : (
                          <span className="text-amber-800 uppercase">Belum Lunas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. DATA SISWA & AKUN */}
        {reportType === 'data_siswa' && (
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border border-gray-300 text-center w-10">No</th>
                  <th className="py-2.5 px-3 border border-gray-300">Nama Siswa</th>
                  <th className="py-2.5 px-3 border border-gray-300">NIS / NISN</th>
                  <th className="py-2.5 px-3 border border-gray-300">Kelas</th>
                  <th className="py-2.5 px-3 border border-gray-300">Nama Orang Tua / Wali</th>
                  <th className="py-2.5 px-3 border border-gray-300">Username Login</th>
                  <th className="py-2.5 px-3 border border-gray-300">Kata Sandi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const acc = db.users.find((u) => u.linkedStudentId === s.id);
                  const cls = classes.find((c) => c.id === s.classId);

                  return (
                    <tr key={s.id} className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-300 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 font-bold">{s.name}</td>
                      <td className="py-2 px-3 border border-gray-300 font-mono">
                        {s.nis} / {s.nisn}
                      </td>
                      <td className="py-2 px-3 border border-gray-300">{cls?.name}</td>
                      <td className="py-2 px-3 border border-gray-300">{s.parentName || '-'}</td>
                      <td className="py-2 px-3 border border-gray-300 font-mono font-bold text-emerald-800">
                        {acc?.username || '-'}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 font-mono font-bold text-amber-800">
                        {acc ? formatPasswordDisplay(acc.password) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signatures Block */}
        <div className="pt-6 border-t border-gray-200 grid grid-cols-2 text-xs">
          <div className="text-center space-y-16">
            <p className="text-gray-600 font-medium">Mengetahui,</p>
            <div>
              <p className="font-bold underline text-gray-900 text-sm">
                {currentClassObj?.homeroomTeacher || 'Gustiana Hermawan, S.Pd.'}
              </p>
              <p className="text-gray-500 text-[11px]">Wali Kelas {currentClassObj?.name || '1A'}</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <p className="text-gray-600 font-medium">
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div>
              <p className="font-bold underline text-gray-900 text-sm">
                {db.settings.headmasterName}
              </p>
              <p className="text-gray-500 text-[11px]">Kepala Madrasah Ibtidaiyah Nurul Falah</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Print, PDF & Close Bar (Hidden during @media print) */}
      <div className="print:hidden fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-2 bg-emerald-950/95 text-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Tutup halaman cetak dan kembali ke dasbor"
          >
            <X className="w-4 h-4" />
            <span>Tutup Print</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
          title="Unduh file PDF resmi MI Nurul Falah"
        >
          {isDownloadingPdf ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
          ) : (
            <Download className="w-4 h-4 text-emerald-700" />
          )}
          <span>{isDownloadingPdf ? 'PDF...' : 'Unduh PDF'}</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          title="Buka dialog cetak browser atau simpan PDF"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen</span>
        </button>
      </div>
    </div>
  );
};
