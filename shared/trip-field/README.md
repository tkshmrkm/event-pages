# Overseas Trip Field Layout

Reusable foundation for static overseas-business-trip pages in this repository.
It standardizes field operation without forcing every event to share the same
visual design.

This is the default note format for future exhibitions, conferences, lectures,
factory visits, and similar field-research trips. Event pages may differ
visually, but should reuse the storage, synchronization, and final-download
workflow unless there is a concrete reason not to.

## Stable interaction contract

Every new trip page should have only three primary field sections:

1. `旅程` — continuous-scroll daily itinerary with a horizontally scrollable date rail.
2. `会場` — event-specific targets and two-part notes: preparation plus same-day notes.
3. `記録` — review, Markdown copy/download, JSON backup, and JSON restore.

Preparation and documents are secondary content inside the itinerary or a
separate pre-departure page. The family view is a separate responsive/print
page. Traveler colors appear only where people actually split; merged travel
uses a neutral surface.

## Shared versus event-specific

Shared:

- three-section navigation and date rail;
- 44 px or larger controls and 16 px input text;
- immediate local browser persistence plus optional Cloudflare synchronization;
- named, timestamped shared append entries that do not overwrite another device's entry;
- JSON export/import format;
- an online smartphone page plus a self-contained desk-print backup;
- responsive targets around iPhone 16 (393 px) and Pixel 7a/8a (412 px).
- EUROBLECH-style transport icons: `.flight-mark` (SVG mask) for flights and `.mode-icon mode-icon-{train|walk|car|unknown}` (inline SVG) for every other mode, matched in size and color. Neither colored emoji nor the monochrome text `✈︎` is used. Reserve `unknown` for a genuinely undecided mode; use words such as `発` and `着` rather than OS-dependent colored departure/arrival emoji.
- No emoji in generated output — not one. Transport modes, activity kinds (meals, sightseeing, lodging, factory visits), action buttons (download, delete, copy), and heading ornaments are all monochrome SVG. Two reasons: emoji whose Unicode default presentation is text (🍽 🏛 ℹ and others) render as black outline glyphs on Windows, and mixing colored emoji with monochrome SVG makes the icon set look unfinished. Flag emoji are dropped rather than redrawn — Windows shows them as the letters DE and JP. Test for this with the `Extended_Pictographic` property, not a list of codepoints; a three-codepoint check once let 49 occurrences through.
- Icon size follows where the icon sits. `.flight-mark` and `.mode-icon` stay a fixed 20px because they occupy a column of their own and set the row height. `.line-icon` — the monochrome SVG that replaces glyphs such as 🖨 🗓 🗺 inside headings, buttons, and running text — is sized in `em` (`1.15em`), so it tracks whatever text surrounds it. A fixed pixel box reads as larger than the text it sits in wherever that text is 13–14px. Events may override the color of `.line-icon`; they must not override its size.
- Field-guide prose, not an essay. An always-visible supporting line carries a fact in roughly 30 characters or fewer; reasons, criteria and conditions go inside a `details.fold`. Name the fold's `summary` after what it holds (`やること`, `過ごし方`, `ラウンジの利用資格`) so it reads without opening; never `続きを読む`. Always-visible lines end without a full stop, since they are labels rather than sentences; text inside a fold is exempt. The character count is a guide, not a rule — a single fact may run longer, and a short explanation still belongs in the fold.

Event-specific:

- palette, typography emphasis, header treatment, and card geometry;
- itinerary content and traveler lanes;
- venue record type (session, exhibitor, factory visit, meeting, etc.);
- family-facing wording and print content.

The record unit may be a session, exhibitor/booth, factory visit, meeting, or
other event-specific target. Each unit should normally provide `事前の狙い・質問`
and `当日メモ`. Additional fields such as follow-up actions may be added without
changing the three primary sections.

## Files

- `core.css` — neutral responsive shell and component classes.
- `runtime.js` — namespaced browser storage, autosave, tab switching, and JSON transfer.
- `theme-template.css` — copy and change only the design tokens for a new event.
- `template.html` — minimal working three-section page.
- `build-desk-print.mjs` — creates one self-contained, non-interactive desk-print HTML file.

## Data attributes

The generic runtime recognizes:

- `body[data-trip-key]` — required local-storage namespace.
- `[data-trip-tab="name"]` — primary navigation control.
- `[data-trip-panel="name"]` — corresponding panel.
- `[data-trip-store="key"]` — autosaved input, textarea, select, or checkbox.
- `textarea[data-trip-append-timestamp]` — mounts a shared-note composer for that field.
- `[data-trip-export-json]` — download all values in the namespace.
- `[data-trip-import-json]` — JSON file input.
- `[data-trip-download-markdown]` — download a readable final memo on a PC.
- `[data-trip-status]` — short live status message.
- `[data-trip-cloud]` — optional Cloudflare synchronization panel.
- `[data-trip-cloud-key]` — runtime-only synchronization key input.
- `[data-trip-cloud-pull]` / `[data-trip-cloud-push]` — explicit cloud transfer controls.

The shared JSON schema is `trip-field-records`, version `1`. Event-specific
keys may vary, but should use readable prefixes such as `session:`,
`exhibitor:`, `factory:`, `day:`, and `trip:`.

## Starting a new trip

1. Copy `template.html` into the event folder.
2. Copy `theme-template.css` and set the event palette.
3. Set a unique `data-trip-key`; never reuse another trip's namespace.
4. Replace the sample itinerary and venue records.
5. Keep the three primary sections even when secondary content differs.
6. Generate the desk-print backup:

```powershell
node .\shared\trip-field\build-desk-print.mjs .\EVENT\index.html .\EVENT\desk_print.html
```

7. Validate the online page at 393 px and 412 px widths, then test two independent shared appends, reload persistence, and JSON transfer.
8. Print-preview the desk copy. It should contain itinerary, preparation, and venue reference content, but no interactive record form or family page.

## Optional Cloudflare synchronization

The online page always saves locally first. When a Cloudflare endpoint is
configured, changes are also sent after a 2.2-second debounce. This keeps the
page usable during a weak or interrupted venue connection and allows another
phone or PC to load the same trip snapshot later.

Deploy `cloudflare/trip-notes-worker`, then put its public Worker URL in the
sync panel's `data-endpoint`. The shared synchronization key is entered by the
user at runtime. Never put that key in committed HTML or JavaScript. The page
can remember it in that device's browser when explicitly selected; it is kept
outside the trip snapshot and JSON export.

Cloud synchronization does not replace JSON backup. The general trip snapshot
uses last-write-wins, so avoid changing plans or free-edit text simultaneously
on multiple devices. Shared note entries use unique KV keys; each named,
timestamped entry is stored separately and concurrent entries do not overwrite
one another. Devices refresh the shared entry list periodically while the page
is open.

## Current adoption

`202609_HumanoidSummitEurope/build_v3.mjs` uses `runtime.js` for its storage
namespace and includes `core.css` in the generated stylesheet. Its HRS-specific
appearance remains in the HRS builder so adoption does not change the approved
design.
