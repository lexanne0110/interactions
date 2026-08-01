import type { ReactNode } from 'react';
import { SideNav } from './SideNav';
import type { InteractionDefinition } from '../interactions/registry';

type Props = {
  activeInteraction: InteractionDefinition;
  onSelectInteraction: (interaction: InteractionDefinition) => void;
  children: ReactNode;
};

export function DashboardLayout({
  activeInteraction,
  onSelectInteraction,
  children,
}: Props) {
  return (
    <div className="dashboard">
      <SideNav activeInteraction={activeInteraction} onSelect={onSelectInteraction} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
