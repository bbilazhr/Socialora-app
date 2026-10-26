import pg from 'pg';

pg.types.setTypeParser(20, (v) => Number(v)); // BIGINT -> number
pg.types.setTypeParser(1082, (v) => v); // DATE -> 'YYYY-MM-DD' (tanpa geser timezone)

const url = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(url);

export const pool = new pg.Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const q = (text, params) => pool.query(text, params);

export async function insertRow(table, data) {
  const k = Object.keys(data);
  const r = await q(
    `INSERT INTO ${table} (${k.join(',')}) VALUES (${k.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`,
    k.map((x) => data[x])
  );
  return r.rows[0];
}

export async function updateRow(table, id, data) {
  const k = Object.keys(data);
  if (!k.length) return (await q(`SELECT * FROM ${table} WHERE id=$1`, [id])).rows[0];
  const r = await q(
    `UPDATE ${table} SET ${k.map((x, i) => `${x}=$${i + 1}`).join(',')} WHERE id=$${k.length + 1} RETURNING *`,
    [...k.map((x) => data[x]), id]
  );
  return r.rows[0];
}

export async function init() {
  await q(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      username VARCHAR(60) UNIQUE NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'User' CHECK (role IN ('Admin','User')),
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      color VARCHAR(9) NOT NULL DEFAULT '#2563eb',
      logo TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS user_brands (
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, brand_id)
    );
    CREATE TABLE IF NOT EXISTS contents (
      id SERIAL PRIMARY KEY,
      brand_id INT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      holiday TEXT,
      title TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'On Brief',
      platforms TEXT[] NOT NULL DEFAULT '{}',
      format VARCHAR(40),
      pillar VARCHAR(40),
      result TEXT,
      file_link TEXT,
      caption TEXT,
      brief TEXT,
      reference TEXT,
      link_post TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_contents_brand_date ON contents(brand_id, date);
    CREATE TABLE IF NOT EXISTS insights (
      id SERIAL PRIMARY KEY,
      brand_id INT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      platform VARCHAR(20) NOT NULL,
      date DATE NOT NULL,
      title TEXT NOT NULL,
      content_type VARCHAR(40),
      likes BIGINT NOT NULL DEFAULT 0,
      comments BIGINT NOT NULL DEFAULT 0,
      shares BIGINT NOT NULL DEFAULT 0,
      views BIGINT NOT NULL DEFAULT 0,
      reposts BIGINT NOT NULL DEFAULT 0,
      saves BIGINT NOT NULL DEFAULT 0,
      followers_gain BIGINT NOT NULL DEFAULT 0,
      link TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_insights_brand ON insights(brand_id, platform, date);
  `);
}
