// Searching CI configuration for tools and steps.
import type { FileIndex } from '../../engine/types.js';
import { findAny } from '../util.js';
import { ciConfigs } from './build-files.js';

/** First CI config line matching `re` (any provider). */
export function inCi(files: FileIndex, re: RegExp): { path: string; line: number } | undefined {
  return findAny(files, ciConfigs(files), re);
}

export const SBOM_TOOLS =
  /\bsyft\b|anchore\/sbom-action|cyclonedx|\bspdx\b|(?:npm|pnpm)\s+sbom|--sbom\b|buildx[^\n]*\bsbom\b/i;
