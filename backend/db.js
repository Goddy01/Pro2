import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Schema reference – submitted data must map only to these columns:
 *
 * articles: title, image, content, category, author
 * gallery_images: image_url, caption, sort_order
 * events: slug, title, description
 * event_images: event_id, image_url, sort_order
 * podcast_episodes: title, description, duration_label, guests, audio_url, video_url, thumbnail_url
 * watch_videos: title, video_id, video_url, duration_label, sort_order
 * work_with_us: name, phone, email, introduction
 * newsletter_signups: name, email, cell
 * admin: username, password_hash
 */

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'Features',
        author TEXT DEFAULT 'Sideline Sports & Entertainment Team',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS work_with_us (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(254) NOT NULL,
        introduction TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        caption TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_images (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS podcast_episodes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        duration_label VARCHAR(50),
        guests TEXT,
        audio_url TEXT,
        video_url TEXT,
        thumbnail_url TEXT,
        show_name VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS watch_videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        video_id VARCHAR(20),
        video_url TEXT,
        duration_label VARCHAR(50) DEFAULT 'Video',
        sort_order INT DEFAULT 0,
        show_name VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS newsletter_signups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(254) NOT NULL,
        cell VARCHAR(30) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE podcast_episodes ADD COLUMN IF NOT EXISTS show_name VARCHAR(200);
      ALTER TABLE watch_videos ADD COLUMN IF NOT EXISTS show_name VARCHAR(200);
    `);
    // Seed 3 test submissions when table is empty (for testing)
    const { rows: countRows } = await client.query('SELECT COUNT(*) AS c FROM work_with_us');
    if (Number(countRows[0]?.c) === 0) {
      await client.query(`
        INSERT INTO work_with_us (name, phone, email, introduction) VALUES
        ('Jordan Smith', '+1 (555) 123-4567', 'jordan.smith@example.com', 'I am a sports producer with 8 years of experience covering college and professional athletics. I would love to bring my production skills and storytelling to Sideline Sports & Entertainment. I have experience with live events, documentaries, and social content.'),
        ('Maria Chen', '(555) 987-6543', 'maria.chen@example.com', 'Hi, I am a recent grad in broadcast journalism and a huge fan of your podcast. I am looking for an opportunity to work in sports media and believe I could contribute to your team with my writing and on-camera experience. I am based in the city and available to start immediately.'),
        ('David Okonkwo', '555-222-3333', 'david.o@example.com', 'I have been following Sideline for years and would be excited to join as a content or operations role. I have background in event coordination and digital marketing. I am organized, detail-oriented, and passionate about sports and entertainment. Looking forward to connecting.')
      `);
    }
  } finally {
    client.release();
  }
}

export default pool;
