-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Occasions table
CREATE TABLE IF NOT EXISTS occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  emoji VARCHAR(10),
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  lora_model_id VARCHAR(255),
  seasonal_start VARCHAR(10),
  seasonal_end VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  card_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id),
  occasion VARCHAR(255) NOT NULL,
  style VARCHAR(255),
  front_text TEXT NOT NULL,
  front_image_url VARCHAR(500),
  inside_text TEXT NOT NULL,
  inside_image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  quality_score DECIMAL(3,2),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Styles table
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  emoji VARCHAR(10),
  category VARCHAR(100),
  color VARCHAR(7),
  training_status VARCHAR(50) DEFAULT 'pending',
  popularity_score INTEGER DEFAULT 0,
  style_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Training Jobs table
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  style_pack_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  images_urls TEXT[] DEFAULT '{}',
  trigger_word VARCHAR(50),
  epochs INTEGER DEFAULT 100,
  learning_rate DECIMAL(6,5) DEFAULT 0.0001,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Media Items table
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(500) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100),
  size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_cards_occasion ON cards(occasion);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_batch_id ON cards(batch_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_occasions_slug ON occasions(slug);

-- Insert Sample Occasions
INSERT INTO occasions (name, slug, category, emoji, color, is_active)
VALUES 
  ('Birthday', 'birthday', 'celebration', '🎂', '#FF6B6B', true),
  ('Anniversary', 'anniversary', 'celebration', '💑', '#FF69B4', true),
  ('Wedding', 'wedding', 'celebration', '💍', '#FFD700', true),
  ('Thank You', 'thank-you', 'gratitude', '🙏', '#87CEEB', true),
  ('Congratulations', 'congratulations', 'celebration', '🎉', '#98D8C8', true),
  ('Get Well', 'get-well', 'care', '💚', '#90EE90', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Styles
INSERT INTO styles (name, slug, emoji, category, color, training_status)
VALUES
  ('Watercolor', 'watercolor', '🎨', 'effect', '#ADD8E6', 'trained'),
  ('Oil Painting', 'oil-painting', '🖼️', 'effect', '#8B4513', 'trained'),
  ('Illustration', 'illustration', '✏️', 'style', '#FFB6C1', 'trained'),
  ('Minimalist', 'minimalist', '⚫', 'style', '#2C3E50', 'trained'),
  ('Vintage', 'vintage', '📷', 'effect', '#D2B48C', 'trained')
ON CONFLICT (slug) DO NOTHING;
