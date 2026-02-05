CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  denomination TEXT,
  address TEXT,
  phone TEXT,
  senior_pastor TEXT,
  founded_year INTEGER,
  member_count INTEGER DEFAULT 0,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'basic', 'standard', 'premium')),
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_churches_name ON churches(name);
CREATE INDEX idx_churches_subdomain ON churches(subdomain);
