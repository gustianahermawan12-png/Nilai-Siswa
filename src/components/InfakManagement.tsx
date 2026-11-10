import React, { useState } from 'react';
import { InfakPayment, User } from '../types';
import { dbService } from '../services/db';
import { calculateInfakTotal, formatIDR } from '../utils/gradeCalculations';
import {
  HeartHandshake,
  Plus,
  Trash2,
  Search,
  Filter,
  Check,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';

interface InfakManagementProps {
  currentUser: User;
}

export const InfakManagement: React.FC<InfakManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const students = db.students;
  const classes = db.classes;
  const infak = db.infak;

  const linkedStudent = !isAdmin
    ? students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    linkedStudent ? linkedStudent.classId : classes[0]?.id || 'cls-1'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState(
    linkedStudent ? linkedStudent.id : students[0]?.id || ''
  );
  const [month, setMonth] = useState('November');
  const [year, setYear] = useState<number>(2024);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>(20000);
  const [notes, setNotes] = useState('Infak bulanan madrasah');

  // Deletion
  const [infakToDelete, setInfakToDelete] = useState<InfakPayment | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    const firstInClass = students.find((s) => s.classId === selectedClassId) || students[0];
    setStudentId(firstInClass?.id || '');
    setMonth('November');
    setYear(2024);
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(20000);
    setNotes('Infak bulanan madrasah');
    setIsModalOpen(true);
  };

  const handleSaveInfak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showToast('Nominal infak harus lebih dari Rp 0!');
      return;
    }

    dbService.addInfakPayment({
      studentId,
      month,
      year: Number(year),
      date,
      amount: Number(amount),
      notes: notes.trim(),
      recordedBy: currentUser.name,
    });

    showToast('Pembayaran infak berhasil dicatat.');
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!infakToDelete) return;
    const success = dbService.deleteInfakPayment(infakToDelete.id);
    if (success) {
      showToast('Data infak berhasil dihapus.');
    }
    setInfakToDelete(null);
  };

  // Filtered payments
  const filteredInfak = infak.filter((item) => {
    if (!isAdmin) {
      if (!linkedStudent || item.studentId !== linkedStudent.id) return false;
    } else {
      if (selectedClassId !== 'all') {
        const std = students.find((s) => s.id === item.studentId);
        if (std?.classId !== selectedClassId) return false;
      }
    }

    if (selectedMonth !== 'all' && item.month !== selectedMonth) return false;

    const std = students.find((s) => s.id === item.studentId);
    return (
      (std && std.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalInfakCalculated = calculateInfakTotal(filteredInfak);
  const grandTotalInfak = calculateInfakTotal(
    !isAdmin && linkedStudent ? infak.filter((i) => i.studentId === linkedStudent.id) : infak
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
            <HeartHandshake className="w-6 h-6 text-emerald-700" />
            <span>Infak Bulanan MI Nurul Falah</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Pencatatan infak bulanan siswa secara transparan untuk keberkahan pendidikan madrasah.'
              : `Riwayat infak bulanan ananda ${linkedStudent?.name}. Semoga menjadi amal jariyah yang berkah.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Catat Pembayaran Infak</span>
          </button>
        )}
      </div>

      {/* Infak Total Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 rounded-3xl border-2 border-amber-400 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              {isAdmin ? 'Total Infak Terkumpul (Seluruh Siswa)' : 'Total Infak Ananda'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatIDR(grandTotalInfak)}
            </div>
            <p className="text-[11px] text-amber-300 mt-1">
              {isAdmin ? `${infak.length} riwayat transaksi pembayaran tercatat` : 'Alhamdulillah tuntas'}
            </p>
          </div>
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-2xl shadow">
            <HeartHandshake className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Sesuai Filter Saat Ini
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
              {formatIDR(totalInfakCalculated)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Menampilkan {filteredInfak.length} data pembayaran
            </p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Filter Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
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
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-700">Filter Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Semua Bulan</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
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
            placeholder="Cari siswa atau catatan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Infak Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">Riwayat Pembayaran Infak</h3>
          </div>
          <span className="text-xs text-emerald-200 font-medium">
            Total {filteredInfak.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Bulan & Tahun</th>
                <th className="py-3 px-4 text-right">Nominal Infak</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Penerima</th>
                {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInfak.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-gray-400">
                    Belum ada data infak yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredInfak.map((item, idx) => {
                  const std = students.find((s) => s.id === item.studentId);

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-700 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block text-xs sm:text-sm">
                          {std?.name || 'Siswa'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">NIS: {std?.nis}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-950 rounded-lg text-xs font-black inline-block">
                          {item.month} {item.year}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black font-mono text-xs sm:text-sm text-emerald-800">
                          {formatIDR(item.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs">{item.notes || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">{item.recordedBy || 'Petugas'}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setInfakToDelete(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus data infak"
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

      {/* Modal Add Infak */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-300" />
                <span>Catat Pembayaran Infak</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInfak} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Untuk Bulan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tahun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tanggal Bayar <span className="text-red-500">*</span>
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
                    Nominal Infak (Rp) <span className="text-red-500">*</span>
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
                  Keterangan / Alokasi
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Infak bulanan / pembangunan mushalla"
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
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {infakToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Data Infak</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data infak bulan {infakToDelete.month} {infakToDelete.year}{' '}
              sebesar <span className="font-bold text-gray-900">{formatIDR(infakToDelete.amount)}</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setInfakToDelete(null)}
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
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
