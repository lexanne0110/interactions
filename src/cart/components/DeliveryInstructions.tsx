import { Section, Checkbox } from './Section';
import { useDragScroll } from '../useDragScroll';

export type Instruction = { id: string; label: string; on: boolean };

export const seedInstructions: Instruction[] = [
  { id: 'door',  label: 'Leave at door',      on: false },
  { id: 'bell',  label: "Don't ring the bell", on: false },
  { id: 'guard', label: 'Leave with guard',   on: false },
  { id: 'pet',   label: 'Pet at home',        on: false },
];

const Glyph = ({ id, on }: { id: string; on: boolean }) => {
  const c = on ? 'var(--c-green)' : '#475467';
  switch (id) {
    case 'door':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 7.5 10 2.5l7 5V16a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16V7.5Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.5 8a4.5 4.5 0 0 1 7-3.7M14.5 9.5V12l1.5 2.5H6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.2 17a2 2 0 0 0 3.6 0M3 3l14 14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'guard':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="6.5" r="3" stroke={c} strokeWidth="1.5" />
          <path d="M4 17c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <ellipse cx="6" cy="7" rx="1.7" ry="2.2" stroke={c} strokeWidth="1.4" />
          <ellipse cx="14" cy="7" rx="1.7" ry="2.2" stroke={c} strokeWidth="1.4" />
          <ellipse cx="10" cy="13.5" rx="3.6" ry="3" stroke={c} strokeWidth="1.4" />
        </svg>
      );
  }
};

type Props = {
  instructions: Instruction[];
  recorded?: string | null;
  onToggle?: (id: string, next: boolean) => void;
  onRecord?: () => void;
};

/**
 * Instruction tiles in a horizontal rail.
 *
 * Tiles hug their own label rather than sharing a fixed width, which is what
 * keeps every label on one line; the rail simply scrolls when they overflow.
 * Record is a tile too, but it holds an action rather than a toggle — hence no
 * checkbox on it.
 */
export function DeliveryInstructions({ instructions, recorded, onToggle, onRecord }: Props) {
  /* Same rail behaviour as coupons and Did You Forget — and it suppresses the
     click after a drag, so dragging across a tile does not toggle it. */
  const railRef = useDragScroll<HTMLDivElement>();

  return (
    <Section title="Delivery Instructions">
      <div className="cart-card">
        <div className="di__rail" ref={railRef}>
          <button className={`di__tile${recorded ? ' is-on' : ''}`} onClick={onRecord}>
            <span className="di__record">
              {recorded ? (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="10" fill="var(--c-green)" />
                  <path d="M8 6.5l6 3.5-6 3.5z" fill="#fff" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" stroke="var(--c-green)" strokeWidth="1.5" />
                  <path d="M4.5 9a5.5 5.5 0 0 0 11 0M10 14.5v3" stroke="var(--c-green)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span className="di__record-label">{recorded ?? 'Record'}</span>
            </span>
            <span className="di__hint">{recorded ? 'Tap to play' : 'Press and hold'}</span>
          </button>

          {instructions.map((i) => (
            <button
              key={i.id}
              className={`di__tile${i.on ? ' is-on' : ''}`}
              onClick={() => onToggle?.(i.id, !i.on)}
            >
              <span className="di__tile-top">
                <Glyph id={i.id} on={i.on} />
                <Checkbox checked={i.on} label={i.label} presentational />
              </span>
              <span className="di__tile-label">{i.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
