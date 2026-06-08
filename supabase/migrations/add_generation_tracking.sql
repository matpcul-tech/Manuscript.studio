-- Add monthly generation tracking to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS generation_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_reset_date timestamptz DEFAULT now();

-- Atomic increment function to avoid read-then-write race conditions
CREATE OR REPLACE FUNCTION increment_generation_count(uid uuid)
RETURNS void AS $$
  UPDATE subscriptions SET generation_count = generation_count + 1 WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update handle_new_user trigger to include new columns
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, plan, generation_count, generation_reset_date)
  VALUES (NEW.id, 'free', 'free', 0, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
