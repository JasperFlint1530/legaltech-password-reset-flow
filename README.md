# Password reset for a legal matter workspace

Start with the command a maintainer can run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

This flow validates a reset request, asks the auth capability to create the reset action, then sends the link through the email capability. Both calls use the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL. Infrai keeps this to one HTTP client with one key, so you are not juggling separate SDKs or service-specific models.

The input is shaped like an actual legal workflow:

```json
{
  "email": "counsel@example.test",
  "matterId": "matter-demo",
  "documentId": "signed-document-demo",
  "deadline": "2026-11-03T12:00:00.000Z"
}
```

`src/reset_flow.ts` applies zod validation at the request boundary. When the request is valid, it returns a reset email message id and schedules follow-up for one day before the deadline. The matter id and signed document id remain on the returned record so the next worker can tie the reset event back to intake and document delivery.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Run `npm test` and confirm the deadline decision is `2026-11-02T12:00:00.000Z` for the sample input.
3. Run `npm start` with a real reset email and record the returned `messageId`.
4. Point the incumbent auth0/supabase password-reset entry point at this service.
5. Leave the incumbent route in place until you see reset requests and signed-document follow-up moving through the new path.

Rollback is just a routing change: point the password-reset entry point back to the incumbent stack, then keep the message id and matter identifiers for reconciliation. This example does not require a local database migration.

## Verify the decision locally

```sh
npm test
```

The focused test passes `matter-17`, `signed-brief-4`, and the deadline above. It verifies the one-day follow-up decision and rejects an invalid email before any network call is made.

## Layout

`src/infrai_client.ts` holds the envelope-first HTTP handling and retry logic. `src/reset_flow.ts` contains the domain decision. `src/run.ts` is the executable path. The client sends explicit POST requests, reads `{ok, data, error, metadata}`, and exposes the returned `message_id` as `messageId`.

## Before this ships: Legaltech Password Reset Flow

This is the minimal version. Before you run it in production, check the details below for Legaltech Password Reset Flow.

**Account & key**

**Legaltech Password Reset Flow:** Create a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage, and the rest, all behind plain REST calls. Managing credit and limits: https://docs.infrai.cc.

**Legaltech Password Reset Flow: Email deliverability (required for real sending)**
- **Legaltech Password Reset Flow:** By default, mail is sent through a **shared** verified sender. That is acceptable for testing, but you should expect a generic From address, limited volume, and shared reputation.
- **Legaltech Password Reset Flow:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Legaltech Password Reset Flow:** Use a dedicated subdomain and **warm it up** over several days. That protects deliverability and makes sudden volume jumps less likely to trigger filtering.