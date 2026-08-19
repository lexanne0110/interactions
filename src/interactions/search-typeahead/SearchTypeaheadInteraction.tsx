import { assetUrl } from '../../lib/assetUrl';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductCard } from '../../components/ProductCard';
import { StatusBar } from '../../components/StatusBar';
import {
  ATTA_QUERY,
  recentSearches,
  row1Products,
  row2Products,
  searchSuggestions,
} from '../../data/products';
import '../../App.css';

const HEADER_COLLAPSED = 108;
const HEADER_EXPANDED = 347;
const EASE = [0.22, 1, 0.36, 1] as const;

const suggestionContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
  exit: {
    opacity: 1,
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

const suggestionItem = {
  hidden: { opacity: 0, y: -8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: EASE },
  },
};

const resultsContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.22 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: EASE },
  },
};

const resultsItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: EASE },
  },
};

const emptyContent = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASE, delay: 0.08 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: EASE },
  },
};

export function SearchTypeaheadInteraction() {
  const [query, setQuery] = useState('');

  const showAttaResults = query.toLowerCase() === ATTA_QUERY;
  const headerHeight = showAttaResults ? HEADER_EXPANDED : HEADER_COLLAPSED;

  return (
    <div className="phone-scroll">
      <div className="search-typeahead search-typeahead--active">
        <motion.div
          className="search-typeahead-hero"
          initial={false}
          animate={{ height: headerHeight }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <motion.div
            className="search-typeahead-hero-fill"
            initial={false}
            animate={{
              background: showAttaResults
                ? 'linear-gradient(to bottom, var(--color-header-from), var(--color-header-to))'
                : 'var(--color-header-from)',
            }}
            transition={{ duration: 0.45, ease: EASE }}
          />

          <StatusBar />

          <div className="search-typeahead-bar">
            <div className="search-bar-wrap content-column">
              <div className="search-bar">
                <button
                  type="button"
                  className="search-bar-back-btn"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <img
                    className="search-bar-back"
                    src={assetUrl('/assets/icons/chevron-back.svg')}
                    alt=""
                    aria-hidden
                  />
                </button>

                <input
                  autoFocus
                  type="text"
                  className="search-typeahead-input"
                  aria-label="Search products"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for 'Atta'"
                />

                <img className="search-bar-mic" src={assetUrl('/assets/icons/microphone.svg')} alt="" aria-hidden />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showAttaResults && (
              <motion.div
                key="suggestions"
                className="search-typeahead-suggestions content-column"
                variants={suggestionContainer}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {/* These are real buttons, so they do something: picking a suggestion
                    commits it as the query rather than leaving focusable dead controls. */}
                {searchSuggestions.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    className="suggestion-item search-typeahead-suggestion"
                    variants={suggestionItem}
                    onClick={() => setQuery(ATTA_QUERY)}
                  >
                    <div className="suggestion-thumb">
                      <img src={item.image} alt="" />
                    </div>
                    <span className="suggestion-label">{item.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="search-typeahead-body">
          <AnimatePresence initial={false} mode="wait">
            {showAttaResults ? (
              <motion.div
                key="results"
                className="search-typeahead-results"
                variants={resultsContainer}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div
                  className="filters content-column search-typeahead-filters"
                  variants={resultsItem}
                >
                  <span className="chip chip-active">
                    <span>Filters</span>
                    <img src={assetUrl('/assets/icons/x-green.svg')} alt="" aria-hidden />
                  </span>
                  <span className="chip chip-active chip-with-thumb">
                    <span className="chip-thumb">
                      <img src={assetUrl('/assets/suggestions/suggestion-1.png')} alt="" />
                    </span>
                    <span>Aashirvaad</span>
                    <img src={assetUrl('/assets/icons/x-green.svg')} alt="" aria-hidden />
                  </span>
                  <span className="chip chip-sort">
                    <span>Sort By</span>
                    <img src={assetUrl('/assets/icons/chevron-down.svg')} alt="" aria-hidden />
                  </span>
                  <span className="chip">
                    <span>Price</span>
                    <img src={assetUrl('/assets/icons/chevron-down.svg')} alt="" aria-hidden />
                  </span>
                </motion.div>

                <div className="product-grid content-column">
                  <div className="product-row">
                    {row1Products.map((product) => (
                      <motion.div
                        key={product.id}
                        className="product-card-slot"
                        variants={resultsItem}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                  <div className="product-row">
                    {row2Products.map((product) => (
                      <motion.div
                        key={product.id}
                        className="product-card-slot"
                        variants={resultsItem}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="search-typeahead-empty"
                variants={emptyContent}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <RecentSearchesSection />
                <CuratedSection
                  title="Shreeram's Previously Bought"
                  subtitle="A curated list of your favourites"
                  products={[...row1Products]}
                />
                <CuratedSection
                  title="Milk, a curated list"
                  subtitle="A curated list of your favourites"
                  products={[...row2Products]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RecentSearchesSection() {
  return (
    <section className="search-typeahead-recent content-column">
      <h2 className="search-typeahead-section-title">Recent Searches</h2>
      <div className="search-typeahead-recent-rows">
        <div className="search-typeahead-recent-row">
          {recentSearches.slice(0, 3).map((item) => (
            <RecentChip key={item.id} label={item.label} image={item.image} />
          ))}
        </div>
        <div className="search-typeahead-recent-row">
          {recentSearches.slice(3).map((item) => (
            <RecentChip key={item.id} label={item.label} image={item.image} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentChip({ label, image }: { label: string; image: string }) {
  return (
    <button type="button" className="recent-chip">
      <span className="recent-chip-thumb">
        <img src={image} alt="" />
      </span>
      <span className="recent-chip-label">{label}</span>
    </button>
  );
}

function CuratedSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: typeof row1Products;
}) {
  return (
    <section className="search-typeahead-curated content-column">
      <div className="search-typeahead-curated-header">
        <h2 className="search-typeahead-section-title">{title}</h2>
        <p className="search-typeahead-section-subtitle">{subtitle}</p>
      </div>
      <div className="product-grid">
        <div className="product-row">
          {products.map((product) => (
            <div key={product.id} className="product-card-slot">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="search-typeahead-view-all">
        <span className="search-typeahead-view-all-thumbs" aria-hidden>
          <img src={assetUrl('/assets/suggestions/suggestion-1.png')} alt="" />
          <img src={assetUrl('/assets/products/suggest-2.png')} alt="" />
          <img src={assetUrl('/assets/products/suggest-4.png')} alt="" />
        </span>
        View All Products
      </button>
    </section>
  );
}
