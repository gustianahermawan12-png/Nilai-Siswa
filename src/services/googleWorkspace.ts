import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppDatabase } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try getting token or prompt
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Creates a formatted Google Sheet in Google Drive containing student academic grades.
 */
export async function exportGradesToGoogleSheets(
  db: AppDatabase,
  classId: string = 'cls-1'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Silakan login dengan Akun Google terlebih dahulu.');
  }

  const cls = db.classes.find((c) => c.id === classId) || db.classes[0];
  if (!cls) {
    throw new Error('Belum ada kelas yang terdaftar untuk diekspor.');
  }
  const students = db.students.filter((s) => s.classId === cls.id);
  const subjects = db.subjects.filter((s) => s.classId === cls.id || s.classId === 'semua');

  // Build rows
  const header = ['No', 'NIS', 'Nama Siswa', 'L/P', ...subjects.map((s) => `${s.name} (${s.code})`), 'Rata-rata', 'Keterangan'];
  const rows: (string | number)[][] = [
    [`REKAP NILAI AKADEMIK - ${db.settings.schoolName}`],
    [`Kelas: ${cls.name} | Tahun Pelajaran: ${cls.academicYear} | Semester: ${cls.semester}`],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    header,
  ];

  students.forEach((std, idx) => {
    const scores: number[] = [];
    const subScores = subjects.map((subj) => {
      // Find PTS or PAS grade
      const g = db.semesterGrades.find(
        (sg) => sg.studentId === std.id && sg.subjectId === subj.id && sg.isReleased
      );
      if (g) {
        scores.push(g.score);
        return g.score;
      }
      return '-';
    });

    const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const status = avg >= db.settings.defaultKkm ? 'TUNTAS' : 'PERBAIKAN';

    rows.push([idx + 1, std.nis, std.name, std.gender, ...subScores, avg || '-', status]);
  });

  // Call Google Sheets API to create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Nilai Siswa ${cls.name} - ${db.settings.schoolName} (${new Date().toLocaleDateString('id-ID')})`,
      },
      sheets: [
        {
          properties: {
            title: cls.name,
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: rows.map((row) => ({
                values: row.map((val) => ({
                  userEnteredValue:
                    typeof val === 'number'
                      ? { numberValue: val }
                      : { stringValue: String(val) },
                })),
              })),
            },
          ],
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Sheets API Error: ${errText}`);
  }

  const sheetData = await createRes.json();
  return {
    spreadsheetId: sheetData.spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl,
  };
}

/**
 * Backs up entire database to Google Drive as a JSON file and returns webViewLink.
 */
export async function backupDatabaseToGoogleDrive(
  db: AppDatabase
): Promise<{ fileId: string; fileName: string; webViewLink: string }> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Silakan login dengan Akun Google terlebih dahulu.');
  }

  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  const fileName = `Backup_${db.settings.schoolName.replace(/\s+/g, '_')}_${timestamp}.json`;
  const fileContent = JSON.stringify(db, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Cadangan data otomatis ${db.settings.schoolName} (Akun Admin, Akun Wali Murid, Data Siswa, Nilai, Keuangan, Absensi)`,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API Error: ${errText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    fileName: data.name || fileName,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}
