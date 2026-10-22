import { codePatternRule } from '../lib/code-patterns.js';

export const xssSinks = codePatternRule({
  id: 'cc6.6/xss-sinks',
  criterion: 'CC6.6',
  title: 'No unescaped HTML rendering sinks',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Defenses against common web flaws'],
  expected:
    'HTML output is escaped by the framework; raw-HTML sinks are avoided or fed only sanitized content.',
  risk: "Rendering raw HTML that contains user input enables cross-site scripting: session theft and actions on the victim's behalf.",
  remediation: {
    summary:
      "Render text through the framework's escaping. Where raw HTML is unavoidable, sanitize it with DOMPurify (or bleach) on the same line so the intent is visible.",
    example: `<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />`,
  },
  extraFiles: (f) =>
    /\.(?:html|jinja2?|j2|njk|hbs|ejs)$/.test(f.path) &&
    !/(?:^|\/)(?:test|tests|fixtures|node_modules|dist|build|coverage)\//.test(f.path),
  clean: 'no raw-HTML rendering sinks without visible sanitization',
  patterns: [
    {
      languages: ['js'],
      re: /dangerouslySetInnerHTML(?![^\n]*sanitiz)/i,
      label: 'React renders raw HTML (dangerouslySetInnerHTML) without visible sanitization',
    },
    {
      languages: ['js'],
      re: /\.(?:inner|outer)HTML\s*\+?=(?!=)(?![^\n]*sanitiz)/i,
      label: 'DOM innerHTML/outerHTML assigned without visible sanitization',
    },
    {
      languages: ['js'],
      re: /\bdocument\.write(?:ln)?\s*\(/,
      label: 'document.write used to render content',
    },
    {
      languages: ['js'],
      re: /\sv-html\s*=|\{@html\s/,
      label: 'Template renders raw HTML (v-html or {@html})',
    },
    {
      languages: ['js'],
      re: /bypassSecurityTrust(?:Html|Script|Url|ResourceUrl)\s*\(/,
      label: 'Angular sanitization bypassed',
    },
    {
      languages: ['python'],
      re: /\bmark_safe\s*\(|\|\s*safe\b|\{%\s*autoescape\s+(?:false|off)/,
      label: 'Template output marked safe, bypassing escaping',
    },
    { languages: ['go'], re: /\btemplate\.HTML\s*\(/, label: 'Go template.HTML bypasses escaping' },
  ],
});
