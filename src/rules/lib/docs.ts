// Finding process documentation (runbooks, policies) in the repository.
import type { FileIndex, RepoFile } from '../../engine/types.js';
import { isTestPath, isVendored } from './languages.js';
import { findAny } from '../util.js';

export function docFiles(files: FileIndex): RepoFile[] {
  return files.files.filter(
    (f) =>
      /\.(?:md|mdx|rst|adoc|txt)$/i.test(f.path) &&
      !isTestPath(f.path) &&
      !isVendored(f.path) &&
      !/^docs\/rubric\//.test(f.path) &&
      !/(?:^|\/)CHANGELOG/i.test(f.path),
  );
}

/** First doc whose text matches `re`. Docs in docs/, runbooks/ and .github/ are searched first. */
export function findDoc(files: FileIndex, re: RegExp): { path: string; line: number } | undefined {
  const docs = docFiles(files).sort(
    (a, b) =>
      Number(!/^(?:docs|runbooks?|ops|\.github)\//i.test(a.path)) -
      Number(!/^(?:docs|runbooks?|ops|\.github)\//i.test(b.path)),
  );
  return findAny(files, docs, re);
}
