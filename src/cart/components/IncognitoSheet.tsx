import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cartAssets } from '../cartData';

/** House curve. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** Sheets in and out. */
const SHEET_EASE = [0.32, 0.72, 0, 1] as const;
/** Colour and opacity only. */
const COLOR_EASE = [0.4, 0, 0.2, 1] as const;

/** How long the sheet takes to leave. The screen transform is timed off this. */
export const SHEET_EXIT_S = 0.28;

/**
 * Far enough down that the rider — who stands 105px above the card's top edge —
 * starts and ends fully off screen. Translating by the card's own 100% would
 * leave his head peeking over the bottom edge on both ends.
 */
const OFFSCREEN_Y = 380;

type Props = {
  open: boolean;
  /** Tapping the sheet itself: the shopper wants incognito. */
  onConfirm: () => void;
  /** Close, the scrim, or Escape: back out without changing anything. */
  onClose: () => void;
};

const textIn = (delay: number) => ({
  hidden: { opacity: 0, y: 6, transition: { duration: 0.12, ease: EASE } },
  shown: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE, delay } },
});

/**
 * Incognito Mode On — Figma row 09 (`2280:7000`, "revised": no CTA).
 *
 * The toggle does not flip until this is answered. With the green button gone,
 * the whole sheet is the confirmation, so the card is the button; the floating
 * close is the way out.
 *
 * Enters in beats: scrim and card first, then the rider lifts in, then the
 * copy and the close. Leaves together, fast — the answer is already given.
 *
 * The press scales the contents, never the card. The card spans the phone edge
 * to edge, and shrinking it opened a gap down both sides where the scrim showed.
 */
export function IncognitoSheet({ open, onConfirm, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="incognito-sheet"
          className="incog-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incog-sheet-title"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          <motion.div
            className="incog-sheet__scrim"
            onClick={onClose}
            variants={{
              hidden: { opacity: 0, transition: { duration: 0.24, ease: COLOR_EASE } },
              shown: { opacity: 1, transition: { duration: 0.24, ease: COLOR_EASE } },
            }}
          />

          <motion.button
            type="button"
            className="incog-sheet__close"
            aria-label="Close — keep incognito off"
            onClick={onClose}
            variants={{
              hidden: { opacity: 0, scale: 0.9, transition: { duration: 0.14, ease: EASE } },
              shown: { opacity: 1, scale: 1, transition: { duration: 0.24, ease: EASE, delay: 0.24 } },
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="#1d2939" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          <motion.button
            type="button"
            className="incog-sheet__card"
            aria-label="Turn on incognito mode"
            onClick={onConfirm}
            whileTap="pressed"
            variants={{
              hidden: { y: OFFSCREEN_Y, transition: { duration: SHEET_EXIT_S, ease: SHEET_EASE } },
              shown: { y: 0, transition: { duration: 0.38, ease: SHEET_EASE } },
              pressed: {},
            }}
          >
            <motion.span
              className="incog-sheet__content"
              variants={{
                hidden: { scale: 1 },
                shown: { scale: 1, transition: { duration: 0.16, ease: EASE } },
                pressed: { scale: 0.97, transition: { duration: 0.12, ease: EASE } },
              }}
            >
              <motion.img
                className="incog-sheet__rider"
                src={cartAssets.incognitoRider}
                alt=""
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.94, transition: { duration: 0.14, ease: EASE } },
                  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: EASE, delay: 0.16 } },
                }}
              />
              <motion.span id="incog-sheet-title" className="incog-sheet__title" variants={textIn(0.22)}>
                Incognito Mode On
              </motion.span>
              <motion.span className="incog-sheet__body" variants={textIn(0.28)}>
                Order History won’t be saved for this order.
              </motion.span>
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
