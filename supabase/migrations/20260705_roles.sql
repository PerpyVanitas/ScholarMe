-- Insert new roles into the roles table
INSERT INTO roles (name)
VALUES 
  ('president'),
  ('treasurer'),
  ('auditor'),
  ('finance_manager'),
  ('committee_head'),
  ('faculty_adviser'),
  ('super_admin')
ON CONFLICT (name) DO NOTHING;
