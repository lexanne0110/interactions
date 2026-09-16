// Run with: node src/cart/bill.check.mjs  (Node 23.6+ strips the TypeScript types itself)
import { computeBill } from './bill.ts';
let n = 0;
const item = (price, qty = 1, was, liquor = false) => ({ id: `i${n++}`, name: '', weight: '', image: '', price, was, qty, liquor });
const base = { msr: false, happyHour: false, couponSavings: 0, walletApplied: 0 };
let fails = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const fees = (b) => ({ delivery: b.delivery.charged, smallCart: b.smallCart.charged, packing: b.packing.charged, liquor: b.liquorHandling ? b.liquorHandling.charged : null });

// Full Figma cart: 6 × ₹161 (was ₹185) + Johnnie Walker ₹161
const full = computeBill({ ...base, items: [...Array.from({ length: 6 }, () => item(161, 1, 185)), item(161, 1, undefined, true)] });
check('full cart fees', fees(full), { delivery: 0, smallCart: 0, packing: 0, liquor: 69 });
check('full cart totals', [full.itemTotal, full.itemMrpTotal, full.saved, full.payable], [1127, 1271, 144, 1105]);

// bill-charges demo: Apple ₹137 (was 161) + Rice Stick ₹98 (was 120)
const start = computeBill({ ...base, items: [item(137, 1, 161), item(98, 1, 120)] });
check('charges start ₹235 → all waived', fees(start), { delivery: 0, smallCart: 0, packing: 0, liquor: null });
const riceOnly = computeBill({ ...base, items: [item(98, 1, 120)] });
check('Apple removed ₹98 → both fees', fees(riceOnly), { delivery: 30, smallCart: 30, packing: 0, liquor: null });
const rice2 = computeBill({ ...base, items: [item(98, 2, 120)] });
check('Rice ×2 ₹196 → delivery only', fees(rice2), { delivery: 30, smallCart: 0, packing: 0, liquor: null });
check('Rice ×2 ₹196 as MSR → free', fees(computeBill({ ...base, msr: true, items: [item(98, 2, 120)] })), { delivery: 0, smallCart: 0, packing: 0, liquor: null });
check('Rice ×3 ₹294 → all waived', fees(computeBill({ ...base, items: [item(98, 3, 120)] })), { delivery: 0, smallCart: 0, packing: 0, liquor: null });

// Boundaries are strict: "above"
check('₹199 exactly → delivery charged', computeBill({ ...base, items: [item(199)] }).delivery.charged, 30);
check('₹200 → delivery free', computeBill({ ...base, items: [item(200)] }).delivery.charged, 0);
check('₹149 exactly as MSR → charged', computeBill({ ...base, msr: true, items: [item(149)] }).delivery.charged, 30);
check('₹150 as MSR → free', computeBill({ ...base, msr: true, items: [item(150)] }).delivery.charged, 0);
check('₹99 exactly → small cart charged', computeBill({ ...base, items: [item(99)] }).smallCart.charged, 30);
check('₹100 → small cart waived', computeBill({ ...base, items: [item(100)] }).smallCart.charged, 0);

// Liquor
check('no liquor → no handling line', computeBill({ ...base, items: [item(500)] }).liquorHandling, null);
check('liquor, no happy hour, ₹1,127 → ₹69', computeBill({ ...base, items: [item(161, 7, undefined, true)] }).liquorHandling.charged, 69);
check('happy hour, ₹966 liquor → ₹69', computeBill({ ...base, happyHour: true, items: [item(161, 6, undefined, true), item(98)] }).liquorHandling.charged, 69);
check('happy hour, ₹1,127 liquor → waived', computeBill({ ...base, happyHour: true, items: [item(161, 7, undefined, true), item(98)] }).liquorHandling.charged, 0);
check('happy hour, ₹999 exactly → charged', computeBill({ ...base, happyHour: true, items: [item(999, 1, undefined, true)] }).liquorHandling.charged, 69);
check('happy hour counts liquor only, not item total', computeBill({ ...base, happyHour: true, items: [item(500, 1, undefined, true), item(900)] }).liquorHandling.charged, 69);

// Money semantics
const withCoupon = computeBill({ ...base, couponSavings: 20, items: [item(137, 1, 161), item(98, 1, 120)] });
check('coupon raises saved and lowers payable', [withCoupon.saved, withCoupon.payable], [start.saved + 20, start.payable - 20]);
const withWallet = computeBill({ ...base, walletApplied: 20, items: [item(137, 1, 161), item(98, 1, 120)] });
check('wallet lowers payable but not saved', [withWallet.saved, withWallet.payable], [start.saved, start.payable - 20]);
check('coupon never brings a fee back (thresholds use item total)', fees(computeBill({ ...base, couponSavings: 200, items: [item(210)] })).delivery, 0);
check('empty cart → nothing to pay', [computeBill({ ...base, items: [] }).payable, fees(computeBill({ ...base, items: [] }))], [0, { delivery: 0, smallCart: 0, packing: 0, liquor: null }]);

console.log(`\n${fails === 0 ? 'ALL PASS' : `${fails} FAILED`}`);
process.exit(fails ? 1 : 0);
