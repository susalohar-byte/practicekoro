# GEO Analysis: practicekoro.online

Checked 2026-11-01 against the live site. The schema markup committed on `seo/schema-markup` (bd373c7) is **not deployed yet**, so it isn't counted here.

## 1. GEO Readiness Score: 35/100

| Criterion               | Weight | Score | Why                                                                                                                                                           |
| ----------------------- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Citability              | 25%    | 30    | ~650 words of rendered text, mostly short taglines. Only 1 of 5 FAQ answers exists in the page at a time. No facts, figures or definitions an AI could quote. |
| Structural readability  | 20%    | 60    | Clean H1 → H2 → H3, question-style FAQ headings. No tables or lists of facts.                                                                                 |
| Multi-modal             | 15%    | 40    | Exam logos and app mock-ups. "Watch Video" opens a modal; no embedded or linked video an AI can attribute.                                                    |
| Authority & brand       | 20%    | 10    | No authors, no publish/update dates on content, blog is empty, and no brand mentions found anywhere on the web.                                               |
| Technical accessibility | 20%    | 35    | AI _search_ crawlers are allowed (good), but the HTML they receive is an empty app shell. Soft 404s. No structured data live yet.                             |

## 2. Platform readiness (qualitative; not measured with a visibility tool)

| Platform                      | Readiness | Main blocker                                                                                                                  |
| ----------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Google AI Overviews / AI Mode | Low       | Googlebot renders JavaScript so it can see the content, but there's very little content to cite and no ranking footprint yet. |
| ChatGPT Search                | Very low  | OAI-SearchBot is allowed but doesn't run JavaScript, so it sees ~20 words of meta text.                                       |
| Perplexity                    | Very low  | Same as above for PerplexityBot. No Reddit presence, which Perplexity cites heavily.                                          |
| Claude search                 | Very low  | Same as above for Claude-SearchBot.                                                                                           |
| Bing Copilot                  | Unknown   | A request using a bingbot user agent got 403 from Hostinger (see §3).                                                         |

## 3. AI crawler access

Tested with each crawler's user-agent string from a non-crawler IP, plus the robots.txt rules (Cloudflare-managed block + your own block).

**Search / citation crawlers**

| User-agent       | Governs                              | robots.txt | Live response                            |
| ---------------- | ------------------------------------ | ---------- | ---------------------------------------- |
| Googlebot        | Google Search, AI Overviews, AI Mode | Allowed    | **403** (from Hostinger, not Cloudflare) |
| bingbot          | Bing, Copilot                        | Allowed    | **403** (from Hostinger)                 |
| OAI-SearchBot    | ChatGPT Search citations             | Allowed    | 200                                      |
| ChatGPT-User     | ChatGPT browsing for a user          | Allowed    | 200                                      |
| PerplexityBot    | Perplexity search                    | Allowed    | 200                                      |
| Claude-SearchBot | Claude search citations              | Allowed    | 200                                      |

