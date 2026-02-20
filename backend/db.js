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
 * team_members: name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order
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

      CREATE TABLE IF NOT EXISTS gallery_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        cover_image_url TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        caption TEXT,
        sort_order INT DEFAULT 0,
        category_id INT REFERENCES gallery_categories(id) ON DELETE SET NULL,
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

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        role VARCHAR(300),
        bio TEXT,
        image TEXT,
        social_x TEXT,
        social_youtube TEXT,
        social_tiktok TEXT,
        social_instagram TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorship_inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        business_name VARCHAR(300) NOT NULL,
        email VARCHAR(254) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        tier VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorship_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        price INT NOT NULL DEFAULT 0,
        tagline VARCHAR(500),
        accent VARCHAR(200) DEFAULT 'from-offwhite/20 via-offwhite/5 to-transparent',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorship_benefits (
        id SERIAL PRIMARY KEY,
        tier_id INT NOT NULL REFERENCES sponsorship_tiers(id) ON DELETE CASCADE,
        benefit_text TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorship_banner (
        id SERIAL PRIMARY KEY,
        image_url TEXT,
        link_url TEXT,
        enabled BOOLEAN DEFAULT false,
        sponsor_name TEXT,
        show_until TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE sponsorship_banner ADD COLUMN IF NOT EXISTS sponsor_name TEXT;
      ALTER TABLE sponsorship_banner ADD COLUMN IF NOT EXISTS show_until TIMESTAMPTZ;
      ALTER TABLE sponsorship_banner ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE podcast_episodes ADD COLUMN IF NOT EXISTS show_name VARCHAR(200);
      ALTER TABLE watch_videos ADD COLUMN IF NOT EXISTS show_name VARCHAR(200);
      ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS category_id INT REFERENCES gallery_categories(id) ON DELETE SET NULL;
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
    // Seed static events when table is empty (migrated from frontend data/events.ts)
    const { rows: eventCountRows } = await client.query('SELECT COUNT(*) AS c FROM events');
    if (Number(eventCountRows[0]?.c) === 0) {
      await client.query(`
        INSERT INTO events (slug, title, description) VALUES
        ('vincent-country', 'Vincent Country Community Event', 'Coverage from the Vincent Country Community Event with NFL Executive & Former Player Troy Vincent.'),
        ('rmh', 'Ronald McDonald House Charities', 'The Impact of Ronald McDonald House with Marnie Schneider & CEO Grace McIntosh.')
      `);
      const { rows: eventIds } = await client.query('SELECT id, slug FROM events ORDER BY slug');
      const vincentId = eventIds.find((r) => r.slug === 'vincent-country')?.id;
      const rmhId = eventIds.find((r) => r.slug === 'rmh')?.id;
      if (vincentId) {
        const urls = [
          '/Vincent Country Community Event/6363A555-5876-4F69-960D-6A0D6DC5756E.jpg',
          '/Vincent Country Community Event/6486642B-72B4-4E55-B0B0-E2AED370FCF7.jpg',
          '/Vincent Country Community Event/95280CF9-D7FC-4245-9B0B-2D6AC194BAF6.jpg',
        ];
        for (let i = 0; i < urls.length; i++) {
          await client.query('INSERT INTO event_images (event_id, image_url, sort_order) VALUES ($1, $2, $3)', [vincentId, urls[i], i]);
        }
      }
      if (rmhId) {
        const urls = [
          '/RMH Event/rmh2.png',
          '/RMH Event/IMG_8595.PNG',
          '/RMH Event/F1793232-1BA8-41C6-BD1C-5727EFCA5B80.jpeg',
          '/RMH Event/IMG_2562.png',
          '/RMH Event/IMG_8597.png',
          '/RMH Event/IMG_8600.png',
          '/RMH Event/IMG_8610.png',
          '/RMH Event/IMG_8614.png',
          '/RMH Event/IMG_8616.png',
          '/RMH Event/IMG_8617.png',
          '/RMH Event/IMG_8622.png',
          '/RMH Event/IMG_8640.png',
          '/RMH Event/IMG_8643.png',
          '/RMH Event/rmh1.png',
        ];
        for (let i = 0; i < urls.length; i++) {
          await client.query('INSERT INTO event_images (event_id, image_url, sort_order) VALUES ($1, $2, $3)', [rmhId, urls[i], i]);
        }
      }
    }
    // Seed team members when table is empty (migrated from Team.tsx static data)
    const { rows: teamCountRows } = await client.query('SELECT COUNT(*) AS c FROM team_members');
    if (Number(teamCountRows[0]?.c) === 0) {
      await client.query(`
        INSERT INTO team_members (name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order) VALUES
        ('J.B. Ellis', 'Founder and CEO', 'J.B. Ellis is an American sports media personality, host, and interviewer known for his energetic style and passion for competition. A leading voice on Sideline Sports & Entertainment, he co-hosts Sideline Sports and leads original programs including Cubfidential and J & J Sports Express. Ellis has covered six Super Bowls and is credentialed with the NFL, NBA, and MLB, providing firsthand insight from major sporting events. He previously created and hosted The PROgram on the Bleav Network.', '/JB-ELLIS.jpg', 'https://x.com/jb_theprogram', NULL, NULL, 'https://www.instagram.com/sidelinesports_j.b.ellis', 0),
        ('Jon Shearer', 'Co Founder & Multimedia Journalist, Photographer ', 'With over a decade in sports media, Jon Shearer has covered six Super Bowls while building a reputation for factual hot takes and high-impact storytelling. As a professional sports photographer, he doesn''t just analyze the moments—he captures them. Jon is dedicated to community-focused charitable work and elevating the culture of sports.', '/JON-SHEARER.jpg', NULL, NULL, NULL, 'https://www.instagram.com/jonshearer_media', 1),
        ('Jay Nelson', 'Sports Personality & Media Executive', 'Jay Nelson, aka "Denzel Snipes," (born Jamon La Roi Nelson) is a Sideline Sports personality and media executive. A 12-year U.S. Air Force veteran with multiple duty stations and deployments, he earned a BS in Convergence Journalism from Abilene Christian University. Nelson has covered major live events including the NFL Hall of Fame and multiple Super Bowls. He currently produces and/or co-hosts six shows and serves as President of Production for the network.', '/JAY.jpg', NULL, NULL, NULL, 'https://www.instagram.com/unconv3ntionalking13', 2),
        ('James Tatum', 'Director of Content & Media Operations', 'James Tatum is a multimedia sports journalist and media executive with Sideline Sports & Entertainment, overseeing content strategy, video production, website management, and talent recruitment. A first-generation graduate driven by passion and determination, he has covered major events across the NFL, MLB, and Premier League. From interviewing athletes and executives to delivering in-depth analysis, feature stories, and digital content, James brings energy and insight to every platform, blending on-camera presence with strong writing and leadership skills to build an authentic, impactful sports media brand.', '/JAMES-TATUM.jpg', 'https://x.com/JTP0V', 'https://www.youtube.com/@jtpointofview', 'https://www.tiktok.com/@jtpointofview', 'https://www.instagram.com/jtpov_', 3),
        ('Will Peralta', 'Multimedia Photographer', 'Will Peralta is a Multimedia Photographer for Sideline Sports & Entertainment, covering professional sports and entertainment events. He has photographed the NBA, NFL, MLB, and major artists, focusing on capturing authentic moments that reflect the atmosphere and story of each client and event.', '/WILL-PERALTA.jpg', NULL, NULL, 'https://www.tiktok.com/@will_media_peralta?_r=1&_t=ZP-93riibpsdF0', 'https://www.instagram.com/will_media_peralta', 4)
      `);
    }
    // Seed sponsorship tiers when empty (from original PACKAGES)
    const { rows: tierCount } = await client.query('SELECT COUNT(*) AS c FROM sponsorship_tiers');
    if (Number(tierCount[0]?.c) === 0) {
      await client.query(`
        INSERT INTO sponsorship_tiers (name, slug, price, tagline, accent, sort_order) VALUES
        ('Platinum Sponsor', 'platinum', 2000, 'Maximum visibility and category exclusivity.', 'from-lime/40 via-lime/20 to-transparent', 0),
        ('Gold Sponsor', 'gold', 1500, 'Strong brand placement with recurring feature mentions.', 'from-amber-400/30 via-amber-400/10 to-transparent', 1),
        ('Silver Sponsor', 'silver', 1000, 'Consistent exposure with on-air engagement.', 'from-offwhite/20 via-offwhite/5 to-transparent', 2),
        ('Bronze Sponsor', 'bronze', 750, 'Affordable brand visibility with direct audience reach.', 'from-amber-700/30 via-amber-700/10 to-transparent', 3)
      `);
      const { rows: tierIds } = await client.query('SELECT id, slug FROM sponsorship_tiers ORDER BY sort_order');
      const benefitsBySlug = {
        platinum: [
          'Business name featured in the show title: "Sideline Sports presented by [Your Business Name]"',
          'Three (3) 30-second commercial spots per episode',
          'Exclusive 20-minute in-show guest interview',
          'First priority for on-location appearances at live events',
          'Premium brand integration throughout the show',
        ],
        gold: [
          'Segment naming rights: "Quick Hits brought to you by [Your Business Name]"',
          'Two (2) 30-second commercial spots per episode',
          '10-minute guest interview opportunity',
          'Second priority for live event appearances',
        ],
        silver: [
          'Two (2) 30-second commercial spots per episode',
          '5-minute guest interview opportunity',
          'Third priority for live event appearances',
        ],
        bronze: [
          'Business name featured on bottom ticker during show',
          'One (1) 30-second commercial spot per episode',
          'Fourth priority for live event appearances',
        ],
      };
      for (const t of tierIds) {
        const benefits = benefitsBySlug[t.slug] || [];
        for (let i = 0; i < benefits.length; i++) {
          await client.query('INSERT INTO sponsorship_benefits (tier_id, benefit_text, sort_order) VALUES ($1, $2, $3)', [t.id, benefits[i], i]);
        }
      }
      await client.query('INSERT INTO sponsorship_banner (image_url, link_url, enabled) VALUES (NULL, NULL, false)');
    }
    // Ensure banner row exists (for DBs created before the tier seed)
    const { rows: bannerCount } = await client.query('SELECT COUNT(*) AS c FROM sponsorship_banner');
    if (Number(bannerCount[0]?.c) === 0) {
      await client.query('INSERT INTO sponsorship_banner (image_url, link_url, enabled) VALUES (NULL, NULL, false)');
    }
  } finally {
    client.release();
  }
}

export default pool;
