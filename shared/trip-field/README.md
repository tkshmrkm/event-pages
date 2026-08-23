# Overseas Trip Field Layout

Reusable foundation for static overseas-business-trip pages in this repository.
It standardizes field operation without forcing every event to share the same
visual design.

This is the default note format for future exhibitions, conferences, lectures,
factory visits, and similar field-research trips. Event pages may differ
visually, but should reuse the storage, synchronization, and final-download
workflow unless there is a concrete reason not to.

## Stable interaction contract

A trip page carries five primary field sections. The count is not the contract
— 準備 folds away once it is filled in, leaving four — but the split is: what is
opened on the ground (旅程, 視察), what is only wanted before departure (準備),
and what shows the whole trip (概要) never share a section. Nothing needed on the
ground may live in the section that folds away.

Each section below says what every event keeps and what each event settles for
itself. The vocabulary these rely on — icons, plan states, prose, overview rules
— is in *Shared versus event-specific* below.

1. `概要` — the whole trip at a glance.
   - Shared: a change of scale, not a summary. One line of fact per day and a
     way through to the detailed section; movement listed one leg per line
     rather than reduced to a representative; rows in time order; one axis per
     chip; no plan-state chips, whose owner is 旅程 and 視察.
   - Event-specific: whether a day splits into lanes (EuroBLECH runs two until
     the travellers meet, HRS one), which fact a day row leads with, palette.
2. `旅程` — the continuous daily itinerary, every day reachable from the date rail.
   - Shared: everything used on the ground lives here, including flights, stays
     and map links; transport icons and `発` / `着` as described below; map links
     on the place name itself; one control that opens and closes every day card.
   - Event-specific: traveler lanes, card geometry, which reference cards sit at
     the end of the section.
3. `視察` — what the trip is there to see: sessions, exhibitors, factory visits, meetings.
   - Shared: every record unit carries `事前の狙い・質問` and `当日メモ`; day notes
     accept named, timestamped appends from more than one device; the section is
     named for the act, not the place.
   - Event-specific: the record unit itself and the columns around it.
4. `準備` — pre-departure to-dos, and nothing else.
   - Shared: it must stay foldable, and once folded nothing needed on the ground
     may be lost with it. HRS moved flights, stays and map links out to 旅程 on
     2026-08-16 for exactly this reason.
   - Event-specific: the to-do list.
5. `記録` — review, cloud sync, Markdown and JSON.
   - Shared: read from the cloud, copy and download Markdown, export and import
     JSON, and never embed the sync key.
   - Event-specific: what the Markdown carries beyond the trip-wide sections.

Order and naming: sections opened on the ground come first and foldable ones
last, and the panels follow the tab order in the DOM, since printing opens every
tab and stacks them. Labels are at most two characters — with five tabs a
four-character label overflows 393 px, and the overflow is silent because the
tab bar scrolls with its scrollbar hidden. The default tab is 旅程, not 概要: the
overview earns its place before departure and at the desk, while opening on it
costs a tap every time on the ground.

**Renaming a tab changes the label only.** `data-tab`, the panel `id` and the
storage keys stay as they are, or saved tab state and saved notes stop
resolving: HRS renamed `会場` to `視察` and kept `venue` and `ses:`. Ids are per
event and frozen at birth rather than shared — HRS calls the itinerary `plan`
where EuroBLECH calls it `itinerary`, and neither may be aligned to the other
now that both hold stored data.

