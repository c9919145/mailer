/**
 * Webhook event types an email provider can report.
 *
 * Lives here so the API can validate incoming event names and the UI can
 * render the same list. Previously the list was duplicated: an unused copy
 * sat in `api/domains/route.ts` and another in `webhooks-client.tsx`, while
 * the create endpoint accepted any non-empty string.
 */
export const WEBHOOK_EVENTS = [
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "COMPLAINED",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];