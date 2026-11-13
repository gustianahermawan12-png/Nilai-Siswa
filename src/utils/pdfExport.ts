import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppDatabase, Student, ClassGroup } from '../types';
import {
  calculateSavingsBalance,
  calculateInfakTotal,
  calculateAttendanceSummary,
  formatIDR,
} from './gradeCalculations';
import { formatPasswordDisplay } from './dbSanitizer';

export type PrintableReportType =
  | 'rapor_pts_pas'
  | 'nilai_harian'
  | 'tabungan'
  | 'infak'
  | 'absensi'
  | 'iuran'
  | 'data_siswa';

export interface ReportSummaryChip {
  label: string;
  value: string;
}

export interface ReportDocumentData {
  reportType: PrintableReportType;
  documentTitle: string;
  subtitle: string;
  filename: string;
  schoolName: string;
  nsm: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  headmasterName: string;
  homeroomTeacher: string;
  className: string;
  printDateFormatted: string;
  student: Student | null;
  headers: string[];
  rows: string[][];
  summaryChips: ReportSummaryChip[];
  summaryFooterText?: string;
}

export interface BuildReportParams {
  db: AppDatabase;
  reportType: PrintableReportType;
  isAdmin: boolean;
  student?: Student;
  classObj?: ClassGroup;
  semesterType: 'PTS' | 'PAS';
  printDate?: Date;
}

function sanitizeFilePart(text: string): string {
  return (text || 'Dokumen')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'Dokumen';
}

