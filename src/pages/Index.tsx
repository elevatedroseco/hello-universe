import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Welcome
        </motion.p>

        <h1 className="font-display text-7xl leading-tight text-foreground sm:text-8xl md:text-9xl">
          Hello
          <span className="text-primary">,</span>
          <br />
          World
          <span className="text-primary">.</span>
        </h1>

        <motion.div
          className="mx-auto mt-8 h-px w-16 bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.p
          className="mx-auto mt-6 max-w-md font-body text-lg font-light leading-relaxed text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          A blank canvas, ready for your next great idea.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Index;
