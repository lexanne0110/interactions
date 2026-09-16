import { PhoneShell } from '../shell/PhoneShell';
import type { InteractionDefinition } from '../interactions/registry';

type Props = {
  interaction: InteractionDefinition;
};

export function InteractionPanel({ interaction }: Props) {
  const InteractionComponent = interaction.Component;
  const Aside = interaction.Aside;

  return (
    <div className="interaction-panel">
      <header className="interaction-header">
        <h2 className="interaction-title">{interaction.title}</h2>
        <p className="interaction-description">{interaction.description}</p>
      </header>

      <div className="interaction-body">
        <div className="interaction-live">
          <PhoneShell>
            <InteractionComponent key={interaction.id} />
          </PhoneShell>
          {Aside && (
            <aside className="interaction-aside">
              <Aside key={interaction.id} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
