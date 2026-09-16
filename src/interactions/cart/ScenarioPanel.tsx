import { useScenario, type CartScenario, type ScenarioStore } from '../../cart/scenario';
import './scenario-panel.css';

export type ScenarioSwitch = { key: keyof CartScenario; label: string; note: string };

/**
 * Switches beside the phone for conditions a shopper can't set from the cart —
 * membership, a store's happy hour. Sitting outside the frame keeps the phone
 * honest: it never grows controls the real screen doesn't have.
 */
export function ScenarioPanel({
  store,
  switches,
  tries,
}: {
  store: ScenarioStore;
  switches: ScenarioSwitch[];
  /** Short scripts for what to do on the phone to see each rule fire. */
  tries: string[];
}) {
  const scenario = useScenario(store);

  const flip = (key: keyof CartScenario) => {
    const patch: Partial<CartScenario> = {};
    patch[key] = !scenario[key];
    store.set(patch);
  };

  return (
    <div className="scenario-panel">
      <p className="scenario-panel__eyebrow">Scenario</p>
      <p className="scenario-panel__lede">Conditions a shopper can’t set from the cart.</p>

      <div className="scenario-panel__list">
        {switches.map((s) => (
          <button
            key={s.key}
            type="button"
            role="switch"
            aria-checked={scenario[s.key]}
            className={`scenario-switch${scenario[s.key] ? ' is-on' : ''}`}
            onClick={() => flip(s.key)}
          >
            <span className="scenario-switch__text">
              <span className="scenario-switch__label">{s.label}</span>
              <span className="scenario-switch__note">{s.note}</span>
            </span>
            <span className="scenario-switch__track" aria-hidden="true">
              <span className="scenario-switch__thumb" />
            </span>
          </button>
        ))}
      </div>

      <p className="scenario-panel__eyebrow">Try</p>
      <ul className="scenario-panel__tries">
        {tries.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}
