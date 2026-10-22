# insecure-app

Deliberately insecure fixture for threesock tests. `dot.env` becomes `.env` and double-brace secret placeholders
are replaced with fake, randomly shaped values at test time so no
secret-looking string is ever committed.
