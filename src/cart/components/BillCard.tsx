import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Section } from './Section';
import { RollingValue } from './RollingValue';

/** One row of Figma's threshold tooltip: "For orders below ₹199 · ₹30 · Standard delivery charge applies". */
export type TooltipRow = { title: string; value: string; note: string };

export type BillLine = {
  id: string;
  label: string;
  /** Charged value as shown: "₹30", "FREE", "-₹100". */
  value: string;
  /** The number behind `value` — only sets which way it rolls when it changes. */
  amount: number;
  /** Struck original, shown while a price is cut or a fee is waived. */
  was?: string;
  /** `credit` is money off the payable; `free` is a waived fee shown as FREE. Both green. */
  tone?: 'credit' | 'free';
  /** Figma colours the Promotional Discount label green as well as its value. */
  labelTone?: 'credit';
  /** Tap target on the dotted label: plain copy, or Figma's two-row threshold table. */
  explain?: string | TooltipRow[];
  /**
   * Lines that exist only sometimes — liquor handling, a wallet deduction. They
   * reveal and collapse in place when they come and go with the bill open;
   * lines that are always there only ride the open stagger.
   */
  optional?: boolean;
  /**
   * For fees: whether it is currently charged or waived. A flip between the two
   * is the moment worth marking, so the row washes — green as a fee is waived,
   * warm as one is applied.
   */
  state?: 'charged' | 'waived';
};

/** House curve. Everything that expands, collapses or morphs uses it. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** `.bill__lines` gap. An arriving line has to cancel it, or it appears in one frame. */
const LINE_GAP = 13;
/**
 * A fee changes a beat after the stepper that caused it: the count moves, then
 * the row it affects. Short, because steppers get tapped in quick runs and a
 * long beat would lag behind the finger.
 */
const CHANGE_DELAY = 0.06;

const listVariants = {
  open: { transition: { staggerChildren: 0.024, delayChildren: 0.06 } },
  shut: { transition: { staggerChildren: 0.012, staggerDirection: -1 } },
};
const lineVariants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
  shut: { opacity: 0, y: 4, transition: { duration: 0.12, ease: EASE } },
};

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

/**
 * Height reveal for content that arrives or leaves inside an open container.
 *
 * Animates to a height measured here, in layout pixels. framer's own `'auto'`
 * target is read from the on-screen box, and the dashboard phone is CSS-scaled:
 * a 17px line was animated to 12.6px (17 × 0.74) and then snapped the rest of
 * the way. `gap` cancels the flex gap in front of the element, which otherwise
 * appears on the frame it mounts and vanishes on the frame it unmounts.
 *
 * Content already present when its presence group first renders skips `initial`
 * and simply sits at its natural height — so opening the bill measures it
 * correctly instead of catching it at 0.
 */
function Reveal({ children, gap = 0 }: { children: ReactNode; gap?: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (innerRef.current) setHeight(innerRef.current.offsetHeight);
  }, []);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0, marginTop: -gap }}
      animate={height == null ? undefined : { height, opacity: 1, marginTop: 0 }}
      exit={{ height: 0, opacity: 0, marginTop: -gap }}
      transition={{ duration: 0.24, ease: EASE }}
      style={{ overflow: 'hidden' }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

/**
 * A bill row. A fee changing state changes in place: the struck original fades
 * in beside the value, and the value rolls — "₹30" down to "FREE" — so the row
 * says which way the money moved without the list shifting.
 */
function LineRow({
  line,
  onExplain,
  rowRef,
}: {
  line: BillLine;
  onExplain?: (id: string) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const linked = !!line.explain;

  /* Wash only on a change, never on mount: opening the bill must not light up
     every fee at once. */
  const prevState = useRef(line.state);
  const [wash, setWash] = useState<{ key: number; tone: 'charged' | 'waived' } | null>(null);
  useEffect(() => {
    if (line.state && prevState.current && line.state !== prevState.current) {
      const tone = line.state;
      setWash((w) => ({ key: (w?.key ?? 0) + 1, tone }));
    }
    prevState.current = line.state;
  }, [line.state]);

  return (
    <div className="bill__line" ref={rowRef}>
      <AnimatePresence>
        {wash && (
          <motion.span
            key={wash.key}
            className={`bill__line-wash bill__line-wash--${wash.tone}`}
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1 }}
            transition={{ duration: 0.8, ease: EASE, times: [0, 0.22, 1], delay: CHANGE_DELAY }}
            onAnimationComplete={() => setWash((w) => (w?.key === wash.key ? null : w))}
          />
        )}
      </AnimatePresence>
      <div className="bill__line-top">
        {/* stopPropagation: a dotted term opens its explanation without also
            collapsing the card underneath it. */}
        <span
          className={cx(
            'bill__line-label',
            linked && 'bill__line-label--linked',
            line.labelTone === 'credit' && 'bill__line-label--credit',
          )}
          onClick={linked ? (e) => { e.stopPropagation(); onExplain?.(line.id); } : undefined}
        >
          {line.label}
        </span>

        <span className="bill__line-value">
          <AnimatePresence initial={false}>
            {line.was && (
              <motion.span
                key="was"
                className="bill__was"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.16, ease: EASE, delay: CHANGE_DELAY }}
              >
                {line.was}
              </motion.span>
            )}
          </AnimatePresence>
          <RollingValue
            className={cx('bill__line-amount', line.tone && `bill__line-amount--${line.tone}`)}
            value={line.value}
            amount={line.amount}
            delay={CHANGE_DELAY}
          />
        </span>
      </div>
    </div>
  );
}

