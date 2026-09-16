/**
 * Cart contents, transcribed from Jiffy Revamp → Cart Screens → `Cart_Default`.
 * Prices and copy are the Figma values verbatim so the build can be diffed
 * against the frame without allowing for drift.
 */

export type CartItem = {
  id: string;
  name: string;
  weight: string;
  /** Price paid, in rupees. */
  price: number;
  /** Struck-through original. Absent when the item is not discounted. */
  was?: number;
  qty: number;
  image: string;
  /** Liquor: drives the liquor handling charge and the happy-hour waiver. */
  liquor?: boolean;
};

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/cart/${file}`;

export const cartItems: CartItem[] = [
  { id: 'apple',      name: 'Apple',                         weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-apple.png') },
  { id: 'banana',     name: 'Banana',                        weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-banana.png') },
  // No struck price in Figma — alcohol is never discounted.
  { id: 'johnnie',    name: 'Johnnie Walker Black Label',    weight: '500 g', price: 161,           qty: 1, image: asset('item-johnnie-walker.png'), liquor: true },
  { id: 'ramen',      name: 'Korean Instant Ramen Noodle …', weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-korean-ramen.png') },
  { id: 'atta',       name: 'Aashirvaad Superior MP Atta',   weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-aashirvaad-atta.png') },
  { id: 'ricestick',  name: 'Real Thai Rice Stick 3mm Chick…', weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-real-thai.png') },
  { id: 'rasna',      name: 'Rasna Orange Fruit Plus',       weight: '500 g', price: 161, was: 185, qty: 1, image: asset('item-rasna.png') },
];

/** The liquor line the scenario panel adds and removes — the same Figma item. */
export const liquorItem: CartItem = cartItems.find((i) => i.liquor)!;

/**
 * Carts for the bill-charge prototypes, priced from Figma's member-pricing
 * frame (2508:8449). Every item in `Cart_Default` is ₹161 — above ₹99 and ₹149 —
 * which leaves two of the three fee thresholds unreachable by stepping; these
 * prices sit either side of all three.
 */
const riceStick: CartItem = { id: 'ricestick', name: 'Real Thai Rice Stick 3mm Chick…', weight: '500 g', price: 98, was: 120, qty: 1, image: asset('item-real-thai.png') };

/**
 * ₹235 to start, so every fee begins waived. Remove Apple and the ₹98 left is
 * under both thresholds; stepping Rice Stick to 2 (₹196) and 3 (₹294) waives
 * the small cart fee, then delivery.
 */
export const billChargesItems: CartItem[] = [
  { id: 'apple', name: 'Apple', weight: '500 g', price: 137, was: 161, qty: 1, image: asset('item-apple.png') },
  riceStick,
];

/**
 * Six bottles is ₹966 of liquor — one step short of happy hour's ₹999, so a
 * single tap crosses it. Rice Stick keeps the other fees out of the way.
 */
export const billLiquorItems: CartItem[] = [
  { ...liquorItem, qty: 6 },
  riceStick,
];

export const cartAssets = {
  avatars: asset('avatars-stack.png'),
  membership: asset('membership-card.png'),
  walletJiffy: asset('wallet-jiffy.png'),
  walletSpencers: asset('wallet-spencers.png'),
  couponNavi: asset('coupon-navi.png'),
  couponAxis: asset('coupon-axis.png'),
  /** Rider on the Incognito Mode On sheet — Figma `2280:8938`, exported at 3× with its crop baked in. */
  incognitoRider: asset('incognito-rider.png'),
};

export const delivery = {
  windowLabel: 'Delivery in',
  windowValue: '24 mins',
};

export const address = {
  label: 'Home',
  line: '5th Floor, Diamond Building, #543 lan…',
};

export const payment = {
  method: 'Axis Visa Card',
  masked: '••••••• 9789',
  secure: 'Secured',
  total: '₹482.53',
};
