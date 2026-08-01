import { motion } from 'framer-motion';
import type { Product } from '../data/products';
import { cardLeafFadeIn } from '../lib/transitions';
import { CardHeroImages } from './CardHeroImages';

type Props = {
  product: Product;
  closing?: boolean;
};

/**
 * Full card replica shown inside the morphing popup sheet during close.
 * Matches ProductCard layout (shell + ADD) so the morph lands on the grid card.
 */
export function CardMorphPreview({ product, closing = false }: Props) {
  const leafTransition = closing ? cardLeafFadeIn : { duration: 0 };

  return (
    <div className="card-morph-preview">
      <div className="card-expand-shell">
        <div
          className={`card-media card-media-in-shell ${product.heroBg === 'cream' ? 'hero-cream' : 'hero-tan'}`}
        >
          <img
            className="card-frame-bg"
            src="/assets/products/card-frame.png"
            alt=""
            aria-hidden
          />
          <div className="card-hero-wrap">
            <div
              className={`card-hero-inner${product.heroBg === 'cream' ? ' card-hero-cream' : ''}`}
            >
              <CardHeroImages product={product} useExpandSlot />
            </div>
          </div>
          {product.previouslyBought && (
            <motion.div
              className="badge-wrap card-leaf"
              initial={{ opacity: closing ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={leafTransition}
            >
              <span className="badge">Previously Bought</span>
            </motion.div>
          )}
          <motion.div
            className="size-pill card-leaf"
            initial={{ opacity: closing ? 0 : 1 }}
            animate={{ opacity: 1 }}
            transition={leafTransition}
          >
            <span>{product.size}</span>
          </motion.div>
        </div>

        <motion.div
          className="card-body card-leaf"
          initial={{ opacity: closing ? 0 : 1 }}
          animate={{ opacity: 1 }}
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

      <motion.button
        type="button"
        className="add-btn card-leaf"
        tabIndex={-1}
        aria-hidden
        initial={{ opacity: closing ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={leafTransition}
      >
        ADD
      </motion.button>
    </div>
  );
}
