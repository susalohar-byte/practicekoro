# Schema Report: practicekoro.online

Checked 2026-11-01. Pages: `/`, `/contact`, `/blog`.

## Detection

| Source                                | JSON-LD | Microdata | RDFa |
| ------------------------------------- | ------- | --------- | ---- |
| Server HTML (what crawlers get first) | none    | none      | none |
| Rendered page after JavaScript        | none    | none      | none |
| `/contact`, `/blog` (rendered)        | none    | none      | none |

**The site has no structured data at all.** Open Graph and Twitter Card tags are present and correct, but they are not Schema.org markup.

The site is a Vite/React single-page app. The server sends the same `index.html` shell (title, meta, empty `<div id="root">`) for every route, and the content is rendered by JavaScript.

## Validation results

| Schema | Type | Status | Issues                              |
| ------ | ---- | ------ | ----------------------------------- |
| —      | —    | ❌     | No markup found on any checked page |

## Other issues found while checking

| Priority | Issue                                                     | Detail                                                                                                                                                                                                                                                                                                                      |
| -------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Android download links are broken                         | `/PracticeKoro.apk` and `/PracticeKoro-arm64.apk`, linked from the homepage, both return **404**. The footer says "Get it on Google Play", but no Play Store link was found.                                                                                                                                                |
| High     | Request with a Googlebot user agent got **403 Forbidden** | Probably a firewall rejecting a _fake_ Googlebot (the request came from a non-Google IP), which is normal. Confirm with Search Console → URL Inspection → Live Test that the real Googlebot gets 200.                                                                                                                       |
| Medium   | Social links are placeholders                             | Footer links go to bare `https://youtube.com`, `https://t.me`, `https://facebook.com`, `https://instagram.com`. They're left out of `sameAs`; add your real profile URLs to both the footer and the schema.                                                                                                                 |
| Medium   | Brand name is inconsistent                                | The visible text and © line say "Practice Koro", `og:site_name` says "PracticeKoro", and the title set by JavaScript is "PracticeKoro \| Mock Test & Practice Platform", which differs from the server title. The schema uses `name: "Practice Koro"` with `alternateName: "PracticeKoro"`; pick one and use it everywhere. |
| Low      | `/blog` has no posts                                      | "শীঘ্রই নতুন লেখা আসছে" (new posts coming soon). Add `BlogPosting` schema per post once articles exist.                                                                                                                                                                                                                     |

## Recommendations

Generated code is in `generated-schema.json`, in three blocks:

1. **`sitewide_index_html`**: `EducationalOrganization` + `WebSite`. Paste it as a `<script type="application/ld+json">` into the `<head>` of `index.html`. Because every route is served from the same `index.html`, this block appears on every page, so it contains only facts that are true sitewide. It's in the server HTML, so crawlers see it without running JavaScript.
2. **`homepage_only`**: `WebPage` + `WebApplication` with your three plans as `Offer`s (₹0 / ₹99 / ₹299). Inject it only on `/` (e.g. with `react-helmet-async`, or by prerendering the homepage). Don't put it in `index.html`, or every route would claim to be the homepage.
3. **`contact_page_only`**: `ContactPage`, for `/contact`.

Every URL in the generated code was checked: `logo.png` (1024×373) and the hero image return 200.

### Deliberately not included

- **AggregateRating / Review from the homepage testimonials.** Google doesn't show review stars for reviews a business publishes about itself, and three hand-picked quotes with no rating aren't valid rating data. Adding them risks a manual action.
- **FAQPage.** Google retired FAQ rich results for all sites on 2026-05-07, so this gives no SERP benefit. It's harmless if you want it for other consumers, but it isn't recommended for Google.
- **MobileApplication.** Add it once the APK or Play Store link works (`operatingSystem: "Android"`, `downloadUrl` or `installUrl` set to the Play Store URL).
- **Course.** Mock tests and question banks don't fit Google's Course requirements well.

### How to verify (and how you'd know it failed)

- After deploying, test `/` and `/contact` in Google's **Rich Results Test** and the **Schema Markup Validator** (validator.schema.org). Success means zero errors and Organization/WebSite detected.
- Within 2–4 weeks, Search Console → Enhancements should list the detected types. If it still shows nothing, Google probably isn't seeing the `index.html` head (check the 403 issue above first).
- Leading indicator: the site name shown in Google results should become "Practice Koro" instead of the bare domain.
