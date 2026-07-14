-- Migration: Hash existing plaintext PINs in auth_cards using pgcrypto

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth_cards
SET pin = crypt(pin, gen_salt('bf', 10))
WHERE pin NOT LIKE '$2a$%' AND pin NOT LIKE '$2b$%';
