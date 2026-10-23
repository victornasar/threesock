// Dependency detection from manifests and imports.
import type { FileIndex } from '../../engine/types.js';
import { isProductionSource, isTestPath, isVendored } from './languages.js';
import { findAny } from '../util.js';

/** First manifest or production source line matching `re`. */
export function usesAny(files: FileIndex, re: RegExp) {
  const manifests = files.files.filter(
    (f) =>
      /(?:^|\/)(?:package\.json|requirements[^/]*\.txt|pyproject\.toml|Pipfile|go\.mod)$/.test(
        f.path,
      ) &&
      !isTestPath(f.path) &&
      !isVendored(f.path),
  );
  return (
    findAny(files, manifests, re) ??
    findAny(
      files,
      files.files.filter((f) => isProductionSource(f)),
      re,
    )
  );
}
