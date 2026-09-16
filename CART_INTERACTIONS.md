# Cart interactions — proposed scope

Candidate interactions for the Cart section, derived from the Cart component & state
inventory in Figma (`Jiffy Revamp` → Cart Screens → `Cart - Components`, 17 rows).

One file per interaction in `src/interactions/<category>/`, registered in
`src/interactions/registry.ts`, following `SCOPE.md`.

**Built so far —** `bill-expand`, `bill-tooltip`, `quantity-to-remove` → `cart-empty`,
`coupon-apply` (with the savings header), `wallet-apply`, `incognito-toggle`,
and `bill-expand`'s two sub-interactions, `bill-charges` and `bill-liquor` — both **parked**
2026-09-16 (`hidden: true`, still routable by hash). Each is also carried into the assembled
`cart-screen` route, which is the one that has to end up with everything.
Entries below are marked **✅ Built** where that is the case; anything unmarked is
still a proposal and its timings are untested.

## Motion conventions already in this repo

| Curve | Use |
|---|---|
| `[0.22, 1, 0.36, 1]` | House curve — expansion, collapse, morph, FLIP |
| `[0.32, 0.72, 0, 1]` | Bottom sheets in and out |
| `[0.4, 0, 0.2, 1]` | Colour and opacity only |
| `spring, stiffness 480` | Small snappy things — checkboxes, chips, badges |

Durations in use cluster at `0.12–0.16` (micro), `0.2–0.28` (component), `0.32–0.45`
(layout / sheet). Keep new work inside those bands.

---

## Category: `cart-items` — "Cart items"

### 1. `quantity-to-remove` — Stepper down to zero
**Description:** Tap − on Apple until the count hits zero → the row collapses out and the bill re-counts.

✅ **Built.** Chains into `cart-empty`.

Distinct from the existing `add-button/quantity-stepper`, which never reaches zero. The
interesting frame here is the one after zero.

- Row collapses height → 0 with a fade, `0.26` house curve
- Siblings close the gap on the same curve, not staggered — the list should feel like one object
- Total digits roll `0.3`; savings strip re-counts with it
- **Invariant:** the row animates its own height. Animating the list's height repaints every sibling and the images flicker.

### 2. `unavailable-items` — Items go out of stock mid-session
**Description:** Trigger a stock check → two rows desaturate, prices strike through, a Currently Unavailable header slides in above them.

- Image desaturate + text to `#98A2B3`, `0.2`, colour curve
- Strike-through wipes left→right `0.24`
- Group header slides down `0.28` house curve, pushing the rows
- `Remove all` fades in `0.18`, delayed `0.14` — after the user has seen what changed

### 3. `delivery-split` — One list becomes two deliveries
**Description:** Add a scheduled item → the single items card splits into Delivery 1 and Delivery 2, with rows re-parenting between them.

The most technically interesting one on this list.

- FLIP: measure rows, re-parent, invert, play `0.36` house curve
- New group headers fade in `0.18`, delayed `0.12`, after the rows have landed
- **Invariant:** rows must keep the same React key across the split, or there is nothing to FLIP — they unmount and remount and the transition is a hard cut.

### 4. `did-you-forget` — Suggestion carousel, add without leaving
**Description:** Scroll the Did You Forget rail and tap ADD → the tile's button becomes a stepper in place; the tile never leaves the carousel.

- Native scroll with `scroll-snap-type: x proximity`
- ADD → stepper reuses the `add-button` timings exactly; do not re-time it

---

## Category: `cart-bill` — "Bill & savings"

### 5. `bill-expand` — Expand the bill from the total row
**Description:** Tap the chevron beside Total Amount To Pay → line items stagger in above it.

✅ **Built.** Carries `bill-tooltip`.

Note the chevron now lives **inside** the card on the total row, not on the section title.

- Card height `0.32` house curve
- Line items stagger `24ms` apart, each fade + 4px rise `0.2`
- Chevron rotates `−90° → 90°`, `0.24`
- **Revised 2026-09-16:** the total stays **in place** and the breakdown opens **below** it (Figma row 07 updated to match). The savings strip, rule and total never move
- **Invariant:** the thing the user just tapped must not move. Previously the total was pinned to the bottom and the lines pushed it down; now nothing above the fold moves at all

