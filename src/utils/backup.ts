import { db } from '../db/db';

export interface UniversalBackupData {
  version: number;
  exportDate: string;
  tables: Record<string, any[]>;
  legacyLocalData?: Record<string, string | null>;
}

export async function exportDatabaseToJson(): Promise<string> {
  const tablesData: Record<string, any[]> = {};

  // Dynamically export all Dexie tables registered in the schema (16 tables)
  for (const table of db.tables) {
    try {
      tablesData[table.name] = await table.toArray();
    } catch (e) {
      console.warn(`Failed to export table ${table.name}:`, e);
      tablesData[table.name] = [];
    }
  }

  // Preserve essential user preferences without leaking secrets
  const localKeysToPreserve = [
    'midmar_win_1',
    'midmar_win_2',
    'midmar_win_3',
    'midmar_tomorrow_anchor',
    'midmar_retro_rating',
    'midmar_retro_reflection',
    'midmar_language_target',
    'midmar_language_quota',
    'midmar_luxury_theme',
    'midmar_asr_method',
  ];

  const legacyLocalData: Record<string, string | null> = {};
  for (const key of localKeysToPreserve) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        legacyLocalData[key] = val;
      }
    } catch (_) {}
  }

  const backupData: UniversalBackupData = {
    version: 2,
    exportDate: new Date().toISOString(),
    tables: tablesData,
    legacyLocalData,
  };

  return JSON.stringify(backupData, null, 2);
}

export function downloadBackupFile(jsonString: string) {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `midmar-lifeos-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseFromJson(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    const tablesData = parsed.tables || parsed.data;
    if (!tablesData) {
      throw new Error('ملف النسخ الاحتياطي غير صالح');
    }

    // Mapping for backwards compatibility with v1 backups
    const legacyNameMap: Record<string, string> = {
      userState: 'user_state',
      quran: 'quran_progress',
      books: 'book_progress',
      goals: 'goals',
      dailyLogs: 'daily_logs',
      bufferQueue: 'buffer_queue',
      leads: 'leads',
      templates: 'templates',
    };

    const allTables = db.tables;
    await db.transaction('rw', allTables, async () => {
      for (const table of allTables) {
        // Look up by exact name, or by legacy key
        let records = tablesData[table.name];
        if (!records) {
          const legacyKey = Object.keys(legacyNameMap).find((k) => legacyNameMap[k] === table.name);
          if (legacyKey && tablesData[legacyKey]) {
            records = tablesData[legacyKey];
          }
        }

        if (Array.isArray(records) && records.length > 0) {
          await table.clear();
          await table.bulkAdd(records);
        }
      }
    });

    // Restore preserved local preferences
    if (parsed.legacyLocalData) {
      for (const [k, v] of Object.entries(parsed.legacyLocalData)) {
        if (typeof v === 'string') {
          try {
            localStorage.setItem(k, v);
          } catch (_) {}
        }
      }
    }

    // Run seamless migration to ensure today's daily_logs has everything
    await migrateLocalStorageToDexie();

    return true;
  } catch (error) {
    console.error('فشل استيراد النسخة الاحتياطية:', error);
    return false;
  }
}

/**
 * Migration helper: seamlessly moves legacy localStorage wins and tomorrow anchor into Dexie daily_logs
 */
export async function migrateLocalStorageToDexie(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const win1 = localStorage.getItem('midmar_win_1');
    const win2 = localStorage.getItem('midmar_win_2');
    const win3 = localStorage.getItem('midmar_win_3');
    const anchor = localStorage.getItem('midmar_tomorrow_anchor');

    const wins = [win1, win2, win3].filter(Boolean) as string[];

    if (wins.length > 0 || anchor) {
      const existing = await db.daily_logs.get(today);
      if (existing) {
        await db.daily_logs.update(today, {
          wins: existing.wins && existing.wins.length > 0 ? existing.wins : wins,
          tomorrowAnchor: existing.tomorrowAnchor || anchor || undefined,
        });
      }
    }
  } catch (e) {
    console.warn('Migration of localStorage to Dexie skipped:', e);
  }
}

export interface EncryptedBackupContainer {
  encrypted: true;
  version: number;
  salt: number[];
  iv: number[];
  cipher: number[];
}

/**
 * Military-grade AES-GCM-256 encryption with PBKDF2 (100k iterations)
 * 100% Client-side sovereign privacy
 */
export async function encryptBackupPayload(plainText: string, pass: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );
  const container: EncryptedBackupContainer = {
    encrypted: true,
    version: 1,
    salt: Array.from(salt),
    iv: Array.from(iv),
    cipher: Array.from(new Uint8Array(cipherBuffer)),
  };
  return JSON.stringify(container, null, 2);
}

/**
 * Decrypts an AES-GCM-256 container using user passphrase
 */
export async function decryptBackupPayload(payloadJson: string, pass: string): Promise<string> {
  const data = JSON.parse(payloadJson);
  if (!data.encrypted) return payloadJson;
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const salt = new Uint8Array(data.salt);
  const iv = new Uint8Array(data.iv);
  const cipher = new Uint8Array(data.cipher);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  return dec.decode(plainBuffer);
}
