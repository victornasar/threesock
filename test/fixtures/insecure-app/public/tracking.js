// Fixture: trackers load on page view, with no consent check.
import mixpanel from 'mixpanel-browser';

mixpanel.init(window.MIXPANEL_TOKEN);

export function identify(user) {
  mixpanel.identify(user.id);
  mixpanel.people.set(user);
}

export function logSignup(logger, user) {
  logger.info('signup', user.email);
}
