import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const examples = [
  {
    domain: "Teacher → Project Manager",
    before: "Managed a classroom of 30 students with individualized learning plans",
    after: "Directed daily operations and resource allocation for a 30-person cohort, achieving a 95% deliverable completion rate through individualized performance tracking",
  },
  {
    domain: "Military → Operations Manager",
    before: "Led a platoon of 40 soldiers in field operations and logistics coordination",
    after: "Led cross-functional team of 40+ in high-stakes operational planning, managing $2M+ in assets with zero mission-critical failures",
  },
  {
    domain: "Nurse → Healthcare PM",
    before: "Provided patient care and coordinated treatment schedules across departments",
    after: "Orchestrated multi-stakeholder care delivery workflows across 5 departments, optimizing resource utilization and reducing turnaround time by 20%",
  },
];

const BeforeAfterShowcase = () => {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-sm font-body text-secondary mb-4">
            <Sparkles className="h-4 w-4" />
            LIVE ALIGNMENTS
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Stop Translating. Start <span className="text-secondary">Aligning.</span>
          </h2>
          <p className="mt-3 font-body text-muted-foreground max-w-xl mx-auto">
            Industry-specific language that makes recruiters stop scrolling
          </p>
        </motion.div>

        <div className="space-y-6">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              <span className="inline-block font-mono text-xs uppercase tracking-wider text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                {ex.domain}
              </span>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Before</p>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {ex.before}
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-center pt-6">
                  <ArrowRight className="h-5 w-5 text-secondary" />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">After</p>
                  <p className="font-body text-sm text-foreground leading-relaxed font-medium">
                    {ex.after}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterShowcase;