// Rule registry. Add new rules here after creating them under src/rules/<criterion>/.
import type { Rule } from '../engine/types.js';
import { codeowners } from './cc1.3/codeowners.js';
import { securityPolicy } from './cc2.3/security-policy.js';
import { envFiles } from './cc6.1/env-files.js';
import { hardcodedSecrets } from './cc6.1/hardcoded-secrets.js';

export const RULES: readonly Rule[] = [codeowners, securityPolicy, envFiles, hardcodedSecrets];
