/*
 * alessiomalerba.it — interactions.
 *
 * No dependencies and no network requests: everything below runs on the
 * visitor's device. The page works without this file; controls that need it
 * are marked data-js in the markup and stay hidden until it loads.
 */
(() => {
  'use strict';

  const EMAIL = 'info@alessiomalerba.it';
  const MAX_FILE = 256 * 1024 * 1024;

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('js');
  $$('[data-js]').forEach((el) => { el.hidden = false; });

  /* ── Announcements for screen readers ─────────────────────────────────── */

  const live = $('#live');
  let liveTimer;

  function announce(message) {
    live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = message; }, 40);
  }

  /* ── Invert colours ───────────────────────────────────────────────────── */

  const invertButton = $('#invert');
  const themeMeta = $('meta[name="theme-color"]');
  const theme = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  function applyTheme(next, remember) {
    root.setAttribute('data-theme', next);
    invertButton.setAttribute('aria-pressed', String(next === 'light'));
    themeMeta.setAttribute('content', next === 'light' ? '#ffffff' : '#000000');
    if (remember) {
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode: fine */ }
    }
  }

  function invert() {
    const next = theme() === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
    announce(next === 'light' ? 'Colours inverted: black on white' : 'Colours inverted: white on black');
  }

  applyTheme(theme(), false);
  invertButton.addEventListener('click', invert);

  /* ── Copy to clipboard ────────────────────────────────────────────────── */

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the old way */ }

    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', '');
    scratch.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(scratch);
    scratch.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    scratch.remove();
    return ok;
  }

  function flash(button, text) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.textContent = text;
    clearTimeout(button.flashTimer);
    button.flashTimer = setTimeout(() => { button.textContent = button.dataset.label; }, 1600);
  }

  async function copyFrom(button, text, what) {
    const ok = await copyText(text);
    flash(button, ok ? 'Copied' : 'Copy failed');
    announce(ok ? `${what} copied` : `${what} could not be copied. It is ${text}`);
  }

  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => copyFrom(button, button.dataset.copy, 'Email address'));
  });

  /* ── Project filter ───────────────────────────────────────────────────── */

  const filterButtons = $$('#filters [data-filter]');
  const projects = $$('.project');
  const inArea = (project, area) => area === 'all' || project.dataset.areas.split(' ').includes(area);
  let currentFilter = 'all';

  filterButtons.forEach((button) => {
    const count = projects.filter((project) => inArea(project, button.dataset.filter)).length;
    $('.count', button).textContent = String(count);
  });

  function setFilter(area, quiet) {
    currentFilter = area;
    let shown = 0;
    projects.forEach((project) => {
      const show = inArea(project, area);
      project.hidden = !show;
      if (show) shown += 1;
    });
    filterButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === area));
    });
    if (!quiet) announce(`${shown} ${shown === 1 ? 'project' : 'projects'} shown`);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });

  /* ── Getting to a place on the page ───────────────────────────────────── */

  // A target can sit inside a closed row or a filtered-out project.
  function prepare(id) {
    const target = id ? document.getElementById(id) : null;
    if (!target) return null;
    const project = target.closest('.project');
    if (project && project.hidden) setFilter('all', true);
    for (let el = target; el; el = el.parentElement) {
      if (el.tagName === 'DETAILS' && !el.open) el.open = true;
    }
    return target;
  }

  function goTo(id) {
    const target = prepare(id);
    if (!target) return;
    if (location.hash === `#${id}`) target.scrollIntoView();
    else location.hash = id;
  }

  function followHash(arriving) {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    const target = prepare(id);
    if (!target) return;
    // Arriving on a deep link jumps, like the browser's own fragment scroll.
    if (arriving) root.style.scrollBehavior = 'auto';
    target.scrollIntoView();
    root.style.scrollBehavior = '';
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) prepare(link.hash.slice(1));
  });
  window.addEventListener('hashchange', () => followHash(false));
  if (location.hash) followHash(true);

  /* ── Permalinks: a # beside each section title ────────────────────────── */

  // The target is declared in the markup, so rewording a title keeps its link.
  $$('[data-anchor]').forEach((heading) => {
    const link = document.createElement('a');
    link.className = 'anchor';
    link.href = `#${heading.dataset.anchor}`;
    link.textContent = '#';
    link.setAttribute('aria-label', `Link to ${heading.textContent.trim()}`);
    heading.append(link);
  });

  /* ── Where am I: current section in the header ────────────────────────── */

  const navLinks = $$('#nav a');
  const sections = navLinks.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  const crumb = $('#crumb');

  function setCurrent(id) {
    let name = '';
    navLinks.forEach((link) => {
      if (link.hash === `#${id}`) {
        link.setAttribute('aria-current', 'true');
        name = link.textContent.trim().toLowerCase();
      } else {
        link.removeAttribute('aria-current');
      }
    });
    crumb.textContent = name;
  }

  if ('IntersectionObserver' in window) {
    const crossing = new Set();
    // The "reading line" sits a third of the way down the viewport.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) crossing.add(entry.target.id);
        else crossing.delete(entry.target.id);
      });
      const current = sections.find((section) => crossing.has(section.id));
      setCurrent(current ? current.id : '');
    }, { rootMargin: '-34% 0px -65% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  /* ── SHA-256 ──────────────────────────────────────────────────────────── */

  /* sha256js:start */
  // Fallback for pages served without HTTPS, where Web Crypto is unavailable.
  // Plain FIPS 180-4; the round constants are derived instead of pasted.
  const SHA256_K = (() => {
    const k = [];
    for (let n = 2; k.length < 64; n += 1) {
      let prime = true;
      for (let d = 2; d * d <= n; d += 1) {
        if (n % d === 0) { prime = false; break; }
      }
      if (prime) k.push(Math.floor((Math.cbrt(n) % 1) * 4294967296));
    }
    return new Uint32Array(k);
  })();

  function sha256js(data) {
    const h = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);
    const length = data.length;
    const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
    padded.set(data);
    padded[length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor((length * 8) / 4294967296));
    view.setUint32(padded.length - 4, (length * 8) >>> 0);

    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let t = 0; t < 16; t += 1) w[t] = view.getUint32(offset + t * 4);
      for (let t = 16; t < 64; t += 1) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = w[t - 16] + s0 + w[t - 7] + s1;
      }

      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t += 1) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + s1 + ch + SHA256_K[t] + w[t]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d;
      h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    return Array.from(h, (word) => word.toString(16).padStart(8, '0')).join('');
  }
  /* sha256js:end */

  async function sha256(bytes) {
    if (window.crypto && window.crypto.subtle) {
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    return sha256js(bytes);
  }

  // 64 hex characters in eight groups of eight, which is how people compare them.
  function renderDigest(el, hex) {
    el.textContent = '';
    for (let i = 0; i < 64; i += 8) {
      const group = document.createElement('b');
      group.textContent = hex.slice(i, i + 8);
      el.append(group, ' ');
    }
  }

  // The one piece of motion on the page: the digest resolves left to right.
  function settleDigest(el, hex) {
    if (reduceMotion) { renderDigest(el, hex); return; }
    const glyphs = '0123456789abcdef';
    const duration = 900;
    const started = performance.now();
    const frame = (now) => {
      const settled = Math.min(64, Math.floor(((now - started) / duration) * 64));
      let shown = hex.slice(0, settled);
      for (let i = settled; i < 64; i += 1) shown += glyphs[(Math.random() * 16) | 0];
      renderDigest(el, shown);
      if (settled < 64) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const encoder = new TextEncoder();
  const mottoText = $('#motto').textContent.replace(/\s+/g, ' ').trim();

  sha256(encoder.encode(mottoText))
    .then((hex) => settleDigest($('#motto-digest'), hex))
    .catch(() => { $('#proof').hidden = true; });

  /* ── Hasher: step one of Ancorhash, live ──────────────────────────────── */

  const hasher = $('#hasher');
  const hashText = $('#hash-text');
  const hashFile = $('#hash-file');
  const hashDigest = $('#hash-digest');
  const hashMeta = $('#hash-meta');
  const hashExpected = $('#hash-expected');
  const hashVerdict = $('#hash-verdict');
  let currentDigest = '';
  let hashJob = 0;

  const byteCount = (n) => (n === 1 ? '1 byte' : `${n.toLocaleString('en-GB')} bytes`);

  function compare() {
    const pasted = hashExpected.value.trim().toLowerCase().replace(/^0x/, '').replace(/[\s:]/g, '');
    let state = 'idle';
    let text = 'Paste 64 hex characters to compare';
    if (pasted) {
      if (/[^0-9a-f]/.test(pasted)) {
        state = 'invalid';
        text = 'A SHA-256 digest only has the characters 0 to 9 and a to f';
      } else if (pasted.length !== 64) {
        state = 'invalid';
        text = `${pasted.length} of 64 characters`;
      } else if (pasted === currentDigest) {
        state = 'match';
        text = 'Match: same bytes, same digest';
      } else {
        state = 'differ';
        text = 'No match: these are not the same bytes';
      }
    }
    if (hashVerdict.textContent !== text) hashVerdict.textContent = text;
    hashVerdict.dataset.state = state;
  }

  async function hashBytes(bytes, description) {
    const job = ++hashJob;
    const hex = await sha256(bytes);
    if (job !== hashJob) return; // a newer input overtook this one
    currentDigest = hex;
    renderDigest(hashDigest, hex);
    hashMeta.textContent = description;
    compare();
  }

  function hashTyped() {
    const bytes = encoder.encode(hashText.value);
    return hashBytes(bytes, `SHA-256 of ${byteCount(bytes.length)} of text`);
  }

  async function hashPicked(file) {
    if (!file) return;
    if (file.size > MAX_FILE) {
      hashMeta.textContent = `${file.name} is over 256 MB. This demo reads the whole file into memory, so pick a smaller one.`;
      announce('That file is too large for this demo');
      return;
    }
    hashMeta.textContent = `Reading ${file.name}`;
    try {
      const buffer = await file.arrayBuffer();
      await hashBytes(
        new Uint8Array(buffer),
        `SHA-256 of ${file.name}, ${byteCount(file.size)}. It was read on this device and went nowhere.`,
      );
      announce(`Digest computed for ${file.name}`);
    } catch (e) {
      hashMeta.textContent = `${file.name} could not be read. Try another file.`;
    }
  }

  hashText.addEventListener('input', hashTyped);
  hashExpected.addEventListener('input', compare);
  $('#hash-pick').addEventListener('click', () => hashFile.click());
  hashFile.addEventListener('change', () => {
    hashPicked(hashFile.files[0]);
    hashFile.value = '';
  });
  $('#hash-copy').addEventListener('click', (event) => copyFrom(event.currentTarget, currentDigest, 'Digest'));

  ['dragenter', 'dragover'].forEach((type) => {
    hasher.addEventListener(type, (event) => {
      event.preventDefault();
      hasher.classList.add('is-over');
    });
  });
  hasher.addEventListener('dragleave', (event) => {
    if (!hasher.contains(event.relatedTarget)) hasher.classList.remove('is-over');
  });
  hasher.addEventListener('drop', (event) => {
    event.preventDefault();
    hasher.classList.remove('is-over');
    hashPicked(event.dataTransfer.files[0]);
  });

  hashTyped();

  /* ── Brief: a draft for the visitor's own mail app ────────────────────── */

  const briefForm = $('#brief-form');
  const briefPreview = $('#brief-preview');
  const briefOpen = $('#brief-open');

  const KINDS = {
    consulting: { subject: 'Consulting enquiry', need: 'consulting: an assessment, a review or advice' },
    project: { subject: 'Project enquiry', need: 'a project with a defined scope' },
    retainer: { subject: 'Retainer enquiry', need: 'a retainer: ongoing capacity with my team' },
    unsure: { subject: 'Enquiry', need: 'not sure yet, let\'s talk' },
  };

  function draftBrief() {
    const data = new FormData(briefForm);
    const kind = KINDS[data.get('kind')] || KINDS.unsure;
    const areas = data.getAll('area');
    const about = String(data.get('about') || '').trim();
    const from = String(data.get('from') || '').trim();

    const subject = areas.length ? `${kind.subject}: ${areas.join(', ')}` : kind.subject;
    const lines = ['Hello Alessio,', '', `I'm looking for: ${kind.need}`];
    if (areas.length) lines.push(`Area: ${areas.join(', ')}`);
    lines.push(`Timing: ${data.get('timing')}`);
    if (about) lines.push('', about);
    if (from) lines.push('', from);
    return { subject, body: lines.join('\n') };
  }

  function refreshBrief() {
    const { subject, body } = draftBrief();
    briefPreview.textContent = `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`;
    const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
    briefOpen.href = `mailto:${EMAIL}?${query}`;
  }

  briefForm.addEventListener('input', refreshBrief);
  briefForm.addEventListener('change', refreshBrief);
  briefForm.addEventListener('submit', (event) => event.preventDefault());
  $('#brief-copy').addEventListener('click', (event) => {
    copyFrom(event.currentTarget, briefPreview.textContent, 'Draft');
  });

  // "Start a project brief" and its siblings preselect the kind of work.
  $$('[data-brief]').forEach((link) => {
    link.addEventListener('click', () => {
      const option = $(`input[name="kind"][value="${link.dataset.brief}"]`, briefForm);
      if (option) option.checked = true;
      refreshBrief();
    });
  });

  refreshBrief();

  /* ── Screenshots: the full image in a viewer ──────────────────────────── */

  // Without this script, a thumbnail is a plain link to the full image.
  const viewer = $('#viewer');
  const viewerImg = $('#viewer-img');
  const viewerTitle = $('#viewer-title');
  const viewerCaption = $('#viewer-caption');
  const viewerPrev = $('#viewer-prev');
  const viewerNext = $('#viewer-next');
  let shotSet = [];
  let shotLabel = '';
  let shotIndex = 0;

  function showShot(index) {
    shotIndex = (index + shotSet.length) % shotSet.length;
    const link = shotSet[shotIndex];
    const caption = $('figcaption', link.closest('figure'));
    viewerImg.width = Number(link.dataset.w) || 0;
    viewerImg.height = Number(link.dataset.h) || 0;
    viewerImg.src = link.href;
    viewerImg.alt = $('img', link).alt;
    viewerCaption.textContent = caption ? caption.textContent : '';
    viewerTitle.textContent = shotSet.length > 1
      ? `${shotLabel}, ${shotIndex + 1} of ${shotSet.length}`
      : shotLabel;
  }

  $$('.shot').forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      // Let Ctrl/Cmd-click and middle-click open the image in a new tab.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const set = link.closest('.shots');
      shotSet = $$('.shot', set);
      shotLabel = set.getAttribute('aria-label') || 'Screenshot';
      viewerPrev.hidden = shotSet.length < 2;
      viewerNext.hidden = shotSet.length < 2;
      showShot(shotSet.indexOf(link));
      viewer.showModal();
    });
  });

  viewerPrev.addEventListener('click', () => showShot(shotIndex - 1));
  viewerNext.addEventListener('click', () => showShot(shotIndex + 1));
  $('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('keydown', (event) => {
    if (shotSet.length < 2) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); showShot(shotIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showShot(shotIndex + 1); }
  });
  viewer.addEventListener('close', () => viewerImg.removeAttribute('src'));

  /* ── Print as a CV ────────────────────────────────────────────────────── */

  let openedForPrint = [];
  let filterBeforePrint = 'all';

  window.addEventListener('beforeprint', () => {
    filterBeforePrint = currentFilter;
    setFilter('all', true);
    openedForPrint = $$('details:not([open])');
    openedForPrint.forEach((row) => { row.open = true; });
  });
  window.addEventListener('afterprint', () => {
    openedForPrint.forEach((row) => { row.open = false; });
    openedForPrint = [];
    setFilter(filterBeforePrint, true);
  });

  /* ── Command palette (and, on small screens, the menu) ────────────────── */

  const palette = $('#palette');
  const paletteInput = $('#palette-input');
  const paletteList = $('#palette-list');
  const paletteHelp = $('#palette-help');
  let paletteHelpText = paletteHelp.textContent;
  const isApple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

  $('#palette-kbd').textContent = isApple ? '⌘K' : 'Ctrl K';

  const commands = [];
  function command(group, label, run, hint = '', words = '') {
    commands.push({ group, label, run, hint, haystack: `${label} ${group} ${hint} ${words}`.toLowerCase() });
  }

  command('Go to', 'Top', () => goTo('top'), '', 'home start');
  navLinks.forEach((link) => {
    command('Go to', link.textContent.trim(), () => goTo(link.hash.slice(1)));
  });
  command('Go to', 'How we can work', () => goTo('pricing'), '', 'pricing engagement consulting project retainer rates');
  command('Go to', 'Stack', () => goTo('stack'), '', 'technologies skills tools');
  command('Go to', 'Training and education', () => goTo('education'), '', 'degree certifications pl-600 pl-400');

  projects.forEach((project) => {
    command('Projects', $('h3', project).textContent, () => goTo(project.id), $('.area', project).textContent, $('.gist', project).textContent);
  });

  command('Do', 'Copy email address', async () => {
    const ok = await copyText(EMAIL);
    announce(ok ? 'Email address copied' : `Email address could not be copied. It is ${EMAIL}`);
  }, EMAIL, 'contact mail');
  command('Do', 'Write an email', () => { location.href = `mailto:${EMAIL}`; }, '', 'contact mail');
  command('Do', 'Write a brief', () => goTo('brief'), '', 'contact enquiry quote');
  command('Do', 'Hash a text or a file', () => goTo('hasher'), 'SHA-256', 'ancorhash digest verify checksum');
  command('Do', 'Invert colours', invert, '', 'theme dark light black white');
  command('Do', 'Print as a CV', () => window.print(), '', 'pdf resume curriculum download');

  command('Elsewhere', 'GitHub', () => { location.href = 'https://github.com/N0g4D'; }, 'github.com/N0g4D');
  command('Elsewhere', 'LinkedIn', () => { location.href = 'https://www.linkedin.com/in/alessiomalerba-tech/'; }, 'linkedin.com');

  let matches = [];
  let active = 0;

  // Words found in a command's own label count more than words in its hints,
  // so "omega mcp" picks omega-mcp and "hash" picks the hasher.
  function score(item, words) {
    const label = item.label.toLowerCase();
    return words.reduce((total, word) => {
      if (label.startsWith(word)) return total + 3;
      if (label.includes(word)) return total + 2;
      return total;
    }, 0);
  }

  function setActive(index, scroll) {
    active = index;
    $$('[role="option"]', paletteList).forEach((option, i) => {
      option.setAttribute('aria-selected', String(i === index));
      if (i === index) {
        paletteInput.setAttribute('aria-activedescendant', option.id);
        if (scroll) option.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function runCommand(index) {
    const chosen = matches[index];
    if (!chosen) return;
    palette.close();
    chosen.run();
  }

  function renderPalette() {
    const words = paletteInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    matches = commands.filter((item) => words.every((word) => item.haystack.includes(word)));
    paletteList.textContent = '';
    paletteInput.removeAttribute('aria-activedescendant');

    if (!matches.length) {
      paletteHelp.textContent = 'Nothing matches. Try "services", "hash" or "email".';
      return;
    }
    paletteHelp.textContent = paletteHelpText;

    let group = null;
    let box = null;
    matches.forEach((item, index) => {
      if (item.group !== group) {
        group = item.group;
        box = document.createElement('div');
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', group);
        const heading = document.createElement('div');
        heading.className = 'palette-group';
        heading.setAttribute('aria-hidden', 'true');
        heading.textContent = group;
        box.append(heading);
        paletteList.append(box);
      }
      const option = document.createElement('div');
      option.id = `command-${index}`;
      option.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = item.label;
      option.append(label);
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'hint';
        hint.textContent = item.hint;
        option.append(hint);
      }
      option.addEventListener('click', () => runCommand(index));
      option.addEventListener('mousemove', () => { if (active !== index) setActive(index, false); });
      box.append(option);
    });

    let best = 0;
    matches.forEach((item, index) => {
      if (score(item, words) > score(matches[best], words)) best = index;
    });
    setActive(best, true);
  }

  function openPalette() {
    if (palette.open) return;
    // On touch screens, opening the menu should not also open the keyboard.
    const touch = window.matchMedia('(pointer: coarse)').matches;
    paletteHelpText = touch
      ? 'Tap a command, or type to filter.'
      : 'Type to filter. Arrow keys to move, Enter to run, Esc to close.';
    paletteInput.value = '';
    renderPalette();
    paletteInput.autofocus = !touch;
    paletteList.autofocus = touch;
    if (touch) paletteList.tabIndex = -1;
    else paletteList.removeAttribute('tabindex');
    palette.showModal();
    paletteList.scrollTop = 0;
  }

  paletteInput.addEventListener('input', renderPalette);
  paletteInput.addEventListener('keydown', (event) => {
    const last = matches.length - 1;
    if (event.key === 'ArrowDown') { event.preventDefault(); if (last >= 0) setActive(active >= last ? 0 : active + 1, true); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); if (last >= 0) setActive(active <= 0 ? last : active - 1, true); }
    else if (event.key === 'Home' && last >= 0) { event.preventDefault(); setActive(0, true); }
    else if (event.key === 'End' && last >= 0) { event.preventDefault(); setActive(last, true); }
    else if (event.key === 'Enter') { event.preventDefault(); runCommand(active); }
  });

  // A click on the dimmed page, outside the box, closes it.
  palette.addEventListener('click', (event) => {
    if (event.target === palette) palette.close();
  });

  $('#open-palette').addEventListener('click', openPalette);

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (palette.open) palette.close();
      else openPalette();
    }
  });

  /* ── Buttons that name an action ──────────────────────────────────────── */

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'print') window.print();
    if (button.dataset.action === 'palette') openPalette();
  });
})();
