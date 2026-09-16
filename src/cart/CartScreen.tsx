import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cartItems as seedItems, liquorItem, type CartItem } from './cartData';
import {
  CartChrome, AddMoreItems, INCOGNITO_SHIFT, STRIP_H, chromeTravel, type ChromeMotion,
} from './components/CartChrome';
import { ItemsCard } from './components/ItemsCard';
import { DidYouForget, seedSuggestions } from './components/DidYouForget';
import { WalletCard, seedWallets, type Wallet } from './components/WalletCard';
import { CouponsCard, seedCoupons, type Coupon } from './components/CouponsCard';
import { BillCard, type BillLine } from './components/BillCard';
import { MembershipCard, GstinRow, CancellationPolicy } from './components/StaticSections';
import { DeliveryInstructions, seedInstructions, type Instruction } from './components/DeliveryInstructions';
import { EmptyCart } from './components/EmptyCart';
import { StickyFooter } from './components/StickyFooter';
import { IncognitoSheet, SHEET_EXIT_S } from './components/IncognitoSheet';
import { computeBill, FEES, THRESHOLDS, type Bill } from './bill';
import { createScenarioStore, useScenario, type ScenarioStore } from './scenario';
import './cart.css';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Coupon apply plays in three beats, so each has one thing to watch.
 *
 * 0ms   — the card: press, check spring, confetti, ring. Nothing else moves.
 * 450ms — the header: band turns green, the savings strip slides out and the
 *         list moves down with it. Held until the confetti has peaked, so the
 *         card is not dragged 34px while the user is still watching it.
 * 750ms — the money: Pay and the bill's savings line roll.
 *
 * Removing is an undo with nothing to celebrate, so it skips the beats and
 * everything returns together.
 */
const BEAT_HEADER_MS = 450;
const BEAT_MONEY_MS = 750;

const couponSavingsOf = (list: Coupon[]) =>
  list.filter((c) => c.applied).reduce((s, c) => s + c.saves, 0);

const rupees = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** For screens without a scenario panel: no membership, no happy hour, liquor follows the items. */
const noScenario = createScenarioStore({ msr: false, happyHour: false, liquor: false });

export type SectionId =
  | 'items' | 'dyf' | 'wallet' | 'coupons' | 'membership'
  | 'bill' | 'gstin' | 'instructions' | 'policy';

const ALL: SectionId[] = ['items', 'dyf', 'wallet', 'coupons', 'membership', 'bill', 'gstin', 'instructions', 'policy'];

type ScreenProps = {
  /** Render only these sections — lets a prototype isolate what it is demonstrating. */
  sections?: SectionId[];
  /** Section to bring into view on mount. */
  focus?: SectionId;
  billOpen?: boolean;
  /** Show the empty state once the last item is removed. */
  emptyOnZero?: boolean;
  /** Starting cart. Defaults to Figma's `Cart_Default`. */
  initialItems?: CartItem[];
  /** Conditions set outside the phone — membership, happy hour, liquor. */
  scenario?: ScenarioStore;
};

/**
 * Bill lines, in Figma's order, from the calculated bill.
 *
 * A waived fee keeps its row and shows the original struck through: Figma's
 * above-threshold bill does exactly that, and it is what lets the shopper see
 * the fee they just stopped paying. Liquor handling is the exception — without
 * liquor it has no row at all, because it isn't a fee that was waived, it is
 * one that doesn't exist.
 */
