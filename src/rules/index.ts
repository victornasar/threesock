// Rule registry. Add new rules here after creating them under src/rules/<criterion>/.
import type { Rule } from '../engine/types.js';
import { codeowners } from './cc1.3/codeowners.js';
import { securityPolicy } from './cc2.3/security-policy.js';
import { actionsPinned } from './cc5.2/actions-pinned.js';
import { cloudCredentials } from './cc5.2/cloud-credentials.js';
import { deployEnvironments } from './cc5.2/deploy-environments.js';
import { pullRequestTarget } from './cc5.2/pull-request-target.js';
import { scriptInjection } from './cc5.2/script-injection.js';
import { secretsInLogs } from './cc5.2/secrets-in-logs.js';
import { workflowPermissions } from './cc5.2/workflow-permissions.js';
import { cookieFlags } from './cc6.1/cookie-flags.js';
import { envFiles } from './cc6.1/env-files.js';
import { genericPassword } from './cc6.1/generic-password.js';
import { hardcodedSecrets } from './cc6.1/hardcoded-secrets.js';
import { iamWildcard } from './cc6.1/iam-wildcard.js';
import { jwtVerification } from './cc6.1/jwt-verification.js';
import { passwordHashing } from './cc6.1/password-hashing.js';
import { publicDatastore } from './cc6.1/public-datastore.js';
import { secretScanning } from './cc6.1/secret-scanning.js';
import { corsCredentials } from './cc6.6/cors-credentials.js';
import { dangerousExecution } from './cc6.6/dangerous-execution.js';
import { openAdminPorts } from './cc6.6/open-admin-ports.js';
import { publicBuckets } from './cc6.6/public-buckets.js';
import { rateLimiting } from './cc6.6/rate-limiting.js';
import { securityHeaders } from './cc6.6/security-headers.js';
import { sqlStringBuilding } from './cc6.6/sql-string-building.js';
import { xssSinks } from './cc6.6/xss-sinks.js';
import { plainHttpUrls } from './cc6.7/plain-http-urls.js';
import { tlsVerification } from './cc6.7/tls-verification.js';
import { weakTlsCrypto } from './cc6.7/weak-tls-crypto.js';
import { baseImages } from './cc6.8/base-images.js';
import { containerScanning } from './cc6.8/container-scanning.js';
import { curlPipeShell } from './cc6.8/curl-pipe-shell.js';
import { dependencyScanning } from './cc6.8/dependency-scanning.js';
import { lockfiles } from './cc6.8/lockfiles.js';
import { reproducibleInstalls } from './cc6.8/reproducible-installs.js';
import { ciOnPullRequests } from './cc8.1/ci-on-pull-requests.js';
import { codeownersSensitivePaths } from './cc8.1/codeowners-sensitive-paths.js';
import { emergencyChange } from './cc8.1/emergency-change.js';
import { migrationsReversible } from './cc8.1/migrations-reversible.js';
import { rollbackProcedure } from './cc8.1/rollback-procedure.js';
import { terraformState } from './cc8.1/terraform-state.js';

export const RULES: readonly Rule[] = [
  // CC1.3 / CC2.3
  codeowners,
  securityPolicy,
  // CC5.2 CI hardening
  actionsPinned,
  cloudCredentials,
  deployEnvironments,
  pullRequestTarget,
  scriptInjection,
  secretsInLogs,
  workflowPermissions,
  // CC6.1 logical access
  cookieFlags,
  envFiles,
  genericPassword,
  hardcodedSecrets,
  iamWildcard,
  jwtVerification,
  passwordHashing,
  publicDatastore,
  secretScanning,
  // CC6.6 external threats
  corsCredentials,
  dangerousExecution,
  openAdminPorts,
  publicBuckets,
  rateLimiting,
  securityHeaders,
  sqlStringBuilding,
  xssSinks,
  // CC6.7 data in transit
  plainHttpUrls,
  tlsVerification,
  weakTlsCrypto,
  // CC6.8 supply chain
  baseImages,
  containerScanning,
  curlPipeShell,
  dependencyScanning,
  lockfiles,
  reproducibleInstalls,
  // CC8.1 change management
  ciOnPullRequests,
  codeownersSensitivePaths,
  emergencyChange,
  migrationsReversible,
  rollbackProcedure,
  terraformState,
];
