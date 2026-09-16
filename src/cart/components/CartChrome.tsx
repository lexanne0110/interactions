import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cartAssets } from '../cartData';
import { RollingValue } from './RollingValue';

const ui = (file: string) => `${import.meta.env.BASE_URL}assets/icons/${file}`;
const cartIcon = (file: string) => `${import.meta.env.BASE_URL}assets/cart/svg/${file}`;

/** House curve. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** Colour curve. */
const COLOR_EASE = [0.4, 0, 0.2, 1] as const;
/**
 * The repo's snappy spring — the switch is a physical object, so it springs.
 *
 * Deliberately left fast while everything else slowed down. The switch is the
 * cause and the screen is the consequence; if the switch waited for the screen
 * the tap would feel unacknowledged.
 */
const SWITCH_SPRING = { type: 'spring' as const, stiffness: 480, damping: 32 };

/**
 * How far the header travels when the incognito strip appears.
 *
 * Figma seats the header at y=28 normally and y=63 in incognito, with the
 * 34px strip filling the gap. Exported because the scrolling body has to
 * travel the same distance — see CartScreen.
 */
export const INCOGNITO_SHIFT = 35;

/** Every strip in the Figma status-strip system is 390×34. */
export const STRIP_H = 34;

/**
 * The one transition every chrome shift uses — and the body that follows it.
 *
 * The header, the strips and the scrolling body animate different elements
 * towards a single reading: the screen moving as one piece. Held as separate
 * literals they were one careless edit away from opening a gap under the
 * header mid-travel, with nothing to catch it but the eye.
 *
 * Retinting the chrome is a layout-scale change, so this sits at the top of
 * the repo's layout band.
 */
export const CHROME_TRAVEL = { duration: 0.42, ease: EASE } as const;

/**
 * Incognito turning on after its confirmation sheet.
 *
 * Plays as its own beat once the sheet has gone, and slower than a direct
 * toggle: the shopper's eye is still on the sheet leaving, so a 0.42s shift is
 * over before it is seen. 0.6s sits past the repo's layout band on purpose — a
 * confirmed mode change is worth watching.
 */
export const INCOGNITO_CONFIRMED_TRAVEL = { duration: 0.6, ease: EASE } as const;

/** What moved the chrome last. Decides the one travel the header, strips and body share. */
export type ChromeMotion = 'default' | 'incognito-confirmed';

export const chromeTravel = (kind: ChromeMotion) =>
  kind === 'incognito-confirmed' ? INCOGNITO_CONFIRMED_TRAVEL : CHROME_TRAVEL;

const rupees = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

/**
 * Status bar, header, and the strips that hang off it.
 *
 * Icons are the SVGs exported from the Figma header, rendered at their own
 * intrinsic sizes (back is 6.6×11.6 at 1.6 stroke — noticeably lighter than
 * the generic chevron in assets/icons).
 *
 * Every state change here is transform or opacity only. Two strips, two
 * mechanisms, because Figma seats them differently:
 *
 * - **Incognito** sits *above* the header (y=28). The header slides down 35px,
 *   and because its own fill is opaque that one move uncovers the strip above
 *   and paints the band below — no `top` or `height` tween.
 * - **Savings** sits *below* the header (y=92). The header does not move; the
 *   strip slides out from underneath the chrome, which hides it while retracted.
 */