function billLinesFor(bill: Bill, wallets: Wallet[], happyHour: boolean): BillLine[] {
  const msr = bill.deliveryThreshold === THRESHOLDS.deliveryMsr;
  const lines: BillLine[] = [
    {
      id: 'items', label: 'Item Total',
      value: rupees(bill.itemTotal), amount: bill.itemTotal,
      was: bill.itemMrpTotal > bill.itemTotal ? rupees(bill.itemMrpTotal) : undefined,
    },
    {
      id: 'promo', label: 'Promotional Discount',
      value: `-${rupees(bill.promo)}`, amount: -bill.promo,
      tone: 'credit', labelTone: 'credit',
    },
    {
      id: 'delivery', label: 'Delivery Charge',
      value: bill.delivery.waived ? 'FREE' : rupees(bill.delivery.charged),
      amount: bill.delivery.charged,
      was: bill.delivery.waived ? rupees(bill.delivery.list) : undefined,
      tone: bill.delivery.waived ? 'free' : undefined,
      state: bill.delivery.waived ? 'waived' : 'charged',
      explain: [
        { title: `For orders below ₹${bill.deliveryThreshold}`, value: rupees(FEES.delivery), note: 'Standard delivery charge applies' },
        { title: `For orders above ₹${bill.deliveryThreshold}`, value: '₹0', note: msr ? 'Free delivery for MSR members' : 'Free delivery' },
      ],
    },
    {
      id: 'packing', label: 'Packing Charge',
      value: rupees(bill.packing.charged), amount: bill.packing.charged,
      was: bill.packing.waived ? rupees(bill.packing.list) : undefined,
      state: bill.packing.waived ? 'waived' : 'charged',
      explain: 'Covers bags and protective packaging for fragile items.',
    },
    {
      id: 'smallcart', label: 'Small Cart Fee',
      value: rupees(bill.smallCart.charged), amount: bill.smallCart.charged,
      was: bill.smallCart.waived ? rupees(bill.smallCart.list) : undefined,
      state: bill.smallCart.waived ? 'waived' : 'charged',
      // The threshold lives in the tooltip, not inline. Figma's tooltip copy
      // reads ₹199; the rule is ₹99, so the rule wins.
      explain: [
        { title: `For orders below ₹${THRESHOLDS.smallCart}`, value: rupees(FEES.smallCart), note: 'Small cart fee applies' },
        { title: `For orders above ₹${THRESHOLDS.smallCart}`, value: '₹0', note: 'No small cart fee' },
      ],
    },
  ];

  if (bill.liquorHandling) {
    lines.push({
      id: 'liquor', label: 'Liquor Handling Charge', optional: true,
      value: rupees(bill.liquorHandling.charged), amount: bill.liquorHandling.charged,
      was: bill.liquorHandling.waived ? rupees(bill.liquorHandling.list) : undefined,
      state: bill.liquorHandling.waived ? 'waived' : 'charged',
      explain: [
        { title: 'Orders with liquor', value: rupees(FEES.liquorHandling), note: 'Liquor handling charge applies' },
        ...(happyHour
          ? [{ title: `Happy hour, liquor above ₹${THRESHOLDS.happyHourLiquor}`, value: '₹0', note: 'Waived during happy hour' }]
          : []),
      ],
    });
  }

  lines.push({
    id: 'gst', label: 'GST and Charges',
    value: rupees(bill.gst), amount: bill.gst,
    explain: 'Government taxes and applicable statutory charges.',
  });

  // Wallet deductions come last, right above the total — a payment, not a charge.
  for (const w of wallets.filter((x) => x.applied)) {
    lines.push({
      id: `wallet-${w.id}`, label: w.name, optional: true,
      value: `-${rupees(w.eligible)}`, amount: -w.eligible, tone: 'credit',
    });
  }

  return lines;
}

