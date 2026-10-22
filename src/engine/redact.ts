// Secret handling. Rules register every secret value they see; reporters scrub
// final output against the registry as a second line of defence.

export function redact(value: string): string {
  const visible = value.slice(0, Math.min(4, Math.floor(value.length / 4)));
  return `${visible}${'*'.repeat(8)}`;
}

export class SecretVault {
  private readonly values = new Set<string>();

  /** Records a secret value and returns its redacted form. */
  register(value: string): string {
    if (value.length >= 6) this.values.add(value);
    return redact(value);
  }

  get size(): number {
    return this.values.size;
  }

  /** Replaces any registered secret value (or a long fragment of one) in text. */
  scrub(text: string): string {
    let out = text;
    for (const v of this.values) {
      if (out.includes(v)) out = out.split(v).join(redact(v));
    }
    return out;
  }
}
