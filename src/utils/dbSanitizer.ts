/**
 * Pure utilities for sanitizing database payloads (removing undefined before Firestore writes),
 * normalizing usernames, validating credentials, and computing shareable portal URLs.
 */

/**
 * Recursively removes keys with `undefined` values from objects and filters `undefined` items from arrays
 * so Firestore `setDoc` never throws "Unsupported field value: undefined".
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = stripUndefined(v);
      }
    }
    return result as T;
  }

  return value;
}

/**
 * Normalizes a username consistently across login, profile, settings, and wali account forms.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, '');
}

export interface CredentialValidationInput {
  username: string;
  password: string;
  requirePassword: boolean;
  minPasswordLength?: number;
}

export interface CredentialValidationResult {
  valid: boolean;
  cleanUsername: string;
  cleanPassword: string;
  error?: string;
}

/**
 * Validates username & password inputs uniformly before hashing and saving.
 */
export function validateCredentialsInput(
  input: CredentialValidationInput
): CredentialValidationResult {
  const minLen = input.minPasswordLength ?? 4;
  const rawTrimmed = input.username.trim();
  if (!rawTrimmed) {
    return {
      valid: false,
      cleanUsername: '',
      cleanPassword: '',
      error: 'Nama pengguna (username) tidak boleh kosong.',
    };
  }

  if (/\s/.test(rawTrimmed)) {
    return {
      valid: false,
      cleanUsername: normalizeUsername(rawTrimmed),
      cleanPassword: '',
      error: 'Nama pengguna (username) tidak boleh mengandung spasi.',
    };
  }

  const cleanUsername = normalizeUsername(rawTrimmed);
  if (cleanUsername.length < 3) {
    return {
      valid: false,
      cleanUsername,
      cleanPassword: '',
      error: 'Nama pengguna (username) minimal 3 karakter.',
    };
  }

  const cleanPassword = input.password.trim();
  if (input.requirePassword && !cleanPassword) {
    return {
      valid: false,
      cleanUsername,
      cleanPassword: '',
      error: 'Kata sandi (password) wajib diisi.',
    };
  }

  if (cleanPassword && cleanPassword.length < minLen) {
    return {
      valid: false,
      cleanUsername,
      cleanPassword,
      error: `Kata sandi (password) minimal ${minLen} karakter.`,
    };
  }

  return {
    valid: true,
    cleanUsername,
    cleanPassword,
  };
}

/**
 * Computes the shareable application URL for Wali Murid / teachers.
 * If currently opened via an AI Studio developer preview URL (`ais-dev-...`),
 * converts it to the public shared preview host (`ais-pre-...`) so external users can access it.
 */
export function getShareableAppUrl(origin: string): string {
  if (!origin) return '';
  return origin.replace('://ais-dev-', '://ais-pre-');
}

/**
 * Formats password for display in tables/prints without exposing internal sha256 hashes.
 */
export function formatPasswordDisplay(storedPassword?: string): string {
  if (!storedPassword) return '-';
  if (storedPassword.startsWith('sha256:')) {
    return '•••••••• (Terenkripsi)';
  }
  return storedPassword;
}

export const ACADEMIC_YEAR_PRESETS = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
];

export function validateAcademicYearInput(raw: string): {
  valid: boolean;
  cleanYear: string;
  error?: string;
} {
  const cleanYear = raw.trim().replace(/\s*\/\s*/g, '/');
  if (!cleanYear) {
    return {
      valid: false,
      cleanYear: '',
      error: 'Tahun ajaran wajib diisi (contoh: 2025/2026).',
    };
  }
  if (cleanYear.length < 4) {
    return {
      valid: false,
      cleanYear,
      error: 'Format tahun ajaran minimal 4 karakter (contoh: 2025/2026).',
    };
  }
  return { valid: true, cleanYear };
}
