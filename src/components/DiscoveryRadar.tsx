import { motion } from "framer-motion";
import { Radar, Search, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const scanMessages = [
  { icon: Search, text: "Scanning company org chart..." },
  { icon: Users, text: "Identifying hiring decision-makers..." },
  { icon: Radar, text: "Mapping department leadership..." },
  { icon: Zap, text: "Generating personalized outreach..." },
  { icon: Search, text: "Cross-referencing talent acquisition..." },
  { icon: Users, text: "Analyzing role alignment..." },
];

const DiscoveryRadar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scanMessages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      {/* Radar animation */}
      <div className="relative h-32 w-32">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-secondary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-secondary/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
        />
        {/* Inner ring */}
        <div className="absolute inset-6 rounded-full border-2 border-secondary/50" />
        {/* Center dot */}
        <motion.div
          className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-secondary"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Sweep line */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[1px] w-[50%] origin-left"
          style={{ background: "var(--gradient-accent)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Blips */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-accent"
            style={{
              left: `${30 + i * 20}%`,
              top: `${20 + i * 25}%`,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Scanning messages */}
      <div className="h-8 overflow-hidden">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-center gap-2 font-mono text-sm text-muted-foreground"
        >
          {(() => {
            const Icon = scanMessages[activeIndex].icon;
            return <Icon className="h-4 w-4 text-secondary" />;
          })()}
          {scanMessages[activeIndex].text}
        </motion.div>
      </div>

      <p className="font-display text-lg text-foreground/80">Discovery Radar Active</p>
    </div>
  );
};

export default DiscoveryRadar;
