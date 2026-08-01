import type { CategorySidebarItem } from '../data/categoryListing';

type Props = {
  items: CategorySidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Sidebar offer strips (e.g. Atta 40% OFF). Off for L2. */
  showBadges?: boolean;
};

export function CategorySidebar({
  items,
  selectedId,
  onSelect,
  showBadges = true,
}: Props) {
  return (
    <aside className="cl-sidebar">
      <nav className="cl-sidebar-nav">
        {items.map((item) => {
          const isActive = item.id === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              className={['cl-sidebar-item', isActive && 'is-active'].filter(Boolean).join(' ')}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'true' : undefined}
            >
              <div className={['cl-sidebar-card', isActive && 'is-active'].filter(Boolean).join(' ')}>
                <div className="cl-sidebar-chrome" aria-hidden />
                <div className={`cl-sidebar-image cl-sidebar-image--${item.id}`}>
                  <img src={item.icon} alt="" />
                </div>
                {showBadges && item.badge ? (
                  <span className="cl-sidebar-badge" aria-hidden>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="cl-sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
