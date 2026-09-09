# Security

This development version is not yet authorized for production use with student data.

## Implemented controls

- Server verification of Cloudflare Access JWT signature, issuer, audience, expiry and account allowlist; no default or shared passwords.
- Fail-closed editorial routes; public visitors cannot read drafts or inbox entries.
- Separate publisher permissions; an editor cannot alter or delete already-published content.
- Exact Origin checks on writes, structured validation, request-size limits and parameterized database queries.
- No user-supplied HTML or scripts. Embed providers are selected by exact host and allowed path.
- Binary file signatures and MIME checks; no SVG/HTML uploads. Unpublished attachments require editorial access.
- Turnstile server verification and temporary HMAC-based rate-limit keys for the anonymous inbox. Raw IP addresses are not stored by application code.
- Optimistic concurrency rejects stale writes. Trash is recoverable. Editorial changes have an audit record.

## Required before launch

Configure Access MFA and individual accounts; prefer passkeys/security keys. The application trusts the signed Access policy outcome, so enforcing MFA in Access is mandatory deployment configuration. Set short sessions and a recovery/handover process. Do not use a bypass policy.

Review current dependency advisories. An initial package-manager installation reported 11 advisories (8 high, 2 moderate, 1 low); a later audit endpoint request failed and does not clear those findings. No claim of a clean dependency audit is made. Validate actual exposure and upgrade affected dependencies before public launch.

Complete real Worker/D1/R2 tests, cross-device publishing tests, authorization tests with two roles, media-range/video playback tests, and a backup/restore exercise. Review the hosting domain, origin aliases, headers, upload quotas and denial-of-service limits. No service is guaranteed immune to attack.

## Inbox and privacy

Only suggestions/questions for the workshop. Not emergency, clinical or professional support. No public comment wall. Do not request names, identity documents, health histories or attachments from visitors. The app retains inbox messages for up to 90 days and temporary abuse keys for approximately two hours; the cleanup job must be deployed. Infrastructure providers may process connection metadata independently. Have the institution review the final notice and retention policy.

## Reporting

Contact the repository owner privately through an established team channel. Do not post credentials, student information, private messages or exploit payloads in a public issue. If institutionalized, replace this guidance with Tecmilenio's approved security contact and incident process.