export function buildReportDocumentData({
  db,
  reportType,
  isAdmin,
  student,
  classObj,
  semesterType,
  printDate = new Date(),
}: BuildReportParams): ReportDocumentData {
  const settings = db.settings;
  const resolvedClass =
    classObj ||
    db.classes.find((c) => c.id === student?.classId) ||
    db.classes[0];

  const printDateFormatted = printDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const titleMap: Record<PrintableReportType, string> = {
    rapor_pts_pas: `LAPORAN HASIL PENILAIAN ${semesterType}`,
    nilai_harian: 'REKAPITULASI NILAI HARIAN / BAB',
    tabungan: 'BUKU TABUNGAN & REKAP KEUANGAN SISWA',
    infak: 'BUKTI & RIWAYAT PEMBAYARAN INFAK BULANAN',
    absensi: 'REKAPITULASI DAFTAR HADIR SISWA',
    iuran: 'LAPORAN REKAP PEMBAYARAN IURAN TAMBAHAN',
    data_siswa: 'BUKU INDUK & DATA AKUN LOGIN SISWA',
  };

  const filePrefixMap: Record<PrintableReportType, string> = {
    rapor_pts_pas: `Rapor_${semesterType}`,
    nilai_harian: 'Nilai_Harian',
    tabungan: 'Buku_Tabungan',
    infak: 'Bukti_Infak',
    absensi: 'Rekap_Absensi',
    iuran: 'Laporan_Iuran',
    data_siswa: 'Data_Siswa_Wali',
  };

  const subjectTarget = reportType === 'data_siswa' ? 'Semua_Siswa' : student?.name || 'Kelas';
  const filename = `${filePrefixMap[reportType]}_${sanitizeFilePart(subjectTarget)}.pdf`;

  let headers: string[] = [];
  let rows: string[][] = [];
  let summaryChips: ReportSummaryChip[] = [];
  let summaryFooterText: string | undefined;

  if (reportType === 'rapor_pts_pas' && student) {
    headers = ['No', 'Mata Pelajaran', 'KKM', 'Nilai Angka', 'Keterangan', 'Catatan Guru'];
    const classSubjects = db.subjects.filter(
      (s) => !s.classId || s.classId === (resolvedClass?.id || student.classId)
    );
    const list = classSubjects.length > 0 ? classSubjects : db.subjects;

    rows = list.map((subj, idx) => {
      const g = db.semesterGrades.find(
        (sg) =>
          sg.studentId === student.id &&
          sg.subjectId === subj.id &&
          sg.type === semesterType &&
          (isAdmin || sg.isReleased)
      );
      const kkm = subj.kkm || settings.defaultKkm || 75;
      return [
        String(idx + 1),
        subj.name,
        String(kkm),
        g ? String(g.score) : '-',
        g ? g.status : '-',
        g?.notes || '-',
      ];
    });
  } else if (reportType === 'nilai_harian' && student) {
    headers = ['No', 'Mata Pelajaran', 'Bab / Materi Penilaian', 'Tanggal', 'Nilai', 'Catatan'];
    const grades = db.dailyGrades.filter(
      (g) => g.studentId === student.id && (isAdmin || g.isReleased)
    );
    rows = grades.map((g, idx) => {
      const subj = db.subjects.find((s) => s.id === g.subjectId);
      return [
        String(idx + 1),
        subj?.name || '-',
        g.chapterTitle,
        g.assessmentDate,
        String(g.score),
        g.notes || '-',
      ];
    });
  } else if (reportType === 'tabungan' && student) {
    headers = ['No', 'Tanggal', 'Uang Masuk (Setoran)', 'Uang Keluar (Penarikan)', 'Keterangan'];
    const txList = db.savings.filter((s) => s.studentId === student.id);
    rows = txList.map((tx, idx) => [
      String(idx + 1),
      tx.date,
      tx.type === 'masuk' ? formatIDR(tx.amount) : '-',
      tx.type === 'keluar' ? formatIDR(tx.amount) : '-',
      tx.notes || '-',
    ]);
    const bal = calculateSavingsBalance(txList);
    summaryChips = [
      { label: 'Total Setoran', value: formatIDR(bal.totalMasuk) },
      { label: 'Total Penarikan', value: formatIDR(bal.totalKeluar) },
      { label: 'SALDO AKHIR', value: formatIDR(bal.balance) },
    ];
    summaryFooterText = `Total Setoran: ${formatIDR(bal.totalMasuk)}   |   Total Penarikan: ${formatIDR(bal.totalKeluar)}   |   SALDO AKHIR: ${formatIDR(bal.balance)}`;
  } else if (reportType === 'infak' && student) {
    headers = ['No', 'Bulan & Tahun', 'Tanggal Bayar', 'Nominal Infak', 'Keterangan'];
    const infakList = db.infak.filter((i) => i.studentId === student.id);
    rows = infakList.map((item, idx) => [
      String(idx + 1),
      `${item.month} ${item.year}`,
      item.date,
      formatIDR(item.amount),
      item.notes || '-',
    ]);
    const total = calculateInfakTotal(infakList);
    summaryFooterText = `TOTAL INFAK TERCATAT: ${formatIDR(total)}`;
  } else if (reportType === 'absensi' && student) {
    headers = ['No', 'Tanggal', 'Status Kehadiran', 'Keterangan'];
    const atts = db.attendance.filter((a) => a.studentId === student.id);
    const sum = calculateAttendanceSummary(atts);
    summaryChips = [
      { label: 'Hadir', value: `${sum.hadir} Hari` },
      { label: 'Sakit', value: `${sum.sakit} Hari` },
      { label: 'Izin', value: `${sum.izin} Hari` },
      { label: 'Alfa', value: `${sum.alfa} Hari` },
    ];
    rows = atts.map((a, idx) => [
      String(idx + 1),
      a.date,
      a.status.toUpperCase(),
      a.notes || '-',
    ]);
  } else if (reportType === 'iuran' && student) {
    headers = ['No', 'Nama Iuran', 'Nominal Tagihan', 'Jatuh Tempo', 'Status Pembayaran'];
    const relevantFees = db.fees.filter(
      (f) => f.targetClassId === 'semua' || f.targetClassId === student.classId
    );
    rows = relevantFees.map((f, idx) => {
      const p = db.feePayments.find(
        (fp) => fp.feeId === f.id && fp.studentId === student.id
      );
      return [
        String(idx + 1),
        f.title,
        formatIDR(f.nominal),
        f.dueDate,
        p?.isPaid ? 'LUNAS' : 'BELUM LUNAS',
      ];
    });
  } else if (reportType === 'data_siswa') {
    headers = ['No', 'Nama Siswa', 'NIS / NISN', 'Kelas', 'Nama Orang Tua / Wali', 'Username Login', 'Kata Sandi'];
    rows = db.students.map((s, idx) => {
      const acc =
        (s.waliMuridId ? db.users.find((u) => u.id === s.waliMuridId) : undefined) ||
        db.users.find((u) => u.linkedStudentId === s.id);
      const cls = db.classes.find((c) => c.id === s.classId);
      return [
        String(idx + 1),
        s.name,
        `${s.nis || '-'} / ${s.nisn || '-'}`,
        cls?.name || '-',
        s.parentName || '-',
        acc?.username || '-',
        acc ? formatPasswordDisplay(acc.password) : '-',
      ];
    });
  }

  return {
    reportType,
    documentTitle: titleMap[reportType],
    subtitle: `Tahun Pelajaran ${settings.academicYear} • Semester ${settings.semester}`,
    filename,
    schoolName: settings.schoolName || 'MI NURUL FALAH',
    nsm: settings.nsm || '-',
    npsn: settings.npsn || '-',
    address: settings.address || '',
    phone: settings.phone || '-',
    email: settings.email || '-',
    headmasterName: settings.headmasterName || '-',
    homeroomTeacher: resolvedClass?.homeroomTeacher || 'Wali Kelas',
    className: resolvedClass?.name || '-',
    printDateFormatted,
    student: reportType === 'data_siswa' ? null : student || null,
    headers,
    rows,
    summaryChips,
    summaryFooterText,
  };
}

