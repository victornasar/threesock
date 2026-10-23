// External scanner adapters (decisions 39-43).
import type { FileIndex, Severity } from '../../engine/types.js';

export interface ToolRunResult {
  /** Exit code, or null when killed. */
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  /** The binary is not on PATH. */
  missing: boolean;
}

/** Runs a binary with arguments. Injectable so tests never execute real tools. */
export type ToolRunner = (
  binary: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number },
) => Promise<ToolRunResult>;

export interface ToolContext {
  root: string;
  files: FileIndex;
  network: boolean;
  /** Registers a secret value so it is scrubbed from all output. */
  secrets: { register(value: string): string };
  /** A private temporary directory for report files; removed after the run. */
  tmpDir: string;
}

export interface ExternalFinding {
  criterion: string;
  /** The tool's own rule or check id. */
  checkId: string;
  title: string;
  observed: string;
  severity: Severity;
  path?: string;
  line?: number;
  key: string;
}

export interface ParseResult {
  findings: ExternalFinding[];
  /** How many targets the tool examined, when it says; 0 means nothing applied. */
  scanned?: number;
}

export interface ToolAdapter {
  name: string;
  binary: string;
  /** Needs the network (vulnerability databases, rule registries): runs only with --network. */
  network: boolean | ((ctx: ToolContext) => boolean);
  /** Criteria this tool can produce checks for. */
  criteria: string[];
  versionArgs: string[];
  /** Reason the tool does not apply to this repository, if any. */
  skip?(ctx: ToolContext): string | undefined;
  args(ctx: ToolContext): string[];
  /** Exit codes that still mean "ran successfully" (many tools exit non-zero when they find issues). */
  okExitCodes: number[];
  /** Reads results from stdout or from a report file in ctx.tmpDir. */
  parse(stdout: string, ctx: ToolContext): ParseResult;
  /** What a clean result covers, for pass evidence. */
  describe: string;
}

export interface ToolStatus {
  name: string;
  available: boolean;
  used: boolean;
  version?: string;
  /** Why the tool was not used, or why its results are incomplete. */
  note?: string;
}
