import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Props = {
  children: ReactNode;
};

/** layoutRoot isolates shared-layout morphs from the dashboard phone scale transform. */
export function PhoneShell({ children }: Props) {
  return (
    <div className="phone-shell-center">
      <div className="phone-scale">
        <motion.div className="phone" layoutRoot>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
