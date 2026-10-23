import posthog from 'posthog-js';

// Analytics stays off until the visitor opts in; Global Privacy Control wins.
posthog.init(window.POSTHOG_KEY, { opt_out_capturing_by_default: true });

export function onConsentChanged(consent) {
  if (consent.analytics && !navigator.globalPrivacyControl) posthog.opt_in_capturing();
}

export function identify(user) {
  posthog.identify(user.id);
}
