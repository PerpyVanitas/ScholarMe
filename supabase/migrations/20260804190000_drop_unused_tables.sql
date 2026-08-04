-- Migration: 20260804190000_drop_unused_tables.sql
-- Description: Drop confirmed 9 unused legacy database tables per ScholarMe AI Development Ruleset v2 (Rule B3 & Audit Section 19)

DROP TABLE IF EXISTS election_candidates CASCADE;
DROP TABLE IF EXISTS election_votes CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS finance_audit_findings CASCADE;
DROP TABLE IF EXISTS physical_books CASCADE;
DROP TABLE IF EXISTS ratelimit_windows CASCADE;
DROP TABLE IF EXISTS tutor_peer_reviews CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS user_uploads CASCADE;
