import { codePatternRule } from '../lib/code-patterns.js';

export const userObjectsToThirdParties = codePatternRule({
  id: 'p6.1/user-objects-to-third-parties',
  criterion: 'P6.1',
  title: 'Only minimal identifiers are sent to analytics and support tools',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false, // set per finding
  checks: ['Payloads to vendors are minimized'],
  expected:
    'Calls to analytics, error-tracking and support SDKs send a pseudonymous id and only the fields the purpose needs, never whole user objects.',
  risk: 'Whole user objects leak every field (email, address, flags) to vendors, a rubric red flag and usually a breach of the privacy notice.',
  remediation: {
    summary: 'Send a pseudonymous id and an explicit allow-list of properties.',
    example: `analytics.identify(user.id, { plan: user.plan });
Sentry.setUser({ id: user.id });`,
  },
  clean: 'no whole user objects or email addresses passed to analytics or support SDKs',
  patterns: [
    {
      languages: ['js', 'python'],
      re: /\b(?:analytics|segment|mixpanel(?:\.people)?|posthog|amplitude|heap|intercom|Sentry|sentry_sdk|FullStory|FS)\.(?:identify|track|set|setUser|set_user|setUserVars|people\.set|register)\s*\([^)]*\b(?:user|currentUser|current_user|req\.user|request\.user|profile|customer)\s*\)/,
      label: 'Whole user object sent to a third-party SDK',
      redFlag: true,
    },
    {
      languages: ['js', 'python'],
      re: /\b(?:analytics|segment|mixpanel(?:\.people)?|posthog|amplitude|heap|intercom|Sentry|sentry_sdk)\.(?:identify|track|set|setUser|set_user|register)\s*\([^)]*\b(?:email|\$email|phone|address)\b/,
      label: 'Email or contact details sent to a third-party SDK',
      redFlag: false,
    },
  ],
});
