import React, { useState } from 'react';
import { ExcuseLetter, User, Student } from '../types';
import { dbService } from '../services/db';
import { compressImageFile } from '../utils/imageHelper';
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react';

interface ExcuseLettersManagementProps {
  currentUser: User;
}

export const ExcuseLettersManagement: React.FC<ExcuseLettersManagementProps> = ({
  currentUser,
}) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const letters = db.excuseLetters;

  const linkedStudent: Student | undefined = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId) || students[0]
    : undefined;

  const studentClass = linkedStudent ? classes.find((c) => c.id === linkedStudent.classId) : undefined;

  // Wali murid submission form states
  const [type, setType] = useState<'sakit' | 'izin'>('sakit');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin review modal states
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [adminDecision, setAdminDecision] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.72);
      setAttachmentUrl(compressed);
    } catch {
      showToast('Gagal memproses foto surat bukti.');
    }
  };

  const handleSubmitLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedStudent) {
      showToast('Akun Anda tidak terhubung dengan siswa.');
      return;
    }

    if (!reason.trim()) {
      showToast('Alasan izin / sakit wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    dbService.submitExcuseLetter({
      studentId: linkedStudent.id,
      studentName: linkedStudent.name,
      className: studentClass?.name || 'Kelas 1A',
      type,
      startDate,
      endDate,
      reason: reason.trim(),
      attachmentUrl: attachmentUrl || undefined,
    });

    await dbService.saveAndSyncNow();
    setReason('');
    setAttachmentUrl('');
    setIsSubmitting(false);
    showToast('Surat izin/sakit berhasil dikirim ke pihak madrasah!');
  };

  const handleReviewConfirm = async () => {
    if (!selectedLetter) return;

    dbService.reviewExcuseLetter(
      selectedLetter.id,
      adminDecision,
      adminNotes.trim() || (adminDecision === 'approved' ? 'Disetujui pihak madrasah' : 'Permohonan ditolak'),
      currentUser.name
    );
    await dbService.saveAndSyncNow();

    if (adminDecision === 'approved') {
      showToast(
        `Surat izin disetujui! Status ${selectedLetter.type.toUpperCase()} otomatis dicatat ke daftar hadir siswa.`
      );
    } else {
      showToast('Surat izin ditolak. Daftar hadir siswa tidak berubah.');
    }

    setSelectedLetter(null);
    setAdminNotes('');
  };

  // Filtered letters list
  const filteredLetters = isAdmin
    ? letters
    : letters.filter((l) => linkedStudent && l.studentId === linkedStudent.id);

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
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black text-[10px] uppercase mb-1">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            Integrasi Otomatis Daftar Hadir
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>Surat Izin & Surat Sakit Madrasah</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Tinjau surat izin yang dikirimkan oleh wali murid. Menyetujui surat akan otomatis mencatat absensi Sakit / Izin tanpa duplikasi.'
              : 'Formulir resmi pengajuan izin ketidakhadiran ananda. Setelah terkirim, surat akan diverifikasi langsung oleh wali kelas.'}
          </p>
        </div>
      </div>

      {/* WALI MURID: SUBMISSION FORM */}
      {!isAdmin && linkedStudent && (
        <div className="bg-white rounded-3xl border-2 border-emerald-200 shadow-md overflow-hidden">
          <div className="p-4 bg-emerald-800 text-white flex items-center justify-between border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm">Formulir Kirim Surat Izin / Sakit</h3>
            </div>
            <span className="text-xs text-amber-300 font-bold">
              {linkedStudent.name} &bull; {studentClass?.name}
            </span>
          </div>

          <form onSubmit={handleSubmitLetter} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Siswa (Otomatis)
                </label>
                <input
                  type="text"
                  disabled
                  value={linkedStudent.name}
                  className="w-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Kelas (Otomatis)
                </label>
                <input
                  type="text"
                  disabled
                  value={studentClass?.name || 'Kelas 1A'}
                  className="w-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jenis Permohonan Izin <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                    type === 'sakit'
                      ? 'border-blue-600 bg-blue-50 text-blue-950'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="excuseType"
                    checked={type === 'sakit'}
                    onChange={() => setType('sakit')}
                    className="hidden"
                  />
                  <span>Sakit (Memerlukan Istirahat)</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                    type === 'izin'
                      ? 'border-amber-600 bg-amber-50 text-amber-950'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="excuseType"
                    checked={type === 'izin'}
                    onChange={() => setType('izin')}
                    className="hidden"
                  />
                  <span>Izin (Keperluan Penting Keluarga)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mulai Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Sampai Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alasan & Keterangan Rinci <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Ananda mengalami demam dan flu sejak malam, dianjurkan dokter puskesmas untuk beristirahat..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Doctor Note Photo Attachment */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Lampiran Foto Surat Dokter / Bukti Izin (Opsional)
              </label>
              <div className="flex items-center gap-3 mt-2">
                {attachmentUrl ? (
                  <img
                    src={attachmentUrl}
                    alt="Lampiran"
                    className="w-16 h-16 rounded-xl object-cover border border-gray-300 bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                    Foto
                  </div>
                )}
                <label className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Ambil Foto Surat / Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-gray-500 italic">
                * Setelah dikirim, pengajuan surat tidak dapat diubah atau dihapus.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 border-b-2 border-emerald-950"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>Kirim Surat Izin Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History & Review Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">
              {isAdmin ? 'Daftar Pengajuan Surat Izin & Sakit Masuk' : 'Riwayat Pengajuan Surat Anda'}
            </h3>
          </div>
          <span className="text-xs text-emerald-200 font-medium">
            Total {filteredLetters.length} Surat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Jenis Izin</th>
                <th className="py-3 px-4">Rentang Tanggal</th>
                <th className="py-3 px-4">Alasan & Lampiran</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4">Catatan Wali Kelas</th>
                {isAdmin && <th className="py-3 px-4 text-center">Tindakan Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-gray-400">
                    Belum ada pengajuan surat izin / sakit.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter, idx) => (
                  <tr key={letter.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                        {letter.studentName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">{letter.className}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          letter.type === 'sakit'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {letter.type === 'sakit' ? 'Sakit' : 'Izin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700 whitespace-nowrap">
                      {letter.startDate === letter.endDate ? (
                        <span>{letter.startDate}</span>
                      ) : (
                        <span>
                          {letter.startDate} s/d {letter.endDate}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-gray-800 line-clamp-2">{letter.reason}</p>
                      {letter.attachmentUrl && (
                        <a
                          href={letter.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline mt-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Lihat Foto Bukti</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {letter.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          Menunggu
                        </span>
                      )}
                      {letter.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-900">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Disetujui
                        </span>
                      )}
                      {letter.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-900">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-[11px]">
                      {letter.adminNotes || '-'}
                      {letter.reviewedBy && (
                        <div className="text-[9px] text-gray-400">Oleh: {letter.reviewedBy}</div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        {letter.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLetter(letter);
                              setAdminDecision('approved');
                              setAdminNotes('');
                            }}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-[11px] rounded-xl shadow-xs transition-colors"
                          >
                            Tinjau & Setujui
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLetter(letter);
                              setAdminDecision(letter.status === 'approved' ? 'approved' : 'rejected');
                              setAdminNotes(letter.adminNotes || '');
                            }}
                            className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-semibold text-[10px] rounded-lg border border-gray-200"
                          >
                            Ubah Status
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Review Modal */}
      {selectedLetter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLetter(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">Verifikasi Surat Izin / Sakit</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs">
                <p className="font-bold text-emerald-950 text-sm">{selectedLetter.studentName}</p>
                <p className="text-emerald-800 mt-0.5">
                  Kelas: {selectedLetter.className} &bull; Jenis:{' '}
                  <span className="font-bold uppercase">{selectedLetter.type}</span>
                </p>
                <p className="text-emerald-700 font-mono text-[11px] mt-1">
                  Rentang: {selectedLetter.startDate} s/d {selectedLetter.endDate}
                </p>
                <p className="text-gray-700 mt-2 bg-white p-2.5 rounded-xl border border-emerald-100">
                  "{selectedLetter.reason}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Keputusan Verifikasi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                      adminDecision === 'approved'
                        ? 'border-green-600 bg-green-50 text-green-950'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={adminDecision === 'approved'}
                      onChange={() => setAdminDecision('approved')}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Setujui Permohonan</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                      adminDecision === 'rejected'
                        ? 'border-red-600 bg-red-50 text-red-950'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={adminDecision === 'rejected'}
                      onChange={() => setAdminDecision('rejected')}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Tolak Permohonan</span>
                  </label>
                </div>
              </div>

              {adminDecision === 'approved' && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                  <span>
                    Sistem otomatis menandai status <strong>{selectedLetter.type.toUpperCase()}</strong> pada daftar hadir siswa untuk rentang tanggal yang dimohonkan.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Catatan / Alasan Guru
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Izin disetujui. Semoga lekas sembuh ananda..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
              >
                Tutup (Batal)
              </button>
              <button
                type="button"
                onClick={handleReviewConfirm}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer ${
                  adminDecision === 'approved'
                    ? 'bg-green-700 hover:bg-green-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Keputusan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
