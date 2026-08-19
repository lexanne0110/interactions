import { assetUrl } from '../lib/assetUrl';

type Props = {
  className?: string;
};

/**
 * Phone status bar (time + wifi/reception/battery).
 *
 * Shared by every screen mock so the chrome can't drift between interactions — it was
 * previously copy-pasted into both category-listing screens, the typeahead and the
 * search screen. The PDP has its own variant (`.pdp-status-bar`) because it animates
 * with scroll progress.
 */
export function StatusBar({ className = '' }: Props) {
  return (
    <div className={`status-bar ${className}`.trim()}>
      <img className="status-time" src={assetUrl('/assets/icons/time-1047.svg')} alt="10:47" />
      <div className="status-icons">
        <img src={assetUrl('/assets/icons/wifi.svg')} alt="" aria-hidden />
        <img src={assetUrl('/assets/icons/reception.svg')} alt="" aria-hidden />
        <img src={assetUrl('/assets/icons/battery.svg')} alt="" aria-hidden />
      </div>
    </div>
  );
}
