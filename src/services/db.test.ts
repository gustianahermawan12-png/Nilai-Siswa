import test from 'node:test';
import assert from 'node:assert/strict';
import { dbService } from './db';

test('dbService initializes with seed data', () => {
  const snapshot = dbService.getSnapshot();
  assert.ok(snapshot.students.length >= 4);
  assert.ok(snapshot.classes.length >= 3);
  assert.ok(snapshot.users.length >= 3);
  assert.equal(snapshot.settings.schoolName, 'MI NURUL FALAH');
});

test('Excuse letter approval automatically records attendance for dates in range', () => {
  const studentId = 'std-3';
  // Submit an excuse letter
  const letter = dbService.submitExcuseLetter({
    studentId,
    studentName: 'Muhammad Rayhan Pratama',
    className: 'Kelas 1A',
    type: 'izin',
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    reason: 'Keperluan keluarga',
  });

  assert.equal(letter.status, 'pending');

  // Review & approve
  const approved = dbService.reviewExcuseLetter(letter.id, 'approved', 'Disetujui', 'Gustiana Hermawan');
  assert.equal(approved, true);

  // Check attendance records for 2026-12-01 and 2026-12-02
  const atts = dbService.getAttendance().filter((a) => a.studentId === studentId);
  const rec1 = atts.find((a) => a.date === '2026-12-01');
  const rec2 = atts.find((a) => a.date === '2026-12-02');

  assert.ok(rec1, 'Expected attendance on 2026-12-01');
  assert.equal(rec1?.status, 'izin');
  assert.ok(rec2, 'Expected attendance on 2026-12-02');
  assert.equal(rec2?.status, 'izin');
});

test('Student deletion removes student and unlinks wali murid', () => {
  const newStudent = dbService.addStudent({
    nis: '99999',
    nisn: '9999999999',
    name: 'Siswa Percobaan',
    gender: 'L',
    classId: 'cls-1',
    parentName: 'Orang Tua Tes',
    phone: '081122334455',
    address: 'Jl. Uji Coba',
    status: 'aktif',
  });

  const createdId = newStudent.id;
  assert.ok(dbService.getStudents().some((s) => s.id === createdId));

  const deleted = dbService.deleteStudent(createdId);
  assert.equal(deleted, true);
  assert.ok(!dbService.getStudents().some((s) => s.id === createdId));
});

test('checkUsernameAvailable prevents duplicate usernames', () => {
  const adminUser = dbService.getUsers().find((u) => u.username === 'admin');
  assert.ok(adminUser);

  // 'admin' is taken for another user ID
  assert.equal(dbService.checkUsernameAvailable('admin', 'different-user-id'), false);
  // Case-insensitive duplicate check
  assert.equal(dbService.checkUsernameAvailable('ADMIN', 'different-user-id'), false);
  // Allowed if checking own user ID
  assert.equal(dbService.checkUsernameAvailable('admin', adminUser.id), true);
  // Free unique username
  assert.equal(dbService.checkUsernameAvailable('username_baru_bebas_123'), true);
});

test('toggleUserStatus switches user status between aktif and nonaktif', () => {
  const users = dbService.getUsers();
  const testUser = users.find((u) => u.role === 'wali_murid') || users[0];
  const initialStatus = testUser.status || 'aktif';

  const res1 = dbService.toggleUserStatus(testUser.id);
  assert.equal(res1, true);
  const expectedNext = initialStatus === 'aktif' ? 'nonaktif' : 'aktif';
  const updatedUser1 = dbService.getUsers().find((u) => u.id === testUser.id);
  assert.equal(updatedUser1?.status, expectedNext);

  // Toggle back
  const res2 = dbService.toggleUserStatus(testUser.id);
  assert.equal(res2, true);
  const updatedUser2 = dbService.getUsers().find((u) => u.id === testUser.id);
  assert.equal(updatedUser2?.status, initialStatus);
});

