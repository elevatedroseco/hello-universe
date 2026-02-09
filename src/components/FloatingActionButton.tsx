import { useUnitSelection } from '@/store/useUnitSelection';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const FloatingActionButton = () => {
  const setDrawerOpen = useUnitSelection((state) => state.setDrawerOpen);

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Button
        onClick={() => setDrawerOpen(true)}
        size="lg"
        className="w-14 h-14 rounded-full bg-modded-gold hover:bg-modded-gold-glow text-black shadow-lg hover:shadow-xl animate-glow"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </motion.div>
  );
};
