ALTER TABLE users ADD COLUMN name text NOT NULL DEFAULT '';
-- Date of birth is encrypted at field level with pgcrypto and a KMS-managed key.
ALTER TABLE users ADD COLUMN date_of_birth_encrypted bytea;
