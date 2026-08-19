import { assetUrl } from '../lib/assetUrl';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../data/products';
import type { ExpandOrigin } from '../lib/expandOrigin';
import { measureExpandOrigin } from '../lib/expandOrigin';
import { AddButtonStepper } from './AddButtonStepper';
import { CardHeroImages } from './CardHeroImages';
import { cardLeafFadeIn, cardLeafFadeOut } from '../lib/transitions';

type Props = {
  product: Product;
  onExpand?: (origin: ExpandOrigin) => void;
  hidden?: boolean;
  layoutResetKey?: number;
  addButtonVariant?: 'default' | 'stepper';
  disableExpand?: boolean;
  quantity?: number;
  onQuantityChange?: (next: number, prev: number) => void;
};

export function ProductCard({
  product,
  onExpand,
  hidden,
  layoutResetKey = 0,
  addButtonVariant = 'default',
  disableExpand = false,
  quantity,
  onQuantityChange,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const isExpandable = product.expandable && !disableExpand;
  const leafVisible = !hidden;
  // Un-hiding only ever happens during a close — either the non-target cards coming back
  // when the popup starts collapsing, or the target card at the handoff. `{duration: 0}`
  // made both of those snap; they now fade on the close curve so the grid settles rather
  // than popping. (Mount is unaffected: framer seeds initial from animate, so a card that
  // starts visible does not animate in.)
  const leafTransition = hidden ? cardLeafFadeOut : cardLeafFadeIn;

  const handleExpand = () => {
    if (!shellRef.current) return;
    onExpand?.(measureExpandOrigin(shellRef.current));
  };

  return (
    <article
      data-product-id={product.id}
      className={`product-card ${isExpandable ? 'expandable' : ''} ${hidden ? 'is-hidden' : ''}`}
    >
      {/* A stretched hit area rather than role="button" on the <article>. The card
          contains the ADD control, and a button role may not contain other interactive
          elements — that nesting also made Enter/Space ambiguous between the two. */}
      {isExpandable && (
        <button
          type="button"
          className="card-expand-hit"
          aria-label={`View details for ${product.title}`}
          tabIndex={hidden ? -1 : 0}
          onClick={handleExpand}
        />
      )}

      {isExpandable ? (
        <div
          key={`card-expand-${layoutResetKey}`}
          ref={shellRef}
          className="card-expand-shell"
        >
          <div
            className={`card-media card-media-in-shell ${product.heroBg === 'cream' ? 'hero-cream' : 'hero-tan'}`}
          >
            <img
              className="card-frame-bg"
              src={assetUrl('/assets/products/card-frame.png')}
              alt=""
              aria-hidden
            />
            <div className="card-hero-wrap">
              <div
                className={`card-hero-inner${product.heroBg === 'cream' ? ' card-hero-cream' : ''}`}
              >
                <CardHeroImages
                  product={product}
                  layoutResetKey={layoutResetKey}
                  useExpandSlot
                />
              </div>
            </div>
            {product.previouslyBought && (
              <motion.div
                className="badge-wrap card-leaf"
                animate={{ opacity: leafVisible ? 1 : 0 }}
                transition={leafTransition}
              >
                <span className="badge">Previously Bought</span>
              </motion.div>
            )}
            <motion.div
              className="size-pill card-leaf"
              animate={{ opacity: leafVisible ? 1 : 0 }}
              transition={leafTransition}
            >
              <span>{product.size}</span>
            </motion.div>
          </div>

          <motion.div
            className="card-body card-leaf"
            animate={{ opacity: leafVisible ? 1 : 0 }}
            transition={leafTransition}
          >
            <div className="card-info">
              <div className="price-row">
                <span className="price">{product.price}</span>
                <span className="mrp">{product.mrp}</span>
              </div>
              <h3 className="title">{product.title}</h3>
              <p className="eta">{product.eta}</p>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <div
            className={`card-media ${product.heroBg === 'cream' ? 'hero-cream' : 'hero-tan'}`}
          >
            <img
              className="card-frame-bg"
              src={assetUrl('/assets/products/card-frame.png')}
              alt=""
              aria-hidden
            />
            <motion.div className="card-hero-wrap">
              <div
                className={`card-hero-inner${product.heroBg === 'cream' ? ' card-hero-cream' : ''}`}
              >
                <CardHeroImages
                  product={product}
                  layoutResetKey={layoutResetKey}
                  useExpandSlot={false}
                />
              </div>
            </motion.div>
            {product.previouslyBought && (
              <div className="badge-wrap">
                <span className="badge">Previously Bought</span>
              </div>
            )}
            <div className="size-pill">
              <span>{product.size}</span>
            </div>
          </div>

          <div className="card-body">
            <div className="card-info">
              <div className="price-row">
                <span className="price">{product.price}</span>
                <span className="mrp">{product.mrp}</span>
              </div>
              <h3 className="title">{product.title}</h3>
              <p className="eta">{product.eta}</p>
            </div>
          </div>
        </>
      )}

      {addButtonVariant === 'stepper' ? (
        <motion.div
          className="card-leaf"
          animate={{ opacity: leafVisible ? 1 : 0 }}
          transition={leafTransition}
        >
          <AddButtonStepper count={quantity} onCountChange={onQuantityChange} />
        </motion.div>
      ) : (
        <motion.button
          className="add-btn card-leaf"
          type="button"
          animate={{ opacity: leafVisible ? 1 : 0 }}
          transition={leafTransition}
          onClick={(e) => e.stopPropagation()}
        >
          ADD
        </motion.button>
      )}
    </article>
  );
}
