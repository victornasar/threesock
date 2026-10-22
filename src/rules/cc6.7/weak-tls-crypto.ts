import type { Rule } from '../../engine/types.js';
import { scanLines, type CodePattern } from '../lib/code-patterns.js';
import { isProductionSource, isTestPath, isVendored } from '../lib/languages.js';
import { absence, plural } from '../util.js';

const BELOW_12: CodePattern[] = [
  {
    languages: ['js'],
    re: /minVersion\s*:\s*['"]TLSv1(?:\.1)?['"]|secureProtocol\s*:\s*['"](?:TLSv1_method|TLSv1_1_method|SSLv3_method|SSLv23_method)/,
    label: 'Node TLS allows versions below TLS 1.2',
  },
  {
    languages: ['python'],
    re: /ssl\.PROTOCOL_(?:TLSv1|TLSv1_1|SSLv2|SSLv3)\b|TLSVersion\.(?:TLSv1|TLSv1_1|SSLv3)\b/,
    label: 'Python SSL context allows versions below TLS 1.2',
  },
  {
    languages: ['go'],
    re: /MinVersion\s*:\s*tls\.Version(?:TLS10|TLS11|SSL30)\b/,
    label: 'Go TLS config allows versions below TLS 1.2',
  },
  {
    languages: ['js', 'python', 'go'],
    re: /ssl_protocols[^;\n]*\b(?:SSLv3|TLSv1|TLSv1\.1)(?=[\s;])/,
    label: 'nginx allows protocols below TLS 1.2',
  },
  {
    languages: ['js', 'python', 'go'],
    re: /ssl_policy\s*=\s*"ELBSecurityPolicy-(?:2015-05|2016-08|TLS-1-0-|TLS-1-1-)|minimum_protocol_version\s*=\s*"(?:SSLv3|TLSv1|TLSv1_2016|TLSv1\.1_2016)"|min_tls_version\s*=\s*"(?:1\.0|1\.1|TLS1_0|TLS1_1)"/,
    label: 'Cloud load balancer or CDN allows TLS below 1.2',
  },
];
const BELOW_13: CodePattern[] = [
  {
    languages: ['js'],
    re: /minVersion\s*:\s*['"]TLSv1\.2['"]/,
    label: 'Node TLS minimum is 1.2; policy requires 1.3',
  },
  {
    languages: ['go'],
    re: /MinVersion\s*:\s*tls\.VersionTLS12\b/,
    label: 'Go TLS minimum is 1.2; policy requires 1.3',
  },
];
const WEAK_CIPHERS: CodePattern[] = [
  {
    languages: ['js'],
    re: /createCipher(?:iv)?\(\s*['"](?:des|des-ede3?|des-ede3-cbc|rc4|rc2|bf|blowfish)[^'"]*['"]|createCipher(?:iv)?\(\s*['"]aes-\d+-ecb['"]/i,
    label: 'Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)',
  },
  {
    languages: ['js'],
    re: /\bcrypto\.createCipher\s*\(/,
    label: 'Deprecated createCipher without an IV',
  },
  {
    languages: ['python'],
    re: /\b(?:DES|DES3|ARC4|ARC2|Blowfish)\.new\s*\(|AES\.new\([^)]*MODE_ECB|algorithms\.(?:TripleDES|ARC4|Blowfish|CAST5)\s*\(|modes\.ECB\s*\(/,
    label: 'Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)',
  },
  {
    languages: ['go'],
    re: /\bdes\.New(?:TripleDES)?Cipher\s*\(|\brc4\.NewCipher\s*\(/,
    label: 'Weak cipher (DES, 3DES or RC4)',
  },
];

export const weakTlsCrypto: Rule = {
  id: 'cc6.7/weak-tls-crypto',
  criterion: 'CC6.7',
  title: 'Weak TLS versions and ciphers are disabled',
  tags: ['CODE', 'CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['Weak protocols/ciphers disabled'],
  expected:
    'TLS endpoints and clients require at least the configured minimum version (default 1.2), and code uses modern ciphers (AES-GCM, ChaCha20-Poly1305).',
  risk: 'Legacy protocols and ciphers have practical attacks that expose traffic or encrypted data.',
  remediation: {
    summary:
      'Raise the minimum TLS version to 1.2 or 1.3 and replace legacy ciphers with an authenticated cipher such as AES-256-GCM.',
    example: `tls.createServer({ minVersion: 'TLSv1.3', key, cert });
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);`,
  },
  detect(ctx) {
    const config = ctx.files.files.filter(
      (f) =>
        /\.(?:tf|conf)$|(?:^|\/)nginx[^/]*$/.test(f.path) &&
        !isTestPath(f.path) &&
        !isVendored(f.path),
    );
    const files = [...ctx.files.files.filter((f) => isProductionSource(f)), ...config];
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No production source or TLS configuration files to check.',
      };
    const patterns = [
      ...BELOW_12,
      ...(ctx.config.thresholds.minTlsVersion === '1.3' ? BELOW_13 : []),
      ...WEAK_CIPHERS,
    ];
    const findings = scanLines(ctx, files, patterns);
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${plural(files.length, 'file')}; no TLS below ${ctx.config.thresholds.minTlsVersion} and no legacy ciphers found.`,
    );
  },
};
