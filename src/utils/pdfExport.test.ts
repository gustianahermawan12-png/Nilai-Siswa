import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportDocumentData } from './pdfExport';
import { getInitialDatabase } from '../services/db';

test('buildReportDocumentData builds PTS report and filters unreleased grades for wali murid', () => {
  const db = getInitialDatabase();
  // Add an unreleased PTS grade for std-1 on sbj-6
  db.semesterGrades.push({
    id: 'sg-unreleased',
    studentId: 'std-1',
    subjectId: 'sbj-6',
    classId: 'cls-1',
    type: 'PTS',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    score: 80,
    status: 'TUNTAS',
    notes: 'Draft',
    isReleased: false,
    updatedAt: '2024-10-01T08:00:00Z',
  });

  const std1 = db.students.find((s) => s.id === 'std-1')!;
  const cls1 = db.classes.find((c) => c.id === 'cls-1')!;

  const waliDoc = buildReportDocumentData({
    db,
    reportType: 'rapor_pts_pas',
    isAdmin: false,
    student: std1,
    classObj: cls1,
    semesterType: 'PTS',
  });

  const adminDoc = buildReportDocumentData({
    db,
    reportType: 'rapor_pts_pas',
    isAdmin: true,
    student: std1,
    classObj: cls1,
    semesterType: 'PTS',
  });

  const binRowWali = waliDoc.rows.find((r) => r[1] === 'Bahasa Indonesia');
  const binRowAdmin = adminDoc.rows.find((r) => r[1] === 'Bahasa Indonesia');

  assert.equal(binRowWali?.[3], '-');
  assert.equal(binRowAdmin?.[3], '80');
  assert.match(waliDoc.filename, /^Rapor_PTS_Ahmad_Zaki_Pratama\.pdf$/);
});

test('buildReportDocumentData builds data_siswa report with masked encrypted passwords', () => {
  const db = getInitialDatabase();
  db.users[1].password = 'sha256:abcdef123456';

  const doc = buildReportDocumentData({
    db,
    reportType: 'data_siswa',
    isAdmin: true,
    semesterType: 'PAS',
  });

  assert.equal(doc.student, null);
  assert.equal(doc.rows.length, db.students.length);
  const firstRow = doc.rows[0];
  assert.equal(firstRow[5], 'wali_ahmad');
  assert.match(firstRow[6], /Terenkripsi/);
});
