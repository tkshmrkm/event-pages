# Overseas Trip Field Layout

Reusable foundation for static overseas-business-trip pages in this repository.
It standardizes field operation without forcing every event to share the same
visual design.

## Stable interaction contract

Every new trip page should have only three primary field sections:

1. `旅程` — continuous-scroll daily itinerary with a horizontally scrollable date rail.
2. `会場` — event-specific targets and two-part notes: preparation plus same-day notes.
3. `記録` — review, Markdown output, JSON backup, and JSON restore.

Preparation and documents are secondary content inside the itinerary or a
separate pre-departure page. The family view is a separate responsive/print
page. Traveler colors appear only where people actually split; merged travel
uses a neutral surface.

## Shared versus event-specific

Shared:

- three-section navigation and date rail;
- 44 px or larger controls and 16 px input text;
- local browser persistence;
- JSON export/import format;
- an online smartphone page plus a self-contained desk-print backup;
- responsive targets around iPhone 16 (393 px) and Pixel 7a/8a (412 px).
- monochrome text-presentation `✈︎` for flights; use words such as `発` and `着` rather than OS-dependent colored departure/arrival emoji.

Event-specific:

- palette, typography emphasis, header treatment, and card geometry;
- itinerary content and traveler lanes;
- venue record type (session, exhibitor, factory visit, meeting, etc.);
- family-facing wording and print content.

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
- `[data-trip-status]` — short live status message.

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

## Current adoption

`202609_HumanoidSummitEurope/build_v3.mjs` uses `runtime.js` for its storage
namespace and includes `core.css` in the generated stylesheet. Its HRS-specific
appearance remains in the HRS builder so adoption does not change the approved
design.
