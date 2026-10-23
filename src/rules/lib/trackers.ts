// Third-party analytics, advertising and session-recording SDKs.
export interface Sdk {
  vendor: string;
  /** Matches the package in a manifest or the loader in source. */
  re: RegExp;
}

export const TRACKERS: Sdk[] = [
  {
    vendor: 'Google Analytics',
    re: /googletagmanager\.com|google-analytics\.com|\bgtag\(\s*['"]config|"(?:react-ga4?|@next\/third-parties|vue-gtag)"/,
  },
  {
    vendor: 'Segment',
    re: /"@segment\/analytics-(?:next|node)"|"analytics-node"|cdn\.segment\.com|\banalytics\.load\(/,
  },
  { vendor: 'Mixpanel', re: /"mixpanel(?:-browser)?"|\bmixpanel\.init\(/ },
  { vendor: 'PostHog', re: /"posthog-(?:js|node)"|\bposthog\.init\(/ },
  { vendor: 'Amplitude', re: /"@amplitude\/[\w-]+"|\bamplitude\.init\(/ },
  { vendor: 'Hotjar', re: /static\.hotjar\.com|"@hotjar\/browser"|\bhj\(\s*['"]/ },
  { vendor: 'Meta Pixel', re: /connect\.facebook\.net|\bfbq\(\s*['"]init/ },
  { vendor: 'FullStory', re: /"@fullstory\/browser"|fullstory\.com\/s\/fs\.js/ },
  { vendor: 'Microsoft Clarity', re: /clarity\.ms\/tag|"@microsoft\/clarity"/ },
  {
    vendor: 'Intercom',
    re: /widget\.intercom\.io|"@intercom\/messenger-js-sdk"|"react-use-intercom"/,
  },
  { vendor: 'Heap', re: /cdn\.heapanalytics\.com|\bheap\.load\(/ },
];

export const CONSENT =
  /cookieconsent|vanilla-cookieconsent|onetrust|cookiebot|klaro|osano|iubenda|usercentrics|tarteaucitron|react-cookie-consent|@c15t\/|gtag\(\s*['"]consent['"]|opt_out_capturing_by_default|hasConsent\s*\(|consent\.(?:analytics|marketing|granted)|globalPrivacyControl/;
