# MegiLance Project Documentation

**Last Updated:** 2025-08-08

---


## 1. Project Overview & Current Status

This document outlines the complete structure of the MegiLance application, detailing all pages, portals, and layouts. Its purpose is to serve as a clear and organized roadmap for both development and project management.

**Current Implementation Status:**
The project is in the **frontend development phase**. The core focus is on building out the user-facing portals (Admin, Client, Freelancer) with a premium, investor-grade user experience. Several key components and layouts have been established, but many pages are yet to be implemented.

**Progress Key:**
- `[ ]` - **Not Started:** The page or feature has not been designed or coded.
- `[~]` - **In Progress:** The page or feature is currently being designed or coded.
- `[x]` - **Complete:** The page or feature is fully implemented and polished.

---

## 2. Layout Strategy: Portal vs. Simple Website

For a sophisticated SaaS platform like MegiLance, a hybrid approach is most suitable.

-   **Simple Navbar Website:** This layout is ideal for the **public-facing marketing and information pages**. It's clean, familiar to new visitors, and optimized for content consumption and lead generation (e.g., Home, About, Blog, Pricing).

-   **Portal Dashboard Layout:** This layout is essential for the **core application used by logged-in users** (Admins, Clients, and Freelancers). It provides a persistent, feature-rich environment necessary for managing complex workflows like projects, payments, and communication. The sidebar allows for efficient navigation between many different tools and screens.

**Decision:** We will implement **both**. Public pages will use the simple website layout, and all authenticated user-specific functionality will be housed within the appropriate portal dashboard layout.

---

## 3. Page & Feature Breakdown

### 3.1. Public-Facing Website (Simple Navbar Layout)

These pages are for marketing, information, and user acquisition. They do not require a user to be logged in.

-   `[x]` `/` - Home Page
-   `[x]` `/about` - About Us Page
-   `[x]` `/blog` - Blog Posts List
-   `[x]` `/blog/[slug]` - Individual Blog Post
-   `[x]` `/contact` - Contact Us Page
-   `[x]` `/faq` - Frequently Asked Questions
-   `[x]` `/jobs` - Public Job Listings Page
-   `[x]` `/pricing` - Pricing Plans Page
-   `[x]` `/legal/privacy` - Privacy Policy
-   `[x]` `/legal/terms` - Terms of Service
-   `[x]` `/security` - Security Information Page
-   `[x]` `/support` - Support Page
-   `[x]` `/teams` - Teams Page
-   `[x]` `/testimonials` - Testimonials Page
-   `[x]` `/clients` - Page for Showcasing Clients
-   `[x]` `/freelancers` - Page for Browsing Freelancers

#### 3.1.a Public Pages: Specifications & Enhancements

The following expands each public route with structure, UX, SEO, accessibility, and measurement requirements. Use these as acceptance criteria when building or polishing pages. All pages must be responsive, theme-aware, and lighthouse AA compliant.

General requirements (apply to all public pages):
- Header/Footer from the public layout, skip-links, and semantic landmarks (`header`, `nav`, `main`, `footer`).
- SEO: unique `<title>`, `<meta name="description">`, OpenGraph/Twitter cards, canonical URL, and structured data where applicable.
- Performance: image optimization (`next/image`), prefetch critical links, minimal CLS, lazy-load below-the-fold.
- Accessibility: color contrast AA, focus-visible, ARIA labels, keyboard traps avoided, headings hierarchy.
- Analytics: page view + primary CTA events; consent banner if required.
- Internationalization-ready copy blocks (centralized strings), but English default.

Page specs:

- `/` Home
  - Purpose: Convert visitors via clear value prop and primary CTA.
  - Sections: Hero (USP, social proof), Key Benefits, How It Works, Featured Categories, Testimonials, Logos, CTA Banner, Blog Teasers.
  - Components: `Hero`, `BenefitGrid`, `HowItWorks`, `LogoWall`, `TestimonialCarousel`, `CTASection`.
  - SEO: Organization schema, Website/SearchAction, FAQPage (if FAQs present).

- `/about`
  - Purpose: Establish trust and mission.
  - Sections: Story, Mission/Values, Team (with photos), Timeline, Press, Careers CTA.
  - Components: `TeamGrid`, `Timeline`, `PressLogos`.
  - SEO: Organization schema; author profiles with Person schema.

