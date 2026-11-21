# alessiomalerba.it

Personal site of **Alessio Malerba**, Senior Power Platform Solution Architect &
Pro-Dev Security Specialist.

**Live:** <https://alessiomalerba.it>

This is the GitHub **user site** repo (`N0g4D/n0g4d.github.io`). It owns the
`CNAME` file, so it is the repo that serves the apex domain. Deploy here, not
anywhere else.

A static site with no build step, no package manager, no framework and no
third-party requests: the fonts are served from this repo, there are no
trackers and no cookies. It works without JavaScript; the script only adds
interactions on top.

## Contents

| File | Purpose |
| --- | --- |
| `index.html` | All the content and markup |
| `assets/site.css` | All the styles, including the print stylesheet that turns the page into a CV |
| `assets/site.js` | All the interactions (see below). No dependencies |
| `assets/fonts/` | Atkinson Hyperlegible Next and Mono (variable, Latin subset), with their OFL licences |
| `assets/shots/` | Project screenshots, in WebP: the full image and a 960-px-wide thumbnail for each |
| `n0g4d.png` | Favicon and touch icon |
| `og.png` | 1200×630 preview image for links shared on LinkedIn, Slack, etc. |
| `CNAME` | Binds the apex domain `alessiomalerba.it`. **Do not delete**: removing it unbinds the custom domain on the next build |
| `.nojekyll` | Serves the files verbatim, skipping Jekyll processing |

The page runs: hero → `#services` (with `#pricing` and `#stack`) →
`#experience` (with `#education`) → `#work` (open source: `#omega-connect`,
`#omega-mcp`, `#ancorhash`, `#atlantysm`, `#pcf-mega-library`, `#crysm`) →
`#contact` (with `#brief`).

Links to any of those ids open the right row, even if it is collapsed or hidden
by a filter. Old links to `#ancorhash` and `#pricing` still work.

## Design

Two colours and nothing in between: `--ink` and `--paper`, white on black by
default. There are no greys anywhere in the CSS. Emphasis is size, weight or
inversion (hover and selected states swap ink and paper); a quiet line is a
dotted line; the backdrop behind the command palette is a one-bit checkerboard
rather than a translucent grey. The light theme is the same stylesheet with the
two variables swapped.

- **Type:** Atkinson Hyperlegible Next for everything, Atkinson Hyperlegible
  Mono only for things that are literally data (the SHA-256 digests, the brief
  preview, keyboard shortcuts). Both were designed by the Braille Institute for
  legibility, which suits a maximum-contrast page; the slashed zero is part of
  that.
- **Layout:** each section is a title column and a content column. Content is
  rows of "term, then what it means", separated by dotted rules, rather than
  grids of cards.
- **Screenshots** are the one exception to the two colours, and only on
  request: grey on the page, in their own colours on hover and in the viewer.
- **Motion:** one moment only. The hero digest resolves from left to right on
  load. It is skipped under `prefers-reduced-motion`.

## Interactions

All of them run on the visitor's device; nothing is sent anywhere.

- **Command palette** (`⌘K` / `Ctrl K`, or the Menu button on small screens):
  jump to any section or project, copy the email address, invert colours,
  print. On touch screens it opens without popping up the keyboard.
- **Invert colours:** remembered in `localStorage` and applied before first
  paint, so there is no flash.
- **Live SHA-256** of the motto in the hero, and a hasher inside the Ancorhash
  entry: type text, choose or drop a file, compare against a digest you already
  have. It uses Web Crypto, with a small pure-JS fallback for pages opened over
  plain HTTP.
- **Project filter** by area (AI agents, Web3, Power Platform).
- **Screenshots** inside a project open full size in a viewer (arrow keys
  move between them, Esc closes). Without JavaScript a thumbnail is a plain
  link to the full image, and Ctrl/⌘-click opens it in a new tab either way.
  Images load only when their project is opened.
- **Write a brief:** a few choices and a few lines turn into a draft in the
  visitor's own mail app (a `mailto:` link). The "Start a … brief" buttons
  preselect the kind of work.
- **Print as a CV:** prints two A4 pages with name, contacts, summary, stack,
  experience, education and one line per project. Services, rates, the brief and
  the project write-ups stay on screen.
- **Permalinks:** a `#` beside each section title. The target comes from the
  heading's `data-anchor` attribute, so rewording a title doesn't change its
  link.

## Running locally

Serve the folder; opening `index.html` from disk works too, but a server
matches production:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Editing

- **Contact address:** `info@alessiomalerba.it` appears 11 times in
  `index.html` (links, copy buttons, structured data) and once in
  `assets/site.js` (`EMAIL`). Change them together.
- **A new project:** copy one of the `<details class="entry entry-named
  project">` blocks in `#work`, give it a new `id`, set `data-areas` (space
  separated: `agents`, `web3`, `power-platform`) and update the
  `github.com/N0g4D/…` line inside it, which is what the printed CV shows. The
  filter counts and the palette pick it up on their own.
- **A screenshot:** save two WebP files in `assets/shots/`, the full image
  (up to 1600 px wide) as `<project>-<what>.webp` and a 960-px-wide copy as
  `<project>-<what>-960.webp`. Then add an `<li>` to the project's
  `<ul class="shots">` (copy the one in `#crysm`; a project without
  screenshots needs the whole `<ul>`, after its description): `data-w` and
  `data-h` are the full image's size, `width` and `height` the thumbnail's.
  Write the `alt` text for someone who can't see the image and keep the
  caption to one line. Thumbnails are cropped to 16:10 from the top; the
  viewer shows the whole image. With an odd number of screenshots, the first
  one spans the full width. Leave out client work, emails and tenant names.
- **A new section:** add a `<section class="section" id="…">`, a link in
  `<nav id="nav">` (the palette and the current-section highlight read the nav)
  and `data-anchor` on its title.
- **What prints:** controlled by `.no-print`, `.print-only` and the `@media
  print` block at the end of `site.css`. In `#services`, only elements with
  the `cv` class print.
- **Controls that need JavaScript** carry `data-js hidden` in the markup and
  are revealed by the script, so visitors without it never see a dead button.

## Deployment

Served by **GitHub Pages** from the root of `main`. Every push publishes; there
is no workflow or build stage.

The custom domain is bound by the tracked `CNAME` file. Deleting and recreating
it re-runs GitHub's domain check and can leave the site on an older successful
build, so leave it in place. DNS points the apex at GitHub's Pages servers via
four `A` records (`185.199.108-111.153`) plus the matching `AAAA` records; see
GitHub's
[custom domain documentation](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

> **Note on duplication.** An older version of this page lives in
> [`alessiomalerba.it-landing`](https://github.com/N0g4D/alessiomalerba.it-landing),
> where it was first built, and publishes to
> `alessiomalerba.it/alessiomalerba.it-landing/`. This repo is the source now;
> that copy is not kept in sync.

## Licence

Code is free to reuse. The written content, CV and personal details are not;
please swap them for your own. The fonts are under the SIL Open Font Licence
(see `assets/fonts/`).
