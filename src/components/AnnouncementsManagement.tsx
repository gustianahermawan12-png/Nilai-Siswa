import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { dbService } from '../services/db';
import { compressImageFile } from '../utils/imageHelper';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Camera,
  Check,
} from 'lucide-react';

interface AnnouncementsManagementProps {
  currentUser: User;
}

export const AnnouncementsManagement: React.FC<AnnouncementsManagementProps> = ({
  currentUser,
}) => {
  const db = dbService.getSnapshot();
  const isAdmin = currentUser.role === 'admin';
  const announcements = db.announcements;
  const classes = db.classes;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetClassId, setTargetClassId] = useState('semua');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [annToDelete, setAnnToDelete] = useState<Announcement | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setDate(new Date().toISOString().slice(0, 10));
    setTargetClassId('semua');
    setAttachmentUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setDate(ann.date);
    setTargetClassId(ann.targetClassId);
    setAttachmentUrl(ann.attachmentUrl || '');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.72);
      setAttachmentUrl(compressed);
    } catch {
      showToast('Gagal memproses foto dari galeri.');
    }
  };

  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Judul dan isi pengumuman wajib diisi!');
      return;
    }

    if (editingAnn) {
      dbService.updateAnnouncement(editingAnn.id, {
        title: title.trim(),
        content: content.trim(),
        date,
        targetClassId,
        attachmentUrl: attachmentUrl || undefined,
      });
      await dbService.saveAndSyncNow();
      showToast('Pengumuman berhasil diperbarui.');
    } else {
      dbService.addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        date,
        targetClassId,
        attachmentUrl: attachmentUrl || undefined,
        authorName: currentUser.name,
      });
      await dbService.saveAndSyncNow();
      showToast('Pengumuman baru berhasil diterbitkan.');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!annToDelete) return;
    const success = dbService.deleteAnnouncement(annToDelete.id);
    if (success) {
      await dbService.saveAndSyncNow();
      showToast('Pengumuman berhasil dihapus.');
    }
    setAnnToDelete(null);
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
            <Bell className="w-6 h-6 text-emerald-700" />
            <span>Pengumuman & Informasi Madrasah</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Terbitkan surat edaran, jadwal kegiatan, dan pengumuman resmi untuk seluruh wali murid.'
              : 'Informasi dan pengumuman resmi terkini dari MI Nurul Falah.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 border-b-2 border-emerald-950"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {announcements.length === 0 ? (
          <p className="text-xs text-gray-500 col-span-3 text-center py-12 bg-white rounded-3xl border border-gray-200">
            Belum ada pengumuman yang diterbitkan.
          </p>
        ) : (
          announcements.map((ann) => {
            const targetClass =
              ann.targetClassId === 'semua'
                ? 'Semua Kelas'
                : classes.find((c) => c.id === ann.targetClassId)?.name || 'Kelas Khusus';

            return (
              <div
                key={ann.id}
                className="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {ann.attachmentUrl && (
                    <img
                      src={ann.attachmentUrl}
                      alt={ann.title}
                      className="w-full h-40 object-cover border-b border-gray-100 bg-gray-50"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-bold text-[10px] uppercase">
                        {targetClass}
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        {ann.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 leading-snug">{ann.title}</h3>
                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px] font-medium">Oleh: {ann.authorName}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ann)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Edit pengumuman"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnToDelete(ann)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Hapus pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Announcement */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-emerald-700 animate-in fade-in zoom-in-95 max-h-[calc(100dvh-1rem)] sm:max-h-[88dvh] flex flex-col my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-800 text-white flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
                <Bell className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="truncate">{editingAnn ? 'Edit Pengumuman' : 'Terbitkan Pengumuman Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                &times; Tutup
              </button>
            </div>

            <form onSubmit={handleSaveAnn} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Judul Pengumuman <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Jadwal Penilaian Akhir Semester (PAS) Gasal"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Tanggal Terbit <span className="text-red-500">*</span>
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
                      Target Wali Murid <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="semua">Semua Siswa & Wali</option>
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
                    Isi Surat Edaran / Pengumuman <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tuliskan isi pengumuman lengkap untuk wali murid..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Photo attachment */}
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Lampiran Gambar / Poster (Opsional)
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    {attachmentUrl ? (
                      <img
                        src={attachmentUrl}
                        alt="Lampiran"
                        className="w-14 h-14 rounded-xl object-cover border border-gray-300 bg-white"
                      />
                    ) : null}
                    <label className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>Pilih Foto dari Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => setAttachmentUrl('')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup (Batal)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer border-b-2 border-emerald-950"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingAnn ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {annToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Pengumuman</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus pengumuman{' '}
              <span className="font-bold text-gray-900">"{annToDelete.title}"</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setAnnToDelete(null)}
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
                <span>Ya, Hapus Pengumuman</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
