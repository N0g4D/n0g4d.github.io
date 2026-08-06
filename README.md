# alessiomalerba.it

Personal landing page of **Alessio Malerba** — Senior Power Platform Solution
Architect & Pro-Dev Security Specialist.

**Live:** <https://alessiomalerba.it>

This is the GitHub **user site** repo (`N0g4D/n0g4d.github.io`). It owns the
`CNAME` file, so it is the repo that serves the apex domain — deploy here, not
anywhere else.

A single-file, dependency-free static site: dark, minimal, terminal-flavoured,
with documentation-style anchor links on every heading. No build step, no
package manager, no framework.

## Contents

| File | Purpose |
| --- | --- |
| `index.html` | The entire site — markup, config and scripts in one file |
| `CNAME` | Binds the apex domain `alessiomalerba.it`. **Do not delete** — removing it unbinds the custom domain on the next build |
| `.nojekyll` | Serves the files verbatim, skipping Jekyll processing |
| `README.md` | This file |

The page runs: hero → `#services` → `#experience` → `#ancorhash` → `#pricing`
→ `#contact`. Content is the real CV — certifications, dated engagements with
their delivery metrics, education — plus a section on
[**Ancorhash**](https://github.com/N0g4D/azure-web3-notarizer), the flagship
open-source project (browser-side SHA-256 anchored on Polygon, with opt-in
Azure AI document extraction).

> **Note on duplication.** The same page also lives in
> [`alessiomalerba.it-landing`](https://github.com/N0g4D/alessiomalerba.it-landing),
> which is where it was built. That repo publishes to
> `alessiomalerba.it/alessiomalerba.it-landing/`. Any edit made there has to be
> copied here, or the two drift apart — this repo is the one the domain serves.

## Stack

Everything is loaded from a CDN at runtime; there is nothing to install.

- **[Tailwind CSS](https://tailwindcss.com)** (Play CDN) — utility classes,
  configured inline in a `tailwind.config` block
- **[AnchorJS 4.3.1](https://www.bryanbraun.com/anchorjs/)** — `#` anchor links
  injected into every `h2` and `h3`
- **[Inter](https://fonts.google.com/specimen/Inter)** — UI and body copy
- **[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)** —
  buttons, labels, technical details, terminal blocks

## Design notes

- Absolute black background (`bg-black`), white headings, `zinc-400` body copy,
  `zinc-500/600` for secondary detail
- Thin `border-zinc-800` outlines and `rounded-sm` corners — no shadows, no
  gradients, no backdrop blur
- Grids share a single outer border and separate cells with `divide-x`, so card
  groups read as a table rather than as floating panels
- Monospace is reserved for anything technical; sans-serif carries the prose

### Anchor links

AnchorJS adds a hover-revealed `#` beside each `h2` and `h3`. The custom CSS in
`<head>` restyles it for the dark theme (zinc-700 → white on hover, monospace,
size-matched to the heading) and adds a `:focus-visible` state so keyboard users
can reach anchors that are otherwise hover-only.

Headings without an explicit `id` get one generated from their text, which means
**changing a heading's wording changes its permalink**. If you want to share a
stable deep link, add an explicit `id` to that heading first.

## Running locally

```bash
open index.html
```

Or serve it, which more closely matches production:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Editing

The page is a flat sequence of `<section>` elements, each with the `id` used by
the navbar and footer links:

```
navbar → hero → #services → #experience → #ancorhash → #pricing → #contact → footer
```

- **Contact address** — `info@alessiomalerba.it` appears in 9 `mailto:` links;
  change them together.
- **Adding a section** — copy an existing `<section>`, give it a new `id`, and
  add the matching link to both the desktop nav and the mobile menu.
- **Colours and fonts** — the palette is stock Tailwind `zinc`; the font stacks
  live in the `tailwind.config` block at the top of the file.

## Deployment

Served by **GitHub Pages** from the root of `main`. Every push publishes; there
is no workflow or build stage.

The custom domain is bound by the tracked `CNAME` file. Deleting and recreating
it re-runs GitHub's domain check and can leave the site on an older successful
build, so leave it in place. DNS points the apex at GitHub's Pages servers via
four `A` records (`185.199.108-111.153`) plus the matching `AAAA` records; see
GitHub's
[custom domain documentation](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Licence

Code is free to reuse. The written content, CV and personal details are not —
please swap them for your own.
