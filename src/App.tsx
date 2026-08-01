import { DashboardLayout } from './layout/DashboardLayout';
import { InteractionPanel } from './layout/InteractionPanel';
import { useHashRoute } from './lib/useHashRoute';
import './layout/dashboard.css';

export default function App() {
  const { interaction, selectInteraction } = useHashRoute();

  return (
    <DashboardLayout
      activeInteraction={interaction}
      onSelectInteraction={selectInteraction}
    >
      <InteractionPanel interaction={interaction} />
    </DashboardLayout>
  );
}