export function CartChrome({
  incognito = false,
  saved = null,
  chromeMotion = 'default',
  onToggleIncognito,
}: {
  incognito?: boolean;
  /** Total saved while a coupon is applied; `null` when there is nothing to announce. */
  saved?: number | null;
  /** What caused the latest change — a confirmed incognito plays slower. */
  chromeMotion?: ChromeMotion;
  onToggleIncognito?: () => void;
}) {
  const savingsOn = saved != null;
  // Not named `motion`: that would shadow framer-motion's `motion` in this file.
  const travel = chromeTravel(chromeMotion);
  const confirmed = chromeMotion === 'incognito-confirmed';
  /* Keeps the last figure on the strip while it retracts. Without it the
     amount would blank out at the start of the exit, mid-slide. */
  const lastSaved = useRef(saved ?? 0);
  if (saved != null) lastSaved.current = saved;
  /* The counter is remounted each time the strip appears. RollingValue does not
     roll on mount but does roll on change, and the hidden strip still holds its
     previous figure — so without a fresh mount it would count up while sliding
     in: one more thing moving in a beat that is meant to be calm. It still rolls
     if the amount changes while the strip is showing (a second coupon). */
  const appearances = useRef(0);
  const wasOn = useRef(savingsOn);
  if (savingsOn && !wasOn.current) appearances.current += 1;
  wasOn.current = savingsOn;

  return (
    <>
      <div className="cart-topbar" />

      {/* Savings retint. Full height, unlike the incognito band: nothing opaque
          covers its lower half. Painted before the incognito band, so privacy
          wins the chrome if both are on — the savings strip still shows. */}
      <motion.div
        className="cart-topbar cart-topbar--savings"
        initial={false}
        animate={{ opacity: savingsOn ? 1 : 0 }}
        transition={{ duration: 0.28, ease: COLOR_EASE }}
      />

      {/* Only 63px tall: everything below that is covered by the header's own
          fill once it has moved, so there is nothing there to paint. It fades
          faster than the header travels, so the strip is already dark by the
          time the header clears it. */}
      <motion.div
        className="cart-topbar cart-topbar--incognito"
        initial={false}
        animate={{ opacity: incognito ? 1 : 0 }}
        transition={{ duration: confirmed ? 0.4 : 0.28, ease: COLOR_EASE }}
      />

      {/* Slides out from under the chrome. Retracted, it sits 34px up — wholly
          behind the opaque band — so it never fades in over the content; it
          arrives from the header, which is where it belongs. It also rides the
          incognito shift, since it hangs off the header's bottom edge. */}
      <motion.div
        className="cart-strip--savings"
        aria-hidden={!savingsOn}
        initial={false}
        animate={{ y: (incognito ? INCOGNITO_SHIFT : 0) + (savingsOn ? 0 : -STRIP_H) }}
        transition={travel}
      >
        <img src={cartIcon('star-06.svg')} alt="" width={16} height={16} />
        <span className="cart-strip__text">
          You have saved&nbsp;
          <RollingValue
            key={appearances.current}
            value={rupees(lastSaved.current)}
            amount={lastSaved.current}
          />
        </span>
      </motion.div>

      <div className={`cart-status${incognito ? ' is-incognito' : ''}`}>
        <img src={ui('time-1047.svg')} alt="10:47" height={11} />
        <span className="cart-status__icons">
          <img src={ui('wifi.svg')} alt="" height={14} />
          <img src={ui('reception.svg')} alt="" height={15} />
          <img src={ui('battery.svg')} alt="" height={15} />
        </span>
      </div>

      {/* Sits in the gap the header vacates. The delay tracks the header: the
          house curve is front-loaded, so the header has all but arrived by
          ~45% of its travel, and the label starts just after that. On the way
          out it leaves immediately, so it is gone before the header returns. */}
      <motion.div
        className="cart-strip cart-strip--incognito"
        aria-hidden={!incognito}
        initial={false}
        animate={{ opacity: incognito ? 1 : 0, y: incognito ? 0 : -6 }}
        transition={{ duration: confirmed ? 0.4 : 0.3, ease: EASE, delay: incognito ? (confirmed ? 0.28 : 0.2) : 0 }}
      >
        Incognito Order Mode Activated
      </motion.div>

      <motion.div
        className={`cart-header${incognito ? ' is-incognito' : ''}`}
        initial={false}
        animate={{ y: incognito ? INCOGNITO_SHIFT : 0 }}
        transition={travel}
      >
        {/* The tint is its own layer so the header can carry an opaque fill
            without the buttons crossfading along with it. */}
        <motion.div
          className="cart-header__tint"
          initial={false}
          animate={{ opacity: incognito ? 1 : 0 }}
          transition={{ duration: travel.duration, ease: COLOR_EASE }}
        />

        <button className="cart-header__btn cart-header__btn--back" aria-label="Back">
          <img src={cartIcon('back.svg')} alt="" width={6.6} height={11.6} />
        </button>

        <h1 className="cart-header__title">Cart</h1>

        <motion.button
          className={`cart-toggle${incognito ? ' is-on' : ''}`}
          onClick={onToggleIncognito}
          aria-pressed={incognito}
          aria-label="Incognito order mode"
          whileTap={{ scale: 0.94 }}
          transition={SWITCH_SPRING}
        >
          <motion.span
            className="cart-toggle__knob"
            initial={false}
            animate={{ x: incognito ? 24.3 : 0 }}
            /* A direct tap springs — the switch is the cause. After the sheet,
               the sheet was the cause and the switch is part of the result, so
               it slides at the screen's pace instead of snapping ahead of it. */
            transition={confirmed ? { duration: 0.5, ease: EASE } : SWITCH_SPRING}
          >
            <img src={cartIcon('incognito.svg')} alt="" width={16.3} height={16.3} />
          </motion.span>
        </motion.button>

        <button className="cart-header__btn cart-header__btn--search" aria-label="Search">
          <img src={cartIcon('search.svg')} alt="" width={16.6} height={16.6} />
        </button>
        <button className="cart-header__btn cart-header__btn--share" aria-label="Share">
          <img src={cartIcon('share.svg')} alt="" width={16.8} height={15.6} />
        </button>
      </motion.div>
    </>
  );
}

/** "Add More Items" strip that closes the items section. */
export function AddMoreItems({ onClick }: { onClick?: () => void }) {
  return (
    <button className="add-more" onClick={onClick}>
      <img className="add-more__avatars" src={cartAssets.avatars} alt="" />
      <span className="add-more__label">Add More Items</span>
    </button>
  );
}