- `/blog`
  - Purpose: Content discovery and SEO hub.
  - Sections: Featured Post, Categories/Tags, Post Grid with pagination, Newsletter signup.
  - Components: `PostCard`, `CategoryPills`, `Pagination`, `SubscribeForm`.
  - SEO: Blog schema; list view structured data; noindex paginated pages beyond page 1 if needed.

- `/blog/[slug]`
  - Purpose: Readable, fast article pages.
  - Features: MDX support, TOC, reading progress, code highlighting, images with captions, author box, related posts.
  - SEO: Article schema with author, datePublished, dateModified, image.
  - Accessibility: Accessible headings, skip TOC, keyboard nav within code blocks.

- `/contact`
  - Purpose: Lead capture and support routing.
  - Sections: Contact form (name/email/message), Department selector, Success/Errors, Office info/map, Support links.
  - Integrations: ReCAPTCHA/Turnstile, CRM webhook.
  - Accessibility: Proper labels, `aria-describedby` for errors, focus management on submit.

- `/pricing`
  - Purpose: Plan comparison and conversion.
  - Sections: Pricing tiers (monthly/annual toggle), Feature matrix, FAQs, Trust badges, CTA.
  - Components: `PricingTable`, `FeatureMatrix`, `FAQAccordion`.
  - SEO: Product/Offer schema with prices; ensure currency formatting.

- `/faq`
  - Purpose: Reduce support load.
  - Features: Search/filter, categories, collapsible items, anchor links for deep-linking.
  - SEO: FAQPage schema.

- `/jobs`
  - Purpose: Public job listings (teaser for platform activity).
  - Features: Filters (category, budget, remote), list with pagination, job detail modal or route, CTA to sign up.
  - Performance: Virtualized list for large result sets.

- `/clients`
  - Purpose: Market to client personas.
  - Sections: Outcomes, Case studies, Workflow, Pricing CTA, Security/Compliance.
  - Components: `CaseStudyCard`, `WorkflowDiagram`, `SecurityBadges`.

- `/freelancers`
  - Purpose: Market to freelancer personas.
  - Sections: Earnings potential, Tools, Success stories, Onboarding steps, CTA.
  - Components: `StepByStep`, `TestimonialCarousel`, `EarningsEstimator` (optional).

- `/legal/privacy`
  - Purpose: Compliance and transparency.
  - Features: Versioned document, sidebar TOC, last updated, anchors.
  - SEO: noindex/nofollow optional; LegalService schema if applicable.

- `/legal/terms`
  - Similar to privacy: versioning, anchors, last updated.

- `/security`
  - Purpose: Communicate security posture.
  - Sections: Infrastructure, Data handling, Compliance badges, Responsible disclosure, Bug bounty link.
  - Schema: Organization/Contact for security.

- `/support`
  - Purpose: Help center entry.
  - Features: Search, categories, popular articles, contact routes, status link.
  - Components: `SearchBar`, `CategoryGrid`, `ArticleList`.

- `/teams`
  - Purpose: Pitch team features.
  - Sections: Roles & permissions, Billing, SSO/SCIM (enterprise), Case studies.
  - Components: `FeatureCallouts`, `IntegrationGrid`.

- `/testimonials`
  - Purpose: Social proof at scale.
  - Features: Filterable testimonials, video support, rating distribution, case study links.

Implementation notes:
- Use `@/lib/seo` helpers to centralize meta/og tags and schema builders.
- Store static content (marketing copy) in JSON/MDX where possible for localization.
- Follow brand playbook for tone, typography scale, and spacing rhythm.

#### 3.1.b Additional Recommended Public Pages

To maximize credibility, SEO, and conversions, add the following routes:

