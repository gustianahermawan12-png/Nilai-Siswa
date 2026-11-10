import React, { useState } from 'react';
import { ScheduleItem, User } from '../types';
import { dbService } from '../services/db';
import {
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  MapPin,
  Check,
  X,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface ScheduleManagementProps {
  currentUser: User;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ currentUser }) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const schedules = db.schedules;
  const classes = db.classes;
  const subjects = db.subjects;

  // Determine initial class
  const student = !isAdmin
    ? db.students.find((s) => s.id === currentUser.linkedStudentId)
    : undefined;
  const initialClassId = student ? student.classId : classes[0]?.id || 'cls-1';

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form states
  const [classId, setClassId] = useState(initialClassId);
  const [day, setDay] = useState<ScheduleItem['day']>('Senin');
  const [startTime, setStartTime] = useState('07:15');
  const [endTime, setEndTime] = useState('08:30');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'sbj-1');
  const [teacherName, setTeacherName] = useState(subjects[0]?.teacherName || '');
  const [room, setRoom] = useState('Ruang 1A');

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const days: ScheduleItem['day'][] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setClassId(selectedClassId);
    setDay('Senin');
    setStartTime('07:15');
    setEndTime('08:30');
    setSubjectId(subjects[0]?.id || 'sbj-1');
    setTeacherName(subjects[0]?.teacherName || '');
    setRoom('Ruang Kelas');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setClassId(item.classId);
    setDay(item.day);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setSubjectId(item.subjectId);
    setTeacherName(item.teacherName);
    setRoom(item.room || 'Ruang Kelas');
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      showToast('Waktu masuk dan waktu pulang/selesai wajib diisi!');
      return;
    }

    if (editingItem) {
      dbService.updateSchedule(editingItem.id, {
        classId,
        day,
        startTime,
        endTime,
        subjectId,
        teacherName: teacherName.trim(),
        room: room.trim(),
      });
      showToast('Jadwal pelajaran berhasil diperbarui.');
    } else {
      dbService.addSchedule({
        classId,
        day,
        startTime,
        endTime,
        subjectId,
        teacherName: teacherName.trim(),
        room: room.trim(),
      });
      showToast('Jadwal pelajaran baru berhasil ditambahkan.');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    const success = dbService.deleteSchedule(itemToDelete.id);
    if (success) {
      showToast('Jadwal pelajaran berhasil dihapus.');
    }
    setItemToDelete(null);
  };

  // Filtered schedule list sorted by time
  const filteredSchedules = schedules
    .filter((s) => s.classId === selectedClassId && (selectedDay === 'all' || s.day === selectedDay))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentClassObj = classes.find((c) => c.id === selectedClassId);

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
            <CalendarDays className="w-6 h-6 text-emerald-700" />
            <span>Jadwal Pelajaran & Jam Masuk / Pulang</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Atur jadwal mata pelajaran per hari, waktu jam masuk dan jam pulang, pengampu, serta ruang kelas.'
              : `Jadwal kegiatan belajar mengajar ananda di ${currentClassObj?.name || 'kelas'}.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Jadwal Baru</span>
          </button>
        )}
      </div>

      {/* Class & Day Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">Pilih Kelas:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            {currentClassObj?.name} &bull; Wali Kelas: {currentClassObj?.homeroomTeacher}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1">Hari:</span>
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              selectedDay === 'all'
                ? 'bg-amber-400 text-emerald-950 shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua Hari
          </button>
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                selectedDay === d
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table & Cards */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">
              Tabel Jadwal {currentClassObj?.name} {selectedDay !== 'all' ? `(${selectedDay})` : ''}
            </h3>
          </div>
          <span className="text-xs text-emerald-200 font-medium">
            Total {filteredSchedules.length} Sesi Terjadwal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Hari</th>
                <th className="py-3 px-4">Jam Masuk - Pulang</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Guru Pengampu</th>
                <th className="py-3 px-4">Ruangan</th>
                {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-gray-400">
                    Tidak ada jadwal pelajaran untuk hari ini.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => {
                  const subj = subjects.find((s) => s.id === item.subjectId);

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-emerald-950">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-950 rounded-lg text-xs font-black">
                          {item.day}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5 text-xs sm:text-sm">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          Masuk: {item.startTime} | Pulang: {item.endTime}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">
                          {subj?.name || 'Mata Pelajaran'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-semibold">
                          Kode: {subj?.code || '-'} &bull; KKM: {subj?.kkm || 75}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {item.teacherName || subj?.teacherName || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.room || 'Ruang Kelas'}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit jadwal"
                              aria-label="Edit jadwal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus jadwal"
                              aria-label="Hapus jadwal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal Add / Edit Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-300" />
                <span>{editingItem ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Hari <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as ScheduleItem['day'])}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time in and Time out */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                    Waktu Jam Masuk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                    Waktu Jam Pulang / Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    const s = subjects.find((subj) => subj.id === e.target.value);
                    if (s) setTeacherName(s.teacherName);
                  }}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - Pengampu: {s.teacherName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Guru Pengampu
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ustadz / Ustadzah..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Ruang Kelas / Lokasi
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ruang 1A / Lapangan / Lab"
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
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Jadwal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Working safely! */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Jadwal Pelajaran</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus sesi jadwal{' '}
              <span className="font-bold text-gray-900">
                {subjects.find((s) => s.id === itemToDelete.subjectId)?.name} (Hari {itemToDelete.day}, {itemToDelete.startTime} - {itemToDelete.endTime})
              </span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
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
                <span>Ya, Hapus Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
