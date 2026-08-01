import { assetUrl } from '../lib/assetUrl';
type Props = {
  variant: 'popup' | 'pdp';
  onBack: () => void;
};

export function HeroControls({ variant, onBack }: Props) {
  const isPopup = variant === 'popup';

  return (
    <div className={`hero-controls ${isPopup ? 'hero-controls-popup' : 'hero-controls-pdp'}`}>
      <button
        type="button"
        className="hero-btn hero-btn-back"
        onClick={onBack}
        aria-label={isPopup ? 'Close' : 'Back'}
      >
        {isPopup ? (
          <img src={assetUrl('/assets/icons/chevron-popup-close.svg')} alt="" />
        ) : (
          <span className="hero-btn-back-icon">
            <img src={assetUrl('/assets/icons/chevron-back.svg')} alt="" />
          </span>
        )}
      </button>
      <button type="button" className="hero-btn hero-btn-search" aria-label="Search">
        <img src={assetUrl('/assets/icons/search-popup.svg')} alt="" />
      </button>
      <button type="button" className="hero-btn hero-btn-share" aria-label="Share">
        <img src={assetUrl('/assets/icons/share.svg')} alt="" />
      </button>
    </div>
  );
}
