import { Section } from './Section';
import { useDragScroll } from '../useDragScroll';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/cart/${file}`;

export type Suggestion = {
  id: string;
  image: string;
  weight: string;
  price: number;
  was: number;
  name: string;
  eta: string;
  /** Only the first card carries this in Figma. */
  previouslyBought?: boolean;
};

/**
 * Figma repeats the same copy across all four tiles — they are placeholders, so
 * the text is identical here too rather than invented. The fourth tile is only a
 * 15px peek in the frame, so it reuses the second tile's artwork.
 */
export const seedSuggestions: Suggestion[] = [
  { id: 's1', image: asset('dyf-1.png'), weight: '500 g', price: 61, was: 85, name: 'Aashirvaad Atta with Multigrains', eta: '60 mins', previouslyBought: true },
  { id: 's2', image: asset('dyf-2.png'), weight: '500 g', price: 61, was: 85, name: 'Aashirvaad Atta with Multigrains', eta: '60 mins' },
  { id: 's3', image: asset('dyf-3.png'), weight: '500 g', price: 61, was: 85, name: 'Aashirvaad Atta with Multigrains', eta: '60 mins' },
  { id: 's4', image: asset('dyf-4.png'), weight: '500 g', price: 61, was: 85, name: 'Aashirvaad Atta with Multigrains', eta: '60 mins' },
];

type Props = {
  suggestions: Suggestion[];
  onAdd?: (id: string) => void;
  onViewAll?: () => void;
};

export function DidYouForget({ suggestions, onAdd, onViewAll }: Props) {
  const railRef = useDragScroll<HTMLDivElement>();

  return (
    <Section title="Did You Forget">
      <div className="dyf__rail" ref={railRef}>
        {suggestions.map((s) => (
          <div className="dyf-card" key={s.id}>
            <div className="dyf-card__media">
              <img src={s.image} alt="" />
              {s.previouslyBought && <span className="dyf-card__badge">Previously Bought</span>}
            </div>

            {/* Weight is not rendered here: in Figma it is overlaid on the bottom of
                the image area, so it comes in with the exported tile artwork. */}
            <div className="dyf-card__info">
              <span className="dyf-card__prices">
                <span className="dyf-card__price">₹{s.price}</span>
                <span className="dyf-card__was">₹{s.was}</span>
              </span>
              <span className="dyf-card__name">{s.name}</span>
              <span className="dyf-card__eta">{s.eta}</span>
            </div>

            <button className="dyf-card__add" onClick={() => onAdd?.(s.id)}>
              ADD
            </button>
          </div>
        ))}
      </div>

      <button className="cart-pill" onClick={onViewAll}>
        View All Products
      </button>
    </Section>
  );
}
