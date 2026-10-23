// Library entry point: lets other tools (including threesock-mcp) run threesock programmatically.
export { scan, nowFromEnv, type ScanOptions, type ScanOutput } from './engine/scan.js';
export { loadConfig, resolveConfig, ConfigError } from './engine/config.js';
export { CRITERIA } from './engine/criteria.generated.js';
export {
  SCHEMA_VERSION,
  DISCLAIMER,
  type ScanReport,
  type Finding,
  type CriterionResult,
} from './engine/model.js';
export { CATEGORIES, SEVERITIES } from './engine/types.js';
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
export { renderMarkdown } from './reports/markdown.js';
export { renderText } from './reports/text.js';
export { renderSarif } from './reports/sarif.js';
export { renderHtml } from './reports/html.js';
export { VERSION } from './version.js';
