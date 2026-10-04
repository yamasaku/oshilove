# OshiLove & OshiPocket website

Static, multilingual product website for OshiLove and OshiPocket. The existing
OshiLove privacy policy and support pages keep their original URLs and content.

## Pages

- `index.html` — shared product landing page
- `landing.css` — landing page layout, pastel colour variables and responsive styles
- `privacy.html` — privacy policy for App Store / Google Play
- `support.html` — support page and frequently asked questions

The site defaults to Japanese and supports Traditional Chinese and English. It uses Google Analytics 4 with Consent Mode: analytics storage is denied by default, limited cookieless measurement may run before consent, and full analytics starts only after consent. Advertising storage and personalisation remain disabled. It uses no external fonts.

The landing page also includes a side-by-side app chooser and a privacy-focused
summary so visitors can quickly understand which app fits their needs and how
their records are stored.

## Product screenshots

The landing page uses real portrait screenshots supplied for both apps:

- `oshilove-home.webp`
- `oshilove-profile.webp`
- `oshipocket-stats.webp`

They are presented inside the reusable `.device` frame without cropping app
controls. Optimised WebP files are loaded on the page; the supplied PNG files
remain as source assets. New screens should keep the same 9:19.5 ratio and
descriptive alt text.

The App Store buttons use app IDs verified from App Store Connect. Regional
availability has not been confirmed, so the page does not claim either app is
currently available in every storefront. The footer keeps separate Privacy and
Support URLs for OshiLove and OshiPocket, matching their submitted Apple URLs.

`robots.txt`, `sitemap.xml`, canonical URLs, Open Graph large-image metadata and
JSON-LD are included for search and link previews. Update the sitemap `lastmod`
values when publishing meaningful content changes.

## Before publishing

Support requests use the public GitHub Issues page. Users should be reminded not to attach private photos or personal information.

## Suggested GitHub Pages setup

1. Create a public repository named `oshilove` under the `yamasaku` GitHub account.
2. Copy the contents of this directory to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Select **Deploy from a branch**, branch `main`, folder `/ (root)`.
5. The expected website URL will be `https://yamasaku.github.io/oshilove/`.

Suggested App Store URLs:

- Privacy Policy: `https://yamasaku.github.io/oshilove/privacy.html`
- Support URL: `https://yamasaku.github.io/oshilove/support.html`

Copyright: `2026 WONG SUM YI`
