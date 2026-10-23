import type { RawFinding, Rule } from '../../engine/types.js';
import { isVendored } from '../lib/languages.js';
import { plural } from '../util.js';

const DATA_FILE =
  /(?:^|\/)(?:seeds?|fixtures?|mocks?|samples?|testdata|test-data|data)\/.*\.(?:json|csv|sql|ya?ml|tsv)$|(?:^|\/)seed[^/]*\.(?:json|csv|sql|[jt]s|py)$/i;
const CARD = /\b(?:\d[ -]?){13,19}\b/g;
const SSN = /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
const EMAIL =
  /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|icloud|aol|protonmail|proton|live|msn|gmx)\.[a-z.]{2,6}\b/gi;
// Card numbers payment providers publish for testing.
const TEST_CARDS = new Set([
  '4242424242424242',
  '4111111111111111',
  '5555555555554444',
  '378282246310005',
  '371449635398431',
  '6011111111111117',
  '4000056655665556',
  '5105105105105100',
  '4012888888881881',
]);

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

export const piiInFixtures: Rule = {
  id: 'c1.1/pii-in-fixtures',
  criterion: 'C1.1',
  title: 'Fixtures and seed data contain no real personal or card data',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Confidential data is excluded from source control, test fixtures'],
  expected:
    'Seeds, fixtures and sample data are synthetic: test card numbers, reserved example domains, generated identifiers.',
  risk: 'Real customer data in the repository is a breach of its own, copied to every clone, CI runner and laptop.',
  remediation: {
    summary:
      'Replace real-looking data with synthetic values (example.com addresses, provider test cards) or generate it with Faker; purge any real data from history.',
    example: `{ "email": "ada@example.com", "card": "4242424242424242", "ssn": "000-00-0000" }`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter((f) => DATA_FILE.test(f.path) && !isVendored(f.path));
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No fixture, seed or sample data files found.',
      };
    const findings: RawFinding[] = [];
    for (const f of files) {
      const text = ctx.files.read(f.path) ?? '';
      const cards = [...text.matchAll(CARD)]
        .map((m) => m[0].replace(/[ -]/g, ''))
        .filter(
          (d) =>
            d.length >= 13 &&
            d.length <= 19 &&
            !TEST_CARDS.has(d) &&
            luhn(d) &&
            !/^(\d)\1+$/.test(d),
        );
      const ssns = [...text.matchAll(SSN)].filter((m) => m[0] !== '123-45-6789');
      const emails = [...text.matchAll(EMAIL)];
      const kinds = [
        cards.length && plural(cards.length, 'valid card number'),
        ssns.length && plural(ssns.length, 'SSN-shaped value'),
        emails.length &&
          `${plural(emails.length, 'address', 'addresses')} at consumer email providers (${[...new Set(emails.map((m) => m[1]?.toLowerCase()))].join(', ')})`,
      ].filter(Boolean);
      for (const c of cards) ctx.secrets.register(c);
      if (kinds.length)
        findings.push({
          path: f.path,
          title: `Possible real personal data in ${f.path}`,
          observed: `${f.path} contains ${kinds.join(', ')}. Values are not shown.`,
          key: f.path,
        });
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'absence',
          description: `Checked ${plural(files.length, 'fixture or seed file')}; no real-looking card numbers, SSNs or consumer email addresses.`,
        },
      ],
    };
  },
};