**Training crawlers** (blocking these doesn't affect search visibility)

| User-agent        | Governs                            | robots.txt | Live response           |
| ----------------- | ---------------------------------- | ---------- | ----------------------- |
| GPTBot            | OpenAI training                    | Disallowed | 403 (Cloudflare)        |
| ClaudeBot         | Anthropic training                 | Disallowed | 403 (Cloudflare)        |
| CCBot             | Common Crawl                       | Disallowed | 403 (Cloudflare)        |
| Google-Extended   | Gemini/Vertex training & grounding | Disallowed | n/a (robots token only) |
| Applebot-Extended | Apple Intelligence training        | Disallowed | n/a (robots token only) |

Your training-bot blocks are a reasonable licensing choice and don't hurt search. Blocking **Google-Extended does not** remove you from AI Overviews or AI Mode.

`Content-Signal: search=yes, ai-train=no, use=reference` is set; `ai-input` is not stated, which means neither granted nor refused.

⚠️ **The Googlebot/bingbot 403s need checking.** They come from Hostinger's origin (`platform: hostinger`), which is probably rejecting a _spoofed_ bot because the test came from a non-Google IP. But if it also blocks real crawlers, the site can't be indexed at all. Confirm with **Search Console → URL Inspection → Test live URL** and **Bing Webmaster Tools → URL Inspection**. If either fails, turn off Hostinger's bot protection for verified search engines.

## 4. llms.txt

**Missing.** `/llms.txt` returns **200 with the homepage HTML**, a soft 404. Google states llms.txt has no effect on Search, and no major AI provider has confirmed using it, so it's low priority. The real problem is the soft 404: **every unknown URL returns 200**, which can waste crawl budget and get junk URLs indexed.

## 5. Brand mentions

Web searches for "Practice Koro", "PracticeKoro" and `practicekoro.online` returned **no mentions** on any site, including YouTube, Reddit, Facebook, Wikipedia or LinkedIn. The search tool covers US results only, so Indian coverage may be incomplete, but the footprint is effectively zero.

The footer's social links point to bare `youtube.com`, `t.me`, `facebook.com` and `instagram.com`, so there are no real profiles to link to.

Third-party studies (Ahrefs, Dec 2025) found YouTube mentions correlate with AI citations far more strongly than backlinks do. For a Bengali exam-prep brand, YouTube is the obvious first channel.

## 6. Passage-level citability

- **Rendered text**: ~650 words. Almost all are short marketing lines ("পরীক্ষার প্রস্তুতি এখন আরও গুছানো…"), which give an AI nothing factual to quote.
- **FAQ**: 5 good question headings, but the accordion ([faq-search-accordion.tsx](src/components/ui/faq-search-accordion.tsx)) **removes closed answers from the DOM**. Only the first answer exists when the page loads, so crawlers see 1 of 5 answers. The answers are also 1–2 sentences, with few specifics.
- **No answerable topic pages.** Aspirants ask things like "WBP Constable exam pattern 2026" or "WBSSC Group D syllabus", and the site has no page that answers them. The blog is empty.

## 7. Server-side rendering check

|                          | Words in HTML      | What an AI search crawler sees                            |
| ------------------------ | ------------------ | --------------------------------------------------------- |
| Raw HTML (no JavaScript) | ~20 visible + meta | Title, meta description, OG tags, empty `<div id="root">` |
| After JavaScript         | ~650               | Full landing page                                         |

The site is a client-rendered Vite/React app. Googlebot runs JavaScript; OAI-SearchBot, PerplexityBot and Claude-SearchBot generally don't. **This is the single biggest GEO blocker.**

## 8. Top 5 highest-impact changes

| #   | Change                                                                                                                                                                                | Why (first principle)                                                                    | Depends on                | How you'd know it failed                                             | Leading indicator                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **Prerender public routes** (`/`, `/blog`, `/contact`, legal pages) to static HTML at build time, e.g. with `vite-plugin-prerender` or a small Playwright/`renderToString` build step | Non-JS AI crawlers can only cite text that's in the HTML                                 | —                         | `curl` the homepage still shows `<div id="root"></div>` with no text | `curl -s https://practicekoro.online \| grep -c "Popular Exams"` returns ≥1 |
| 2   | **Confirm real Googlebot/bingbot get 200** (GSC + Bing live tests); fix Hostinger bot protection if not                                                                               | No indexing means no AI Overviews, AI Mode or Copilot                                    | —                         | Live test shows "blocked" or 403                                     | GSC Pages report shows the homepage as Indexed                              |
| 3   | **Publish exam-guide pages**: one per exam (WBP Constable, WBSSC C & D, WBPSC Clerkship…) with exam pattern, syllabus, marking scheme, dates, author and "last updated"               | Gives AI something specific and current to cite; recency strongly affects citation       | 1 (so they're crawlable)  | Pages get no impressions in GSC after 8 weeks                        | GSC impressions for "<exam> syllabus/pattern" queries                       |
| 4   | **Keep all FAQ answers in the DOM** (hide closed ones with CSS or `<details>` instead of unmounting), and expand each to 40–80 specific words                                         | Crawlers can't cite answers that aren't in the page                                      | 1 for non-JS crawlers     | Rendered HTML still holds only one answer                            | Count of answer texts in the prerendered HTML = 5                           |
| 5   | **Build a real brand footprint**: a YouTube channel (solution walkthroughs in Bengali), a working Play Store listing, and real social URLs in the footer and in `sameAs`              | Mentions on other sites are the strongest AI-visibility signal; right now there are none | Fix broken APK/Play links | Brand searches still return nothing in 3 months                      | Branded search impressions in GSC; YouTube subscribers                      |

Also: **deploy the `seo/schema-markup` branch**, and return a real 404 for unknown URLs (Hostinger/`.htaccess` rule, or a prerendered 404 page with a 404 status).

## 9. Schema recommendations

- Deploy the existing branch: EducationalOrganization, WebSite, WebPage, WebApplication with plan offers, ContactPage.
- Once social profiles exist: add `sameAs` to the organization.
- For exam-guide pages: `Article` with `author` (a `Person` with credentials), `datePublished`, `dateModified`, plus `BreadcrumbList`.
- Avoid FAQPage. Google retired FAQ rich results on 2026-05-07, so it gives no SERP benefit.

## 10. Content rewrite suggestions

**FAQ: "মক টেস্টগুলো কি আসল পরীক্ষার সিলেবাস ও নেগেটিভ মার্কিং মেনে তৈরি?"**
Make the answer self-contained and specific. State which exams, the number of questions and time limit for each, the negative-marking ratio used, and the date the test pattern was last checked against the official notification.

**FAQ: "কোন কোন সরকারি চাকরির পরীক্ষার প্রস্তুতি নেওয়া যায়?"**
List every exam by full official name (e.g. "West Bengal Police Constable (WBP)", "WBSSC Group C & D", "WBPSC Clerkship"), with the number of mock tests available for each. Named, countable facts are what gets quoted.

**Hero:** keep the tagline, but add one plain factual sentence under it, e.g. "Practice Koro is a Bengali mock-test platform for West Bengal government job exams (WBP, WBSSC, WBPSC, Railway, SSC), with N+ tests and solutions in Bengali and English." A definition like this, in the first 60 words, is the easiest passage for an AI to quote.

### Not recommended

- **llms.txt**: optional. It doesn't affect Google, and other AI systems haven't confirmed using it. Fix the soft 404 first.
- **Unblocking training crawlers**: has no effect on search citations.
