# Cart interactions — handoff

Working notes for continuing the Cart section of this prototype in a fresh session.
`CART_INTERACTIONS.md` is the spec and status of each interaction; this file is the
context around it. Delete it once it has served its purpose — it is not meant to ship.

## Before anything else

- **Committed and pushed** to branch `fix/popup-close-morph-and-interaction-audit` on
  2026-09-16 (first push of the cart work, at the designer's request). Not merged, and not
  on the Pages-deployed branch, so the live site is unchanged.
- **`.gitignore` gotcha, fixed 2026-09-16:** the pattern `interactions/` was unanchored, so it
  matched `src/interactions/` and silently ignored every new interaction file. It is now
  `/interactions/`. If new files under `src/interactions/` ever fail to show in `git status`,
  check this first.
- **Never push to GitHub without the designer's explicit approval.** Build, show, get sign-off, then push.
- Dev server: `jiffy-interactions` in `/Users/lexie/Desktop/Claude/.claude/launch.json`, port 5181.
- Typecheck: `npx tsc --noEmit`. Fee rules: `node src/cart/bill.check.mjs` (23 checks).

## How the designer works

- A Figma "reference" means **style, not content** — extract tokens and anatomy, rebuild the existing thing.
- Interactions are **for mobile**: whole-card tap targets, touch-sized controls.
- When one tap changes several places, **sequence it in beats** (cause → effect → result),
  one focal point per beat, and never move the thing being watched mid-celebration.
- Offer real decisions as **options with explanations and previews** — they like to pick.
- Every finished interaction must also land in the assembled `cart-screen` route.
- Verify by **measuring, not inferring**, and share proof (numbers + a screenshot).

## Figma

File `r31CxjH4db4C0idE8l8Fu2` (Jiffy Revamp), page `38:388`, section `2124:4421` (Cart component &
state inventory). Nodes used so far:

| What | Node |
|---|---|
| Header & status strip row | `2124:4426` |
| Savings header | `2125:4479` · incognito strip `3284:5753` |
| Bill Details row | `2124:4468` |
| Bill above / below threshold | `2700:11001` / `2700:11077` |
| Delivery / small cart tooltip | `2867:11040` / `2867:11114` |
| Member pricing (demo cart prices) | `2508:8449` |
| Delivery instructions row | `2682:10914` |
| Canonical card | `1174:11640` — `#fefefe`, r16, no stroke, `0 0 4px rgba(0,0,0,.12)` |

## Code map

- `src/cart/CartScreen.tsx` — owns all state; sections are controlled components; `sections`,
  `billOpen`, `initialItems`, `scenario` props let a prototype isolate what it shows.
- `src/cart/bill.ts` — every money rule, one pure `computeBill`. Nothing on screen computes money itself.
- `src/cart/scenario.ts` — tiny external store for conditions set outside the phone (MSR, happy hour, liquor).
- `src/cart/components/` — `BillCard` (expand, `Reveal`, fee wash, table tooltips), `CartChrome`
  (incognito + savings strip, `CHROME_TRAVEL`), `CouponsCard`, `ConfettiBurst`, `RollingValue`, …
- `src/interactions/cart/` — one thin wrapper per route.
- `registry.ts` gained `parentId` (nests an entry in `SideNav`) and an optional `Aside` slot beside the phone. The bill prototypes' scenario panels were removed at the designer's request (2026-09-14); `ScenarioPanel.tsx` / `scenario-panel.css` are now unused.

## Built

`cart-screen`, `bill-expand`, `quantity-to-remove` →
`cart-empty`, `coupon-apply` (three beats + savings header), `wallet-apply`, `incognito-toggle`.
Also fixed: delivery-instruction rail clipped square against the card radius; card shadow back to
Figma's literal 4px.

**Parked (2026-09-16):** `bill-charges` and `bill-liquor` are built and still routable by hash
(`#/cart/bill-charges`, `#/cart/bill-liquor`) but carry `hidden: true` in the registry, so they
are out of the side nav. Remove the flag to bring them back.

**Bill layout changed (2026-09-16):** the total stays in place and the breakdown opens *below* it,
in the prototype and in Figma row 07 (all six expanded cells). The savings strip, rule and total
never move.

## Next, in order

1. `delivery-split` — FLIP rows between two delivery groups; rows must keep their React key
2. `address-sheet` → `far-address-prompt` — sets the sheet timing every other sheet copies
3. `age-gate` — blocked, see open decisions
4. `cart-load`, then `slot-sheet` → `next-day-confirm`
5. `unavailable-items`, `did-you-forget`, `delivery-instructions`

## Open decisions (ask, don't assume)

- **Promotional Discount:** fixed ₹100, capped at item total so it can't go negative — at ₹98 it reads −₹98. Real rule?
- **Promo ₹100 and GST ₹9** are Figma placeholders held constant.
- **Demo carts** use Figma's member-pricing prices as regular prices (every default item is ₹161, which can't cross ₹99/₹149).
- **Green text:** `#027a48` instead of Figma's `#039855`, which fails AA at 13px on white.
- **Figma copy slip:** small cart tooltip says ₹199; the rule is ₹99.
- **Age gate:** the 21-year threshold is hardcoded but India's drinking age is state-dependent.
- **Delivery instructions:** no phone-off icon for "Avoid calling"; no voice-note length cap.
- **Cart load:** Figma settled on all-at-once — confirm before adding any stagger.
- Unanswered from earlier: which "first state" was missing from the address flow; what counts as a "far" address and how often the prompt fires.

## Hard-won invariants

- **The phone is CSS-scaled** (`--phone-scale`, ~0.74). `getBoundingClientRect` is scaled; `offsetHeight` is not. Never compare the two.
- **Never animate `height` to `'auto'` inside the phone.** framer measures the on-screen box, so a 17px line animated to 12.6px and snapped. Measure `offsetHeight` and animate to the number (`Reveal` in `BillCard`).
- **An element entering a gapped flex list** must animate `marginTop: -gap → 0` (and back on exit), or the gap pops in on the first frame and out on the last.
- **A child mounting after its parent's variant stagger** must run its own `initial`/`animate`; inherited variants leave it at opacity 0 — present but invisible.
- **`AnimatePresence` renders an exiting child with its last props** — anything needed on exit belongs in `exit`.
- **Anything that clips for an animation** must not clip at rest (it eats shadows and tooltips).
- **`box-shadow` is not composited** — pulse a separate layer's opacity/scale instead, or neighbours shimmer.
- **Shifts are transforms paid for with static slack** (`.cart-body` bottom padding covers incognito + savings travel), never padding/top/height tweens.
- **Elements that must move together share one transition object** (`CHROME_TRAVEL`), never two literals.
- **Coupons raise "You saved"; wallet balance never does** — it is the shopper's own money.
- The browser console keeps **stale errors from mid-edit reloads**; confirm against `tsc` and the live DOM before chasing them.

## Verifying motion

Sample every animation frame-by-frame in the preview with `requestAnimationFrame`, divide rects by the
phone scale `k = screen.getBoundingClientRect().width / 390`, and check:
- the height series is monotonic and its **last moving step is sub-pixel** (no end snap);
- an animator's height equals its content's `offsetHeight` at rest (no clipping, no gap);
- a new element's **effective opacity** (product up the tree) is 1 once settled.
