import { categories, type InteractionDefinition } from '../interactions/registry';

type Props = {
  activeInteraction: InteractionDefinition;
  onSelect: (interaction: InteractionDefinition) => void;
};

export function SideNav({ activeInteraction, onSelect }: Props) {
  const renderItem = (item: InteractionDefinition, child = false) => {
    const isActive =
      item.categoryId === activeInteraction.categoryId &&
      item.id === activeInteraction.id;

    return (
      <button
        type="button"
        className={`side-nav-item${child ? ' side-nav-item--child' : ''} ${isActive ? 'is-active' : ''}`}
        onClick={() => onSelect(item)}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.title}
      </button>
    );
  };

  return (
    <nav className="side-nav" aria-label="Interactions">
      <div className="side-nav-brand">
        <h1 className="side-nav-title">Jiffy Interactions</h1>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="side-nav-section">
          <h2 className="side-nav-section-label">{category.label}</h2>
          <ul className="side-nav-list">
            {/* Sub-interactions nest under their parent rather than sitting in
                the flat list, so variations of one interaction read as one. */}
            {category.interactions
              .filter((item) => !item.parentId && !item.hidden)
              .map((item) => {
                const children = category.interactions.filter((c) => c.parentId === item.id && !c.hidden);
                return (
                  <li key={item.id}>
                    {renderItem(item)}
                    {children.length > 0 && (
                      <ul className="side-nav-sublist">
                        {children.map((c) => <li key={c.id}>{renderItem(c, true)}</li>)}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

    </nav>
  );
}
