## What and why

<!-- What does this change, and why? Link the issue. -->

## Security impact

- [ ] No change to what threesock reads, writes or sends over the network
- [ ] No secret value (beyond its first 4 characters) can reach any output, log or report
- [ ] New or changed rules cite evidence for every `pass`, and say `unknown` when they can't tell
- [ ] New dependencies are justified below (or there are none)

<!-- If any box is unchecked, explain here. -->

## Testing

- [ ] `pnpm run check` passes
- [ ] Golden report and snapshots updated and reviewed (`UPDATE_GOLDEN=1 pnpm exec vitest run -u`)
- [ ] `CHANGELOG.md` updated