Documents and the family view are not tabs. `family_print.html` and
`immigration_print.html` are separate pages reached from the header.
Traveler colors appear only where people actually split; merged travel
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
- Plan states use `.plan-state` and exactly five labels: `未検討` (no option drafted), `候補あり` (options to compare), `仮決め` (current first choice), `確定` (booked, ticketed, or officially confirmed), `当日判断` (decided on the ground). One state per plan item — not per day, not per page. Events must not invent their own wording for the same idea; HRS previously carried the same concept in three markup shapes and seven words. Keep this progress axis separate from the reason an item is unsettled (not yet announced by the other party / findable by asking / ours to decide) — the reason belongs in the body text or a fold, never in the chip. A condition that must be met before `確定` goes next to the chip in `.state-note`.
- No emoji in generated output — not one. Transport modes, activity kinds (meals, sightseeing, lodging, factory visits), action buttons (download, delete, copy), and heading ornaments are all monochrome SVG. Two reasons: emoji whose Unicode default presentation is text (🍽 🏛 ℹ and others) render as black outline glyphs on Windows, and mixing colored emoji with monochrome SVG makes the icon set look unfinished. Flag emoji are dropped rather than redrawn — Windows shows them as the letters DE and JP. Test for this with the `Extended_Pictographic` property, not a list of codepoints; a three-codepoint check once let 49 occurrences through.
- Icon size follows where the icon sits. `.flight-mark` and `.mode-icon` stay a fixed 20px because they occupy a column of their own and set the row height. `.line-icon` — the monochrome SVG that replaces glyphs such as 🖨 🗓 🗺 inside headings, buttons, and running text — is sized in `em` (`1.15em`), so it tracks whatever text surrounds it. A fixed pixel box reads as larger than the text it sits in wherever that text is 13–14px. Events may override the color of `.line-icon`; they must not override its size.
- Field-guide prose, not an essay. An always-visible supporting line carries a fact in roughly 30 characters or fewer; reasons, criteria and conditions go inside a `details.fold`. Name the fold's `summary` after what it holds (`やること`, `過ごし方`, `ラウンジの利用資格`) so it reads without opening; never `続きを読む`. Always-visible lines end without a full stop, since they are labels rather than sentences; text inside a fold is exempt. The character count is a guide, not a rule — a single fact may run longer, and a short explanation still belongs in the fold.

- An overview is a change of scale, not a summary. Drop what every day and every trip have in common — immigration, baggage claim, checking a bag in before the room is ready — and keep what tells one day from the next, plus the skeleton of the journey. When shortening, take part of the itinerary's own sentence rather than rewording for the overview. Pick one representative item per day only for kinds that occur once a day; a kind that occurs several times and cannot be dropped — movement above all — is listed in full, one leg per line, and then left out of the representative line so the same fact does not appear twice. HRS lost both homebound flights this way: the undecided daytime won the day's one slot.
- Sort what is time-bound by time, not by kind, and file each leg under the day it departs. Pinning a headline above the legs put a 12:11 arrival above the flight that landed at 09:20; filing by the family copy's "that night" grouping would put a 00:45 departure on the previous day.
- One chip carries one axis. If two values in the same column are not mutually exclusive — a day that is both a day off and the day the trip turns homeward — the axis is mixed and needs a second chip. This has been settled the same way three times now: progress versus the reason an item is unsettled, the calendar versus what the day holds, and, inside the latter, what is done versus where the day sits in the trip. Avoid umbrella words such as `イベント`: the day spent in the hall and the day spent off-site differ in place and in when they end.
- Write an attribute only where it changes. Time zones and dates go on a leg whose departure and arrival differ, not on every line: printed everywhere they stretch the line past two rows on a phone, omitted everywhere they leave arithmetic that does not add up (00:45 to 19:35 in 12h50m).
- One thing, one name. Do not mix a formal name, a nickname and a code on one screen; settle on at most three forms — name, code, full form — and keep every other spelling out of the generated files. Check by counting in the body with `href` attributes stripped, since a map-search URL never reaches the screen.

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

Two events are already scheduled on this base: SIGGRAPH Asia in December 2026
and LOGIMAT in March 2027. Treat every fix as a candidate for this folder, not
for the event you happen to be editing. If a change would otherwise be copied
from one event to the next, it belongs here first — the icon set, the plan-state
chip, and the em-based icon sizing all started as one event's local fix and cost
a second pass to pull back out.

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

`202609_HumanoidSummitEurope/build.mjs` uses `runtime.js` for its storage
namespace and includes `core.css` in the generated stylesheet. Its HRS-specific
appearance remains in the HRS builder so adoption does not change the approved
design.

`202610_Europe_TechEx_EuroBLECH` loads the HRS stylesheet and therefore already
receives everything in `core.css`, including the plan-state chip and the icon
set. What it still carries locally — a fixed 19 px `.line-icon`, emoji, and
Tailwind-shaped markup — is listed in that event's `CLAUDE_HANDOFF.md`.

Before adding a rule to an event builder, check whether it is event-specific
appearance or a shared contract. Colors, itinerary content, and traveler lanes
are event-specific. Icon shape and size, state vocabulary, punctuation, fold
behavior, and the record-and-export contract are shared.
