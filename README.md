<div align="center">

# HeForShe · Entre nos

### A campus journal for voices that move us forward

**Tecmilenio · Campus Laguna · Torreón, Coahuila**

![React](https://img.shields.io/badge/React-19-E71975?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-E71975?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Ready-292126?style=for-the-badge&logo=cloudflare&logoColor=white)
[![License MIT](https://img.shields.io/badge/Code_License-MIT-292126?style=for-the-badge)](LICENSE)
![Status](https://img.shields.io/badge/Status-Development-EDABC8?style=for-the-badge&logoColor=292126)

[Instagram](https://www.instagram.com/heforshe_laguna/) · [TikTok](https://www.tiktok.com/@heforshe2025) · [Guía del proyecto](docs/PROYECTO.md)

</div>

---

## About

**Entre nos** is an editorial platform for the HeForShe community at Tecmilenio Campus Laguna. It brings stories, a digital newspaper, events, educational games and student generations into a warm, expressive space centered on equality, empathy and respect.

This is a working development version. The offline demo and the connected application have different storage and security behavior. No production domain, real editorial accounts or social API connections have been configured yet.

## Highlights

- Pink editorial identity, readable typography and reduced-motion support
- Editable welcome message, sections and social profile links
- Publications with drafts, review status and recoverable trash
- Structured block editor: headings, text, quotes, images, video, links, supported embeds and dividers
- Block fonts, size, spacing, color, backgrounds and column widths
- Numbered newspaper archive with multiple pages and optional page sound
- Editable events with location, registration links and downloadable calendar reminders
- Generations with portraits, roles, Instagram and LinkedIn links
- Quiz and memory-game templates, optional date windows and dismissible entrance invitations
- Private suggestion inbox; no visitor registration needed
- Server authorization, schema validation, optimistic concurrency and content visibility checks

## Technology

React 19 · TypeScript · Vinext/Vite · Shadcn/Base UI · Cloudflare Workers · D1 · R2 · Access · Turnstile

The repository can remain private while the website is publicly available on its own domain. GitHub stores the code; Cloudflare hosts the application and data.

## Run locally

Requires **Node.js 24+** and npm. The test suite uses Node's built-in SQLite API.

```bash
npm ci
npm run dev
```

Open `/demo` on the local URL to explore the editorial workspace with sample data. The root route is the connected application and needs the Worker API. The demo stores changes on the current browser only. Never use it as a secure shared admin panel.

```bash
npm test
npm run typecheck
npm run build
npm run build:standalone
```

The standalone build creates the frontend for a custom-domain Worker deployment. It is not the offline demonstration file. See [deployment](docs/DEPLOYMENT.md) for database, identity and storage setup.

## Security and readiness

The Worker fails closed when editorial identity is not configured. It verifies signed Access tokens, audience, issuer and expiration, checks an explicit account allowlist, separates editors from publishers and rejects cross-origin writes. Unpublished media requires authorization. The suggestion endpoint requires server-side Turnstile validation and a rate limit.

These measures are an implemented foundation, **not a security certification**. MFA policies, real accounts, backups, end-to-end deployment checks and dependency advisory review are required before launch. See [SECURITY.md](SECURITY.md).

## Integrations

Canva exports can be uploaded as supported images or video. Supported Canva public-view links can be embedded after the reader chooses to load them. This preserves the design as a visual; it does not turn Canva layers into editable blog blocks.

Social profile links and manually selected social posts are editable now. Automatic Instagram/TikTok feeds, OAuth token renewal, Instagram Stories and web-push delivery are not implemented. Their authorization and provider limitations are documented in [the project guide](docs/PROYECTO.md).

## Project context

Developed for a real student initiative with room for future generations and additional campuses. Institutional adoption, permissions to use university branding and moderation responsibilities remain decisions for the team and Tecmilenio.

## License and media

The original project code is available under the [MIT License](LICENSE). Logos, names, trademarks, photographs, editorial content and third-party assets retain their respective rights. The code license does not authorize use of Tecmilenio or HeForShe branding or imply institutional endorsement. Dependencies retain their own licenses.

---

<div align="center">Created and developed by [Abril Miranda Villa Márquez](https://github.com/abrilvillita) · Built for the HeForShe community ♡</div>
