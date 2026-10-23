CREATE TABLE customers (
  id serial PRIMARY KEY,
  email text,
  ssn text,
  deleted_at timestamptz
);
