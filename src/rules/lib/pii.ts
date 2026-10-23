// Does the repository handle personal data? Privacy rules that inspect code
// report not applicable when it does not, instead of failing.
import type { FileIndex, RepoFile } from '../../engine/types.js';
import { findAny } from '../util.js';
import { isProductionSource, isTestPath, isVendored } from './languages.js';

const SCHEMA =
  /\.(?:sql|prisma|graphqls?)$|(?:^|\/)(?:models?|schemas?|entities|migrations?)\/|models\.py$/;
const PII_FIELD =
  /\b(?:email|e_mail|phone(?:_?number)?|first_?name|last_?name|full_?name|date_of_birth|birth_?date|dob|street_?address|postal_?code|zip_?code|ssn|passport)\b\s*(?:[:=(]|varchar|text|string|String|citext|Column|Field|\?)/i;

export function personalDataFiles(files: FileIndex): RepoFile[] {
  return files.files.filter(
    (f) =>
      (SCHEMA.test(f.path) || isProductionSource(f)) && !isTestPath(f.path) && !isVendored(f.path),
  );
}

const cache = new WeakMap<FileIndex, { path: string; line: number } | null>();

/** First schema or source line that defines a personal-data field, if any. */
export function personalData(files: FileIndex): { path: string; line: number } | undefined {
  if (cache.has(files)) return cache.get(files) ?? undefined;
  const hit = findAny(files, personalDataFiles(files), PII_FIELD);
  cache.set(files, hit ?? null);
  return hit;
}

export const NO_PERSONAL_DATA =
  'No personal-data fields (email, name, phone, address, date of birth, ...) were found in schemas or source.';
