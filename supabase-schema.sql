-- Run this SQL in Supabase SQL Editor after creating your project

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Credits/points table
CREATE TABLE credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  balance INT DEFAULT 0,
  total_purchased INT DEFAULT 0,
  total_used INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions log
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount INT NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')) NOT NULL,
  description TEXT DEFAULT '',
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (Paddle payments)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  paddle_order_id TEXT,
  paddle_transaction_id TEXT,
  amount_cents INT NOT NULL,
  credits INT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Registration IP limit table (one registration per IP per day)
CREATE TABLE registration_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT
);

-- Indexes
CREATE INDEX idx_credits_user ON credits(user_id);
CREATE INDEX idx_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_paddle ON orders(paddle_transaction_id);
CREATE INDEX idx_registration_ips_ip_date ON registration_ips(ip, registered_at);
