// Files that run commands at build or deploy time: CI configs, Dockerfiles, scripts.
import type { FileIndex, RepoFile } from '../../engine/types.js';
import { isTestPath, isVendored } from './languages.js';

export const DOCKERFILE = /(?:^|\/)(?:Dockerfile|Containerfile)(?:\.[^/]+)?$|\.Dockerfile$/;
const BUILD =
  /^\.github\/workflows\/[^/]+\.ya?ml$|(?:^|\/)(?:\.gitlab-ci\.yml|Jenkinsfile|azure-pipelines\.ya?ml|bitbucket-pipelines\.yml|cloudbuild\.ya?ml|Makefile|justfile|Taskfile\.ya?ml)$|^\.circleci\/config\.yml$|^\.buildkite\/|\.sh$/;

export function buildFiles(files: FileIndex): RepoFile[] {
  return files.files.filter(
    (f) =>
      (BUILD.test(f.path) || DOCKERFILE.test(f.path)) && !isTestPath(f.path) && !isVendored(f.path),
  );
}

export function dockerfiles(files: FileIndex): RepoFile[] {
  return files.files.filter(
    (f) => DOCKERFILE.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
  );
}

/** Files that configure CI on any common provider. */
export function ciConfigs(files: FileIndex): RepoFile[] {
  return files.files.filter((f) =>
    /^\.github\/workflows\/[^/]+\.ya?ml$|^(?:\.gitlab-ci\.yml|Jenkinsfile|azure-pipelines\.ya?ml|bitbucket-pipelines\.yml|cloudbuild\.ya?ml)$|^\.circleci\/config\.yml$|^\.buildkite\/pipeline\.ya?ml$/.test(
      f.path,
    ),
  );
}
