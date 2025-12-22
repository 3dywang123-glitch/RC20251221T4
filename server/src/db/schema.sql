-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  occupation VARCHAR(255),
  bio TEXT,
  age VARCHAR(50),
  avatar_b64 TEXT,
  additional_images TEXT[], -- Array of base64 images
  social_links TEXT,
  ai_model_preference VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
  analysis_model_preference VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
  api_endpoint VARCHAR(255) DEFAULT 'https://hnd1.aihub.zeabur.ai/',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Target profiles table
CREATE TABLE IF NOT EXISTS target_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  occupation VARCHAR(255),
  bio TEXT,
  age VARCHAR(50),
  avatar_b64 TEXT,
  additional_images TEXT[],
  social_links TEXT,
  general_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personality reports table
CREATE TABLE IF NOT EXISTS personality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES target_profiles(id) ON DELETE CASCADE,
  big_five JSONB,
  mbti VARCHAR(10),
  emotional_stability INTEGER,
  core_interests TEXT[],
  communication_style TEXT,
  summary TEXT,
  dating_advice TEXT,
  avatar_analysis TEXT,
  data_sufficiency INTEGER,
  generated_at BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social analysis results table
CREATE TABLE IF NOT EXISTS social_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES target_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform VARCHAR(100),
  handle VARCHAR(255),
  timeframe VARCHAR(100),
  executive_summary TEXT,
  report_tags TEXT[],
  basic_profile TEXT,
  work_lifestyle TEXT,
  key_focus_elements TEXT,
  love_intentions TEXT,
  personality_analysis TEXT,
  personality_keywords TEXT[],
  persona_analysis TEXT,
  performance_analysis TEXT,
  psychological_profile TEXT,
  approach_strategy TEXT,
  metrics JSONB,
  report TEXT,
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social post analysis table
CREATE TABLE IF NOT EXISTS social_post_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES target_profiles(id) ON DELETE CASCADE,
  content TEXT,
  images TEXT[],
  analysis TEXT,
  suggested_replies TEXT[],
  tags TEXT[],
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship reports table
CREATE TABLE IF NOT EXISTS relationship_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES target_profiles(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  status_assessment TEXT,
  partner_personality_analysis TEXT,
  green_flags TEXT[],
  red_flags TEXT[],
  communication_dos TEXT[],
  communication_donts TEXT[],
  magic_topics TEXT[],
  strategy TEXT,
  date_ideas JSONB,
  ice_breakers TEXT[],
  tags TEXT[],
  goal_context TEXT,
  generated_at BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES target_profiles(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'user' or 'target'
  text TEXT NOT NULL,
  insight TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V2 Schema Updates and Additions

-- Add gender field to target_profiles
ALTER TABLE target_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'Unknown';

-- Update social_analysis_results for v2 structure
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS surface_subtext TEXT;
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS persona_impression TEXT;
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS performance_purpose TEXT;
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS suggested_replies TEXT[];
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS input_images TEXT[];
ALTER TABLE social_analysis_results ADD COLUMN IF NOT EXISTS input_note TEXT;

-- Update social_post_analysis for v2 structure
ALTER TABLE social_post_analysis ADD COLUMN IF NOT EXISTS input_note TEXT;

-- Update personality_reports for v2 structure
ALTER TABLE personality_reports ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update relationship_reports for v2 structure
ALTER TABLE relationship_reports ADD COLUMN IF NOT EXISTS archived_input JSONB;

-- Create smart_analysis_cache table for caching classification results
CREATE TABLE IF NOT EXISTS smart_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_hash VARCHAR(64) UNIQUE,
  type VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  extracted_profile JSONB,
  avatar_box INTEGER[],
  avatar_source_index INTEGER,
  analysis_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_target_profiles_user_id ON target_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_reports_target_id ON personality_reports(target_id);
CREATE INDEX IF NOT EXISTS idx_social_analysis_target_id ON social_analysis_results(target_id);
CREATE INDEX IF NOT EXISTS idx_social_post_target_id ON social_post_analysis(target_id);
CREATE INDEX IF NOT EXISTS idx_relationship_reports_user_target ON relationship_reports(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_target ON chat_messages(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_analysis_hash ON smart_analysis_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_smart_analysis_user ON smart_analysis_cache(user_id);
