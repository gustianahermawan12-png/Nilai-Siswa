export interface SavingsTx {
  type: 'masuk' | 'keluar';
  amount: number;
}

export interface AttendanceItem {
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
}

/**
 * Calculates grade completion status based on KKM threshold.
 */
export function calculateStatus(score: number, kkm: number = 75): 'TUNTAS' | 'PERBAIKAN' {
  if (score >= kkm) {
    return 'TUNTAS';
  }
  return 'PERBAIKAN';
}

/**
 * Calculates average of an array of numeric scores.
 */
export function calculateAverage(scores: number[]): number {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Calculates total savings deposit, withdrawal, and final balance.
 */
export function calculateSavingsBalance(transactions: SavingsTx[]): {
  totalMasuk: number;
  totalKeluar: number;
  balance: number;
} {
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const tx of transactions) {
    if (tx.type === 'masuk') {
      totalMasuk += Number(tx.amount) || 0;
    } else if (tx.type === 'keluar') {
      totalKeluar += Number(tx.amount) || 0;
    }
  }

  return {
    totalMasuk,
    totalKeluar,
    balance: totalMasuk - totalKeluar,
  };
}

/**
 * Calculates sum of infak payments.
 */
export function calculateInfakTotal(payments: { amount: number }[]): number {
  return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
}

/**
 * Summarizes attendance records into counts and percentage.
 */
export function calculateAttendanceSummary(records: AttendanceItem[]): {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  total: number;
  percentageHadir: number;
} {
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alfa = 0;

  for (const r of records) {
    if (r.status === 'hadir') hadir++;
    else if (r.status === 'sakit') sakit++;
    else if (r.status === 'izin') izin++;
    else if (r.status === 'alfa') alfa++;
  }

  const total = hadir + sakit + izin + alfa;
  const percentageHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return {
    hadir,
    sakit,
    izin,
    alfa,
    total,
    percentageHadir,
  };
}

/**
 * Returns an array of YYYY-MM-DD date strings inclusive between start and end.
 */
export function getDateRangeArray(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  if (!startDate) return dates;
  if (!endDate) return [startDate];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [startDate];
  }

  // Ensure start is before or equal to end
  const cur = new Date(Math.min(start.getTime(), end.getTime()));
  const stop = new Date(Math.max(start.getTime(), end.getTime()));

  while (cur <= stop) {
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    cur.setDate(cur.getDate() + 1);
  }

  return dates;
}

/**
 * Formats IDR currency.
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
