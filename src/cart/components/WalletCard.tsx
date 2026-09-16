import { AnimatePresence, motion } from 'framer-motion';
import { cartAssets } from '../cartData';
import { Section, Checkbox } from './Section';

/** House curve. */
const EASE = [0.22, 1, 0.36, 1] as const;

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  /** Amount of the balance usable on this order — deliberately not the balance. */
  eligible: number;
  logo: string;
  applied: boolean;
};

export const seedWallets: Wallet[] = [
  { id: 'jiffy', name: 'Jiffy Wallet', balance: 100, eligible: 20, logo: cartAssets.walletJiffy, applied: false },
  { id: 'spencers', name: 'Spencers Wallet', balance: 100, eligible: 15, logo: cartAssets.walletSpencers, applied: false },
];

type Props = {
  wallets: Wallet[];
  onToggle?: (id: string, next: boolean) => void;
  onAddBalance?: () => void;
};

export function WalletCard({ wallets, onToggle, onAddBalance }: Props) {
  return (
    <Section title="Wallet">
      <div className="cart-card">
        <div className="wallet__rows">
          {wallets.map((w, i) => (
            <div key={w.id}>
              {i > 0 && <div className="wallet__rule" />}
              <div className="wallet__row">
                <img className="wallet__logo" src={w.logo} alt="" />
                <span className="wallet__text">
                  <span className="wallet__name">{w.name}</span>
                  {/* The balance line swaps for a statement of what actually
                      came off. `eligible ≠ balance` is the whole point of this
                      card, and it is easiest to read at the moment of applying:
                      ₹20 of a ₹100 balance, said plainly. */}
                  <span className="wallet__balance">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={w.applied ? 'applied' : 'idle'}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.16, ease: EASE }}
                      >
                        {w.applied ? (
                          <>
                            <em>₹{w.eligible} applied</em> · ₹{w.balance - w.eligible} left
                          </>
                        ) : (
                          <>
                            Balance ₹{w.balance} · <em>₹{w.eligible} eligible</em>
                          </>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
                <Checkbox
                  checked={w.applied}
                  label={`Use ${w.name}`}
                  onChange={(next) => onToggle?.(w.id, next)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="cart-pill" onClick={onAddBalance}>
        Add Wallet Balance
      </button>
    </Section>
  );
}
