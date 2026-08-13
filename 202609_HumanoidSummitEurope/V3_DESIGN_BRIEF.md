# HRS Europe 2026 v3 design brief

## Purpose

Build a field-use version for smartphone operation, including possible use outdoors in direct sunlight. Preserve the useful overview and continuous scrolling of `index.html` (v1), while retaining the venue and recording capabilities developed in `index_v2.html`.

## Deliverables

- `index_v3.html`: primary online version.
- `index_v3_offline.html`: self-contained emergency version with no CDN or external runtime dependency.
- `family_print.html`: separate family-facing print document.
- Generate the online and offline versions from the same canonical content rather than maintaining two independent copies.

## Field navigation

Use only three primary sections:

1. `旅程`: continuous-scroll daily itinerary based on the v1 structure, with direct date navigation.
2. `会場`: sessions, target companies, questions, and direct links into note entry.
3. `記録`: review, organize, export, and import field notes.

Do not include a people filter. Use Kyoto/Inuyama colors only on lane headers where the travelers are actually separated. Use a neutral `全員` lane after merging.

Preparation content should not occupy a primary field-use tab. Keep it in a separate pre-departure page or a secondary collapsed section. The family view only needs to print well and does not need the smartphone field UI.

## Itinerary behavior

- Keep the v1 advantage of reading the schedule through vertical scrolling.
- Put flight, train, hotel, map, and emergency information into the relevant day instead of requiring a separate tab.
- Keep long reference material and restaurant lists collapsed.
- Distinguish selecting a candidate plan from confirming it.
- Candidate days use the pending color and `検討中` label.
- After explicit confirmation, remove the pending treatment and show the normal-day color with `確定` or no badge.

## Outdoor smartphone visual rules

- Preferred font stack: `BIZ UDPGothic`, `Yu Gothic UI`, `Meiryo`, system sans-serif.
- Main text: 15–17 px.
- Secondary text: at least 13 px.
- Touch targets: 44–48 px minimum.
- Use white cards, dark text, stronger borders, and sufficiently distinct colored surfaces.
- Keep the title scrollable; keep only the three-section navigation and date navigation sticky where needed.
- Avoid horizontal page overflow at a 390 px viewport.

Latest palette:

- Page: `#EDF2F3`
- Card: `#FFFFFF`
- Main text: `#101820`
- Secondary text: `#263640`
- Muted text: `#46565F`
- Border: `#AEBCC3`
- Normal/travel day: `#9FD7D8` with `#0B3A3C`
- HRS day: `#F0B49F` with `#5D200F`
- Pending day: `#CFC7EA` with `#302568`
- Kyoto lane: `#B7D4F1` with `#153F68`
- Inuyama lane: `#BFDFC6` with `#17482A`
- Merged/neutral surface: `#D8E2E6` with `#263640`

## Online and offline records

Browser storage for the online URL and a standalone local HTML file will not automatically share data. Use the online version as the primary record and provide JSON or Markdown export/import so notes created in the emergency offline version can be transferred.

## Design samples

- `index_v2_palette_sample.html`: four palette directions.
- `index_v2_no_people_filter_sample.html`: no-people-filter structure and outdoor-mobile treatment.
- `index_v2_three_way_comparison.html`: current v2 versus the earlier proposal versus the outdoor-mobile proposal.

The existing `index.html` and `index_v2.html` remain unchanged at this checkpoint.
