import { cartAssets } from '../cartData';
import { Section } from './Section';

/** Membership — a single exported artwork card; nothing inside it animates. */
export function MembershipCard() {
  return (
    <Section title="Membership">
      <img className="membership__art" src={cartAssets.membership} alt="My Spencers Rewards membership" />
    </Section>
  );
}

/** GSTIN entry row. Chevron leads to the add-GSTIN sheet. */
export function GstinRow({ onOpen }: { onOpen?: () => void }) {
  return (
    <div className="cart-card gstin" onClick={onOpen} role="button" tabIndex={0}>
      <span className="gstin__icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 2.5h10a1 1 0 0 1 1 1v14l-2.5-1.5L11 17.5 8.5 16 6 17.5 4 16V3.5a1 1 0 0 1 1-1Z"
            stroke="var(--c-green)" strokeWidth="1.4" strokeLinejoin="round"
          />
          <path d="M7.5 7h5M7.5 10h5" stroke="var(--c-green)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="gstin__text">
        <span className="gstin__title">Add GSTIN</span>
        <span className="gstin__sub">Claim GST input credit up to 18% on your order</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M7 5l4 4-4 4" stroke="#1d2939" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function CancellationPolicy() {
  return (
    <Section title="Cancellation Policy">
      <div className="cart-card">
        <p className="policy__body">
          Once an order is packed for dispatch, it is deemed final and therefore ineligible for
          cancellation or refund. If your full order or any individual items do not reach you, our
          support team will investigate the issue and promptly issue any eligible refund.
        </p>
      </div>
    </Section>
  );
}
