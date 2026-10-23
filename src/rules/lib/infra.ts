// What kind of infrastructure a repository defines.
import type { FileIndex, RepoFile } from '../../engine/types.js';
import { isTestPath, isVendored } from './languages.js';
import { dockerfiles } from './build-files.js';

const K8S_KIND = /^kind:\s*(?:Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod|ReplicaSet)\s*$/m;

function prod(files: FileIndex): RepoFile[] {
  return files.files.filter((f) => !isTestPath(f.path) && !isVendored(f.path));
}

export function terraformFiles(files: FileIndex): RepoFile[] {
  return prod(files).filter((f) => f.path.endsWith('.tf'));
}

export function cloudFormationFiles(files: FileIndex): RepoFile[] {
  return prod(files).filter(
    (f) =>
      /\.(?:ya?ml|json)$/.test(f.path) &&
      /AWSTemplateFormatVersion|AWS::[A-Za-z0-9]+::/.test(files.read(f.path) ?? ''),
  );
}

/** Kubernetes workload manifests (Helm templates are skipped: they are not valid YAML). */
export function k8sWorkloads(files: FileIndex): RepoFile[] {
  return prod(files).filter(
    (f) =>
      /\.ya?ml$/.test(f.path) &&
      !/(?:^|\/)templates\//.test(f.path) &&
      K8S_KIND.test(files.read(f.path) ?? ''),
  );
}

export function composeFiles(files: FileIndex): RepoFile[] {
  return prod(files).filter((f) => /(?:^|\/)(?:docker-)?compose(?:\.[\w-]+)?\.ya?ml$/.test(f.path));
}

export function hasIac(files: FileIndex): boolean {
  return (
    terraformFiles(files).length > 0 ||
    cloudFormationFiles(files).length > 0 ||
    k8sWorkloads(files).length > 0 ||
    dockerfiles(files).length > 0
  );
}
