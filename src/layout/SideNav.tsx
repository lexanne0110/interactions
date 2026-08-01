import { categories, type InteractionDefinition } from '../interactions/registry';

type Props = {
  activeInteraction: InteractionDefinition;
  onSelect: (interaction: InteractionDefinition) => void;
};

export function SideNav({ activeInteraction, onSelect }: Props) {
  return (
    <nav className="side-nav" aria-label="Interactions">
      <div className="side-nav-brand">
        <h1 className="side-nav-title">Jiffy Interactions</h1>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="side-nav-section">
          <h2 className="side-nav-section-label">{category.label}</h2>
          <ul className="side-nav-list">
            {category.interactions.map((item) => {
              const isActive =
                item.categoryId === activeInteraction.categoryId &&
                item.id === activeInteraction.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`side-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSelect(item)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

    </nav>
  );
}