- `/careers` — Open roles, culture, benefits, process, diversity & inclusion statement. Integrate ATS or simple form.
- `/press` — Press kit, boilerplate, media mentions, contact. Link to `Brand/Media Kit`.
- `/brand` (or `/media-kit`) — Logos, color specs, usage guidelines, downloadable assets.
- `/status` — Link/iframe to status page (use external provider). Historical uptime and incident postmortems.
- `/changelog` — Release notes, RSS/Atom feed, product updates. Tag by area.
- `/partners` — Technology and channel partners with badges; inquiry form.
- `/integrations` — Supported integrations and guides. Link cards per integration.
- `/sitemap.xml` & `/robots.txt` — Generated by server; include blog/posts.
- `/accessibility` — WCAG conformance statement, contact for accommodation.
- `/responsible-disclosure` — Security reporting policy and PGP key link.
- `/cookies` — Cookie policy and preferences; integrates with consent banner.

#### 3.1.c Global SEO & Analytics Baseline (Public)

- Central meta + schema utilities in `@/lib/seo`:
  - `buildMeta({ title, description, canonical, noindex })`
  - `buildOG({ title, description, url, image })`
  - Schema builders: `orgSchema`, `articleSchema`, `faqSchema`, `productOfferSchema`.
- Analytics: GA4 or Plausible + server-side events for primary CTAs.
- Sitemaps: dynamic sitemap index; include blog, paginated lists, lastmod.
- Canonical/prev/next for paginated blog and jobs.
- Link prefetch for hero CTAs and common next-step routes.

#### 3.1.d Content Model & CMS Readiness

- Consider MDX for blog and static marketing sections.
- Content types:
  - `Post`: title, slug, excerpt, coverImage, author, tags, publishedAt, updatedAt, bodyMDX.
  - `Testimonial`: name, role, company, quote, avatar, videoURL, rating.
  - `CaseStudy`: logo, title, metrics, storyMDX, industry, link.
- Optional CMS integration (e.g., Contentlayer, Sanity) behind an adapter.

#### 3.1.e Performance & Accessibility Budgets

- LCP < 2.0s (4G), CLS < 0.05, TTI < 3.5s; images lazy by default; preconnect CDN.
- Use `next/font` for brand fonts; subset; display swap.
- Ensure focus-visible styles and skip links; test with keyboard + screen reader.

#### 3.1.f Implementation Checklist (per page)

- [ ] Wireframe → UI implementation matches brand spacing/typography scale.
- [ ] SEO meta + OG + schema set via `@/lib/seo`.
- [ ] Lighthouse AA checks (contrast, headings, landmarks, labels).
- [ ] Analytics page view + CTA events wired.
- [ ] Responsive at 360, 768, 1024, 1280, 1536 breakpoints.
- [ ] Content reviewed for tone per Brand Playbook.

#### 3.1.g Implementation Roadmap (Public Site)

1) Foundations
- [ ] Create `app/layouts/PublicLayout` with Header, Footer, skip-links.
- [ ] Add `@/lib/seo` helpers (meta, OG, schema builders) + tests.
- [ ] Establish `@/styles/tokens.css` variables if not present (colors, spacing, type scale).

2) Core Pages (MVP content)
- [ ] Home, About, Pricing, FAQ, Contact, Blog index/post.
- [ ] Shared components: `Hero`, `CTASection`, `BenefitGrid`, `FAQAccordion`, `PostCard`.

3) Conversion Pages
- [ ] Clients, Freelancers, Testimonials, Teams.
- [ ] Add `CaseStudyCard`, `TestimonialCarousel`, `WorkflowDiagram`.

4) Trust & Compliance
- [ ] Security, Legal (Privacy/Terms), Accessibility, Responsible Disclosure.

5) Operational Pages
- [ ] Careers, Press, Brand/Media Kit, Changelog, Partners, Integrations, Status link.

6) SEO/Perf
- [ ] Sitemaps, robots.txt, canonical/prev/next, preload key fonts, image CDNs.

#### 3.1.h Public Pages Status Matrix

