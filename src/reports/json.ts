import type { ScanReport } from '../engine/model.js';

export function renderJson(report: ScanReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
