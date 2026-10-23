import { codePatternRule } from '../lib/code-patterns.js';

export const massAssignment = codePatternRule({
  id: 'cc6.2/mass-assignment',
  criterion: 'CC6.2',
  title: 'Users cannot assign their own roles through request data',
  tags: ['CODE'],
  severity: 'high',
  redFlag: true,
  checks: ['cannot self-assign privileged roles'],
  expected:
    'Create and update handlers copy only allow-listed fields from requests; roles and permissions are set by privileged code paths only.',
  risk: 'Mass assignment lets a user send `"role": "admin"` in a signup or profile update and become an administrator.',
  remediation: {
    summary:
      'Validate request bodies against a schema of allowed fields and set roles explicitly on the server.',
    example: `const input = SignupSchema.parse(req.body); // { email, password, name } only
await User.create({ ...input, role: 'member' });`,
  },
  clean: 'no request bodies spread into models and no client-supplied roles',
  patterns: [
    {
      languages: ['js'],
      re: /\b(?:create|update|insert|upsert|findOneAndUpdate|updateOne|updateMany|save|build|assign)\w*\(\s*(?:\{\s*)?\.\.\.(?:req|request|ctx\.request)\.body\b/,
      label: 'Whole request body spread into a database write',
    },
    {
      languages: ['js'],
      re: /\b(?:req|request|ctx\.request)\.body\.(?:role|roles|isAdmin|is_admin|admin|permissions|isStaff|is_staff)\b/,
      label: 'Role or permission read from the request body',
    },
    {
      languages: ['python'],
      re: /\(\s*\*\*\s*(?:request\.(?:json|data|POST|form)|request\.get_json\(\))/,
      label: 'Whole request body unpacked into a model',
    },
    {
      languages: ['python'],
      re: /request\.(?:json|form|data|POST)(?:\.get\(|\[)\s*['"](?:role|roles|is_admin|is_superuser|is_staff|permissions)['"]/,
      label: 'Role or permission read from the request body',
    },
  ],
});
