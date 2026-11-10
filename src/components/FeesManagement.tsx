import React, { useState } from 'react';
import { FeeItem, FeePayment, User } from '../types';
import { dbService } from '../services/db';
import { formatIDR } from '../utils/gradeCalculations';
import {
  Coins,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Check,
  Edit2,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';

interface FeesManagementProps {
  currentUser: User;
}

export const FeesManagement: React.FC<FeesManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const fees = db.fees;
  const feePayments = db.feePayments;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedFeeId, setSelectedFeeId] = useState<string>(fees[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);

  // Form states for new fee
  const [title, setTitle] = useState('');
  const [targetClassId, setTargetClassId] = useState('semua');
  const [nominal, setNominal] = useState<number | ''>(50000);
  const [dueDate, setDueDate] = useState('2024-12-20');
  const [description, setDescription] = useState('');
  const [feeToDelete, setFeeToDelete] = useState<FeeItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingFee(null);
    setTitle('');
    setTargetClassId('semua');
    setNominal(50000);
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FeeItem) => {
    setEditingFee(f);
    setTitle(f.title);
    setTargetClassId(f.targetClassId);
    setNominal(f.nominal);
    setDueDate(f.dueDate);
    setDescription(f.description);
    setIsModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !nominal || Number(nominal) <= 0) {
      showToast('Harap isi judul iuran dan nominal valid!');
      return;
    }

    if (editingFee) {
      dbService.updateFee(editingFee.id, {
        title: title.trim(),
        targetClassId,
        nominal: Number(nominal),
        dueDate,
        description: description.trim(),
      });
      showToast('Iuran tambahan berhasil diperbarui.');
    } else {
      const newFee = dbService.addFee({
        title: title.trim(),
        targetClassId,
        nominal: Number(nominal),
        dueDate,
        description: description.trim(),
        isActive: true,
      });
      setSelectedFeeId(newFee.id);
      showToast('Iuran tambahan baru berhasil dibuat.');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!feeToDelete) return;
    const success = dbService.deleteFee(feeToDelete.id);
    if (success) {
      showToast('Iuran berhasil dinonaktifkan/dihapus (arsip pembayaran tetap tersimpan).');
    }
    setFeeToDelete(null);
  };

  const handleTogglePayment = (feeId: string, studentId: string, currentPaid: boolean, fullNominal: number) => {
    dbService.recordFeePayment({
      feeId,
      studentId,
      amountPaid: currentPaid ? 0 : fullNominal,
      isPaid: !currentPaid,
      notes: !currentPaid ? 'Lunas via Guru' : 'Belum lunas',
    });
    showToast(!currentPaid ? 'Status pembayaran diubah: LUNAS' : 'Status pembayaran diubah: BELUM LUNAS');
  };

  const activeFeeObj = fees.find((f) => f.id === selectedFeeId) || fees[0];

  // Students eligible for selected fee
  const eligibleStudents = students.filter((s) => {
    if (s.status !== 'aktif') return false;
    if (!activeFeeObj) return false;
    if (activeFeeObj.targetClassId === 'semua') return true;
    return s.classId === activeFeeObj.targetClassId;
  });

  // For Wali Murid: fees applicable to child
  const childFees = linkedStudent
    ? fees.filter(
        (f) => f.isActive && (f.targetClassId === 'semua' || f.targetClassId === linkedStudent.classId)
      )
    : [];

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
            <Coins className="w-6 h-6 text-emerald-700" />
            <span>Iuran Tambahan Siswa</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Kelola iuran kegiatan madrasah, perlengkapan seragam, atau iuran mendadak dengan pencatatan status lunas.'
              : `Daftar iuran kegiatan madrasah yang berlaku untuk ananda ${linkedStudent?.name}.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Buat Iuran Baru</span>
          </button>
        )}
      </div>

      {/* ADMIN VIEW */}
      {isAdmin && (
        <>
          {/* Fee Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {fees.map((fee) => (
              <button
                key={fee.id}
                type="button"
                onClick={() => setSelectedFeeId(fee.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all text-left border ${
                  selectedFeeId === fee.id
                    ? 'bg-emerald-800 text-white border-amber-400 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                }`}
              >
                <div className="truncate max-w-[200px]">{fee.title}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    selectedFeeId === fee.id ? 'text-amber-300' : 'text-emerald-700'
                  }`}
                >
                  {formatIDR(fee.nominal)} &bull; {fee.targetClassId === 'semua' ? 'Semua Kelas' : 'Kelas Khusus'}
                </div>
              </button>
            ))}
          </div>

          {activeFeeObj && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-emerald-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-amber-400">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
                      AKTIF
                    </span>
                    <h3 className="font-bold text-base text-white">{activeFeeObj.title}</h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">{activeFeeObj.description || 'Tidak ada deskripsi'}</p>
                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                    Batas Pembayaran: {activeFeeObj.dueDate} &bull; Target:{' '}
                    {activeFeeObj.targetClassId === 'semua'
                      ? 'Semua Siswa Madrasah'
                      : classes.find((c) => c.id === activeFeeObj.targetClassId)?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeFeeObj)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Iuran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeToDelete(activeFeeObj)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>

              {/* Table of students and payment status */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Tagihan</th>
                      <th className="py-3 px-4">Status Pembayaran</th>
                      <th className="py-3 px-4">Tanggal Lunas</th>
                      <th className="py-3 px-4 text-center">Tindakan Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {eligibleStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Tidak ada siswa terdaftar untuk iuran ini.
                        </td>
                      </tr>
                    ) : (
                      eligibleStudents.map((std, idx) => {
                        const payment = feePayments.find(
                          (fp) => fp.feeId === activeFeeObj.id && fp.studentId === std.id
                        );
                        const isPaid = payment?.isPaid || false;
                        const cls = classes.find((c) => c.id === std.classId);

                        return (
                          <tr key={std.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-500">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                                {std.name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">NIS: {std.nis}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[11px]">
                                {cls?.name || 'Kelas 1A'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black font-mono text-emerald-950">
                              {formatIDR(activeFeeObj.nominal)}
                            </td>
                            <td className="py-3.5 px-4">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  Lunas
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Belum Lunas
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                              {payment?.paidAt ? payment.paidAt.slice(0, 10) : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleTogglePayment(
                                    activeFeeObj.id,
                                    std.id,
                                    isPaid,
                                    activeFeeObj.nominal
                                  )
                                }
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-xs ${
                                  isPaid
                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                }`}
                              >
                                {isPaid ? 'Batal Lunas' : 'Tandai Lunas'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* WALI MURID VIEW: ONLY APPLICABLE FEES */}
      {!isAdmin && linkedStudent && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
            <div>
              <h3 className="font-bold text-sm">Iuran Madrasah untuk {linkedStudent.name}</h3>
              <p className="text-[11px] text-emerald-200">
                Informasi resmi iuran kegiatan dan perlengkapan siswa
              </p>
            </div>
            <span className="bg-amber-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
              STATUS
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {childFees.length === 0 ? (
              <p className="text-xs text-gray-500 col-span-2 text-center py-8">
                Tidak ada iuran tambahan aktif saat ini.
              </p>
            ) : (
              childFees.map((fee) => {
                const payment = feePayments.find(
                  (fp) => fp.feeId === fee.id && fp.studentId === linkedStudent.id
                );
                const isPaid = payment?.isPaid || false;

                return (
                  <div
                    key={fee.id}
                    className="p-5 rounded-2xl border-2 border-gray-100 hover:border-emerald-300 transition-all bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{fee.title}</h4>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-900 border border-green-300">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Lunas
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{fee.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Nominal</span>
                        <div className="text-base font-black text-emerald-900 font-mono">
                          {formatIDR(fee.nominal)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Batas Waktu</span>
                        <div className="text-xs font-mono font-semibold text-gray-700">{fee.dueDate}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Add / Edit Fee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-300" />
                <span>{editingFee ? 'Edit Iuran Tambahan' : 'Buat Iuran Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Iuran / Keperluan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Iuran Outing Class / Seragam Baru"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={nominal}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Target Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  >
                    <option value="semua">Semua Siswa</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Batas Pembayaran (Jatuh Tempo) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Keterangan / Rincian Penggunaan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rincian peruntukan iuran..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingFee ? 'Simpan Perubahan' : 'Buat Iuran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {feeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Iuran Tambahan</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus iuran{' '}
              <span className="font-bold text-gray-900">"{feeToDelete.title}"</span>? Seluruh riwayat pembayaran siswa yang telah tercatat akan tetap diarsipkan dengan aman.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setFeeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Iuran</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