async function fetchImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadReportPdf(
  docData: ReportDocumentData,
  logoPath = '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg'
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  // Optional official madrasah logo on left
  const logoDataUrl = await fetchImageAsDataUrl(logoPath);
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'JPEG', margin, y, 20, 20);
    } catch {
      // Ignore image decode issues cleanly
    }
  }

  // Accreditation badge on right
  pdf.setFillColor(253, 230, 138); // amber-200
  pdf.roundedRect(pageWidth - margin - 26, y + 6, 26, 7, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(6, 78, 59); // emerald-900
  pdf.text('AKREDITASI B', pageWidth - margin - 13, y + 10.6, { align: 'center' });

  // Kop Surat text centered
  const centerX = pageWidth / 2;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(6, 78, 59); // emerald-900
  pdf.text('KEMENTERIAN AGAMA REPUBLIK INDONESIA', centerX, y + 4, { align: 'center' });

  pdf.setFontSize(15);
  pdf.setTextColor(2, 44, 34); // emerald-950
  pdf.text(docData.schoolName.toUpperCase(), centerX, y + 10.5, { align: 'center' });

  pdf.setFontSize(8.5);
  pdf.setTextColor(180, 83, 9); // amber-700
  pdf.text(`NSM: ${docData.nsm}  •  NPSN: ${docData.npsn}`, centerX, y + 15.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.8);
  pdf.setTextColor(75, 85, 99);
  if (docData.address) {
    const addrLines = pdf.splitTextToSize(docData.address, pageWidth - margin * 2 - 44);
    pdf.text(addrLines, centerX, y + 19.5, { align: 'center' });
    y += 19.5 + addrLines.length * 3.5;
  } else {
    y += 21;
  }

  pdf.setFontSize(7.5);
  pdf.text(`Telp: ${docData.phone}  |  Email: ${docData.email}`, centerX, y + 1.5, { align: 'center' });
  y += 5;

  // Double border line
  pdf.setDrawColor(2, 44, 34);
  pdf.setLineWidth(0.7);
  pdf.line(margin, y, pageWidth - margin, y);
  pdf.setLineWidth(0.25);
  pdf.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  y += 8;

  // Document title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(17, 24, 39);
  pdf.text(docData.documentTitle, centerX, y, { align: 'center' });
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.text(docData.subtitle, centerX, y, { align: 'center' });
  y += 7;

  // Student metadata box
  if (docData.student) {
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(209, 213, 219);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

    const col1X = margin + 4;
    const col2X = pageWidth / 2 + 4;

    pdf.setFontSize(7.5);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Nama Siswa:', col1X, y + 4.5);
    pdf.text('Kelas / Wali Kelas:', col1X, y + 12.5);
    pdf.text('NIS / NISN:', col2X, y + 4.5);
    pdf.text('Tanggal Cetak:', col2X, y + 12.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(17, 24, 39);
    pdf.text(docData.student.name || '-', col1X + 24, y + 4.5);
    pdf.text(`${docData.className} (${docData.homeroomTeacher})`, col1X + 28, y + 12.5);
    pdf.text(`${docData.student.nis || '-'} / ${docData.student.nisn || '-'}`, col2X + 22, y + 4.5);
    pdf.text(docData.printDateFormatted, col2X + 25, y + 12.5);

    y += 23;
  }

  // Summary chips (e.g. Attendance)
  if (docData.summaryChips.length > 0 && docData.reportType === 'absensi') {
    const chipWidth = (pageWidth - margin * 2 - 6) / docData.summaryChips.length;
    docData.summaryChips.forEach((chip, i) => {
      const cx = margin + i * (chipWidth + 2);
      pdf.setFillColor(243, 244, 246);
      pdf.setDrawColor(209, 213, 219);
      pdf.roundedRect(cx, y, chipWidth, 12, 1.5, 1.5, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(6, 78, 59);
      pdf.text(chip.value, cx + chipWidth / 2, y + 5.5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text(chip.label, cx + chipWidth / 2, y + 10, { align: 'center' });
    });
    y += 16;
  }

  // Main table
  if (docData.rows.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [docData.headers],
      body: docData.rows,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [31, 41, 55],
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [6, 78, 59], // emerald-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
      },
    });
    const finalY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (finalY || y + 20) + 6;
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Belum ada data tercatat untuk laporan ini.', centerX, y + 6, { align: 'center' });
    y += 14;
  }

  if (docData.summaryFooterText) {
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(167, 243, 208);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 9, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(6, 78, 59);
    pdf.text(docData.summaryFooterText, pageWidth - margin - 4, y + 5.8, { align: 'right' });
    y += 14;
  }

  // Ensure signature block fits on page
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + 38 > pageHeight - 12) {
    pdf.addPage();
    y = 20;
  }

  y += 4;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  const leftSigX = margin + (pageWidth - margin * 2) * 0.25;
  const rightSigX = margin + (pageWidth - margin * 2) * 0.75;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text('Mengetahui,', leftSigX, y, { align: 'center' });
  pdf.text(docData.printDateFormatted, rightSigX, y, { align: 'center' });

  y += 20;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(17, 24, 39);
  pdf.text(docData.homeroomTeacher, leftSigX, y, { align: 'center' });
  pdf.text(docData.headmasterName, rightSigX, y, { align: 'center' });

  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Wali Kelas ${docData.className}`, leftSigX, y, { align: 'center' });
  pdf.text('Kepala Madrasah Ibtidaiyah Nurul Falah', rightSigX, y, { align: 'center' });

  pdf.save(docData.filename);
}