### 6. `bill-tooltip` — Dotted terms open an explanation
**Description:** Tap Delivery Charge, Packing Charge or GST → a dark tooltip opens under that row. Only one is open at a time.

✅ **Built**, as part of `bill-expand`.

- Revised during build: Figma has this as a **floating tooltip**, not an expanding row. Nothing below it moves
- Tooltips are dark; they are the one place in the cart that inverts
- Opening a second collapses the first on the same tick, not after it
- **Invariant:** the tooltip is rendered *outside* the height animator. Inside it, the animator's `overflow: hidden` clips it — and toggling that overflow to compensate makes the card settle with a visible jump

### 6a. `bill-charges` — Fees apply and waive as the item total moves
Sub-interaction of `bill-expand`. Apple ₹137 + Rice Stick ₹98 (Figma's member-pricing prices), bill open. No panel beside the phone — removed at the designer's request (2026-09-14), so MSR can't be toggled in the prototype; the ₹149 rule still lives in `bill.ts`.

✅ **Built.**

Rules from the product team (2026-09-11), all in `src/cart/bill.ts`:
- Delivery ₹30, free above ₹199 item total — ₹149 for MSR members
- Small cart fee ₹30, waived above ₹99
- Packing charge always waived
- Thresholds read the **item total** (after item price cuts, before coupons or wallet), so a coupon can never bring a fee back. "Above" is strict

Motion, a beat (`0.06`) after the stepper that caused it — short, because steppers get tapped in runs:
- The row washes `0.8`: green `#e8f7ef` as a fee is waived, warm `#fef4dc` as one is applied. Opacity/scale only, and never on mount
- Struck original fades in or out `0.16`; the amount rolls (`₹30` down to `FREE`)
- Total and Pay roll `0.3`, `+0.08`
- Thresholds are explained in the dotted-label tooltip — Figma's two-row table, opening above the row. No inline helper text

### 6b. `bill-liquor` — Liquor handling charge
Sub-interaction of `bill-expand`. 6 × Johnnie Walker (₹966 of liquor) + Rice Stick, happy hour on. No panel beside the phone (removed 2026-09-14): happy hour stays on, and the bottle stepper is the only control.

✅ **Built.**

- ₹69 while liquor is in the cart; waived during happy hour once liquor is above ₹999
- The line has no row at all without liquor — it reveals and collapses its own height rather than showing ₹0
- **Invariant:** never animate `height` to `'auto'` inside the scaled phone. framer measures the on-screen box, so a 17px line animated to 12.6px and snapped. Measure in layout pixels and animate to the number
- **Invariant:** a line arriving mid-list cancels the 13px row gap with a `-13 → 0` margin, or the gap appears on its first frame and vanishes on its last
- **Invariant:** a line mounting after the open stagger runs its own `initial`/`animate`. Inherited variants leave it at opacity 0 — present, but invisible

### 7. `coupon-apply` — APPLY → applied → REMOVE
**Description:** Press APPLY → the check springs with confetti; then the header turns green and a "You have saved" strip slides out from under it; then Pay rolls.

✅ **Built.**

Choreographed in **three beats**. Fired together it was ~10 motions in 3 places inside 400ms, and the list moved the card while its confetti was still playing.

| Beat | When | What moves |
|---|---|---|
| Card | `0ms` | press `0.9` spring · check `0.3 → 0.86 → 1` `0.34` · 14-particle confetti `0.95` · ring pulse `0.55` |
| Header | `450ms` | band → green `0.28` colour curve · savings strip slides out from under the chrome and the list pushes 34px, both `CHROME_TRAVEL` (`0.42` house) |
| Money | `750ms` | Pay and the bill's "You saved" roll `0.3`, `+0.08` |

- The header beat waits for the confetti to peak, so the card is not pushed 34px while it is being watched
- The strip arrives already showing its final figure — its counter remounts on appearance so it does not roll on the way in
- REMOVE is an undo: no beats, everything returns together
- `APPLY` → `REMOVE` label crossfade `0.15` in a fixed-width slot
- **Invariant:** the header strip and the body read the same beat snapshot and the same transition, so the strip-to-content gap holds at 20px on every frame
- **Invariant:** the ring pulse is its own layer animating opacity/scale. Pulsing the card's `box-shadow` repaints the rail and the neighbouring coupon shimmers

### 8. `wallet-apply` — Eligible wallet balance comes off the bill
**Description:** Tick Jiffy Wallet → ₹20 of the ₹100 balance applies; a wallet line appears in the bill and Pay counts down.

✅ **Built.**

- Checkbox `spring, stiffness 480`
- Wallet row's balance line swaps to "₹20 applied · ₹80 left" `0.16` house curve — eligible ≠ balance, said plainly at the moment it matters
- New bill line expands its own height `0.24`, last before the total, while the card tweens to its new measured height `0.32`
- Pay and Total roll `0.3`
- **Invariant:** wallet balance lowers the payable but is **not a saving**. "You saved" must not move — only coupons raise it

---

## Category: `cart-delivery` — "Delivery & address"

### 9. `slot-sheet` — Change Slot → sheet → header morphs
**Description:** Tap Change Slot → slot sheet rises, pick a window, confirm → the group header time morphs to the new slot.

- Sheet in `0.38` `[0.32, 0.72, 0, 1]`, scrim to 55% over `0.24`
- Radio `spring, stiffness 480`
- Header text crossfades `0.2` — do not slide it, the number changing in place is the point

### 10. `next-day-confirm` — Choosing tomorrow raises a confirmation
**Description:** Pick a next-day window → the sheet dismisses into a centred dialog asking you to confirm tomorrow.

- Sheet out `0.28`, dialog in `0.26` scale `0.96 → 1` + fade, house curve
- The two overlap by `0.1` so it reads as one movement, not two

### 11. `address-sheet` — Footer address bar → location sheet
**Description:** Tap the address bar → sheet rises with saved addresses; start typing and the quick actions collapse away, leaving search results.

- Sheet in `0.38` `[0.32, 0.72, 0, 1]`
- Quick-actions grid collapses height → 0 `0.26` on first keystroke
- Saved match stays pinned above results — it should not re-order as you type

### 12. `far-address-prompt` — Distant address raises a question
**Description:** Choose an address well outside the saved set → a sheet asks whether you're ordering for someone else.

- Chained off `address-sheet`; sheet swaps content rather than dismissing and re-presenting

### 13. `delivery-instructions` — Tiles and the voice note
**Description:** Toggle instruction tiles; press and hold Record → a timer runs, release → the tile becomes a voice note with play, clip length and delete.

- Tile select: fill + border crossfade `0.16`, checkbox `spring`
- Hold to record: disc pulses `1.2s` loop while held, respects `prefers-reduced-motion`
- Release → tile morphs to the recorded state `0.24`
- **Recorded state (Figma row 10, updated 2026-09-11):** the tile keeps its size. Play + length on the left; a 20px white delete button with `trash-01` on the right, in the same slot as the other tiles' checkboxes. Tapping the tile plays; delete returns it to the Record tile. Give the delete a ≥32px hit area around the 20px glyph, and stop propagation so deleting doesn't also play
- Record tile stretches to the row height so it matches the option tiles (was 68px vs 71px)

---

## Category: `cart-states` — "Cart states"

### 14. `cart-load` — Skeleton to content
**Description:** Load the cart → skeleton shimmer resolves section by section into the real cart.

- Shimmer sweep `1.4s` linear loop
- Crossfade skeleton → content `0.3`
- Decision pending: the Figma board settled on **all-at-once**, so no per-section stagger unless that changes

### 15. `cart-empty` — Removing the last item
**Description:** Remove the final item → the cart collapses into the empty state with Start shopping.

✅ **Built.** Chains off `quantity-to-remove`.

- Chains directly off `quantity-to-remove`
- Sections collapse top-down, `0.28`, `40ms` apart
- Empty block fades + rises 8px `0.3`, delayed until the collapse finishes
- Sticky footer slides out `0.24` — it should not linger disabled

### 16. `age-gate` — Age confirmation unblocks Pay
**Description:** Tick the age box → the blocking banner collapses and Pay goes from grey to green.

- Banner collapses `0.26`, Pay fill crossfades `0.2`, both on the same tick
- The button should look like it earns the colour as the blocker leaves, not after it

### 17. `incognito-toggle` — Privacy mode on
**Description:** Tap the header switch → the Incognito Mode On sheet rises. Tap the sheet → it drops away and the chrome retints, the header slides down 35px and uncovers the incognito strip, and the body follows. Tap ✕ → nothing changes.

**Confirmation sheet** (Figma row 09, `2280:7000`, revised — no CTA; added 2026-09-14):
- The toggle stays off until the sheet is answered. The whole card is the confirm; close, scrim tap and Escape back out
- In, in beats: scrim `0.24` colour curve + card rises `0.38` `[0.32, 0.72, 0, 1]` → rider lifts `0.32` house, `+0.16` → title / copy `+0.22` / `+0.28` → close `+0.24`
- Out: card `0.28` sheet curve, starting 380px down so the rider (105px above the card) never peeks
- Confirm: the transform waits for the sheet to leave (starts `0.32`) and plays as its own beat at `0.6` (`INCOGNITO_CONFIRMED_TRAVEL`) — started under the exit it was over before it was seen. The knob tweens `0.5` at the screen's pace instead of springing; a direct tap (turning off) keeps the `0.42` travel and the spring
- **Invariant:** the sheet's press scales its contents, never the card. The card is full-bleed, and scaling it opened ~3px gaps down both sides where the dark scrim showed
- Turning incognito **off** needs no confirmation

✅ **Built.**

- Switch `spring, stiffness 480, damping 32`; pill presses to `0.94`. Deliberately left fast when everything else slowed — the switch is the cause, the screen is the consequence
- Dark band fades `0.28` colour curve — ahead of the header, so the strip is already dark when the header clears it
- Header travel and body travel `0.42` house curve from **one shared constant** (`INCOGNITO_TRAVEL`), so the first card holds its 20px clearance the whole way
- Strip label `0.3` house curve, `0.2` delay — it must not be readable through the header on its way past, and on the way out it must clear before the header returns
- Header block `#c2d3eb` `0.42`, status glyphs invert `0.34`, both colour curve

**Built with no layout animation.** The header's fill is opaque, so translating it 35px both uncovers the strip above and paints the band below — no `top` or `height` tween. The band is only 63px tall for the same reason. The body's shift is a transform paid for by 35px of static bottom padding, so the scroll range never changes.

---

## Build order

Done: `bill-expand` (+ `bill-tooltip`) · `quantity-to-remove` → `cart-empty` ·
`coupon-apply` (+ savings header) · `wallet-apply` · `incognito-toggle`.

Remaining, in the order they earn their keep:

1. `delivery-split` — the hardest, and the one devs will most want a reference for. FLIP over re-parented rows
2. `address-sheet` → `far-address-prompt` — gates checkout, and the sheet timings set the pattern for every other sheet in the app
3. `age-gate` — small, but it's the only interaction where motion carries a **compliance** meaning
4. `cart-load` — needs no new vocabulary, and reads best once the sections it resolves into are all real
5. `slot-sheet` → `next-day-confirm` — chains off the sheet pattern from (2), so cheaper after it than before
6. `unavailable-items` · `did-you-forget` · `delivery-instructions` — worth having, but none teach something the ones above haven't

**Blocked / needs a decision before building:**
- `age-gate` — the 21-year threshold is hardcoded; India's drinking age is state-dependent. Needs a real rule before it ships as a reference
- `delivery-instructions` — "Avoid calling" has no phone-off icon in the Figma file, and the voice-note length cap is unspecified
- `cart-load` — Figma settled on all-at-once; confirm before adding any per-section stagger