| Route               | Status | Notes |
|---------------------|--------|-------|
| /                   | [ ]    | Hero, benefits, CTA |
| /about              | [ ]    | Team, timeline |
| /blog               | [ ]    | Index w/ pagination |
| /blog/[slug]        | [ ]    | MDX article |
| /contact            | [ ]    | Form + CRM |
| /pricing            | [ ]    | Tiers + matrix |
| /faq                | [ ]    | Accordion + schema |
| /jobs               | [ ]    | Filters + list |
| /clients            | [ ]    | Case studies |
| /freelancers        | [ ]    | Success stories |
| /legal/privacy      | [ ]    | Versioned |
| /legal/terms        | [ ]    | Versioned |
| /security           | [ ]    | Badges + disclosure |
| /support            | [ ]    | Help center entry |
| /teams              | [ ]    | Roles & permissions |
| /testimonials       | [ ]    | Carousel + filters |
| /careers            | [ ]    | ATS integration |
| /press              | [ ]    | Media kit link |
| /brand              | [ ]    | Assets + guidelines |
| /changelog          | [ ]    | RSS feed |
| /partners           | [ ]    | Logos, inquiry |
| /integrations       | [ ]    | Cards + docs |
| /accessibility      | [ ]    | WCAG statement |
| /responsible-disclosure | [ ] | PGP/contact |

#### 3.1.i References

- See `frontend/ROUTES_MAP.md` for route → component mapping.
- See `frontend/ARCHITECTURE_OVERVIEW.md` for layout and styling standards.
- See `frontend/README.md` for auth layout and theming guidelines.

### 3.2. User Authentication (Portal Entry Layout)

These pages manage the entry points into the core application.

-   `[x]` `/login` - User Login (All Roles)
-   `[x]` `/signup` - User Signup (All Roles)
-   `[x]` `/forgot-password` - Forgot Password Form
-   `[x]` `/reset-password` - Reset Password Form

### 3.3. Core Application (Portal Dashboard Layout)

This is the main, authenticated part of the application, divided into role-specific portals and features.

#### 3.3.1. General Authenticated Pages

These pages are accessible to any logged-in user, regardless of their specific role.

-   `[x]` `/dashboard` - Main Dashboard Overview
-   `[x]` `/dashboard/analytics` - Analytics Screen
-   `[x]` `/dashboard/community` - Community/Forum Screen
-   `[x]` `/dashboard/projects` - User's Projects List
-   `[x]` `/dashboard/wallet` - User Wallet/Finance Screen
-   `[x]` `/audit-logs` - User's Account Audit Logs

#### 3.3.2. Admin Portal

-   `[x]` `/admin/dashboard` - Admin Dashboard Overview
-   `[x]` `/admin/users` - User Management
-   `[x]` `/admin/projects` - Platform-wide Project Management
-   `[x]` `/admin/payments` - Platform-wide Payment Management
-   `[x]` `/admin/support` - Admin Support Interface
-   `[x]` `/admin/ai-monitoring` - AI Monitoring Tools
-   `[x]` `/admin/settings` - Admin Settings

#### 3.3.3. Client Portal

-   `[x]` `/client/dashboard` - Client Dashboard Overview
-   `[x]` `/client/post-job` - Post a New Job Form
-   `[x]` `/client/projects` - Client's Projects List
-   `[x]` `/client/projects/[id]` - Individual Project View
-   `[x]` `/client/freelancers` - Browse/Search Freelancers
-   `[x]` `/client/hire` - Hire a Freelancer Process
-   `[x]` `/client/reviews` - Client's Reviews Management
-   `[x]` `/client/payments` - Client's Payment History
-   `[x]` `/client/settings` - Client Account Settings

#### 3.3.3. Freelancer Portal

-   `[~]` `/freelancer/dashboard` - Freelancer Dashboard Overview
-   `[ ]` `/freelancer/profile` - Edit Freelancer Profile
-   `[ ]` `/freelancer/my-jobs` - Freelancer's Active/Past Jobs
-   `[ ]` `/freelancer/proposals` - Manage Job Proposals
-   `[ ]` `/freelancer/contracts` - Manage Contracts
-   `[ ]` `/freelancer/wallet` - Freelancer Payouts/Wallet
-   `[ ]` `/freelancer/analytics` - Freelancer Performance Analytics
-   `[ ]` `/freelancer/settings` - Freelancer Account Settings

#### 3.3.4. Shared Portal Features

These features are accessible within the portal layout for relevant roles.

-   `[x]` `/messages` - User Messages/Inbox
-   `[x]` `/notifications` - User Notifications
-   `[x]` `/search` - In-App Search Results
-   `[x]` `/help` - Help/Support Center

- `/audit-logs`: User's account audit logs
