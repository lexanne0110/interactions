import { MotionConfig } from 'framer-motion';
import { DashboardLayout } from './layout/DashboardLayout';
import { InteractionPanel } from './layout/InteractionPanel';
import { useHashRoute } from './lib/useHashRoute';
import './layout/dashboard.css';

export default function App() {
  const { interaction, selectInteraction } = useHashRoute();

  return (
    // `reducedMotion="user"` makes every framer animation respect the OS setting:
    // transforms and opacity snap to their target instead of tweening. CSS keyframes and
    // transitions are covered by the media query in App.css.
    <MotionConfig reducedMotion="user">
      <DashboardLayout
        activeInteraction={interaction}
        onSelectInteraction={selectInteraction}
      >
        <InteractionPanel interaction={interaction} />
      </DashboardLayout>
    </MotionConfig>
  );
}
