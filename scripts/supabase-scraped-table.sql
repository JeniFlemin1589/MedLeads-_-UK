-- Create the scraped_leads table for Doctify & GoPrivate data
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS scraped_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                     -- 'doctify' | 'goprivate'
  name TEXT NOT NULL,
  url TEXT UNIQUE,
  address TEXT,
  postcode TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  specialties TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',           -- ['weight-loss', 'hair', 'cosmetic', 'dental']
  rating NUMERIC,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB DEFAULT '{}'::jsonb
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_scraped_source ON scraped_leads(source);
CREATE INDEX IF NOT EXISTS idx_scraped_categories ON scraped_leads USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_scraped_name ON scraped_leads(name);
CREATE INDEX IF NOT EXISTS idx_scraped_postcode ON scraped_leads(postcode);

-- Enable Row Level Security (allow all reads, restrict writes)
ALTER TABLE scraped_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON scraped_leads
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON scraped_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON scraped_leads
  FOR UPDATE USING (true);
