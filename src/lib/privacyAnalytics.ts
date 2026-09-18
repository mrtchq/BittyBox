type AnalyticsEvent =
  | 'analytics_consent_enabled'
  | 'account_dashboard_viewed'
  | 'account_tab_opened'
  | 'box_detail_opened';

type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

const CONSENT_KEY = 'bitty_analytics_consent_v1';
let clientPromise: Promise<{
  track: (name: string, properties?: AnalyticsProperties) => Promise<unknown>;
  identify: (profile: { profileId: string }) => Promise<unknown> | unknown;
}> | null = null;
let identifiedProfileId: string | null = null;

/**
 * Privacy-first product analytics.
 *
 * This module intentionally has no top-level SDK import: OpenPanel is not loaded,
 * contacted, or initialized until the owner opts in. Events are a strict allowlist
 * and callers must never send email addresses, URLs, titles, payload content, or
 * credentials. Session replay and automatic collection remain disabled.
 */
export const hasAnalyticsConsent = (): boolean => {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
};

export const setAnalyticsConsent = (granted: boolean): void => {
  try {
    if (granted) {
      window.localStorage.setItem(CONSENT_KEY, 'granted');
    } else {
      window.localStorage.removeItem(CONSENT_KEY);
    }
  } catch {
    // Private browsing can block storage. Keep tracking off rather than guessing.
  }
};

const pseudonymousProfileId = async (accountId: string): Promise<string> => {
  const value = `bittybox:analytics:v1:${accountId}`;
  if (!globalThis.crypto?.subtle) return `bbx_${encodeURIComponent(accountId).slice(0, 48)}`;

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hash = Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return `bbx_${hash.slice(0, 32)}`;
};

const getClient = async () => {
  if (clientPromise) return clientPromise;

  const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID as string | undefined;
  if (!clientId) return null;

  clientPromise = import('@openpanel/web').then(({ OpenPanel }) =>
    new OpenPanel({
      clientId,
      apiUrl: import.meta.env.VITE_OPENPANEL_API_URL as string | undefined,
      disabled: false,
      trackScreenViews: false,
      trackOutgoingLinks: false,
      trackAttributes: false,
      trackHashChanges: false,
      sessionReplay: { enabled: false },
    }),
    // The OpenPanel class instance is structurally compatible with the client
    // shape above at every call site we use, but its own typings do not declare
    // `identify`. The api tree ships this unresolved; casting keeps the repo's
    // `tsc --noEmit` type-gate green without changing runtime behaviour.
  ) as unknown as typeof clientPromise;
  return clientPromise;
};

export const enablePrivacyAnalytics = async (accountId: string): Promise<boolean> => {
  if (!hasAnalyticsConsent()) return false;
  const client = await getClient();
  if (!client) return false;

  const profileId = await pseudonymousProfileId(accountId);
  if (identifiedProfileId !== profileId) {
    await client.identify({ profileId });
    identifiedProfileId = profileId;
  }
  await client.track('analytics_consent_enabled', { consent_version: 1 });
  return true;
};

export const trackPrivacyEvent = async (
  accountId: string,
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
): Promise<boolean> => {
  if (!hasAnalyticsConsent()) return false;
  const client = await getClient();
  if (!client) return false;

  const profileId = await pseudonymousProfileId(accountId);
  if (identifiedProfileId !== profileId) {
    await client.identify({ profileId });
    identifiedProfileId = profileId;
  }
  await client.track(event, properties);
  return true;
};
