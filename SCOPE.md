# Project scope

**Jiffy Interactions** (`~/Projects/jiffy-interactions`) is a fresh codebase for Figma-accurate interaction prototypes.

## Relationship to the old interaction library

| | Old library (reference only) | This project |
|---|------------------------------|--------------|
| Purpose | Broad component demos (Add Button, Cart, Pop Up, etc.) | Focused flows from Jiffy Revamp Figma |
| Code | Do not import or copy wholesale | Own components, tokens, assets |
| Patterns to borrow | Sidebar + registry, Live/Recording tabs, hash URLs | Already implemented in `src/layout/`, `src/interactions/registry.ts` |

When adding interactions here, implement from **Figma + this repo’s patterns** — not by porting old library entries.

## Adding an interaction

1. `src/interactions/<category>/<Name>Interaction.tsx`
2. Register in `src/interactions/registry.ts`
3. Optional MP4: `public/videos/<id>.mp4`

## Dev server

Port **5176** (`vite.config.ts`) — avoids clashing with other local Vite apps.
