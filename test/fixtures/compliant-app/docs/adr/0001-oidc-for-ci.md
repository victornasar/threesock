# 0001. Use OIDC for CI cloud access

## Status
Accepted

## Decision
CI assumes a deploy role through GitHub OIDC.

## Security considerations
No long-lived AWS keys exist in CI; the role is scoped to the deploy pipeline.