export function CartScreen({
  sections = ALL,
  focus,
  billOpen: initialBillOpen = false,
  emptyOnZero = false,
  initialItems = seedItems,
  scenario = noScenario,
}: ScreenProps = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [wallets, setWallets] = useState<Wallet[]>(seedWallets);
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons);
  const [instructions, setInstructions] = useState<Instruction[]>(seedInstructions);
  const [incognito, setIncognito] = useState(false);
  const [billOpen, setBillOpen] = useState(initialBillOpen);
  const [explain, setExplain] = useState<string | null>(null);

  /**
   * Incognito asks before it turns on.
   *
   * The toggle opens the Incognito Mode On sheet and stays off. Tapping the
   * sheet confirms; close, the scrim or Escape back out and nothing changes.
   * Turning incognito off needs no confirmation — the sheet only speaks to
   * switching it on.
   *
   * On confirm the transform waits until the sheet has gone and then plays as
   * its own, slower beat — started under the exit, it was over before the eye
   * got back to the header.
   */
  const [incognitoAsk, setIncognitoAsk] = useState(false);
  /* What moved the chrome last. The header, strips and body read one travel
     from it, so they stay in lockstep whichever pace is playing. */
  const [chromeMotion, setChromeMotion] = useState<ChromeMotion>('default');
  const incognitoHandoff = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(incognitoHandoff.current), []);
  const toggleIncognito = () => {
    if (incognito) { setChromeMotion('default'); setIncognito(false); return; }
    setIncognitoAsk(true);
  };
  const confirmIncognito = () => {
    setIncognitoAsk(false);
    window.clearTimeout(incognitoHandoff.current);
    incognitoHandoff.current = window.setTimeout(() => {
      setChromeMotion('incognito-confirmed');
      setIncognito(true);
    }, (SHEET_EXIT_S + 0.04) * 1000);
  };
  const closeIncognitoAsk = () => setIncognitoAsk(false);
  const { msr, happyHour, liquor } = useScenario(scenario);
  const hasScenario = scenario !== noScenario;

  /* Liquor is two-way. The panel can add or remove the bottle, and stepping it
     to zero removes it too. Each side writes only when it disagrees with the
     other, so the pair settles instead of ping-ponging. */
  useEffect(() => {
    if (!hasScenario) return;
    setItems((list) => {
      const has = list.some((i) => i.liquor);
      if (liquor && !has) return [...list, { ...liquorItem, qty: 1 }];
      if (!liquor && has) return list.filter((i) => !i.liquor);
      return list;
    });
  }, [liquor, hasScenario]);

  const itemsHaveLiquor = items.some((i) => i.liquor);
  useEffect(() => {
    if (hasScenario) scenario.set({ liquor: itemsHaveLiquor });
  }, [itemsHaveLiquor, hasScenario, scenario]);

  /* One coupon list per beat. `coupons` is the truth and drives the card;
     the header and the money read snapshots that catch up on their beat. */
  const [chromeCoupons, setChromeCoupons] = useState<Coupon[]>(seedCoupons);
  const [moneyCoupons, setMoneyCoupons] = useState<Coupon[]>(seedCoupons);
  const couponsRef = useRef(coupons);
  useEffect(() => { couponsRef.current = coupons; }, [coupons]);
  const beatTimers = useRef<number[]>([]);
  const clearBeats = () => {
    beatTimers.current.forEach((t) => window.clearTimeout(t));
    beatTimers.current = [];
  };
  useEffect(() => clearBeats, []);

  const applyCoupon = (id: string) => {
    setCoupons((cs) => cs.map((c) => (c.id === id ? { ...c, applied: true } : c)));
    /* Timers read the latest truth when they fire, not a closure copy, so two
       applies inside one beat still land on the final state. */
    beatTimers.current.push(
      window.setTimeout(() => {
        setChromeMotion('default');
        setChromeCoupons(couponsRef.current);
      }, BEAT_HEADER_MS),
      window.setTimeout(() => setMoneyCoupons(couponsRef.current), BEAT_MONEY_MS),
    );
  };

  const removeCoupon = (id: string) => {
    clearBeats();
    const next = couponsRef.current.map((c) => (c.id === id ? { ...c, applied: false } : c));
    setCoupons(next);
    setChromeMotion('default');
    setChromeCoupons(next);
    setMoneyCoupons(next);
  };

  const show = (id: SectionId) => sections.includes(id);
  const isEmpty = emptyOnZero && items.length === 0;

  /**
   * Every figure on screen comes from one calculated bill.
   *
   * Coupons and wallets are deliberately not the same thing. A coupon is money
   * somebody else took off the order, so it raises "You saved". Wallet balance
   * is the shopper's own money: it lowers what is payable but saves nothing.
   */
  const walletApplied = wallets.filter((w) => w.applied).reduce((s, w) => s + w.eligible, 0);
  const bill = computeBill({
    items, msr, happyHour,
    couponSavings: couponSavingsOf(moneyCoupons),
    walletApplied,
  });
  const billLines = billLinesFor(bill, wallets, happyHour);

  /* The header announces savings only while a coupon is applied, on its own
     beat. It arrives already showing the final figure; the bill's "You saved"
     line catches up to the same number 300ms later, on the money beat. */
  const couponApplied = chromeCoupons.some((c) => c.applied);
  const chromeSaved = bill.itemMrpTotal - bill.itemTotal + couponSavingsOf(chromeCoupons);

  useEffect(() => {
    if (!focus) return;
    const labels: Partial<Record<SectionId, string>> = {
      bill: 'Bill Details', wallet: 'Wallet',
      coupons: 'Coupons & Offers', instructions: 'Delivery Instructions',
      dyf: 'Did You Forget',
    };
    const heading = [...(scrollRef.current?.querySelectorAll('.cart-section__title') ?? [])]
      .find((n) => n.textContent === labels[focus]);
    if (heading && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (heading as HTMLElement).offsetTop - 112);
    }
  }, [focus]);

  const handleQuantityChange = (id: string, next: number) =>
    setItems((list) =>
      next === 0 ? list.filter((i) => i.id !== id) : list.map((i) => (i.id === id ? { ...i, qty: next } : i)),
    );

  /**
   * Sections collapse top-down as the cart empties, 40ms apart.
   *
   * `overflow` is animated to hidden only for the exit. Setting it statically
   * clips the card's shadow, which is the card's only edge.
   */
  const collapsible = (key: string, index: number, children: ReactNode) => (
    <motion.div
      key={key}
      className="cart-section-slot"
      exit={{ height: 0, opacity: 0, marginTop: 0, overflow: 'hidden' }}
      transition={{ duration: 0.28, ease: EASE, delay: index * 0.04 }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="cart-screen">
      <div className="cart-scroll" ref={scrollRef}>
        {/* The body follows the header down so the first card keeps its
            clearance. A transform, not padding — the scroll range is
            unchanged, and the travel is absorbed by the body's bottom slack.
            Shares the header's transition object rather than restating it:
            any divergence would open and close a gap under the header. */}
        <motion.div
          className={`cart-body${sections.length === 1 ? ' cart-body--focused' : ''}`}
          initial={false}
          animate={{ y: (incognito ? INCOGNITO_SHIFT : 0) + (couponApplied ? STRIP_H : 0) }}
          transition={chromeTravel(chromeMotion)}
        >
          <AnimatePresence>
            {!isEmpty && [
              show('items') && collapsible('items', 0, (
                <div className="cart-section-stack">
                  <ItemsCard items={items} onQuantityChange={handleQuantityChange} />
                  <AddMoreItems />
                </div>
              )),
              show('dyf') && collapsible('dyf', 1, <DidYouForget suggestions={seedSuggestions} />),
              show('wallet') && collapsible('wallet', 2, (
                <WalletCard
                  wallets={wallets}
                  onToggle={(id, next) =>
                    setWallets((ws) => ws.map((w) => (w.id === id ? { ...w, applied: next } : w)))}
                />
              )),
              show('coupons') && collapsible('coupons', 3, (
                <CouponsCard coupons={coupons} onApply={applyCoupon} onRemove={removeCoupon} />
              )),
              show('membership') && collapsible('membership', 4, <MembershipCard />),
              show('bill') && collapsible('bill', 5, (
                <BillCard
                  savings={rupees(bill.saved)}
                  savingsAmount={bill.saved}
                  was={bill.saved > 0 ? rupees(bill.payable + bill.saved) : undefined}
                  now={rupees(bill.payable)}
                  nowAmount={bill.payable}
                  lines={billLines}
                  expanded={billOpen}
                  openExplain={explain}
                  /* Collapsing also dismisses any open tooltip — leaving one
                     mounted lets it flash over the total row on the way down. */
                  onToggle={() => setBillOpen((v) => { if (v) setExplain(null); return !v; })}
                  onExplain={(id) => setExplain((cur) => (cur === id ? null : id))}
                  scrollRef={scrollRef}
                />
              )),
              show('gstin') && collapsible('gstin', 6, <GstinRow />),
              show('instructions') && collapsible('instructions', 7, (
                <DeliveryInstructions
                  instructions={instructions}
                  onToggle={(id, next) =>
                    setInstructions((list) => list.map((i) => (i.id === id ? { ...i, on: next } : i)))}
                />
              )),
              show('policy') && collapsible('policy', 8, <CancellationPolicy />),
            ].filter(Boolean)}
          </AnimatePresence>
        </motion.div>
      </div>

      {isEmpty && <EmptyCart />}

      <CartChrome
        incognito={incognito}
        saved={couponApplied ? chromeSaved : null}
        chromeMotion={chromeMotion}
        onToggleIncognito={toggleIncognito}
      />

      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            key="footer"
            exit={{ y: 120 }}
            transition={{ duration: 0.24, ease: EASE }}
            style={{ position: 'absolute', left: 0, bottom: 0, width: '100%' }}
          >
            <StickyFooter total={rupees(bill.payable)} totalAmount={bill.payable} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last, so it covers the chrome and the footer as well as the list. */}
      <IncognitoSheet open={incognitoAsk} onConfirm={confirmIncognito} onClose={closeIncognitoAsk} />
    </div>
  );
}
