import { address, payment } from '../cartData';
import { RollingValue } from './RollingValue';

type Props = {
  total?: string;
  totalAmount?: number;
  disabled?: boolean;
  onChangeAddress?: () => void;
  onChangeMethod?: () => void;
  onPay?: () => void;
};

/**
 * Address band + payment row. Pinned, so it sits outside .cart-scroll.
 *
 * The two bands are siblings rather than a wrapper with a shared transform —
 * the Figma group's origin is derived from its children, and moving the group
 * scatters them. Position each band directly.
 */
export function StickyFooter({
  total = payment.total,
  totalAmount = 0,
  disabled = false,
  onChangeAddress,
  onChangeMethod,
  onPay,
}: Props) {
  return (
    <div className="cart-footer">
      <div className="cart-footer__address">
        <span className="cart-footer__pin">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 7.5 10 2.5l7 5V16a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16V7.5Z"
              stroke="var(--c-pay-mid)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M7.75 17.5v-5.25h4.5v5.25" stroke="var(--c-pay-mid)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>

        <span className="cart-footer__addr">
          <span className="cart-footer__addr-title">
            Delivering to <b>{address.label}</b>
          </span>
          <span className="cart-footer__addr-sub">{address.line}</span>
        </span>

        <button className="cart-footer__change" onClick={onChangeAddress}>
          CHANGE
        </button>
      </div>

      <div className="cart-footer__nav">
        <button className="cart-footer__method" onClick={onChangeMethod}>
          <span className="cart-footer__method-text">
            <span className="cart-footer__method-row">
              <svg width="24" height="11" viewBox="0 0 24 11" aria-hidden="true">
                <text
                  x="0"
                  y="9"
                  fontFamily="Onest, system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="700"
                  fontStyle="italic"
                  fill="#1434CB"
                >
                  VISA
                </text>
              </svg>
              <span className="cart-footer__method-name">{payment.method}</span>
            </span>
            <span className="cart-footer__method-row">
              <span className="cart-footer__method-num">{payment.masked}</span>
              <span className="cart-footer__method-num">|</span>
              <span className="cart-footer__method-secure">{payment.secure}</span>
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 10l4-4 4 4" stroke="var(--c-green)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="cart-footer__pay" onClick={onPay} disabled={disabled}>
          Pay&nbsp;<RollingValue value={total} amount={totalAmount} delay={0.08} />
        </button>
      </div>
    </div>
  );
}
