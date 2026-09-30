import pg from 'pg';

const { Pool } = pg;

// Read DATABASE_URL or individual PG environment variables
const connectionString = process.env.DATABASE_URL;

let pool = null;
let isPostgresAvailable = false;

if (connectionString || process.env.PGHOST) {
  try {
    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST || undefined,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || undefined,
      password: process.env.PGPASSWORD || undefined,
      database: process.env.PGDATABASE || undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err) => {
      console.error('⚠️ [PostgreSQL Pool Error]:', err.message);
      isPostgresAvailable = false;
    });
  } catch (err) {
    console.error('⚠️ [PostgreSQL Init Error]:', err.message);
    pool = null;
  }
}

/**
 * Initialize PostgreSQL Schema (Self-migrating idempotent tables)
 */
export async function initPostgres() {
  if (!pool) {
    console.log('ℹ️ [Database] No PostgreSQL DATABASE_URL detected. Operating in local file-storage mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('🐘 [PostgreSQL] Connected successfully. Initializing database schema...');

      await client.query(`
        -- 1. Centralized Users & Authentication Table
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          salt VARCHAR(64) NOT NULL,
          pin_hash VARCHAR(255),
          role VARCHAR(32) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE
        );

        -- Add onboarding_completed column if not exists
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

        -- Index for fast lookup by username or email
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- 2. Centralized User Profiles & Settings
        CREATE TABLE IF NOT EXISTS user_profiles (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          theme VARCHAR(64) DEFAULT 'emerald',
          mode VARCHAR(32) DEFAULT 'student',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 3. Centralized User State & Sync Data Store (JSONB for rich flexible offline sync)
        CREATE TABLE IF NOT EXISTS user_sync_data (
          user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data JSONB NOT NULL,
          client_timestamp BIGINT,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          version INT DEFAULT 1
        );

        -- 4. Centralized Web Push Subscriptions Table
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          profile_id VARCHAR(64) NOT NULL,
          endpoint TEXT UNIQUE NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 5. Centralized Scheduled Alarms & Notifications Table
        CREATE TABLE IF NOT EXISTS scheduled_alarms (
          id VARCHAR(64) PRIMARY KEY,
          profile_id VARCHAR(64) NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          timestamp_ms BIGINT NOT NULL,
          tag VARCHAR(64),
          url TEXT,
          sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_alarms_pending ON scheduled_alarms(sent, timestamp_ms);
      `);

      isPostgresAvailable = true;
      console.log('✅ [PostgreSQL] All tables and indexes are ready.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ [PostgreSQL Schema Init Failed]:', err.message);
    isPostgresAvailable = false;
    return false;
  }
}

export function isPgConnected() {
  return isPostgresAvailable;
}

// ----------------------------------------------------------------------------
// User Operations
// ----------------------------------------------------------------------------

export async function pgCreateUser({ id, username, email, displayName, passwordHash, salt, pinHash, role = 'user', onboardingCompleted = false }) {
  if (!isPostgresAvailable) return null;
  const query = `
    INSERT INTO users (id, username, email, display_name, password_hash, salt, pin_hash, role, onboarding_completed)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, username, email, display_name AS "displayName", pin_hash AS "pinHash", role, created_at AS "createdAt", onboarding_completed AS "onboardingCompleted";
  `;
  const res = await pool.query(query, [id, username.toLowerCase(), email.toLowerCase(), displayName, passwordHash, salt, pinHash, role, Boolean(onboardingCompleted)]);
  return res.rows[0];
}

export async function pgFindUserByIdentifier(identifier) {
  if (!isPostgresAvailable) return null;
  const clean = identifier.toLowerCase().trim();
  const query = `
    SELECT id, username, email, display_name AS "displayName", password_hash AS "passwordHash",
           salt, pin_hash AS "pinHash", role, created_at AS "createdAt", last_login_at AS "lastLoginAt",
           COALESCE(onboarding_completed, FALSE) AS "onboardingCompleted"
    FROM users
    WHERE username = $1 OR email = $1
    LIMIT 1;
  `;
  const res = await pool.query(query, [clean]);
  return res.rows[0] || null;
}

export async function pgFindUserById(id) {
  if (!isPostgresAvailable) return null;
  const query = `
    SELECT id, username, email, display_name AS "displayName", password_hash AS "passwordHash",
           salt, pin_hash AS "pinHash", role, created_at AS "createdAt", last_login_at AS "lastLoginAt",
           COALESCE(onboarding_completed, FALSE) AS "onboardingCompleted"
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const res = await pool.query(query, [id]);
  return res.rows[0] || null;
}

export async function pgListUsers() {
  if (!isPostgresAvailable) return [];
  const query = `
    SELECT id, username, email, display_name AS "displayName", role, 
           (pin_hash IS NOT NULL) AS "hasPin",
           last_login_at AS "lastLoginAt",
           COALESCE(onboarding_completed, FALSE) AS "onboardingCompleted"
    FROM users
    ORDER BY created_at ASC;
  `;
  const res = await pool.query(query);
  return res.rows;
}

export async function pgUpdateUserLogin(id) {
  if (!isPostgresAvailable) return;
  await pool.query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
}

export async function pgUpdateUserPin(id, pinHash) {
  if (!isPostgresAvailable) return;
  await pool.query('UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2', [pinHash, id]);
}

export async function pgUpdateUserProfile(id, displayName, username, email, onboardingCompleted) {
  if (!isPostgresAvailable) return;
  if (onboardingCompleted !== undefined) {
    await pool.query(
      'UPDATE users SET display_name = $1, username = $2, email = $3, onboarding_completed = $4, updated_at = NOW() WHERE id = $5',
      [displayName, username.toLowerCase(), email ? email.toLowerCase() : '', Boolean(onboardingCompleted), id]
    );
  } else {
    await pool.query(
      'UPDATE users SET display_name = $1, username = $2, email = $3, updated_at = NOW() WHERE id = $4',
      [displayName, username.toLowerCase(), email ? email.toLowerCase() : '', id]
    );
  }
}

export async function pgSetUserOnboardingCompleted(id, completed = true) {
  if (!isPostgresAvailable) return;
  await pool.query('UPDATE users SET onboarding_completed = $1, updated_at = NOW() WHERE id = $2', [Boolean(completed), id]);
}

export async function pgCountUsers() {
  if (!isPostgresAvailable) return 0;
  const res = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  return res.rows[0]?.count || 0;
}

// ----------------------------------------------------------------------------
// User Sync Store Operations (Cloud State)
// ----------------------------------------------------------------------------

export async function pgSaveUserSyncData(userId, data, clientTimestamp) {
  if (!isPostgresAvailable) return null;
  try {
    await pool.query(
      `INSERT INTO users (id, username, email, display_name, password_hash, salt)
       VALUES ($1, $2, $3, $4, '', '')
       ON CONFLICT (id) DO NOTHING;`,
      [userId, `user_${userId}`, `${userId}@local.app`, userId]
    );
  } catch (_) {}

  const query = `
    INSERT INTO user_sync_data (user_id, data, client_timestamp, synced_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET data = EXCLUDED.data,
        client_timestamp = EXCLUDED.client_timestamp,
        synced_at = NOW(),
        version = user_sync_data.version + 1
    RETURNING user_id AS "userId", synced_at AS "syncedAt", version;
  `;
  const res = await pool.query(query, [userId, JSON.stringify(data), clientTimestamp]);
  return res.rows[0];
}

export async function pgGetUserSyncData(userId) {
  if (!isPostgresAvailable) return null;
  const query = `
    SELECT user_id AS "userId", data, client_timestamp AS "clientTimestamp", synced_at AS "syncedAt", version
    FROM user_sync_data
    WHERE user_id = $1
    LIMIT 1;
  `;
  const res = await pool.query(query, [userId]);
  return res.rows[0] || null;
}

// ----------------------------------------------------------------------------
// Push Subscriptions & Alarms in PostgreSQL
// ----------------------------------------------------------------------------

export async function pgSavePushSubscription(profileId, sub) {
  if (!isPostgresAvailable) return;
  const query = `
    INSERT INTO push_subscriptions (profile_id, endpoint, p256dh, auth)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (endpoint) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth;
  `;
  await pool.query(query, [profileId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]);
}

export async function pgGetAllPushSubscriptions() {
  if (!isPostgresAvailable) return {};
  const query = `SELECT profile_id, endpoint, p256dh, auth FROM push_subscriptions;`;
  const res = await pool.query(query);
  const map = {};
  for (const row of res.rows) {
    if (!map[row.profile_id]) map[row.profile_id] = [];
    map[row.profile_id].push({
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    });
  }
  return map;
}

export async function pgDeletePushSubscription(endpoint) {
  if (!isPostgresAvailable) return;
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

export async function pgSaveScheduledAlarm(alarm) {
  if (!isPostgresAvailable) return;
  const query = `
    INSERT INTO scheduled_alarms (id, profile_id, title, body, timestamp_ms, tag, url, sent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        body = EXCLUDED.body,
        timestamp_ms = EXCLUDED.timestamp_ms,
        tag = EXCLUDED.tag,
        url = EXCLUDED.url,
        sent = EXCLUDED.sent;
  `;
  await pool.query(query, [alarm.id, alarm.profileId, alarm.title, alarm.body, alarm.timestampMs, alarm.tag, alarm.url, alarm.sent || false]);
}

export async function pgGetPendingAlarms(nowMs) {
  if (!isPostgresAvailable) return [];
  const query = `
    SELECT id, profile_id AS "profileId", title, body, timestamp_ms AS "timestampMs", tag, url, sent
    FROM scheduled_alarms
    WHERE sent = FALSE AND timestamp_ms <= $1 AND $1 - timestamp_ms <= 3600000;
  `;
  const res = await pool.query(query, [nowMs]);
  return res.rows;
}

export async function pgMarkAlarmSent(id) {
  if (!isPostgresAvailable) return;
  await pool.query('UPDATE scheduled_alarms SET sent = TRUE, sent_at = NOW() WHERE id = $1', [id]);
}

export async function pgCancelScheduledAlarm(profileId, tag) {
  if (!isPostgresAvailable) return;
  if (profileId) {
    await pool.query('DELETE FROM scheduled_alarms WHERE profile_id = $1 AND tag = $2', [profileId, tag]);
  } else {
    await pool.query('DELETE FROM scheduled_alarms WHERE tag = $1', [tag]);
  }
}

export async function pgClearProfileUnsentAlarms(profileId) {
  if (!isPostgresAvailable) return;
  await pool.query('DELETE FROM scheduled_alarms WHERE profile_id = $1 AND sent = FALSE', [profileId]);
}