type Props = {
  savings: string;
  savingsAmount?: number;
  /** Struck total, omitted when nothing was saved. */
  was?: string;
  now: string;
  nowAmount?: number;
  lines: BillLine[];
  expanded: boolean;
  openExplain?: string | null;
  onToggle?: () => void;
  onExplain?: (id: string) => void;
  /** Scroll container, so an expanded card can bring its own detail into view. */
  scrollRef?: React.RefObject<HTMLElement | null>;
};

/** Height of the pinned footer, which covers the bottom of the scroll area. */
const FOOTER_H = 120;

/**
 * Bill Details.
 *
 * The expand chevron sits on the Total row inside the card, not on the section
 * title — the control belongs on the number it expands.
 *
 * The savings strip, the rule and the total never move: the breakdown opens
 * *below* the total, so the row that was tapped stays exactly where the finger
 * left it and the card grows downwards from there.
 *
 * The page stays still while it grows. Once the tween has settled, if the card
 * now runs past the fold, only the overshoot is scrolled — so the detail that
 * was just revealed is actually readable rather than sitting behind the footer.
 */
export function BillCard({
  savings, savingsAmount = 0, was, now, nowAmount = 0,
  lines, expanded, openExplain, onToggle, onExplain, scrollRef,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  /**
   * Tooltips are positioned against the card, not rendered inside the height
   * animator. That animator must clip for the whole open and close, and
   * toggling its overflow to free a tooltip changed the box's layout at settle
   * — a 33px jump right at the end of the expand.
   */
  const lineEls = useRef<Record<string, HTMLDivElement | null>>({});
  const [tipTop, setTipTop] = useState<number | null>(null);

  /**
   * Open to a height we measured, never to `'auto'`.
   *
   * framer reads an `'auto'` target from the on-screen box, which inside the
   * scaled phone comes out short — the expand used to finish with a visible
   * step. Measuring the list ourselves makes start and end agree.
   */
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);
  useLayoutEffect(() => {
    if (expanded && innerRef.current) setContentH(innerRef.current.offsetHeight);
  }, [expanded]);

  /**
   * Once open, the animator hands its height back to `auto`.
   *
   * A measured pixel height is only right for the open tween. Lines that arrive
   * or leave while the bill is open animate their own height, and a container
   * pinned to a number cannot follow them: an arriving line was clipped out of
   * sight, and a leaving one left a 30px gap. On `auto`, the container simply
   * follows its content.
   */
  const [settled, setSettled] = useState(false);
  useEffect(() => { if (!expanded) setSettled(false); }, [expanded]);

  /* Lines moving under an open tooltip would leave it pointing at the wrong
     row, so a change in which lines exist closes it. */
  const lineIds = lines.map((l) => l.id).join('|');
  const prevLineIds = useRef(lineIds);
  useEffect(() => {
    if (prevLineIds.current !== lineIds && openExplain) onExplain?.(openExplain);
    prevLineIds.current = lineIds;
  }, [lineIds, openExplain, onExplain]);

  const toggle = () => onToggle?.();

  /**
   * After expanding, bring the newly revealed lines into view.
   *
   * On a real cart the bill has sections above and below it, so a card that
   * grows past the fold leaves its detail hidden behind the sticky footer.
   * Scrolling only the overshoot — and only after the tween — keeps the page
   * still during the animation and reveals the rest once it has settled.
   */
  useEffect(() => {
    if (!expanded) return;
    const scroller = scrollRef?.current;
    const card = cardRef.current;
    if (!scroller || !card) return;

    const id = window.setTimeout(() => {
      const cRect = card.getBoundingClientRect();
      const sRect = scroller.getBoundingClientRect();
      // The phone is CSS-scaled; scrollBy expects layout pixels.
      const scale = card.offsetWidth ? cRect.width / card.offsetWidth : 1;
      const visibleBottom = sRect.bottom - FOOTER_H * scale;
      const overshoot = cRect.bottom + 12 * scale - visibleBottom;
      if (overshoot > 1) {
        scroller.scrollBy({ top: overshoot / (scale || 1), behavior: 'smooth' });
      }
    }, 340);

    return () => window.clearTimeout(id);
  }, [expanded, scrollRef]);

  /* Figma opens the tooltip above its row, caret pointing down at the label.
     Anchored at the row's top; the anchor lifts the tip by its own height, so
     the tooltip never has to be measured. */
  useLayoutEffect(() => {
    if (!openExplain) { setTipTop(null); return; }
    const el = lineEls.current[openExplain];
    if (el) setTipTop(el.offsetTop - 8);
  }, [openExplain, expanded]);

  const tip = lines.find((l) => l.id === openExplain)?.explain;

  return (
    <Section title="Bill Details">
      {/* The whole card is the tap target. On mobile a 13px chevron is far below
          a comfortable touch size, and the card has no other primary action. */}
      <div
        className="cart-card bill-card"
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        }}
      >
        <div className="bill__savings">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7.2 5.3 10 11.5 4" stroke="var(--c-green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          You saved&nbsp;
          {/* 80ms behind its cause, so the cause reads before the effect. */}
          <RollingValue value={savings} amount={savingsAmount} delay={0.08} />
          &nbsp;on this order
        </div>

        <div className="bill__rule" />

        <div className="bill__total">
          <span className="bill__total-label">Total Amount To Pay</span>
          {/* Prices and chevron are one group so the row stays SPACE_BETWEEN with
              two children; the prices keep Figma's 5px, the toggle sits 8px clear. */}
          <span className="bill__total-value">
            <span className="bill__total-prices">
              <AnimatePresence initial={false}>
                {was && (
                  <motion.span
                    key="was"
                    className="bill__was"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: EASE }}
                  >
                    {was}
                  </motion.span>
                )}
              </AnimatePresence>
              <RollingValue className="bill__now" value={now} amount={nowAmount} delay={0.08} />
            </span>
            {/* Presentational: the card owns the tap, so this is an affordance,
                not a second control competing for the same gesture. */}
            <span className="bill__toggle" aria-hidden="true">
              <motion.svg
                width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                <path d="M5 7l4 4 4-4" stroke="#1d2939" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </span>
          </span>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="lines"
              /* marginTop cancels the card's 13px flex gap while collapsed. The
                 card gains a fourth child when this mounts — now the last one,
                 under the total — so without it that gap appears and disappears
                 in a single frame at each end. */
              initial={{ height: 0, opacity: 0, marginTop: -13 }}
              animate={{ height: settled ? 'auto' : contentH || 'auto', opacity: 1, marginTop: 0 }}
              exit={{ height: 0, opacity: 0, marginTop: -13 }}
              transition={{ duration: 0.32, ease: EASE }}
              /* Only the open tween may settle the box. The exit also completes
                 on this element — with its last props — and must not re-arm it,
                 or the next open would tween to 'auto' and end short again. */
              onAnimationComplete={(def) => {
                const target = typeof def === 'object' && def !== null
                  ? (def as unknown as { height?: unknown }).height
                  : undefined;
                if (target !== 0) setSettled(true);
              }}
              /* Clips for the whole open and close — never toggled, so the box's
                 layout cannot change underneath the animation. */
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                className="bill__lines"
                ref={innerRef}
                variants={listVariants}
                initial="shut"
                animate="open"
                exit="shut"
              >
                <AnimatePresence initial={false}>
                  {lines.map((l) => {
                    const row = (
                      <LineRow
                        line={l}
                        onExplain={onExplain}
                        rowRef={(el) => { lineEls.current[l.id] = el; }}
                      />
                    );
                    /* Optional lines reveal their own height when they come
                       and go, and run their own fade rather than inheriting the
                       list's. A line that mounts after the open stagger has
                       finished inherits "shut" and is never told to open — it
                       sat at opacity 0, taking up space but invisible. */
                    return l.optional ? (
                      <Reveal key={l.id} gap={LINE_GAP}>
                        <motion.div variants={lineVariants} initial="shut" animate="open">{row}</motion.div>
                      </Reveal>
                    ) : (
                      <motion.div key={l.id} variants={lineVariants}>{row}</motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rendered against the card, outside the clipping animator, so it can
            hang over the rows above without the animator having to un-clip. */}
        <AnimatePresence initial={false}>
          {openExplain && tipTop != null && tip && (
            <motion.span key={openExplain} className="bill__tip-anchor" style={{ top: tipTop }}>
              <motion.span
                className="bill__tip"
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
              >
                {typeof tip === 'string'
                  ? tip
                  : tip.map((row) => (
                    <span className="bill__tip-row" key={row.title}>
                      <span className="bill__tip-head">
                        <span>{row.title}</span>
                        <span className="bill__tip-value">{row.value}</span>
                      </span>
                      <span className="bill__tip-note">{row.note}</span>
                    </span>
                  ))}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>

      </div>
    </Section>
  );
}
