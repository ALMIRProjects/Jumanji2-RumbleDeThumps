CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 16),
  score integer NOT NULL CHECK (score >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON high_scores TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_high_scores" ON high_scores;
CREATE POLICY "anon_select_high_scores" ON high_scores
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_high_scores" ON high_scores;
CREATE POLICY "anon_insert_high_scores" ON high_scores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS high_scores_score_idx ON high_scores (score DESC);
