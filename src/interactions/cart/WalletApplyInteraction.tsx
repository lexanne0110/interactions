import { CartScreen } from '../../cart/CartScreen';

/**
 * wallet-apply — tick Jiffy Wallet.
 *
 * The bill opens on mount because the consequence lives inside it: a wallet
 * line appearing among the charges is the thing worth watching, and it would
 * be invisible behind a collapsed card.
 *
 * Note what does *not* move — "You saved" holds still. Wallet balance is the
 * user's own money, so it lowers the payable without being a saving.
 */
export function WalletApplyInteraction() {
  return <CartScreen sections={['wallet', 'bill']} billOpen />;
}
