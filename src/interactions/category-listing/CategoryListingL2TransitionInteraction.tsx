import { assetUrl } from '../../lib/assetUrl';
import { useState } from 'react';
import { CategoryListingProductCard } from '../../components/CategoryListingProductCard';
import { CategorySidebar } from '../../components/CategorySidebar';
import { StatusBar } from '../../components/StatusBar';
import {
  categoryListingProducts,
  categorySidebarItems,
  DEFAULT_SIDEBAR_SELECTION,
} from '../../data/categoryListing';
import '../../App.css';

export function CategoryListingL2TransitionInteraction() {
  const [selectedId, setSelectedId] = useState(DEFAULT_SIDEBAR_SELECTION);

  return (
    <div className="phone-scroll">
      <div className="cl-screen">
        <StatusBar />

        <div className="cl-toolbar">
          <button type="button" className="cl-toolbar-btn" aria-label="Back">
            <img src={assetUrl('/assets/category-listing/icons/chevron-back-cl.svg')} alt="" aria-hidden />
          </button>
          <h1 className="cl-toolbar-title">Foodgrains, Oil &amp; Masala</h1>
          <button type="button" className="cl-toolbar-btn" aria-label="Search">
            <img src={assetUrl('/assets/category-listing/icons/search-cl.svg')} alt="" aria-hidden />
          </button>
        </div>

        <div className="cl-body">
          <CategorySidebar
            items={categorySidebarItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showBadges={false}
          />

          <main className="cl-main">
            <div className="cl-filters">
              <div className="chip chip-active cl-filter-chip">
                <span>Filters</span>
                <img src={assetUrl('/assets/category-listing/icons/x-cl.svg')} alt="" aria-hidden />
              </div>
              <div className="chip chip-active cl-filter-brand">
                <div className="cl-filter-brand-thumb">
                  <img src={assetUrl('/assets/category-listing/filter-aashirvaad.png')} alt="" />
                </div>
                <span>Aashirvaad</span>
                <img src={assetUrl('/assets/category-listing/icons/x-cl.svg')} alt="" aria-hidden />
              </div>
              <div className="chip cl-filter-sort">
                <span>Sort By</span>
                <img src={assetUrl('/assets/category-listing/icons/chevron-down-cl.svg')} alt="" aria-hidden />
              </div>
              <div className="chip cl-filter-price">
                <span>Price</span>
                <img src={assetUrl('/assets/category-listing/icons/chevron-down-cl.svg')} alt="" aria-hidden />
              </div>
            </div>

            <div className="cl-grid">
              {categoryListingProducts.map((product) => (
                <CategoryListingProductCard key={product.id} product={product} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
