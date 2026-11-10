import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStatus,
  calculateAverage,
  calculateSavingsBalance,
  calculateInfakTotal,
  calculateAttendanceSummary,
  getDateRangeArray,
} from './gradeCalculations';

test('calculateStatus correctly assigns TUNTAS and PERBAIKAN', () => {
  assert.equal(calculateStatus(75, 75), 'TUNTAS');
  assert.equal(calculateStatus(90, 75), 'TUNTAS');
  assert.equal(calculateStatus(74.9, 75), 'PERBAIKAN');
  assert.equal(calculateStatus(50, 75), 'PERBAIKAN');
  // Custom KKM threshold
  assert.equal(calculateStatus(80, 80), 'TUNTAS');
  assert.equal(calculateStatus(78, 80), 'PERBAIKAN');
});

test('calculateAverage handles empty and non-empty arrays', () => {
  assert.equal(calculateAverage([]), 0);
  assert.equal(calculateAverage([80, 90, 100]), 90);
  assert.equal(calculateAverage([75, 80]), 77.5);
});

test('calculateSavingsBalance accurately computes deposit, withdrawal, and final balance', () => {
  const transactions = [
    { type: 'masuk' as const, amount: 50000 },
    { type: 'masuk' as const, amount: 25000 },
    { type: 'keluar' as const, amount: 20000 },
  ];
  const result = calculateSavingsBalance(transactions);
  assert.equal(result.totalMasuk, 75000);
  assert.equal(result.totalKeluar, 20000);
  assert.equal(result.balance, 55000);
});

test('calculateInfakTotal aggregates infak contributions', () => {
  const payments = [{ amount: 10000 }, { amount: 15000 }, { amount: 20000 }];
  assert.equal(calculateInfakTotal(payments), 45000);
});

test('calculateAttendanceSummary calculates counts and attendance percentage', () => {
  const records = [
    { status: 'hadir' as const },
    { status: 'hadir' as const },
    { status: 'hadir' as const },
    { status: 'sakit' as const },
    { status: 'izin' as const },
  ];
  const summary = calculateAttendanceSummary(records);
  assert.equal(summary.hadir, 3);
  assert.equal(summary.sakit, 1);
  assert.equal(summary.izin, 1);
  assert.equal(summary.alfa, 0);
  assert.equal(summary.total, 5);
  assert.equal(summary.percentageHadir, 60);
});

test('getDateRangeArray generates full list of contiguous ISO dates', () => {
  const dates = getDateRangeArray('2026-11-10', '2026-11-12');
  assert.deepEqual(dates, ['2026-11-10', '2026-11-11', '2026-11-12']);

  const single = getDateRangeArray('2026-11-10', '2026-11-10');
  assert.deepEqual(single, ['2026-11-10']);
});
