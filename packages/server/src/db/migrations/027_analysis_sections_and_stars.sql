-- Phase B2: Analysis Result Enhancement
-- Add structured sections JSON to analyses + analysis_stars table

ALTER TABLE analyses ADD COLUMN result_sections_json TEXT;

CREATE TABLE IF NOT EXISTS analysis_stars (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_stars_analysis ON analysis_stars(analysis_id);
