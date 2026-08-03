# Interactions

**New, standalone project** for coded Jiffy Revamp (Figma) interaction prototypes. This repo is separate from any older interaction library — use that only as a loose reference for dashboard patterns (sidebar, registry), not as a code dependency or shared runtime.

## Run locally

**Do not double-click `index.html`** — this app needs a local server.

```bash
cd ~/Projects/interactions
npm install
npm start
```

`npm start` runs the dev server and opens your browser automatically.

Manual option:

```bash
npm run dev
```

Then open **http://localhost:5176/** (or the port Vite prints if 5176 is busy).

### Built HTML (offline / share)

```bash
npm run serve
```

Builds `dist/` and opens a preview server. The built HTML lives at `dist/index.html` but still must be served — opening that file directly from Finder will not work.

## Dashboard

- **Sidebar** — browse interactions by category
- **Main panel** — interactive phone prototype

### Deep links

Share a specific interaction with the URL hash:

```
http://localhost:5176/#/search-to-pdp/card-expand
```

## Prototypes

| Category | ID | Name |
|----------|-----|------|
| Search to PDP transitions | `card-expand` | Card expand → Popup → PDP |

### Test flow (card-expand)

1. Tap the **second card** (Aashirvaad Atta, Previously Bought)
2. Card morphs to popup — close via X or backdrop
3. Open again — scroll down to expand to full PDP

## Add a new interaction

1. Create `src/interactions/<category>/<Name>Interaction.tsx`
2. Register it in [`src/interactions/registry.ts`](src/interactions/registry.ts)

## Deploy (HTML sharing)

```bash
npm run build
```

Deploy the `dist/` folder to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or GitHub Pages.

**Live site:** https://lexanne0110.github.io/interactions/

Share: `https://lexanne0110.github.io/interactions/#/search-to-pdp/card-expand`

## Assets

- Design tokens: `src/styles/tokens.css`
- Product images: `public/assets/` (exported from Figma)
