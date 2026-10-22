// Terminal styling. Monochrome by default; color is used only for severity.
import type { Severity } from '../engine/types.js';

export function colorEnabled(stream: NodeJS.WriteStream = process.stdout): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') return false;
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0') return true;
  return Boolean(stream.isTTY) && process.env.TERM !== 'dumb';
}

const SEVERITY_CODES: Record<Severity, [number, number]> = {
  critical: [31, 39], // red
  high: [33, 39], // yellow
  medium: [36, 39], // cyan
  low: [2, 22], // dim
};

export interface Style {
  severity(sev: Severity, text: string): string;
  bold(text: string): string;
}

export function makeStyle(color: boolean): Style {
  return {
    severity: (sev, text) => {
      const [open, close] = SEVERITY_CODES[sev];
      return color ? `\u001b[${open}m${text}\u001b[${close}m` : text;
    },
    bold: (text) => (color ? `\u001b[1m${text}\u001b[22m` : text),
  };
}
