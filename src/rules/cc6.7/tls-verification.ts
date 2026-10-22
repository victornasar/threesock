import { codePatternRule } from '../lib/code-patterns.js';
import { isTestPath, isVendored } from '../lib/languages.js';

const SCRIPTS =
  /(?:^|\/)(?:Dockerfile[^/]*|[^/]*\.Dockerfile|Makefile|[^/]*\.sh|\.npmrc|\.yarnrc(?:\.yml)?|\.gitlab-ci\.yml|Jenkinsfile)$|^\.github\/workflows\/[^/]+\.ya?ml$/;

export const tlsVerification = codePatternRule({
  id: 'cc6.7/tls-verification',
  criterion: 'CC6.7',
  title: 'TLS certificate verification is never disabled',
  tags: ['CODE', 'CONFIG'],
  severity: 'high',
  redFlag: true,
  checks: ['Certificate validation is never disabled'],
  expected:
    'Every TLS client validates certificates and hostnames. Private CAs are trusted explicitly instead of turning validation off.',
  risk: 'With validation off, anyone on the network path can impersonate the server and read or alter traffic, including credentials.',
  remediation: {
    summary:
      'Remove the override. For internal or self-signed services, trust the specific CA bundle instead.',
    example: `// Node: trust a private CA instead of disabling checks
https.request(url, { ca: fs.readFileSync('certs/internal-ca.pem') });

# Python
requests.get(url, verify="certs/internal-ca.pem")`,
  },
  extraFiles: (f) => SCRIPTS.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
  clean: 'certificate verification is never disabled',
  patterns: [
    {
      languages: ['js'],
      re: /rejectUnauthorized\s*:\s*false/,
      label: 'Node TLS client with certificate rejection turned off',
    },
    {
      languages: ['js', 'python', 'go'],
      re: /NODE_TLS_REJECT_UNAUTHORIZED\s*[=:]\s*['"]?0/,
      label: 'NODE_TLS_REJECT_UNAUTHORIZED set to 0',
    },
    {
      languages: ['js'],
      re: /\bstrictSSL\s*:\s*false/,
      label: 'HTTP client with strictSSL turned off',
    },
    {
      languages: ['python'],
      re: /\bverify\s*=\s*False\b/,
      label: 'Python HTTP client with certificate verification turned off',
    },
    {
      languages: ['python'],
      re: /ssl\._create_unverified_context|\bCERT_NONE\b|check_hostname\s*=\s*False/,
      label: 'Python SSL context without certificate or hostname checks',
    },
    {
      languages: ['go'],
      re: /InsecureSkipVerify\s*:\s*true/,
      label: 'Go TLS config skips certificate verification',
    },
    {
      languages: ['js', 'python', 'go'],
      re: /\bcurl\b[^\n|]*\s(?:-k|--insecure)(?:\s|$)|\bwget\b[^\n]*--no-check-certificate|GIT_SSL_NO_VERIFY\s*[=:]\s*['"]?(?:true|1)|\bstrict-ssl\s*[=:]?\s*false/,
      label: 'Download or package tool with certificate checks turned off',
    },
  ],
});
