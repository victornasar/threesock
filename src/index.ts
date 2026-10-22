// Library entry point: lets other tools run threesock programmatically.
export { scan, type ScanOptions, type ScanOutput } from './engine/scan.js';
export { loadConfig, resolveConfig, ConfigError } from './engine/config.js';
export { CRITERIA } from './engine/criteria.generated.js';
export {
  SCHEMA_VERSION,
  DISCLAIMER,
  type ScanReport,
  type Finding,
  type CriterionResult,
} from './engine/model.js';
export type {
  Rule,
  RuleContext,
  RuleOutcome,
  Evidence,
  RawFinding,
  Severity,
  Score,
  Category,
} from './engine/types.js';
export { RULES } from './rules/index.js';
export { renderJson } from './reports/json.js';
export { renderText } from './reports/text.js';
