type Props = {
  variant: 'card' | 'popup';
};

const POPUP_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 127 26' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.699999988079071'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.449 0 0 1.525 63.5 13)'><stop stop-color='rgba(0,77,255,1)' offset='0'/><stop stop-color='rgba(0,77,255,0.47)' offset='1'/></radialGradient></defs></svg>\")";

export function PreviouslyBoughtBadge({ variant }: Props) {
  if (variant === 'card') {
    return <span className="badge">Previously Bought</span>;
  }

  return (
    <span
      className="badge-popup"
      style={{ backgroundImage: POPUP_GRADIENT }}
    >
      Previously Bought
    </span>
  );
}
