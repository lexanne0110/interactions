import type { ReactNode } from 'react';

/**
 * Section shell: 18/700 title over content, 12px apart.
 * `trailing` puts a control on the title row (Bill Details used to; the
 * chevron has since moved into the card, but coupons/wallet may need it).
 */
export function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="cart-section">
      {trailing ? (
        <div className="cart-section__head">
          <h2 className="cart-section__title">{title}</h2>
          {trailing}
        </div>
      ) : (
        <h2 className="cart-section__title">{title}</h2>
      )}
      {children}
    </section>
  );
}

const tick = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.2 4.7 8.4 9.5 3.6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * `presentational` renders a span instead of a button — required wherever the
 * checkbox sits inside a larger clickable surface (the instruction tiles), since
 * a button nested in a button is invalid HTML and React will refuse to hydrate it.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  presentational = false,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  presentational?: boolean;
}) {
  const className = `cbox${checked ? ' is-on' : ''}`;

  if (presentational) {
    return (
      <span className={className} aria-hidden="true">
        {checked && tick}
      </span>
    );
  }

  return (
    <button
      className={className}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
    >
      {checked && tick}
    </button>
  );
}
