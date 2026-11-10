import React, { useState } from 'react';
import { SavingsTransaction, User } from '../types';
import { dbService } from '../services/db';
import { calculateSavingsBalance, formatIDR } from '../utils/gradeCalculations';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Search,
  Filter,
  Check,
  Printer,
  Calendar,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface SavingsManagementProps {
  currentUser: User;
  onNavigateToPrint?: () => void;
}

export const SavingsManagement: React.FC<SavingsManagementProps> = ({
  currentUser,
  onNavigateToPrint,
}) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const savings = db.savings;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    linkedStudent ? linkedStudent.id : 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState(
    linkedStudent ? linkedStudent.id : students[0]?.id || ''
  );
  const [type, setType] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>(20000);
  const [notes, setNotes] = useState('');

  // Deletion
  const [txToDelete, setTxToDelete] = useState<SavingsTransaction | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    const firstInClass = students.find((s) => s.classId === selectedClassId) || students[0];
    setStudentId(firstInClass?.id || '');
    setType('masuk');
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(20000);
    setNotes('Setoran tabungan');
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showToast('Nominal transaksi harus lebih dari Rp 0!');
      return;
    }

    const std = students.find((s) => s.id === studentId);
    if (!std) return;

    // Check withdrawal balance
    if (type === 'keluar') {
      const currentBal = calculateSavingsBalance(savings.filter((s) => s.studentId === studentId)).balance;
      if (Number(amount) > currentBal) {
        showToast(`Saldo tabungan siswa tidak mencukupi! Saldo saat ini: ${formatIDR(currentBal)}`);
        return;
      }
    }

    dbService.addSavingsTransaction({
      studentId,
      date,
      type,
      amount: Number(amount),
      notes: notes.trim() || (type === 'masuk' ? 'Setoran tabungan' : 'Penarikan tabungan'),
      recordedBy: currentUser.name,
    });

    showToast(`Transaksi tabungan ${type === 'masuk' ? 'Setoran' : 'Penarikan'} berhasil dicatat.`);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!txToDelete) return;
    const success = dbService.deleteSavingsTransaction(txToDelete.id);
    if (success) {
      showToast('Transaksi tabungan berhasil dihapus.');
    }
    setTxToDelete(null);
  };

  // Filtered transactions
  const filteredTransactions = savings.filter((tx) => {
    if (!isAdmin) {
      if (!linkedStudent || tx.studentId !== linkedStudent.id) return false;
    } else {
      if (selectedStudentId !== 'all' && tx.studentId !== selectedStudentId) return false;
      if (selectedClassId !== 'all') {
        const std = students.find((s) => s.id === tx.studentId);
        if (std?.classId !== selectedClassId) return false;
      }
    }

    const std = students.find((s) => s.id === tx.studentId);
    return (
      (std && std.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate balance for the current view
  const overallBalance = calculateSavingsBalance(
    !isAdmin && linkedStudent
      ? savings.filter((s) => s.studentId === linkedStudent.id)
      : selectedStudentId !== 'all'
      ? savings.filter((s) => s.studentId === selectedStudentId)
      : savings
  );

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
            <Wallet className="w-6 h-6 text-emerald-700" />
            <span>Tabungan Siswa MI Nurul Falah</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Catat uang masuk (setoran) & uang keluar (penarikan). Saldo otomatis dihitung: Saldo Akhir = Total Masuk - Total Keluar.'
              : `Buku tabungan ananda ${linkedStudent?.name}. Pantau seluruh riwayat setoran, penarikan, dan saldo akhir.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Catat Transaksi Tabungan</span>
          </button>
        )}
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Masuk */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase">Total Uang Masuk (Setoran)</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">
              {formatIDR(overallBalance.totalMasuk)}
            </div>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Total Keluar */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase">Total Uang Keluar (Penarikan)</span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">
              {formatIDR(overallBalance.totalKeluar)}
            </div>
          </div>
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Akhir */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-3xl shadow-lg border-2 border-amber-400 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
              Saldo Akhir Tabungan
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {formatIDR(overallBalance.balance)}
            </div>
            <p className="text-[10px] text-amber-300 mt-1">
              {selectedStudentId !== 'all' ? 'Saldo Siswa Terpilih' : 'Saldo Total Madrasah'}
            </p>
          </div>
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-2xl shadow">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Filter Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('all');
                }}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Siswa Tertentu:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none max-w-[200px]"
              >
                <option value="all">Semua Siswa</option>
                {students
                  .filter((s) => selectedClassId === 'all' || s.classId === selectedClassId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa atau keterangan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">Riwayat Transaksi Tabungan</h3>
          </div>
          <span className="text-xs text-emerald-200 font-medium">
            Total {filteredTransactions.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Keterangan / Keperluan</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-gray-400">
                    Belum ada riwayat transaksi tabungan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const std = students.find((s) => s.id === tx.studentId);
                  const isMasuk = tx.type === 'masuk';

                  return (
                    <tr key={tx.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-700 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                          {std?.name || 'Siswa'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">NIS: {std?.nis}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isMasuk
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                              Uang Masuk (Setoran)
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-amber-700" />
                              Uang Keluar (Penarikan)
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black font-mono text-xs sm:text-sm ${
                            isMasuk ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {isMasuk ? '+' : '-'} {formatIDR(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs">{tx.notes || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">{tx.recordedBy || 'Petugas'}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Savings Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-300" />
                <span>Catat Transaksi Tabungan</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Siswa <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Jenis Transaksi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                      type === 'masuk'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="txType"
                      checked={type === 'masuk'}
                      onChange={() => setType('masuk')}
                      className="hidden"
                    />
                    <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                    <span>Uang Masuk (Setor)</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer font-bold text-xs transition-colors ${
                      type === 'keluar'
                        ? 'border-amber-600 bg-amber-50 text-amber-950'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="txType"
                      checked={type === 'keluar'}
                      onChange={() => setType('keluar')}
                      className="hidden"
                    />
                    <ArrowUpRight className="w-4 h-4 text-amber-700" />
                    <span>Uang Keluar (Tarik)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tanggal Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-emerald-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Keterangan / Keperluan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Setoran mingguan / Beli buku tulis"
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
                  <span>Simpan Transaksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Transaksi Tabungan</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus transaksi{' '}
              <span className="font-bold text-gray-900">
                {txToDelete.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'} {formatIDR(txToDelete.amount)}
              </span>{' '}
              pada tanggal {txToDelete.date}? Saldo akan otomatis disesuaikan kembali.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
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
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
