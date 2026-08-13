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
- JSON export/import format;
- an online smartphone page plus a self-contained desk-print backup;
- responsive targets around iPhone 16 (393 px) and Pixel 7a/8a (412 px).
- monochrome text-presentation `✈︎` for flights; use words such as `発` and `着` rather than OS-dependent colored departure/arrival emoji.

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

7. Validate the online page at 393 px and 412 px widths, then test reload persistence and JSON transfer.
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

Cloud synchronization does not replace JSON backup. KV uses last-write-wins,
so avoid editing the same trip simultaneously on multiple devices.

## Current adoption

`202609_HumanoidSummitEurope/build_v3.mjs` uses `runtime.js` for its storage
namespace and includes `core.css` in the generated stylesheet. Its HRS-specific
appearance remains in the HRS builder so adoption does not change the approved
design.
